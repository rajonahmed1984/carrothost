<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\LoginOtpService;
use App\Services\Auth\LoginService;
use App\Support\Auth\Portal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class LoginOtpController extends Controller
{
    public function __construct(
        private readonly LoginOtpService $otp,
        private readonly LoginService $login,
    ) {}

    public function show(Request $request)
    {
        [$pending, $account] = $this->pending($request);

        return [
            'portal' => $pending['portal'],
            'email' => $this->otp->maskEmail($account->email),
            'local_otp' => LoginOtpService::isLocalDev() ? LoginOtpService::LOCAL_TEMP_OTP : null,
        ];
    }

    public function verify(Request $request)
    {
        [$pending, $account] = $this->pending($request);
        $data = $request->validate(['otp' => 'required|string|min:4|max:10']);
        $throttleKey = "verify-otp:{$pending['portal']}:{$account->getAuthIdentifier()}";

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages(['otp' => "Too many incorrect attempts. Please try again in {$seconds} seconds."]);
        }

        if (! $this->otp->verify($account, $data['otp'])) {
            RateLimiter::hit($throttleKey, 120);

            throw ValidationException::withMessages(['otp' => 'Invalid or expired verification code.']);
        }

        RateLimiter::clear($throttleKey);
        $this->login->complete($request, $pending['portal'], $account, (bool) ($pending['remember'] ?? false));

        return ['portal' => $pending['portal']];
    }

    public function resend(Request $request)
    {
        [$pending, $account] = $this->pending($request);
        $throttleKey = "resend-otp:{$pending['portal']}:{$account->getAuthIdentifier()}";

        if (RateLimiter::tooManyAttempts($throttleKey, 2)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages(['otp' => "Please wait {$seconds} seconds before requesting a new code."]);
        }

        RateLimiter::hit($throttleKey, 60);

        if (! $this->otp->generateAndSend($account, $pending['portal']) && ! LoginOtpService::isLocalDev()) {
            throw ValidationException::withMessages(['otp' => 'We could not send the code. Please try again shortly.']);
        }

        return ['message' => 'A new verification code has been sent to your email.'];
    }

    public function cancel(Request $request)
    {
        $request->session()->forget(LoginService::PENDING_OTP);

        return response()->noContent();
    }

    /** The account must still qualify when the code comes back, not only when it was sent. */
    private function pending(Request $request): array
    {
        $pending = $request->session()->get(LoginService::PENDING_OTP);
        abort_unless(is_array($pending), 404, 'No sign-in is waiting for a code.');

        $account = Auth::guard(Portal::guard($pending['portal']))->getProvider()->retrieveById($pending['id']);

        if (! $account || ! Portal::allows($pending['portal'], $account)) {
            $request->session()->forget(LoginService::PENDING_OTP);
            abort(404, 'No sign-in is waiting for a code.');
        }

        return [$pending, $account];
    }
}
