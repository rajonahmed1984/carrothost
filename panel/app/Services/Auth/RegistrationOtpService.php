<?php

namespace App\Services\Auth;

use App\Mail\VerificationCode;
use App\Support\MailFrom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Holds a sign-up in the session until its email address is proven, so nothing
 * is created for an address the person does not control.
 */
class RegistrationOtpService
{
    public const SESSION_KEY = 'register.pending';

    public const MAX_ATTEMPTS = 5;

    public const MAX_SENDS_PER_HOUR = 5;

    public function __construct(private readonly LoginOtpService $otp) {}

    /** Keep the validated sign-up and email its code. False means the code could not be delivered. */
    public function start(Request $request, array $data): bool
    {
        $data['password'] = Hash::make($data['password']);
        $request->session()->put(self::SESSION_KEY, ['data' => $data]);

        return $this->sendCode($request);
    }

    public function pending(Request $request): ?array
    {
        $pending = $request->session()->get(self::SESSION_KEY);

        return is_array($pending) && ! empty($pending['data']['email']) ? $pending : null;
    }

    public function forget(Request $request): void
    {
        $request->session()->forget(self::SESSION_KEY);
    }

    public function sendLimitReached(string $email): bool
    {
        return RateLimiter::tooManyAttempts($this->sendKey($email), self::MAX_SENDS_PER_HOUR);
    }

    /** Replace the session's code with a new one and email it. */
    public function sendCode(Request $request): bool
    {
        $pending = $this->pending($request);
        if (! $pending) {
            return false;
        }

        $email = $pending['data']['email'];
        $code = (string) random_int(100000, 999999);
        $minutes = LoginOtpService::OTP_EXPIRY_MINUTES;
        $appName = 'CarrotHost';

        $pending['otp_hash'] = hash('sha256', $code);
        $pending['otp_expires_at'] = now()->addMinutes($minutes)->getTimestamp();
        $pending['attempts'] = 0;
        $request->session()->put(self::SESSION_KEY, $pending);

        RateLimiter::hit($this->sendKey($email), 3600);

        return $this->otp->deliver($email, new VerificationCode(
            code: $code,
            subjectLine: 'Your Email Verification Code',
            heading: 'Your Email Verification Code',
            intro: "Thank you for signing up with {$appName}. Enter the code below to verify your email and create your account.",
            instructions: "This code expires in {$minutes} minutes and can only be used once.",
            footer: 'If you did not try to register, you can ignore this email. No account has been created.',
            sender: MailFrom::SALES,
            name: $pending['data']['name'] ?? null,
        ));
    }

    /** A code stops working once it expires or after too many wrong guesses. */
    public function verify(Request $request, string $submitted): bool
    {
        $pending = $this->pending($request);
        if (! $pending) {
            return false;
        }

        $submitted = trim($submitted);

        if (LoginOtpService::isLocalDev() && $submitted === LoginOtpService::LOCAL_TEMP_OTP) {
            return true;
        }

        $attempts = (int) ($pending['attempts'] ?? 0);
        $isLive = ! empty($pending['otp_hash'])
            && $attempts < self::MAX_ATTEMPTS
            && now()->getTimestamp() <= (int) ($pending['otp_expires_at'] ?? 0);

        if ($isLive && hash_equals($pending['otp_hash'], hash('sha256', $submitted))) {
            return true;
        }

        $pending['attempts'] = $attempts + 1;
        $request->session()->put(self::SESSION_KEY, $pending);

        return false;
    }

    private function sendKey(string $email): string
    {
        return 'register-otp-send:'.sha1(strtolower($email));
    }
}
