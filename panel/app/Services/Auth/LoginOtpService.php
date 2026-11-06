<?php

namespace App\Services\Auth;

use App\Support\EmailTemplates;
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

    /**
     * A fixed code on a server would undo the check, so this needs a local env, debug mode
     * and a request to a local host. The host check keeps it off a live domain even when
     * a development .env was uploaded there by mistake.
     */
    public static function isLocalDev(): bool
    {
        if (! app()->environment('local') || ! config('app.debug')) {
            return false;
        }

        return self::isLocalHost(request()->getHost());
    }

    public static function isLocalHost(?string $host): bool
    {
        $host = strtolower(trim((string) $host, '[]'));

        return in_array($host, ['localhost', '127.0.0.1', '::1'], true)
            || str_ends_with($host, '.localhost')
            || str_ends_with($host, '.test');
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

        // Customers get the Login Verification Code template; staff keep the built-in wording.
        $template = $portal === Portal::CLIENT
            ? EmailTemplates::render('login_code', ['client_name' => $account->name, 'client_email' => $account->email, 'code' => $code, 'expiry_minutes' => self::OTP_EXPIRY_MINUTES])
            : null;

        return $this->deliver($account->email, new VerificationCode(
            code: $code,
            // No code in the subject: a plain subject and a labelled code is what mail apps recognise.
            subjectLine: $template['subject'] ?? 'Your Login Verification Code',
            heading: 'Your Login Verification Code',
            intro: "Someone has just entered the correct password for your {$label} account. Enter the code below to finish signing in.",
            instructions: 'This code expires in '.self::OTP_EXPIRY_MINUTES.' minutes and can only be used once.',
            footer: 'If you did not try to sign in, change your password immediately.',
            name: $account->name,
            templateHtml: $template['html'] ?? null,
            templateText: $template['text'] ?? null,
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
