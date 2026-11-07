<?php

namespace App\Support;

use App\Models\EmailTemplate;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Every email the panel sends a customer, grouped by kind. The defaults live here; Admin >
 * Settings > Email saves only what an admin changes, so a reset brings the default straight back.
 *
 * Merge fields are written {$name}. Text values are escaped in the body; the few listed in
 * HTML_FIELDS are built by the panel as HTML (item tables, the ticket message) and go in as they are.
 */
class EmailTemplates
{
    public const GROUPS = [
        'general' => 'General Messages',
        'product' => 'Product/Service Messages',
        'domain' => 'Domain Messages',
        'invoice' => 'Invoice Messages',
        'support' => 'Support Messages',
    ];

    /** Fields every template can use. */
    public const COMMON_FIELDS = ['client_name', 'client_first_name', 'client_email', 'client_company', 'company_name', 'client_area_url', 'signature'];

    public const HTML_FIELDS = ['invoice_items', 'order_items', 'ticket_message'];

    private const CACHE_KEY = 'panel.email_templates';

    /** @return array<string, array{group: string, name: string, description: string, subject: string, body: string, fields: list<string>, required?: list<string>, locked?: bool}> */
    public static function definitions(): array
    {
        $hello = '<p>Dear {$client_name},</p>';
        $sign = '<p>{$signature}</p>';

        return [
            /* ---------- General ---------- */
            'order_confirmation' => [
                'group' => 'general', 'name' => 'Order Confirmation', 'description' => 'Sent when a customer places an order.',
                'subject' => 'Order confirmation #{$order_number}',
                'body' => $hello.'<p>We have received your order <strong>#{$order_number}</strong>. Thank you for choosing us.</p>{$order_items}<p>Invoice <strong>#{$invoice_number}</strong> for <strong>{$invoice_total}</strong> is due on {$invoice_due_date}. Your order is set up as soon as it is paid.</p>'.$sign,
                'fields' => ['order_number', 'order_items', 'invoice_number', 'invoice_total', 'invoice_due_date', 'invoice_link'],
            ],
            'order_accepted' => [
                'group' => 'general', 'name' => 'Order Accepted', 'description' => 'Sent when an admin accepts an order.',
                'subject' => 'Your order #{$order_number} has been accepted',
                'body' => $hello.'<p>Your order <strong>#{$order_number}</strong> has been accepted and is being set up. We will email your login details once it is ready.</p>'.$sign,
                'fields' => ['order_number'],
            ],
            'login_code' => [
                'group' => 'general', 'name' => 'Login Verification Code', 'description' => 'The one-time code for two-step sign-in. Always sent.',
                'subject' => 'Your Login Verification Code',
                'body' => $hello.'<p>Someone has just entered the correct password for your account. Enter the code below to finish signing in.</p><p style="margin:0 0 4px;font-weight:bold;">Verification code:</p><p style="margin:0 0 16px;font-family:\'Courier New\',monospace;font-size:30px;font-weight:bold;letter-spacing:6px;">{$code}</p><p style="font-size:13px;color:#475569;">This code expires in {$expiry_minutes} minutes and can only be used once. If you did not try to sign in, change your password immediately.</p>',
                'fields' => ['code', 'expiry_minutes'], 'required' => ['code'], 'locked' => true,
            ],
            'signup_code' => [
                'group' => 'general', 'name' => 'Email Address Verification', 'description' => 'The code that confirms a new customer\'s email at sign-up. Always sent.',
                'subject' => 'Your Email Verification Code',
                'body' => $hello.'<p>Thank you for signing up with {$company_name}. Enter the code below to verify your email and create your account.</p><p style="margin:0 0 4px;font-weight:bold;">Verification code:</p><p style="margin:0 0 16px;font-family:\'Courier New\',monospace;font-size:30px;font-weight:bold;letter-spacing:6px;">{$code}</p><p style="font-size:13px;color:#475569;">This code expires in {$expiry_minutes} minutes. If you did not try to register, you can ignore this email.</p>',
                'fields' => ['code', 'expiry_minutes'], 'required' => ['code'], 'locked' => true,
            ],
            'password_reset' => [
                'group' => 'general', 'name' => 'Password Reset Validation', 'description' => 'The link a customer uses to reset a forgotten password. Always sent.',
                'subject' => 'Reset your password',
                'body' => $hello.'<p>We received a request to reset the password for your account. Use the button below to choose a new one.</p><p>This link expires in {$expiry_minutes} minutes. If you did not ask for this, you can ignore this email.</p>'.$sign,
                'fields' => ['reset_link', 'expiry_minutes'], 'locked' => true,
            ],
            'account_user_password' => [
                'group' => 'general', 'name' => 'Account User Password Link', 'description' => 'Sent to a user added to a customer\'s account, to set or reset their password. Always sent.',
                'subject' => '{$password_action} your password',
                'body' => '<p>Dear {$user_name},</p><p>Use the button below to {$password_action_lower} the password you use to sign in to {$company_name}.</p><p>This link expires in {$expiry_minutes} minutes. If you did not ask for this, you can ignore this email.</p>'.$sign,
                'fields' => ['user_name', 'password_action', 'password_action_lower', 'reset_link', 'expiry_minutes'], 'locked' => true,
            ],

            /* ---------- Product/Service ---------- */
            'service_welcome' => [
                'group' => 'product', 'name' => 'Hosting Account Welcome', 'description' => 'Sent when a hosting account is set up.',
                'subject' => 'Your {$service_product_name} account is ready',
                'body' => $hello.'<p>Your <strong>{$service_product_name}</strong> service for <strong>{$service_domain}</strong> is ready.</p><table style="border-collapse:collapse;font-size:14px;"><tr><td style="padding:4px 12px 4px 0;color:#64748b;">Username</td><td style="padding:4px 0;"><strong>{$service_username}</strong></td></tr><tr><td style="padding:4px 12px 4px 0;color:#64748b;">Control panel</td><td style="padding:4px 0;">{$service_panel_url}</td></tr><tr><td style="padding:4px 12px 4px 0;color:#64748b;">Server</td><td style="padding:4px 0;">{$service_server_hostname}</td></tr></table><p>Your password is shown on the service page in the client area, where you can also sign in to the control panel in one click.</p>'.$sign,
                'fields' => ['service_product_name', 'service_domain', 'service_username', 'service_panel_url', 'service_server_hostname', 'service_link'],
            ],
            'service_suspended' => [
                'group' => 'product', 'name' => 'Service Suspension Notification', 'description' => 'Sent when a service is suspended for an overdue payment.',
                'subject' => 'Service suspended: {$service_product_name}',
                'body' => $hello.'<p>Your <strong>{$service_product_name}</strong> service for <strong>{$service_domain}</strong> has been suspended because a payment is overdue.</p><p>Pay invoice <strong>#{$invoice_number}</strong> and the service is turned back on automatically.</p>'.$sign,
                'fields' => ['service_product_name', 'service_domain', 'invoice_number', 'invoice_link'],
            ],

            /* ---------- Domain ---------- */
            'domain_renewal_reminder' => [
                'group' => 'domain', 'name' => 'Upcoming Domain Renewal Notice', 'description' => 'Sent on the domain reminder days before expiry.',
                'subject' => 'Domain renewal reminder: {$domain_name}',
                'body' => $hello.'<p>Your domain <strong>{$domain_name}</strong> expires in {$days_left} days, on <strong>{$domain_expiry_date}</strong>.</p><p>Renew it now to keep your website and email working.</p>'.$sign,
                'fields' => ['domain_name', 'domain_expiry_date', 'days_left', 'invoice_number', 'domain_link'],
            ],
            'domain_expired' => [
                'group' => 'domain', 'name' => 'Expired Domain Notice', 'description' => 'Sent on the reminder days after a domain has expired.',
                'subject' => 'Domain expired: {$domain_name}',
                'body' => $hello.'<p>Your domain <strong>{$domain_name}</strong> expired on <strong>{$domain_expiry_date}</strong>.</p><p>An expired domain stops working and may be lost if it is not renewed soon. Renew it from your client area today.</p>'.$sign,
                'fields' => ['domain_name', 'domain_expiry_date', 'days_left', 'invoice_number', 'domain_link'],
            ],

            /* ---------- Invoice ---------- */
            'invoice_created' => [
                'group' => 'invoice', 'name' => 'Invoice Created', 'description' => 'Sent when a new invoice is generated.',
                'subject' => 'New invoice {$invoice_number}',
                'body' => $hello.'<p>A new invoice has been generated for you.</p>{$invoice_items}<p>Total: <strong>{$invoice_total}</strong><br>Due date: <strong>{$invoice_due_date}</strong></p>'.$sign,
                'fields' => ['invoice_number', 'invoice_items', 'invoice_total', 'invoice_balance', 'invoice_due_date', 'invoice_link'],
            ],
            'invoice_payment_reminder' => [
                'group' => 'invoice', 'name' => 'Invoice Payment Reminder', 'description' => 'Sent before an unpaid invoice falls due.',
                'subject' => 'Invoice payment reminder {$invoice_number}',
                'body' => $hello.'<p>This is a reminder that invoice <strong>#{$invoice_number}</strong> is due on <strong>{$invoice_due_date}</strong>.</p>{$invoice_items}<p>Amount due: <strong>{$invoice_balance}</strong></p>'.$sign,
                'fields' => ['invoice_number', 'invoice_items', 'invoice_total', 'invoice_balance', 'invoice_due_date', 'invoice_link'],
            ],
            'invoice_overdue' => [
                'group' => 'invoice', 'name' => 'Overdue Invoice Notice', 'description' => 'Sent on the overdue notice days after the due date.',
                'subject' => 'Overdue invoice {$invoice_number}',
                'body' => $hello.'<p>Invoice <strong>#{$invoice_number}</strong> was due on <strong>{$invoice_due_date}</strong> and is still unpaid.</p>{$invoice_items}<p>Amount due: <strong>{$invoice_balance}</strong></p><p>Please pay it to avoid any interruption to your services.</p>'.$sign,
                'fields' => ['invoice_number', 'invoice_items', 'invoice_total', 'invoice_balance', 'invoice_due_date', 'invoice_link'],
            ],
            'invoice_payment_confirmation' => [
                'group' => 'invoice', 'name' => 'Invoice Payment Confirmation', 'description' => 'Sent when an invoice is paid in full.',
                'subject' => 'Payment received for invoice {$invoice_number}',
                'body' => $hello.'<p>Thank you. We have received full payment for invoice <strong>#{$invoice_number}</strong> ({$invoice_total}).</p>'.$sign,
                'fields' => ['invoice_number', 'invoice_total', 'invoice_link'],
            ],

            /* ---------- Support ---------- */
            'ticket_reply' => [
                'group' => 'support', 'name' => 'Support Ticket Reply', 'description' => 'Sent when staff reply to a customer\'s ticket.',
                'subject' => '[Ticket #{$ticket_number}] {$ticket_subject}',
                'body' => $hello.'<p>{$staff_name} replied to your ticket <strong>#{$ticket_number}</strong>:</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">{$ticket_message}</div><p>Reply from your client area if you need anything else.</p>'.$sign,
                'fields' => ['ticket_number', 'ticket_subject', 'ticket_message', 'ticket_status', 'staff_name', 'ticket_link'],
            ],
        ];
    }

