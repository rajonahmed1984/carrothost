<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Domain;
use App\Support\Branding;
use App\Support\MailFrom;
use App\Support\Settings;
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
                'invoice_due_days' => (int) config('billing.invoice_due_days'),
                'renewal_notice_days' => (int) config('billing.renewal_notice_days'),
                'credit_min_deposit' => config('billing.credit.min_deposit'),
                'credit_max_deposit' => config('billing.credit.max_deposit'),
                'credit_max_balance' => config('billing.credit.max_balance'),
                'suspension_enabled' => (bool) config('billing.suspension_enabled'),
                'suspend_after_days' => (int) config('billing.suspend_after_days'),
                'unsuspension_enabled' => (bool) config('billing.unsuspension_enabled'),
                'ticket_auto_close_days' => (int) config('billing.ticket_auto_close_days'),
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
            ],
            // Secrets only say whether one is stored.
            'secrets' => [
                'recaptcha_secret_key' => ! empty(config('recaptcha.secret_key')),
                'recaptcha_api_key' => ! empty(config('recaptcha.api_key')),
                'mail_password' => ! empty(config('mail.mailers.smtp.password')),
            ],
            'branding' => Branding::public(),
            'custom_logo' => ! empty(config('billing.logo_path')),
            'mailer' => config('mail.default'),
            'time_zones' => DateTimeZone::listIdentifiers(),
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
            'invoice_due_days' => 'required|integer|between:0,365',
            'renewal_notice_days' => 'required|integer|between:0,90',
            'credit_min_deposit' => 'nullable|numeric|min:0.01|max:9999999',
            'credit_max_deposit' => 'nullable|numeric|min:0.01|max:9999999',
            'credit_max_balance' => 'nullable|numeric|min:0.01|max:9999999',
            'suspension_enabled' => 'boolean',
            'suspend_after_days' => 'required|integer|between:0,365',
            'unsuspension_enabled' => 'boolean',
            'ticket_auto_close_days' => 'required|integer|between:0,365',
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
        ]);

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

    private function deleteImage(?string $path): void
    {
        if ($path) {
            Storage::disk('branding')->delete($path);
        }
    }
}
