<?php

namespace App\Services;

use App\Mail\AdminNotice;
use App\Models\ChatMessage;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Service;
use App\Models\Ticket;
use App\Models\User;
use App\Support\MailFrom;
use App\Support\PaymentMethods;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Emails the admins when something needs their eye: a new order, an invoice raised outside an
 * order, a payment, an order accepted or cancelled, a cancellation request, a support ticket or
 * chat. Each kind can be turned off in Settings > Automation; they go to the report recipients
 * there, else every admin. Tickets and chats also go to every active staff member.
 *
 * Queued like the customer emails, so a slow mail server or reverse DNS lookup never delays
 * checkout. (Sending after the response was dropped: on LiteSpeed the PHP process can end once
 * the response is out, and the email was lost.)
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
                    ['title' => 'ISP Information', 'rows' => ['IP' => $ip, 'Host' => null]],
                ],
                items: $invoice ? $this->items($invoice) : [],
                totalLabel: 'Total Due Today',
                total: $invoice ? $this->money($invoice, $invoice->total) : null,
                url: url("/admin/orders/{$order->id}"),
                button: 'View order',
                hostOf: $ip,
            );
        });
    }

    /** A client asked to cancel a service from its page. */
    public function cancellationRequest(Service $service, string $type, string $reason): void
    {
        $this->later('cancellation_request', function () use ($service, $type, $reason) {
            $service->loadMissing('client', 'product');
            $client = $service->client;
            $when = $type === 'immediate' ? 'Immediate' : 'End of Billing Period'.($service->next_due_date ? ' ('.$service->next_due_date->format('d M Y').')' : '');

            return new AdminNotice(
                sender: MailFrom::SUPPORT,
                subjectLine: "Cancellation request - {$client->name}".($service->domain ? " ({$service->domain})" : ''),
                heading: 'Cancellation Request',
                intro: "{$client->name} asked to cancel a service. Nothing changes until you accept it under Pending Cancellations: then the service is cancelled and its account suspended on the server.",
                groups: [
                    ['title' => 'Service', 'rows' => [
                        'Service ID' => (string) $service->id,
                        'Product' => $service->product?->name,
                        'Domain' => $service->domain,
                        'Status' => ucfirst((string) $service->status),
                        'Next Due Date' => $service->next_due_date?->format('d M Y'),
                    ]],
                    ['title' => 'Request', 'rows' => [
                        'Cancellation Type' => $when,
                    ]],
                    $this->customer($client),
                ],
                items: [],
                totalLabel: null,
                total: null,
                url: url('/admin/products-services?status=pending_cancellation'),
                button: 'View pending cancellations',
                body: $this->clip($reason),
            );
        }, staff: true);
    }

    /** A client opened a ticket, or replied to one ($reply). */
    public function ticket(Ticket $ticket, string $message, bool $reply = false): void
    {
        $this->later('ticket', function () use ($ticket, $message, $reply) {
            $ticket->loadMissing('client', 'service.product');
            $client = $ticket->client;

            return new AdminNotice(
                sender: MailFrom::SUPPORT,
                subjectLine: ($reply ? 'Customer reply' : 'New ticket')." #{$ticket->number}: {$ticket->subject}",
                heading: $reply ? 'Customer Reply' : 'New Support Ticket',
                intro: $reply ? "{$client->name} replied to ticket #{$ticket->number}." : "{$client->name} opened a new ticket.",
                groups: [
                    ['title' => 'Ticket', 'rows' => [
                        'Ticket' => "#{$ticket->number}",
                        'Subject' => $ticket->subject,
                        'Department' => ucfirst((string) $ticket->department),
                        'Priority' => ucfirst((string) $ticket->priority),
                        'Service' => $ticket->service ? trim(($ticket->service->product?->name ?? 'Service').($ticket->service->domain ? " - {$ticket->service->domain}" : '')) : null,
                    ]],
                    $this->customer($client),
                ],
                items: [],
                totalLabel: null,
                total: null,
                url: url("/admin/tickets/{$ticket->id}"),
                button: 'View ticket',
                body: $this->clip($message),
            );
        }, staff: true);
    }

    /**
     * A client wrote in the support chat. Only the first message staff have not seen yet is
     * emailed, so a conversation sends one email, not one per line.
     */
    public function chat(ChatMessage $chat, int $staffReadId): void
    {
        $earlierUnread = ChatMessage::where('client_id', $chat->client_id)->whereNull('user_id')
            ->where('id', '<', $chat->id)->where('id', '>', $staffReadId)->exists();
        if ($earlierUnread) {
            return;
        }

        $this->later('chat', function () use ($chat) {
            $client = $chat->client;

            return new AdminNotice(
                sender: MailFrom::SUPPORT,
                subjectLine: "New chat message - {$client->name}",
                heading: 'New Chat Message',
                intro: "{$client->name} wrote in the support chat.",
                groups: [$this->customer($client)],
                items: [],
                totalLabel: null,
                total: null,
                url: url('/admin/chats/'.$client->id),
                button: 'Open chat',
                body: $this->clip($chat->message ?: ($chat->attachment_name ? "Sent a file: {$chat->attachment_name}" : '')),
            );
        }, staff: true);
    }

    private function clip(string $text): string
    {
        return mb_strimwidth(trim($text), 0, 2000, '...');
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

    /** Builds now and queues the email; the queue worker (cron, every minute) sends it. */
    private function later(string $kind, callable $build, bool $staff = false): void
    {
        if (! config("billing.admin_notifications.{$kind}", true)) {
            return;
        }

        $to = $this->reports->recipients();
        if ($staff) {
            // Support staff answer tickets and chats too, not only the report recipients.
            $to = collect($to)->merge(User::where('is_admin', true)->where('is_active', true)->pluck('email'))
                ->filter()->map(fn ($e) => strtolower(trim($e)))->unique()->values()->all();
        }
        if ($to === []) {
            return;
        }

        try {
            Mail::to($to)->queue($build());
        } catch (Throwable $e) {
            Log::warning("Could not queue the {$kind} admin notification: ".$e->getMessage());
        }
    }
}
