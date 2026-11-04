<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ClientUser;
use App\Services\Auth\LoginOtpService;
use App\Services\Auth\LoginService;
use App\Services\Auth\SubUsers;
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
        private readonly SubUsers $subUsers,
    ) {}

    public function show(Request $request)
    {
        [$pending, $account, $user] = $this->pending($request);

        return [
            'portal' => $pending['portal'],
            'email' => $this->otp->maskEmail(($user ?? $account)->email),
            'local_otp' => LoginOtpService::isLocalDev() ? LoginOtpService::LOCAL_TEMP_OTP : null,
        ];
    }

    public function verify(Request $request)
    {
        [$pending, $account, $user] = $this->pending($request);
        $data = $request->validate(['otp' => 'required|string|min:4|max:10']);
        $throttleKey = "verify-otp:{$pending['portal']}:{$account->getAuthIdentifier()}".($user ? ":user:{$user->id}" : '');

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages(['otp' => "Too many incorrect attempts. Please try again in {$seconds} seconds."]);
        }

        if (! $this->otp->verify($user ?? $account, $data['otp'])) {
            RateLimiter::hit($throttleKey, 120);

            throw ValidationException::withMessages(['otp' => 'Invalid or expired verification code.']);
        }

        RateLimiter::clear($throttleKey);
        $this->login->complete($request, $pending['portal'], $account, (bool) ($pending['remember'] ?? false), $user);

        return ['portal' => $pending['portal']];
    }

    public function resend(Request $request)
    {
        [$pending, $account, $user] = $this->pending($request);
        $throttleKey = "resend-otp:{$pending['portal']}:{$account->getAuthIdentifier()}".($user ? ":user:{$user->id}" : '');

        if (RateLimiter::tooManyAttempts($throttleKey, 2)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages(['otp' => "Please wait {$seconds} seconds before requesting a new code."]);
        }

        RateLimiter::hit($throttleKey, 60);

        if (! $this->otp->generateAndSend($user ?? $account, $pending['portal']) && ! LoginOtpService::isLocalDev()) {
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

        $user = empty($pending['client_user_id']) ? null : ClientUser::find($pending['client_user_id']);
        $userGone = ! empty($pending['client_user_id']) && (! $user || ! $this->subUsers->stillAllowed($user, (int) $pending['id']));

        if (! $account || ! Portal::allows($pending['portal'], $account) || $userGone) {
            $request->session()->forget(LoginService::PENDING_OTP);
            abort(404, 'No sign-in is waiting for a code.');
        }

        return [$pending, $account, $user];
    }
}
