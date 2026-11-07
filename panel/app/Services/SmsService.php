<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\SmsLog;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Customer SMS through the 24bulksmsbd.com gateway (config/sms.php, Admin > Settings > SMS).
 *
 * The gateway takes customer_id, api_key, mobile_no and message, answers with
 * {"status": "...", "message": "..."} and only accepts requests from a whitelisted
 * server IP, so from a local machine it always answers "not whitelisted".
 */
class SmsService
{
    public const EVENTS = ['invoice_created', 'invoice_paid', 'invoice_reminder'];

    public const PLACEHOLDERS = ['client_name', 'company_name', 'invoice_number', 'invoice_total', 'amount_due', 'invoice_due_date', 'payment_url', 'invoice_url'];

    public function __construct(private readonly BillingService $billing) {}

    public function enabled(): bool
    {
        return (bool) config('sms.enabled');
    }

    public function isConfigured(): bool
    {
        return $this->apiUrl() !== '' && $this->customerId() !== '' && $this->apiKey() !== '';
    }

    /** $event is one of EVENTS. Does nothing unless SMS and that event are switched on. */
    public function sendForInvoice(Invoice $invoice, string $event): void
    {
        $kind = substr($event, strlen('invoice_'));
        if (! $this->enabled() || ! config("sms.invoice.{$kind}")) {
            return;
        }

        // The job may sit in the queue a while: only send what is still true.
        $still = match ($event) {
            'invoice_created', 'invoice_reminder' => $invoice->status === 'unpaid' && (float) $this->billing->balanceDue($invoice) > 0,
            'invoice_paid' => $invoice->status === 'paid',
            default => false,
        };
        if (! $still) {
            return;
        }

        $invoice->loadMissing('client');
        $log = ['client_id' => $invoice->client_id, 'invoice_id' => $invoice->id, 'event' => $event];

        if (! $this->isConfigured()) {
            SmsLog::create($log + ['status' => 'skipped', 'response' => 'SMS gateway is not configured.']);

            return;
        }

        if ($this->normalizeMobile($invoice->client?->phone) === null) {
            SmsLog::create($log + ['status' => 'skipped', 'response' => mb_strimwidth('No valid Bangladeshi mobile number on the client: '.($invoice->client?->phone ?: 'none'), 0, 255, '...')]);

            return;
        }

        $this->send((string) $invoice->client->phone, $this->render($invoice, (string) config("sms.templates.{$event}")), $log);
    }

    /**
     * Sends one message and records it in the SMS log.
     *
     * @return array{success: bool, message: string, mobile: ?string}
     */
    public function send(string $mobile, string $message, array $log = ['event' => 'test']): array
    {
        $normalized = $this->normalizeMobile($mobile);
        $message = trim($message);

        $result = match (true) {
            $normalized === null => ['success' => false, 'message' => 'Invalid Bangladeshi mobile number.'],
            $message === '' => ['success' => false, 'message' => 'Message is empty.'],
            ! $this->isConfigured() => ['success' => false, 'message' => 'SMS gateway is not configured.'],
            default => $this->post($normalized, $message),
        };

        SmsLog::create($log + [
            'mobile' => $normalized ?? mb_substr($mobile, 0, 20),
            'message' => $message,
            'status' => $result['success'] ? 'sent' : 'failed',
            'response' => mb_strimwidth($result['message'], 0, 255, '...'),
        ]);

        return $result + ['mobile' => $normalized];
    }

    /**
     * Bangladeshi mobile numbers in any common shape (01XXXXXXXXX, +8801XXXXXXXXX,
     * +880.1XXX-XXXXXX, 1XXXXXXXXX) become 8801XXXXXXXXX. Anything else is
     * rejected, since the gateway only delivers locally.
     */
    public function normalizeMobile(?string $mobile): ?string
    {
        foreach (preg_split('/[,;\/]+/', (string) $mobile) ?: [] as $candidate) {
            $digits = preg_replace('/\D+/', '', $candidate) ?? '';

            if (str_starts_with($digits, '00')) {
                $digits = substr($digits, 2);
            }

            if (preg_match('/^8801[3-9]\d{8}$/', $digits)) {
                return $digits;
            }
            if (preg_match('/^01[3-9]\d{8}$/', $digits)) {
                return '88'.$digits;
            }
            if (preg_match('/^1[3-9]\d{8}$/', $digits)) {
                return '880'.$digits;
            }
        }

        return null;
    }

    public function render(Invoice $invoice, string $template): string
    {
        $invoice->loadMissing('client');
        $money = fn ($amount) => trim($invoice->currency.' '.number_format((float) $amount, 2));

        $values = [
            'client_name' => $invoice->client?->name ?: 'Customer',
            'company_name' => (string) config('app.name'),
            'invoice_number' => (string) $invoice->number,
            'invoice_total' => $money($invoice->total),
            'amount_due' => $money($this->billing->balanceDue($invoice)),
            'invoice_due_date' => $invoice->due_date?->format('d M Y') ?? '--',
            'payment_url' => url("invoices/{$invoice->id}"),
            'invoice_url' => url("invoices/{$invoice->id}"),
        ];

        return strtr($template, collect($values)->mapWithKeys(fn ($v, $k) => ['{{'.$k.'}}' => $v])->all());
    }

    /** @return array{success: bool, message: string} */
    private function post(string $mobile, string $message): array
    {
        try {
            $response = Http::asForm()->acceptJson()
                ->timeout(max(5, (int) config('sms.timeout', 15)))
                ->post($this->apiUrl(), [
                    'customer_id' => $this->customerId(),
                    'api_key' => $this->apiKey(),
                    'mobile_no' => $mobile,
                    'message' => $message,
                ]);
        } catch (Throwable $e) {
            return ['success' => false, 'message' => 'Gateway request failed: '.$e->getMessage()];
        }

        $body = trim($response->body());
        $json = $response->json();
        $status = is_array($json) ? strtolower(trim((string) ($json['status'] ?? ''))) : '';
        $said = is_array($json) ? trim((string) ($json['message'] ?? '')) : '';

        $success = $response->successful() && ($status !== ''
            ? ! str_contains($status, 'fail') && ! str_contains($status, 'error')
            : $body !== '' && ! str_contains(strtolower($body), 'fail'));

        return ['success' => $success, 'message' => $said ?: ($body !== '' ? $body : 'HTTP '.$response->status())];
    }

    private function apiUrl(): string
    {
        return trim((string) config('sms.api_url'));
    }

    private function customerId(): string
    {
        return trim((string) config('sms.customer_id'));
    }

    private function apiKey(): string
    {
        return trim((string) config('sms.api_key'));
    }
}
