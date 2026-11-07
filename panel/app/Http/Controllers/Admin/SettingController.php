<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Domain;
use App\Models\SmsLog;
use App\Services\SmsService;
use App\Support\Branding;
use App\Support\MailFrom;
use App\Services\AutomationService;
use App\Support\Settings;
use Illuminate\Support\Facades\Cache;
use DateTimeZone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class SettingController extends Controller
{
    public function show()
    {
        return [
            'settings' => [
                'company_name' => config('app.name'),
                'company_email' => config('billing.company_email'),
                'pay_to_text' => config('billing.pay_to'),
                'company_country' => config('billing.country'),
                'time_zone' => config('app.timezone'),
                'currency' => config('billing.currency'),
                'usd_rate' => config('billing.exchange_rates.USD'),
                'invoice_due_days' => (int) config('billing.invoice_due_days'),
                'renewal_notice_days' => (int) config('billing.renewal_notice_days'),
                'credit_min_deposit' => config('billing.credit.min_deposit'),
                'credit_max_deposit' => config('billing.credit.max_deposit'),
                'credit_max_balance' => config('billing.credit.max_balance'),
                'suspension_enabled' => (bool) config('billing.suspension_enabled'),
                'suspend_after_days' => (int) config('billing.suspend_after_days'),
                'unsuspension_enabled' => (bool) config('billing.unsuspension_enabled'),
                'ticket_auto_close_days' => (int) config('billing.ticket_auto_close_days'),
                'termination_enabled' => (bool) config('billing.termination_enabled'),
                'terminate_after_days' => (int) config('billing.terminate_after_days'),
                'reminder_before_due_days' => (int) config('billing.reminders.before_due_days'),
                ...collect([1, 2, 3])->mapWithKeys(fn ($n) => ["overdue_notice_{$n}" => (int) (config('billing.reminders.overdue_days')[$n - 1] ?? 0)]),
                'domain_reminder_days' => (string) config('billing.reminders.domain_days'),
                'usage_update_enabled' => (bool) config('billing.usage_update_enabled'),
                'domain_sync_enabled' => (bool) config('billing.domain_sync_enabled'),
                'cron_report_enabled' => (bool) config('billing.reports.cron_activity'),
                'domain_sync_report_enabled' => (bool) config('billing.reports.domain_sync'),
                'report_recipients' => config('billing.reports.recipients'),
                'notify_new_order' => (bool) config('billing.admin_notifications.new_order'),
                'notify_invoice_created' => (bool) config('billing.admin_notifications.invoice_created'),
                'notify_invoice_paid' => (bool) config('billing.admin_notifications.invoice_paid'),
                'notify_order_status' => (bool) config('billing.admin_notifications.order_status'),
                'domain_allow_register' => (bool) config('billing.domains.allow_register'),
                'domain_allow_transfer' => (bool) config('billing.domains.allow_transfer'),
                'domain_allow_own' => (bool) config('billing.domains.allow_own'),
                'domain_auto_renew' => (bool) config('billing.domains.auto_renew'),
                ...collect(range(1, 5))->mapWithKeys(fn ($n) => ["nameserver_{$n}" => config('billing.domains.nameservers.'.($n - 1))]),
                'recaptcha_enabled' => (bool) config('recaptcha.enabled'),
                'recaptcha_site_key' => config('recaptcha.site_key'),
                'recaptcha_project_id' => config('recaptcha.project_id'),
                'recaptcha_score_threshold' => config('recaptcha.score_threshold'),
                'mail_host' => config('mail.default') === 'smtp' ? config('mail.mailers.smtp.host') : null,
                'mail_port' => config('mail.mailers.smtp.port'),
                'mail_scheme' => config('mail.mailers.smtp.scheme'),
                'mail_username' => config('mail.mailers.smtp.username'),
                'mail_from_address' => config('mail.from.address'),
                'mail_from_name' => config('mail.from.name'),
                'sms_enabled' => (bool) config('sms.enabled'),
                'sms_api_url' => config('sms.api_url'),
                'sms_customer_id' => config('sms.customer_id'),
                'sms_whitelisted_ip' => config('sms.whitelisted_ip'),
                'sms_invoice_created_enabled' => (bool) config('sms.invoice.created'),
                'sms_invoice_paid_enabled' => (bool) config('sms.invoice.paid'),
                'sms_invoice_reminder_enabled' => (bool) config('sms.invoice.reminder'),
                'sms_invoice_created_template' => config('sms.templates.invoice_created'),
                'sms_invoice_paid_template' => config('sms.templates.invoice_paid'),
                'sms_invoice_reminder_template' => config('sms.templates.invoice_reminder'),
            ],
            // Secrets only say whether one is stored.
            'secrets' => [
                'recaptcha_secret_key' => ! empty(config('recaptcha.secret_key')),
                'recaptcha_api_key' => ! empty(config('recaptcha.api_key')),
                'mail_password' => ! empty(config('mail.mailers.smtp.password')),
                'sms_api_key' => ! empty(config('sms.api_key')),
            ],
            'sms_placeholders' => SmsService::PLACEHOLDERS,
            'branding' => Branding::public(),
            'custom_logo' => ! empty(config('billing.logo_path')),
            'mailer' => config('mail.default'),
            'time_zones' => DateTimeZone::listIdentifiers(),
            // Whether cron is calling the scheduler, and when each daily task last ran.
            'automation' => [
                'heartbeat' => Cache::get('scheduler.heartbeat'),
                'runs' => AutomationService::lastRuns(),
            ],
        ];
    }

    /** POST, not PUT: PHP only parses multipart bodies (the logo) on POST. */
    public function update(Request $request)
    {
        $data = $request->validate([
            'company_name' => 'required|string|max:100',
            'company_email' => 'nullable|email|max:255',
            'pay_to_text' => 'nullable|string|max:1000',
            'company_country' => 'nullable|string|max:100',
            'time_zone' => ['required', Rule::in(DateTimeZone::listIdentifiers())],
            'logo' => 'nullable|file|mimes:png,jpg,jpeg,webp|max:2048',
            'favicon' => 'nullable|file|mimes:png,ico|max:512',
            'remove_logo' => 'boolean',
            'remove_favicon' => 'boolean',
            'currency' => 'required|in:BDT,USD',
            'usd_rate' => 'nullable|numeric|min:0.0001|max:100000',
            'invoice_due_days' => 'required|integer|between:0,365',
            'renewal_notice_days' => 'required|integer|between:0,90',
            'credit_min_deposit' => 'nullable|numeric|min:0.01|max:9999999',
            'credit_max_deposit' => 'nullable|numeric|min:0.01|max:9999999',
            'credit_max_balance' => 'nullable|numeric|min:0.01|max:9999999',
            'suspension_enabled' => 'boolean',
            'suspend_after_days' => 'required|integer|between:0,365',
            'unsuspension_enabled' => 'boolean',
            'ticket_auto_close_days' => 'required|integer|between:0,365',
            'termination_enabled' => 'boolean',
            'terminate_after_days' => 'sometimes|integer|between:1,365',
            'reminder_before_due_days' => 'sometimes|integer|between:0,60',
            'overdue_notice_1' => 'sometimes|integer|between:0,365',
            'overdue_notice_2' => 'sometimes|integer|between:0,365',
            'overdue_notice_3' => 'sometimes|integer|between:0,365',
            'domain_reminder_days' => ['sometimes', 'nullable', 'string', 'max:60', 'regex:/^\s*-?\d{1,3}(\s*,\s*-?\d{1,3})*\s*$/'],
            'usage_update_enabled' => 'boolean',
            'domain_sync_enabled' => 'boolean',
            'cron_report_enabled' => 'boolean',
            'domain_sync_report_enabled' => 'boolean',
            'notify_new_order' => 'boolean',
            'notify_invoice_created' => 'boolean',
            'notify_invoice_paid' => 'boolean',
            'notify_order_status' => 'boolean',
            'report_recipients' => ['sometimes', 'nullable', 'string', 'max:500', function ($attribute, $value, $fail) {
                foreach (\App\Services\AdminReports::parseRecipients($value) as $email) {
                    if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        $fail("{$email} is not a valid email address.");
                    }
                }
            }],
            'domain_allow_register' => 'boolean',
            'domain_allow_transfer' => 'boolean',
            'domain_allow_own' => 'boolean',
            'domain_auto_renew' => 'boolean',
            ...collect(range(1, 5))->mapWithKeys(fn ($n) => ["nameserver_{$n}" => ['nullable', 'string', 'max:255', 'regex:'.Domain::NAME_PATTERN]]),
            'recaptcha_enabled' => 'boolean',
            'recaptcha_site_key' => 'nullable|required_if:recaptcha_enabled,true,1|string|max:255',
            'recaptcha_secret_key' => 'nullable|string|max:255',
            'recaptcha_project_id' => 'nullable|string|max:255',
            'recaptcha_api_key' => 'nullable|string|max:255',
            'recaptcha_score_threshold' => 'nullable|numeric|between:0,1',
            'mail_host' => 'nullable|string|max:255',
            'mail_port' => 'nullable|required_with:mail_host|integer|between:1,65535',
            'mail_scheme' => 'nullable|in:smtp,smtps',
            'mail_username' => 'nullable|string|max:255',
            'mail_password' => 'nullable|string|max:255',
            'mail_from_address' => 'nullable|required_with:mail_host|email|max:255',
            'mail_from_name' => 'nullable|string|max:100',
            'sms_enabled' => 'boolean',
            'sms_api_url' => 'nullable|required_if:sms_enabled,true,1|url|max:255',
            'sms_customer_id' => 'nullable|required_if:sms_enabled,true,1|string|max:100',
            'sms_api_key' => 'nullable|string|max:255',
            'sms_whitelisted_ip' => 'nullable|ip',
            'sms_invoice_created_enabled' => 'boolean',
            'sms_invoice_paid_enabled' => 'boolean',
            'sms_invoice_reminder_enabled' => 'boolean',
            'sms_invoice_created_template' => 'nullable|string|max:1000',
            'sms_invoice_paid_template' => 'nullable|string|max:1000',
            'sms_invoice_reminder_template' => 'nullable|string|max:1000',
        ]);

        if ($request->boolean('sms_enabled') && empty($data['sms_api_key']) && empty(config('sms.api_key'))) {
            throw ValidationException::withMessages(['sms_api_key' => 'Enter the SMS API key to turn SMS on.']);
        }

        // A template left as the default is stored blank, so a later change to the default reaches it.
        foreach (SmsService::EVENTS as $event) {
            $key = "sms_{$event}_template";
            if (array_key_exists($key, $data) && trim((string) $data[$key]) === trim((string) config("sms.templates.{$event}"))) {
                $data[$key] = null;
            }
        }

        // USD prices are converted from BDT, so USD clients cannot be billed without a rate.
        $usdRate = array_key_exists('usd_rate', $data) ? (float) $data['usd_rate'] : (float) config('billing.exchange_rates.USD');
        $usdClients = \App\Models\Client::where('currency', 'USD')->exists();
        if ($usdRate <= 0 && ($data['currency'] === 'USD' || $usdClients)) {
            throw ValidationException::withMessages(['usd_rate' => $usdClients ? 'Some clients are billed in USD, so the USD rate cannot be blank.' : 'Set the USD rate before making USD the default for new clients.']);
        }

        if ($request->boolean('recaptcha_enabled') && empty($data['recaptcha_secret_key']) && ! Settings::isSet('recaptcha_secret_key') && empty(config('recaptcha.secret_key'))) {
            throw ValidationException::withMessages(['recaptcha_secret_key' => 'Enter the reCAPTCHA secret key to turn it on.']);
        }

        $limit = fn (string $key) => (float) ($data["credit_{$key}"] ?? config("billing.credit.{$key}"));
        if ($limit('max_deposit') < $limit('min_deposit')) {
            throw ValidationException::withMessages(['credit_max_deposit' => 'The maximum deposit cannot be below the minimum.']);
        }

        foreach (['logo' => 'logo_path', 'favicon' => 'favicon_path'] as $field => $key) {
            if ($request->hasFile($field)) {
                $data[$key] = $request->file($field)->store('', 'branding');
                $this->deleteImage(config("billing.{$key}"));
            } elseif ($request->boolean("remove_{$field}")) {
                $this->deleteImage(config("billing.{$key}"));
                Settings::forget($key);
            }
        }

        foreach (range(1, 5) as $n) {
            $data["nameserver_{$n}"] = strtolower(trim((string) $request->input("nameserver_{$n}"))) ?: null;
        }

        foreach (Settings::BOOLEANS as $key) {
            $data[$key] = $request->boolean($key);
        }

        Settings::save($data);
        ActivityLog::record('settings.updated');

        return $this->show();
    }

    public function testEmail(Request $request)
    {
        $data = $request->validate(['email' => 'required|email']);

        try {
            Mail::raw('This is a test email from '.config('app.name').'. Your mail settings work.', function ($message) use ($data) {
                $from = MailFrom::for(MailFrom::SUPPORT);
                $message->from($from->address, $from->name)->to($data['email'])->subject('Test email from '.config('app.name'));
            });
        } catch (Throwable $e) {
            return response()->json(['message' => 'Sending failed: '.$e->getMessage()], 422);
        }

        return ['message' => config('mail.default') === 'log'
            ? 'Mail is set to the log driver, so it was written to the log instead of sent. Set MAIL_MAILER=sendmail in .env or save an SMTP server.'
            : "Test email sent to {$data['email']}."];
    }

    public function testSms(Request $request, SmsService $sms)
    {
        $data = $request->validate(['mobile' => 'required|string|max:30', 'message' => 'nullable|string|max:1000']);

        if ($sms->normalizeMobile($data['mobile']) === null) {
            throw ValidationException::withMessages(['mobile' => 'Enter a Bangladeshi mobile number, like 01XXXXXXXXX.']);
        }

        $result = $sms->send($data['mobile'], ($data['message'] ?? '') ?: 'Test SMS from '.config('app.name').'. Your SMS gateway is working.');

        return $result['success']
            ? ['message' => "Test SMS sent to {$result['mobile']}. Gateway said: {$result['message']}"]
            : response()->json(['message' => 'Sending failed: '.$result['message']], 422);
    }

    /** The latest SMS the panel tried to send. */
    public function smsLogs()
    {
        return SmsLog::with('client:id,name', 'invoice:id,number')->latest('id')->limit(50)->get()->map(fn (SmsLog $log) => [
            'id' => $log->id,
            'event' => $log->event,
            'status' => $log->status,
            'mobile' => $log->mobile,
            'message' => $log->message,
            'response' => $log->response,
            'client' => $log->client ? ['id' => $log->client->id, 'name' => $log->client->name] : null,
            'invoice' => $log->invoice ? ['id' => $log->invoice->id, 'number' => $log->invoice->number] : null,
            'created_at' => $log->created_at?->toIso8601String(),
        ]);
    }

    private function deleteImage(?string $path): void
    {
        if ($path) {
            Storage::disk('branding')->delete($path);
        }
    }
}
