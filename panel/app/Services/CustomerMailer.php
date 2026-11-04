<?php

namespace App\Services;

use App\Mail\CustomerNotice;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Order;
use App\Support\EmailHtml;
use App\Support\MailFrom;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/** Order emails come from sales and invoice emails from billing (config/system_mail.php). */
class CustomerMailer
{
    public function orderPlaced(Order $order): void
    {
        $invoice = $order->invoices()->latest('id')->first();
        $lines = $invoice ? $this->items($invoice) : '';

        $this->send($order->client->email, new CustomerNotice(
            sender: MailFrom::SALES,
            subjectLine: "Order confirmation #{$this->number($order)}",
            heading: 'Thank you for your order',
            body: "Hello {$order->client->name},\n\nWe have received your order #{$this->number($order)}.\n\n{$lines}"
                .($invoice ? "\n\nInvoice {$invoice->number} for {$this->money($invoice)} is due on {$invoice->due_date->format('d M Y')}. Your order is set up once it is paid." : ''),
            url: $invoice ? url("invoices/{$invoice->id}") : url('services'),
            button: $invoice ? 'View invoice' : 'View services',
        ));
    }

    public function orderAccepted(Order $order): void
    {
        $this->send($order->client->email, new CustomerNotice(
            sender: MailFrom::SALES,
            subjectLine: "Your order #{$this->number($order)} has been accepted",
            heading: 'Order accepted',
            body: "Hello {$order->client->name},\n\nYour order #{$this->number($order)} has been accepted and is being set up. We will email your login details once it is ready.",
            url: url('services'),
            button: 'View services',
        ));
    }

    public function invoiceCreated(Invoice $invoice): void
    {
        $this->send($invoice->client->email, new CustomerNotice(
            sender: MailFrom::BILLING,
            subjectLine: "New invoice {$invoice->number}",
            heading: "Invoice {$invoice->number}",
            body: "Hello {$invoice->client->name},\n\nA new invoice has been generated for you.\n\n{$this->items($invoice)}\n\nTotal: {$this->money($invoice)}\nDue date: {$invoice->due_date->format('d M Y')}",
            url: url("invoices/{$invoice->id}"),
            button: 'Pay invoice',
        ));
    }

    public function invoiceReminder(Invoice $invoice, string $due): void
    {
        $overdue = $invoice->due_date->isPast() && ! $invoice->due_date->isToday();

        $this->send($invoice->client->email, new CustomerNotice(
            sender: MailFrom::BILLING,
            subjectLine: $overdue ? "Overdue invoice {$invoice->number}" : "Invoice payment reminder {$invoice->number}",
            heading: $overdue ? 'Your invoice is overdue' : 'Payment reminder',
            body: "Hello {$invoice->client->name},\n\nThis is a reminder that invoice {$invoice->number} ".($overdue ? 'was' : 'is')." due on {$invoice->due_date->format('d M Y')}.\n\n{$this->items($invoice)}\n\nAmount due: {$invoice->currency} {$due}",
            url: url("invoices/{$invoice->id}"),
            button: 'Pay invoice',
        ));
    }

    public function paymentReceived(Invoice $invoice): void
    {
        $this->send($invoice->client->email, new CustomerNotice(
            sender: MailFrom::BILLING,
            subjectLine: "Payment received for invoice {$invoice->number}",
            heading: 'Payment received',
            body: "Hello {$invoice->client->name},\n\nThank you. We have received full payment for invoice {$invoice->number} ({$this->money($invoice)}).",
            url: url("invoices/{$invoice->id}"),
            button: 'View invoice',
        ));
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

    /** A mail outage must never undo the order or payment itself. */
    private function send(?string $email, CustomerNotice $mail): void
    {
        if (! $email) {
            return;
        }

        try {
            Mail::to($email)->send($mail);
        } catch (Throwable $e) {
            Log::warning("Failed to send \"{$mail->subjectLine}\" to {$email}: ".$e->getMessage());
        }
    }

    private function items(Invoice $invoice): string
    {
        return $invoice->items->map(fn ($item) => "- {$item->description}: {$invoice->currency} {$item->amount}")->implode("\n");
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