    public static function exists(string $key): bool
    {
        return isset(self::definitions()[$key]);
    }

    /**
     * The template ready to send, or null when an admin turned it off.
     *
     * @return array{subject: string, html: string, text: string}|null
     */
    public static function render(string $key, array $values): ?array
    {
        $template = self::current($key);

        if (! $template['is_active']) {
            return null;
        }

        return self::fill($template['subject'], $template['body'], $values);
    }

    /** @return array{subject: string, html: string, text: string} */
    public static function fill(string $subject, string $body, array $values): array
    {
        $values = [...self::commonValues(), ...$values];
        $text = $html = [];

        foreach ($values as $field => $value) {
            $value = (string) ($value ?? '');
            $text['{$'.$field.'}'] = in_array($field, self::HTML_FIELDS, true) ? EmailHtml::toText($value) : $value;
            $html['{$'.$field.'}'] = in_array($field, self::HTML_FIELDS, true) ? $value : nl2br(e($value), false);
        }

        // Fields without a value are blanked rather than sent as {$field}.
        $blank = fn (string $s) => preg_replace('/\{\$[a-z_]+\}/', '', $s);
        $rendered = $blank(strtr($body, $html));

        return [
            'subject' => trim(preg_replace('/\s+/', ' ', $blank(strtr($subject, $text)))),
            'html' => $rendered,
            'text' => EmailHtml::toText($rendered),
        ];
    }

