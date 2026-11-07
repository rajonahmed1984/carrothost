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
        'usd_rate' => 'billing.exchange_rates.USD',
        'invoice_due_days' => 'billing.invoice_due_days',
        'renewal_notice_days' => 'billing.renewal_notice_days',
        'credit_min_deposit' => 'billing.credit.min_deposit',
        'credit_max_deposit' => 'billing.credit.max_deposit',
        'credit_max_balance' => 'billing.credit.max_balance',
        'suspension_enabled' => 'billing.suspension_enabled',
        'suspend_after_days' => 'billing.suspend_after_days',
        'unsuspension_enabled' => 'billing.unsuspension_enabled',
        'ticket_auto_close_days' => 'billing.ticket_auto_close_days',
        'termination_enabled' => 'billing.termination_enabled',
        'terminate_after_days' => 'billing.terminate_after_days',
        'reminder_before_due_days' => 'billing.reminders.before_due_days',
        'overdue_notice_1' => 'billing.reminders.overdue_days.0',
        'overdue_notice_2' => 'billing.reminders.overdue_days.1',
        'overdue_notice_3' => 'billing.reminders.overdue_days.2',
        'domain_reminder_days' => 'billing.reminders.domain_days',
        'usage_update_enabled' => 'billing.usage_update_enabled',
        'domain_sync_enabled' => 'billing.domain_sync_enabled',
        'cron_report_enabled' => 'billing.reports.cron_activity',
        'domain_sync_report_enabled' => 'billing.reports.domain_sync',
        'report_recipients' => 'billing.reports.recipients',
        'notify_new_order' => 'billing.admin_notifications.new_order',
        'notify_invoice_created' => 'billing.admin_notifications.invoice_created',
        'notify_invoice_paid' => 'billing.admin_notifications.invoice_paid',
        'notify_order_status' => 'billing.admin_notifications.order_status',
        'domain_allow_register' => 'billing.domains.allow_register',
        'domain_allow_transfer' => 'billing.domains.allow_transfer',
        'domain_allow_own' => 'billing.domains.allow_own',
        'domain_auto_renew' => 'billing.domains.auto_renew',
        'domain_lookup_provider' => 'billing.domains.lookup_provider',
        'domain_premium_enabled' => 'billing.domains.premium_enabled',
        'nameserver_1' => 'billing.domains.nameservers.0',
        'nameserver_2' => 'billing.domains.nameservers.1',
        'nameserver_3' => 'billing.domains.nameservers.2',
        'nameserver_4' => 'billing.domains.nameservers.3',
        'nameserver_5' => 'billing.domains.nameservers.4',
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
        'sms_enabled' => 'sms.enabled',
        'sms_api_url' => 'sms.api_url',
        'sms_customer_id' => 'sms.customer_id',
        'sms_api_key' => 'sms.api_key',
        'sms_whitelisted_ip' => 'sms.whitelisted_ip',
        'sms_invoice_created_enabled' => 'sms.invoice.created',
        'sms_invoice_paid_enabled' => 'sms.invoice.paid',
        'sms_invoice_reminder_enabled' => 'sms.invoice.reminder',
        // A blank template falls back to the default in config/sms.php.
        'sms_invoice_created_template' => 'sms.templates.invoice_created',
        'sms_invoice_paid_template' => 'sms.templates.invoice_paid',
        'sms_invoice_reminder_template' => 'sms.templates.invoice_reminder',
    ];

    /** Stored encrypted and never sent back to the browser. */
    public const SECRETS = ['recaptcha_secret_key', 'recaptcha_api_key', 'mail_password', 'sms_api_key'];

    public const BOOLEANS = [
        'suspension_enabled', 'unsuspension_enabled', 'recaptcha_enabled', 'termination_enabled', 'usage_update_enabled', 'domain_sync_enabled',
        'cron_report_enabled', 'domain_sync_report_enabled',
        'domain_allow_register', 'domain_allow_transfer', 'domain_allow_own', 'domain_auto_renew', 'domain_premium_enabled',
        'sms_enabled', 'sms_invoice_created_enabled', 'sms_invoice_paid_enabled', 'sms_invoice_reminder_enabled',
    ];

    public const INTEGERS = ['invoice_due_days', 'renewal_notice_days', 'suspend_after_days', 'ticket_auto_close_days', 'mail_port', 'terminate_after_days', 'reminder_before_due_days', 'overdue_notice_1', 'overdue_notice_2', 'overdue_notice_3'];

    public static function apply(): void
    {
        $saved = self::stored();

        foreach ($saved as $key => $value) {
            if (isset(self::MAP[$key]) && $value !== null && $value !== '') {
                config([self::MAP[$key] => self::cast($key, $value)]);
            } elseif (str_starts_with($key, 'nameserver_') || in_array($key, ['domain_lookup_provider', 'report_recipients'], true)) {
                // No .env fallback for these, so a cleared one is simply empty.
                config([self::MAP[$key] => null]);
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
            $key === 'recaptcha_score_threshold', $key === 'usd_rate' => (float) $value,
            default => $value,
        };
    }
}
