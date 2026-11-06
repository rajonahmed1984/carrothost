<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Services\Auth\LoginOtpService;
use App\Services\Auth\LoginService;
use App\Services\Auth\RegistrationOtpService;
use App\Services\RecaptchaService;
use App\Support\Auth\Portal;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RegistrationController extends Controller
{
    private const EMAIL_TAKEN = 'An account with this email already exists. Please sign in, continue with Google, or reset your password.';

    public function __construct(private readonly RegistrationOtpService $registration) {}

    /** Validate the sign-up and email a code. The account is only created once that code comes back. */
    public function store(Request $request, RecaptchaService $recaptcha)
    {
        $recaptcha->assertValid($request, 'REGISTER');

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'email' => 'required|email|max:255|unique:clients,email',
            'password' => 'required|string|confirmed|min:'.Portal::minPassword(Portal::CLIENT),
            'phone_country' => 'nullable|string|max:6',
            'phone' => 'nullable|string|max:24',
            'address' => 'nullable|string|max:255',
            // What the new account is billed in. Blank means the default from Settings > Currencies.
            'currency' => ['nullable', \Illuminate\Validation\Rule::in(\App\Support\Currency::SUPPORTED)],
        ], ['email.unique' => self::EMAIL_TAKEN]);

        if (empty($data['currency'])) {
            unset($data['currency']);
        }

        $data['email'] = Str::lower($data['email']);
        $data['phone'] = $this->normalizePhone($data['phone'] ?? null, $data['phone_country'] ?? null);
        unset($data['phone_country'], $data['password_confirmation']);

        if ($this->registration->sendLimitReached($data['email'])) {
            throw ValidationException::withMessages(['email' => 'Too many codes requested for this email. Please try again later.']);
        }

        if (! $this->registration->start($request, $data) && ! LoginOtpService::isLocalDev()) {
            $this->registration->forget($request);

            throw ValidationException::withMessages(['email' => 'We could not send the verification email. Please check the address and try again.']);
        }

        return response()->json(['ok' => true], 202);
    }

    public function show(Request $request, LoginOtpService $otp)
    {
        $pending = $this->pending($request);

        return [
            'email' => $otp->maskEmail($pending['data']['email']),
            'local_otp' => LoginOtpService::isLocalDev() ? LoginOtpService::LOCAL_TEMP_OTP : null,
        ];
    }

    public function verify(Request $request, LoginService $login)
    {
        $pending = $this->pending($request);
        $otp = $request->validate(['otp' => 'required|string|min:4|max:10'])['otp'];

        if (! $this->registration->verify($request, $otp)) {
            throw ValidationException::withMessages(['otp' => 'Invalid or expired verification code.']);
        }

        // The address may have been taken while the code was on its way.
        if (Client::where('email', $pending['data']['email'])->exists()) {
            throw ValidationException::withMessages(['otp' => self::EMAIL_TAKEN]);
        }

        $this->registration->forget($request);

        $client = Client::create($pending['data'])->refresh();
        $login->complete($request, Portal::CLIENT, $client);
        ActivityLog::record('client.registered', $client);

        return response()->json(Auth::guard('client')->user()->only('id', 'name', 'email'), 201);
    }

    public function resend(Request $request)
    {
        $pending = $this->pending($request);

        if ($this->registration->sendLimitReached($pending['data']['email'])) {
            throw ValidationException::withMessages(['otp' => 'Too many codes requested for this email. Please try again later.']);
        }

        if (! $this->registration->sendCode($request) && ! LoginOtpService::isLocalDev()) {
            throw ValidationException::withMessages(['otp' => 'We could not send the verification email. Please try again shortly.']);
        }

        return ['message' => 'A new verification code has been sent to your email.'];
    }

    /** Hands the answers back so the form can be corrected without retyping. */
    public function cancel(Request $request)
    {
        $pending = $this->registration->pending($request);
        $this->registration->forget($request);

        return ['form' => $pending ? Arr::except($pending['data'], ['password']) : null];
    }

    private function pending(Request $request): array
    {
        $pending = $this->registration->pending($request);
        abort_unless($pending, 404, 'No registration is waiting for a code.');

        return $pending;
    }

    private function normalizePhone(?string $phone, ?string $country): ?string
    {
        $country = trim((string) $country);
        if (! str_starts_with($country, '+')) {
            $country = '+880';
        }

        $number = preg_replace('/\s+/', '', (string) $phone);

        if ($number === '') {
            return null;
        }

        return str_starts_with($number, '+') ? $number : $country.ltrim($number, '0');
    }
}
