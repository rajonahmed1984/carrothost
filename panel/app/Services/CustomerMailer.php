<?php

namespace App\Services;

use App\Mail\CustomerNotice;
use App\Models\Client;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Service;
use App\Support\EmailHtml;
use App\Support\EmailTemplates;
use App\Support\MailFrom;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Customer emails, written from the templates in Admin > Settings > Email.
 * Order emails come from sales and invoice emails from billing (config/system_mail.php).
 */
class CustomerMailer
{
    public function orderPlaced(Order $order): void
    {
        $invoice = $order->invoices()->latest('id')->first();

        $this->send('order_confirmation', $order->client, MailFrom::SALES, [
            'order_number' => $this->number($order),
            'order_items' => $invoice ? $this->items($invoice) : '',
            ...$invoice ? $this->invoiceValues($invoice) : [],
        ], $invoice ? url("invoices/{$invoice->id}") : url('services'), $invoice ? 'View invoice' : 'View services');
    }

    public function orderAccepted(Order $order): void
    {
        $this->send('order_accepted', $order->client, MailFrom::SALES, ['order_number' => $this->number($order)], url('services'), 'View services');
    }

    public function invoiceCreated(Invoice $invoice): void
    {
        $this->send('invoice_created', $invoice->client, MailFrom::BILLING, $this->invoiceValues($invoice), url("invoices/{$invoice->id}"), 'Pay invoice');
    }

    public function invoiceReminder(Invoice $invoice, string $due): void
    {
        $overdue = $invoice->due_date->isPast() && ! $invoice->due_date->isToday();

        $this->send($overdue ? 'invoice_overdue' : 'invoice_payment_reminder', $invoice->client, MailFrom::BILLING, [
            ...$this->invoiceValues($invoice),
            'invoice_balance' => "{$invoice->currency} {$due}",
        ], url("invoices/{$invoice->id}"), 'Pay invoice');
    }

    public function paymentReceived(Invoice $invoice): void
    {
        $this->send('invoice_payment_confirmation', $invoice->client, MailFrom::BILLING, $this->invoiceValues($invoice), url("invoices/{$invoice->id}"), 'View invoice');
    }

    /** Hosting is ready: where to sign in. The password stays in the client area, not in email. */
    public function serviceWelcome(Service $service): void
    {
        $service->loadMissing('client', 'product', 'server');
        $ports = ['cpanel' => 2083, 'webuzo' => 2003];
        $port = $ports[$service->product->module] ?? null;

        $this->send('service_welcome', $service->client, MailFrom::SUPPORT, [
            ...$this->serviceValues($service),
            'service_username' => $service->credentials['username'] ?? $service->remote_id,
            'service_panel_url' => $port && $service->server ? "https://{$service->server->hostname}:{$port}" : '',
            'service_server_hostname' => $service->server?->hostname,
        ], url("services/{$service->id}"), 'Open your service');
    }

    public function serviceSuspended(Service $service): void
    {
        $service->loadMissing('client', 'product');
        $invoice = Invoice::where('client_id', $service->client_id)->where('status', 'unpaid')
            ->whereHas('items', fn ($q) => $q->where('service_id', $service->id))->latest('id')->first();

        $this->send('service_suspended', $service->client, MailFrom::BILLING, [
            ...$this->serviceValues($service),
            'invoice_number' => $invoice?->number,
            'invoice_link' => $invoice ? url("invoices/{$invoice->id}") : url('invoices'),
        ], $invoice ? url("invoices/{$invoice->id}") : url('invoices'), $invoice ? 'Pay invoice' : 'View invoices');
    }

    /** $daysLeft is negative once the domain has expired. */
    public function domainExpiry(Domain $domain, int $daysLeft): void
    {
        $domain->loadMissing('client');
        $invoice = Invoice::where('client_id', $domain->client_id)->where('status', 'unpaid')
            ->whereHas('items', fn ($q) => $q->where('domain_id', $domain->id))->latest('id')->first();

        $this->send($daysLeft >= 0 ? 'domain_renewal_reminder' : 'domain_expired', $domain->client, MailFrom::BILLING, [
            'domain_name' => $domain->name,
            'domain_expiry_date' => $domain->expires_at->format('d M Y'),
            'days_left' => (string) abs($daysLeft),
            'invoice_number' => $invoice?->number,
            'domain_link' => url("domains/{$domain->id}"),
        ], $invoice ? url("invoices/{$invoice->id}") : url("domains/{$domain->id}"), $invoice ? 'Pay invoice' : 'View domain');
    }

    /**
     * A message an admin writes to many clients, as sanitized HTML from the editor.
     * {name}, {email} and {company} are filled in per client.
     */
    public function message(Client $client, string $sender, string $subject, string $html): void
    {
        $fields = ['{name}' => $client->name, '{email}' => $client->email, '{company}' => (string) $client->company];
        $html = strtr($html, array_map(fn ($value) => e($value), $fields));
        $subject = strtr($subject, $fields);

        Mail::to($client->email)->queue(new CustomerNotice(
            sender: $sender,
            subjectLine: $subject,
            heading: $subject,
            body: EmailHtml::toText($html),
            url: url('/'),
            button: 'Open client area',
            richBody: $html,
        ));
    }

    /** The values every template can use about the customer. */
    public static function clientValues(?Client $client): array
    {
        return $client ? [
            'client_name' => $client->name,
            'client_first_name' => strtok((string) $client->name, ' ') ?: $client->name,
            'client_email' => $client->email,
            'client_company' => (string) $client->company,
        ] : [];
    }

    /** Renders the template and sends it. A turned-off template, or a mail outage, sends nothing and breaks nothing. */
    private function send(string $template, ?Client $client, string $sender, array $values, string $url, string $button): void
    {
        if (! $client?->email) {
            return;
        }

        $mail = EmailTemplates::render($template, [...self::clientValues($client), ...$values]);
        if (! $mail) {
            return;
        }

        try {
            Mail::to($client->email)->send(new CustomerNotice(
                sender: $sender,
                subjectLine: $mail['subject'],
                heading: '',
                body: $mail['text'],
                url: $url,
                button: $button,
                richBody: $mail['html'],
            ));
        } catch (Throwable $e) {
            Log::warning("Failed to send \"{$mail['subject']}\" to {$client->email}: ".$e->getMessage());
        }
    }

    private function invoiceValues(Invoice $invoice): array
    {
        return [
            'invoice_number' => $invoice->number,
            'invoice_items' => $this->items($invoice),
            'invoice_total' => $this->money($invoice),
            'invoice_balance' => $this->money($invoice),
            'invoice_due_date' => $invoice->due_date->format('d M Y'),
            'invoice_link' => url("invoices/{$invoice->id}"),
        ];
    }

    private function serviceValues(Service $service): array
    {
        return [
            'service_product_name' => $service->product->name,
            'service_domain' => $service->domain ?: '-',
            'service_link' => url("services/{$service->id}"),
        ];
    }

    private function items(Invoice $invoice): string
    {
        return EmailTemplates::itemsTable($invoice->items->map(fn ($item) => [$item->description, "{$invoice->currency} {$item->amount}"])->all());
    }

    private function money(Invoice $invoice): string
    {
        return "{$invoice->currency} {$invoice->total}";
    }

    private function number(Order $order): string
    {
        return (string) ($order->order_number ?: $order->id);
    }
}
