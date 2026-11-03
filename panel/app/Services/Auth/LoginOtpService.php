<?php

namespace App\Services\Auth;

use App\Mail\VerificationCode;
use App\Support\Auth\Portal;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/** The six-digit code emailed at sign-in. Only its hash is stored. */
class LoginOtpService
{
    public const LOCAL_TEMP_OTP = '123456';

    public const OTP_EXPIRY_MINUTES = 10;

    /** A fixed code on a server would undo the check, so this needs both a local env and debug mode. */
    public static function isLocalDev(): bool
    {
        return app()->environment('local') && config('app.debug');
    }

    /** False means the code could not be delivered. */
    public function generateAndSend(Model $account, string $portal): bool
    {
        $code = (string) random_int(100000, 999999);
        $label = Portal::label($portal);

        $account->forceFill([
            'login_otp_code' => hash('sha256', $code),
            'login_otp_expires_at' => now()->addMinutes(self::OTP_EXPIRY_MINUTES),
        ])->save();

        return $this->deliver($account->email, new VerificationCode(
            code: $code,
            subjectLine: "Your {$label} login verification code: {$code}",
            heading: 'Security verification',
            intro: "Sign-in attempt for {$label}",
            instructions: 'Enter this 6-digit code to complete your login. It expires in '.self::OTP_EXPIRY_MINUTES.' minutes.',
            footer: 'If you did not try to sign in, change your password immediately.',
        ));
    }

    public function verify(Model $account, string $submitted): bool
    {
        $submitted = trim($submitted);

        if (self::isLocalDev() && $submitted === self::LOCAL_TEMP_OTP) {
            $this->clear($account);

            return true;
        }

        if (empty($account->login_otp_code) || empty($account->login_otp_expires_at) || now()->isAfter($account->login_otp_expires_at)) {
            return false;
        }

        if (! hash_equals($account->login_otp_code, hash('sha256', $submitted))) {
            return false;
        }

        $this->clear($account);

        return true;
    }

    public function maskEmail(string $email): string
    {
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');
        $length = strlen($name);

        $masked = $length <= 2
            ? substr($name, 0, 1).'*'
            : substr($name, 0, 2).str_repeat('*', max(1, $length - 3)).substr($name, -1);

        return $masked.'@'.$domain;
    }

    public function deliver(string $email, VerificationCode $mail): bool
    {
        try {
            Mail::to($email)->send($mail);

            return true;
        } catch (Throwable $e) {
            Log::warning("Failed to send a verification code to {$email}: ".$e->getMessage());

            return false;
        }
    }

    private function clear(Model $account): void
    {
        $account->forceFill(['login_otp_code' => null, 'login_otp_expires_at' => null])->save();
    }
}