    /** The saved version laid over the default. */
    public static function current(string $key): array
    {
        $definition = self::definitions()[$key];
        $saved = self::saved()[$key] ?? null;

        return [
            'subject' => $saved['subject'] ?? $definition['subject'],
            'body' => $saved['body'] ?? $definition['body'],
            'is_active' => ($definition['locked'] ?? false) ? true : (bool) ($saved['is_active'] ?? true),
            'customized' => $saved !== null && ($saved['subject'] !== null || $saved['body'] !== null),
        ];
    }

    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /** What the sample preview fills each field with. */
    public static function sampleValues(): array
    {
        $items = self::itemsTable([['Shared Hosting - Standard (annually) - example.com', 'BDT 6,999.18'], ['Register example.com (1 yr)', 'BDT 1,600.00']]);

        return [
            'client_name' => 'Md Shoriful Islam', 'client_first_name' => 'Md', 'client_email' => 'customer@example.com', 'client_company' => 'Example Ltd',
            'order_number' => '1042', 'order_items' => $items, 'invoice_number' => '10021', 'invoice_items' => $items, 'invoice_total' => 'BDT 8,599.18',
            'invoice_balance' => 'BDT 8,599.18', 'invoice_due_date' => now()->addDays(7)->format('d M Y'), 'invoice_link' => url('invoices/1'),
            'code' => '482913', 'expiry_minutes' => '10', 'reset_link' => url('reset-password/sample'), 'user_name' => 'Rahim Uddin', 'password_action' => 'Set', 'password_action_lower' => 'set',
            'service_product_name' => 'Shared Hosting - Standard', 'service_domain' => 'example.com', 'service_username' => 'example',
            'service_panel_url' => 'https://server.example.com:2083', 'service_server_hostname' => 'server.example.com', 'service_link' => url('services/1'),
            'domain_name' => 'example.com', 'domain_expiry_date' => now()->addDays(30)->format('d M Y'), 'days_left' => '30', 'domain_link' => url('domains/1'),
            'ticket_number' => '734012', 'ticket_subject' => 'Website not loading', 'ticket_message' => '<p>Hello,<br>We have fixed the issue. Please check again.</p>',
            'ticket_status' => 'Answered', 'staff_name' => 'Support Team', 'ticket_link' => url('tickets/1'),
        ];
    }

    /** Line items as an email-safe table. Each row is [description, amount], both plain text. */
    public static function itemsTable(array $rows): string
    {
        if (! $rows) {
            return '';
        }

        $cells = collect($rows)->map(fn ($row) => '<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">'.e($row[0]).'</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap;">'.e($row[1]).'</td></tr>')->implode('');

        return '<table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e2e8f0;border-radius:8px;margin:12px 0;"><thead><tr style="background:#f8fafc;"><th style="padding:8px 12px;text-align:left;">Description</th><th style="padding:8px 12px;text-align:right;">Amount</th></tr></thead><tbody>'.$cells.'</tbody></table>';
    }

    private static function commonValues(): array
    {
        return [
            'company_name' => config('app.name'),
            'client_area_url' => url('/'),
            'signature' => "Regards,\n".config('app.name'),
        ];
    }

    /** @return array<string, array{subject: ?string, body: ?string, is_active: bool}> */
    private static function saved(): array
    {
        try {
            return Cache::rememberForever(self::CACHE_KEY, fn () => EmailTemplate::all()->keyBy('key')->map(fn (EmailTemplate $t) => $t->only('subject', 'body', 'is_active'))->all());
        } catch (Throwable) {
            return []; // Before the migration runs.
        }
    }
}
