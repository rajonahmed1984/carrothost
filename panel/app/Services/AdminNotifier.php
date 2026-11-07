<?php

namespace App\Services;

use App\Mail\AdminNotice;
use App\Models\Invoice;
use App\Models\Order;
use App\Support\MailFrom;
use App\Support\PaymentMethods;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Emails the admins when something needs their eye: a new order, an invoice raised outside an
 * order, a payment, an order accepted or cancelled. Each kind can be turned off in Settings >
 * Automation; they go to the report recipients there, else every admin.
 *
 * Sent after the response, so a slow mail server or reverse DNS lookup never delays checkout.
 */
class AdminNotifier
{
    public function __construct(private readonly AdminReports $reports) {}

    public function newOrder(Order $order, ?string $ip = null): void
    {
        $this->later('new_order', function () use ($order, $ip) {
            $order->loadMissing('client', 'invoices.items');
            $invoice = $order->invoices->sortByDesc('id')->first();
            $client = $order->client;
            $number = $order->order_number ?: (string) $order->id;

            return new AdminNotice(
                sender: MailFrom::SALES,
                subjectLine: "New order #{$number} - {$client->name}",
                heading: 'New Order',
                intro: "{$client->name} placed an order. Accept it to set up the services.",
                groups: [
                    ['title' => 'Order Information', 'rows' => [
                        'Order ID' => (string) $order->id,
                        'Order Number' => $number,
                        'Date/Time' => $order->created_at?->timezone(config('app.timezone'))->format('d M Y h:i A').' ('.config('app.timezone').')',
                        'Invoice Number' => $invoice?->number,
                        'Payment Method' => PaymentMethods::label($order->payment_method),
                    ]],
                    $this->customer($client),
                    ['title' => 'ISP Information', 'rows' => ['IP' => $ip, 'Host' => $this->host($ip)]],
                ],
                items: $invoice ? $this->items($invoice) : [],
                totalLabel: 'Total Due Today',
                total: $invoice ? $this->money($invoice, $invoice->total) : null,
                url: url("/admin/orders/{$order->id}"),
                button: 'View order',
            );
        });
    }

    public function orderAccepted(Order $order): void
    {
        $this->orderStatus($order, 'accepted');
    }

    public function orderCancelled(Order $order): void
    {
        $this->orderStatus($order, 'cancelled');
    }

    /** Invoices of an order are announced with the order; this is for renewals, add funds and manual ones. */
    public function invoiceCreated(Invoice $invoice): void
    {
        $this->later('invoice_created', fn () => $this->invoiceNotice($invoice->loadMissing('client', 'items'),
            subject: "Invoice #{$invoice->number} created - {$invoice->client->name}",
            heading: 'Invoice Created',
            intro: "A new invoice was raised for {$invoice->client->name}.",
            totalLabel: 'Total Due',
        ));
    }

    public function invoicePaid(Invoice $invoice): void
    {
        $this->later('invoice_paid', function () use ($invoice) {
            $invoice->loadMissing('client', 'items', 'payments');
            $payment = $invoice->payments->sortByDesc('id')->first();

            return $this->invoiceNotice($invoice,
                subject: "Payment received for invoice #{$invoice->number} - {$invoice->client->name}",
                heading: 'Invoice Paid',
                intro: "{$invoice->client->name} paid invoice #{$invoice->number}.",
                totalLabel: 'Total Paid',
                payment: $payment ? [
                    'Payment Method' => PaymentMethods::label($payment->gateway),
                    'Transaction ID' => $payment->transaction_id,
                    'Amount' => $this->money($invoice, $payment->amount),
                    'Paid At' => $invoice->paid_at?->timezone(config('app.timezone'))->format('d M Y h:i A'),
                ] : null,
            );
        });
    }

    private function orderStatus(Order $order, string $status): void
    {
        $this->later('order_status', function () use ($order, $status) {
            $order->loadMissing('client', 'invoices.items');
            $invoice = $order->invoices->sortByDesc('id')->first();
            $number = $order->order_number ?: (string) $order->id;
            $by = auth('web')->user()?->name;

            return new AdminNotice(
                sender: MailFrom::SALES,
                subjectLine: 'Order #'.$number.' '.$status.' - '.$order->client->name,
                heading: 'Order '.ucfirst($status),
                intro: "Order #{$number} was {$status}".($by ? " by {$by}" : '').'.',
                groups: [
                    ['title' => 'Order Information', 'rows' => [
                        'Order Number' => $number,
                        'Status' => ucfirst($order->status),
                        'Invoice Number' => $invoice?->number,
                        'Invoice Status' => $invoice ? ucfirst($invoice->status) : null,
                    ]],
                    $this->customer($order->client),
                ],
                items: $invoice ? $this->items($invoice) : [],
                totalLabel: 'Order Total',
                total: $invoice ? $this->money($invoice, $invoice->total) : null,
                url: url("/admin/orders/{$order->id}"),
                button: 'View order',
            );
        });
    }

    /** @param  array<string, string|null>|null  $payment */
    private function invoiceNotice(Invoice $invoice, string $subject, string $heading, string $intro, string $totalLabel, ?array $payment = null): AdminNotice
    {
        return new AdminNotice(
            sender: MailFrom::BILLING,
            subjectLine: $subject,
            heading: $heading,
            intro: $intro,
            groups: array_values(array_filter([
                ['title' => 'Invoice Information', 'rows' => [
                    'Invoice Number' => $invoice->number,
                    'Invoice Date' => $invoice->created_at?->format('d M Y'),
                    'Due Date' => $invoice->due_date?->format('d M Y'),
                    'Status' => ucfirst($invoice->status),
                ]],
                $payment ? ['title' => 'Payment', 'rows' => $payment] : null,
                $this->customer($invoice->client),
            ])),
            items: $this->items($invoice),
            totalLabel: $totalLabel,
            total: $this->money($invoice, $invoice->total),
            url: url("/admin/invoices/{$invoice->id}"),
            button: 'View invoice',
        );
    }

    /** @return array{title: string, rows: array<string, string|null>} */
    private function customer($client): array
    {
        return ['title' => 'Customer Information', 'rows' => [
            'Customer ID' => (string) $client->id,
            'Name' => $client->name,
            'Email' => $client->email,
            'Company' => $client->company,
            'Address' => implode(', ', array_filter([$client->address, $client->city, $client->country])) ?: null,
            'Phone Number' => $client->phone,
        ]];
    }

    /** @return list<array{0: string, 1: string}> */
    private function items(Invoice $invoice): array
    {
        return $invoice->items->map(fn ($item) => [$item->description, $this->money($invoice, $item->amount)])->values()->all();
    }

    private function money(Invoice $invoice, string|float|null $amount): string
    {
        return $invoice->currency.' '.number_format((float) $amount, 2);
    }

    /** Reverse DNS of the buyer's address, when it has one. */
    private function host(?string $ip): ?string
    {
        if (! $ip || ! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return null;
        }
        $host = @gethostbyaddr($ip);

        return $host && $host !== $ip ? $host : null;
    }

    /** Builds and sends once the response has gone out (or at the end of a console command). */
    private function later(string $kind, callable $build): void
    {
        if (! config("billing.admin_notifications.{$kind}", true)) {
            return;
        }

        // Not through the queue: these must go out even where no queue worker runs.
        app()->terminating(function () use ($kind, $build) {
            $to = $this->reports->recipients();
            if ($to === []) {
                return;
            }

            try {
                Mail::to($to)->send($build());
            } catch (Throwable $e) {
                Log::warning("Could not send the {$kind} admin notification: ".$e->getMessage());
            }
        });
    }
}
