<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Gateway;
use App\Models\Invoice;
use App\Models\PaymentAttempt;
use App\Payments\PaymentDriver;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class PaymentService
{
    public function __construct(private BillingService $billing) {}

    public function driver(string $code): ?PaymentDriver
    {
        $class = config("billing.gateways.{$code}.driver");
        $gateway = Gateway::where('code', $code)->where('is_enabled', true)->first();

        return $class && $gateway ? new $class($gateway) : null;
    }

    public function balance(Invoice $invoice): string
    {
        $paid = array_reduce(
            $invoice->payments()->pluck('amount')->all(),
            fn (string $sum, $value) => bcadd($sum, (string) $value, 2),
            '0',
        );

        return bccomp($paid, (string) $invoice->total, 2) >= 0 ? '0.00' : bcsub((string) $invoice->total, $paid, 2);
    }

    /** Returns the URL to send the customer to. */
    public function begin(Invoice $invoice, string $code): string
    {
        $driver = $this->driver($code);
        $balance = $this->balance($invoice);

        if (! $driver) {
            throw ValidationException::withMessages(['gateway' => 'This payment method is not available.']);
        }

        if ($invoice->status !== 'unpaid' || bccomp($balance, '0', 2) <= 0) {
            throw ValidationException::withMessages(['invoice' => 'This invoice has nothing left to pay.']);
        }

        try {
            [$chargeAmount, $chargeCurrency] = $driver->charge($balance);

            $attempt = PaymentAttempt::create([
                'invoice_id' => $invoice->id,
                'gateway' => $code,
                'reference' => 'CH'.$invoice->id.'-'.Str::upper(Str::random(12)),
                'amount' => $balance,
                'charge_amount' => $chargeAmount,
                'charge_currency' => $chargeCurrency,
            ]);

            return $driver->start($attempt);
        } catch (RuntimeException $e) {
            if (isset($attempt)) {
                $attempt->update(['status' => 'failed', 'failure_reason' => $e->getMessage()]);
            }

            ActivityLog::record('payment.start_failed', $invoice, ['gateway' => $code, 'error' => $e->getMessage()]);

            throw ValidationException::withMessages(['gateway' => 'This payment method is unavailable right now. Please try another.']);
        }
    }

    /** Credits the invoice. Safe to call again for the same attempt: callback and IPN both arrive. */
    public function settle(PaymentAttempt $attempt, string $transactionId): bool
    {
        try {
            DB::transaction(function () use ($attempt, $transactionId) {
                $locked = PaymentAttempt::whereKey($attempt->id)->lockForUpdate()->firstOrFail();

                if ($locked->status === 'paid') {
                    return;
                }

                $this->billing->recordPayment($locked->invoice, $locked->gateway, $transactionId, (string) $locked->amount, ['reference' => $locked->reference]);
                $locked->update(['status' => 'paid', 'failure_reason' => null]);
            });

            return true;
        } catch (Throwable $e) {
            // The customer has paid but the invoice could not take it: an admin must see this.
            $this->fail($attempt, 'Paid at the gateway but not credited: '.$e->getMessage());

            return false;
        }
    }

    public function fail(PaymentAttempt $attempt, string $reason, string $status = 'failed'): void
    {
        if ($attempt->status === 'paid') {
            return;
        }

        $attempt->update(['status' => $status, 'failure_reason' => mb_substr($reason, 0, 255)]);
        ActivityLog::record("payment.{$status}", $attempt->invoice, ['gateway' => $attempt->gateway, 'reason' => $reason]);
    }
}
