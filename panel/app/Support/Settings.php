<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Admin settings live in the settings table and are laid over config at boot,
 * so code keeps reading config() and .env stays the fallback for anything unsaved.
 */
class Settings
{
    private const CACHE_KEY = 'panel.settings';

    /** Setting key => the config entry it overrides. */
    public const MAP = [
        'company_name' => 'app.name',
        'company_email' => 'billing.company_email',
        'pay_to_text' => 'billing.pay_to',
        'company_country' => 'billing.country',
        'time_zone' => 'app.timezone',
        'logo_path' => 'billing.logo_path',
        'favicon_path' => 'billing.favicon_path',
        'currency' => 'billing.currency',
        'invoice_due_days' => 'billing.invoice_due_days',
        'renewal_notice_days' => 'billing.renewal_notice_days',
        'suspension_enabled' => 'billing.suspension_enabled',
        'suspend_after_days' => 'billing.suspend_after_days',
        'unsuspension_enabled' => 'billing.unsuspension_enabled',
        'ticket_auto_close_days' => 'billing.ticket_auto_close_days',
        'recaptcha_enabled' => 'recaptcha.enabled',
        'recaptcha_site_key' => 'recaptcha.site_key',
        'recaptcha_secret_key' => 'recaptcha.secret_key',
        'recaptcha_project_id' => 'recaptcha.project_id',
        'recaptcha_api_key' => 'recaptcha.api_key',
        'recaptcha_score_threshold' => 'recaptcha.score_threshold',
        'mail_host' => 'mail.mailers.smtp.host',
        'mail_port' => 'mail.mailers.smtp.port',
        'mail_scheme' => 'mail.mailers.smtp.scheme',
        'mail_username' => 'mail.mailers.smtp.username',
        'mail_password' => 'mail.mailers.smtp.password',
        'mail_from_address' => 'mail.from.address',
        'mail_from_name' => 'mail.from.name',
    ];

    /** Stored encrypted and never sent back to the browser. */
    public const SECRETS = ['recaptcha_secret_key', 'recaptcha_api_key', 'mail_password'];

    public const BOOLEANS = ['suspension_enabled', 'unsuspension_enabled', 'recaptcha_enabled'];

    public const INTEGERS = ['invoice_due_days', 'renewal_notice_days', 'suspend_after_days', 'ticket_auto_close_days', 'mail_port'];

    public static function apply(): void
    {
        $saved = self::stored();

        foreach ($saved as $key => $value) {
            if (isset(self::MAP[$key]) && $value !== null && $value !== '') {
                config([self::MAP[$key] => self::cast($key, $value)]);
            }
        }

        // A saved SMTP server means mail goes out through it, whatever .env says.
        if (! empty($saved['mail_host'])) {
            config(['mail.default' => 'smtp']);
        }

        if (empty($saved['mail_from_name']) && ! empty($saved['company_name'])) {
            config(['mail.from.name' => $saved['company_name']]);
        }

        date_default_timezone_set(config('app.timezone'));
    }

    /** Saves the given keys. A blank secret keeps the one already stored. */
    public static function save(array $values): void
    {
        foreach ($values as $key => $value) {
            if (! isset(self::MAP[$key])) {
                continue;
            }

            if (in_array($key, self::SECRETS, true)) {
                if ($value === null || $value === '') {
                    continue;
                }
                $value = Crypt::encryptString((string) $value);
            } elseif (is_bool($value)) {
                $value = $value ? '1' : '0';
            }

            Setting::updateOrCreate(['key' => $key], ['value' => $value === null ? null : (string) $value]);
        }

        Cache::forget(self::CACHE_KEY);
        self::apply();
    }

    /** Only for keys whose config default is null, like the uploaded images. */
    public static function forget(string $key): void
    {
        Setting::whereKey($key)->delete();
        Cache::forget(self::CACHE_KEY);
        config([self::MAP[$key] => null]);
    }

    public static function isSet(string $key): bool
    {
        return ! empty(self::stored()[$key]);
    }

    /** @return array<string, ?string> decrypted */
    private static function stored(): array
    {
        try {
            $rows = Cache::rememberForever(self::CACHE_KEY, fn () => Setting::pluck('value', 'key')->all());
        } catch (Throwable) {
            return []; // Before the first migration there is no table yet.
        }

        foreach (self::SECRETS as $key) {
            if (! empty($rows[$key])) {
                try {
                    $rows[$key] = Crypt::decryptString($rows[$key]);
                } catch (Throwable) {
                    Log::warning("Setting {$key} could not be decrypted; was APP_KEY changed?");
                    $rows[$key] = null;
                }
            }
        }

        return $rows;
    }

    private static function cast(string $key, string $value): mixed
    {
        return match (true) {
            in_array($key, self::BOOLEANS, true) => $value === '1',
            in_array($key, self::INTEGERS, true) => (int) $value,
            $key === 'recaptcha_score_threshold' => (float) $value,
            default => $value,
        };
    }
}
