<?php

namespace App\Services\Auth;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Services\RecaptchaService;
use App\Support\Auth\Portal;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginService
{
    public const LOGIN_MAX_ATTEMPTS = 5;

    public const PENDING_OTP = 'login.pending_otp';

    public const IMPERSONATOR = 'impersonator_id';

    public function __construct(
        private readonly RecaptchaService $recaptcha,
        private readonly LoginOtpService $otp,
    ) {}

    public static function registerRateLimiter(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $portal = $request->is('api/client/*') ? Portal::CLIENT : Portal::ADMIN;

            return [
                Limit::perMinute(self::LOGIN_MAX_ATTEMPTS)
                    ->by(self::limiterKey($request, $portal, (string) $request->input('email', '')))
                    ->response(fn () => response()->json(['message' => 'Too many login attempts. Please try again in 60 seconds.'], 429)),
                // Stops one address guessing a common password across many accounts.
                Limit::perMinute(self::LOGIN_MAX_ATTEMPTS * 6)
                    ->by('ip|'.$request->ip())
                    ->response(fn () => response()->json(['message' => 'Too many login attempts. Please try again in 60 seconds.'], 429)),
            ];
        });
    }

    /**
     * Check the password without signing in, so an account that needs a code
     * has no session or remember cookie until the code comes back.
     */
    public function authenticate(Request $request, string $portal): array
    {
        $credentials = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $remember = $request->boolean('remember');

        $this->recaptcha->assertValid($request, Portal::recaptchaAction($portal));

        $guard = Auth::guard(Portal::guard($portal));
        $scoped = [...$credentials, ...Portal::scope($portal)];

        if (! $guard->validate($scoped)) {
            ActivityLog::record('login.denied', context: ['portal' => $portal, 'email' => $credentials['email'], 'ip' => $request->ip()]);

            throw ValidationException::withMessages(['email' => 'The provided credentials are incorrect.']);
        }

        $account = $guard->getLastAttempted();
        $guard->getProvider()->rehashPasswordIfRequired($account, $credentials);

        if (! $account->requiresLoginOtp()) {
            $this->complete($request, $portal, $account, $remember);

            return ['requires_otp' => false];
        }

        if (! $this->otp->generateAndSend($account, $portal) && ! LoginOtpService::isLocalDev()) {
            throw ValidationException::withMessages(['email' => 'We could not send your verification code. Please try again shortly.']);
        }

        $request->session()->put(self::PENDING_OTP, ['id' => $account->getAuthIdentifier(), 'portal' => $portal, 'remember' => $remember]);

        return ['requires_otp' => true];
    }

    /** Every way in ends here: password, emailed code, registration and Google. */
    public function complete(Request $request, string $portal, Authenticatable $account, bool $remember = false): void
    {
        Auth::guard(Portal::guard($portal))->login($account, $remember);

        $request->session()->regenerate();
        // A real sign-in ends any impersonation still recorded in this session.
        $request->session()->forget([self::IMPERSONATOR, self::PENDING_OTP]);

        // The throttle middleware stores its counter under this hash of the limiter name and key.
        RateLimiter::clear(md5('login'.self::limiterKey($request, $portal, $account->email)));

        if ($account instanceof Client) {
            $account->update(['last_login_at' => now(), 'last_login_ip' => $request->ip()]);
            $account->sessions()->create([
                'session_id' => $request->session()->getId(),
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 500),
            ]);
            ActivityLog::record('client.login', $account, ['ip' => $request->ip()]);
        } else {
            ActivityLog::record('admin.login', context: ['ip' => $request->ip()]);
        }
    }

    public function logout(Request $request): void
    {
        $impersonating = $request->session()->has(self::IMPERSONATOR);

        foreach (Portal::guards() as $guard) {
            // logout() also cycles the remember token, which would sign the customer out of their own devices.
            $impersonating ? Auth::guard($guard)->logoutCurrentDevice() : Auth::guard($guard)->logout();
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }

    private static function limiterKey(Request $request, string $portal, string $email): string
    {
        return implode('|', ['login', $portal, strtolower(trim($email)), $request->ip()]);
    }
}
