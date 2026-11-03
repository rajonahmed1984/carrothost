<?php

namespace App\Http\Controllers;

use App\Models\PaymentAttempt;
use App\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Gateways and customers' browsers call these without a login. Nothing in the
 * request is trusted: every result is re-checked with the gateway server to server.
 */
class PaymentCallbackController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    public function sslcommerzSuccess(Request $request): RedirectResponse
    {
        $attempt = $this->attempt('sslcommerz', 'reference', $request->input('tran_id'));

        return $this->back($attempt, $this->confirmSslcommerz($attempt, $request) ? 'success' : 'failed');
    }

    public function sslcommerzIpn(Request $request)
    {
        $this->confirmSslcommerz($this->attempt('sslcommerz', 'reference', $request->input('tran_id')), $request);

        return response('OK');
    }

    public function sslcommerzFail(Request $request): RedirectResponse
    {
        $attempt = $this->attempt('sslcommerz', 'reference', $request->input('tran_id'));
        $this->payments->fail($attempt, 'SSLCommerz reported the payment failed.');

        return $this->back($attempt, 'failed');
    }

    public function sslcommerzCancel(Request $request): RedirectResponse
    {
        $attempt = $this->attempt('sslcommerz', 'reference', $request->input('tran_id'));
        $this->payments->fail($attempt, 'Customer cancelled at SSLCommerz.', 'cancelled');

        return $this->back($attempt, 'cancelled');
    }

    public function bkash(Request $request): RedirectResponse
    {
        $attempt = $this->attempt('bkash', 'external_id', $request->query('paymentID'));
        $status = $request->query('status');

        if ($status !== 'success') {
            $this->payments->fail($attempt, "bKash returned status {$status}.", $status === 'cancel' ? 'cancelled' : 'failed');

            return $this->back($attempt, $status === 'cancel' ? 'cancelled' : 'failed');
        }

        if ($attempt->status === 'paid') {
            return $this->back($attempt, 'success');
        }

        [$verified, $result] = $this->payments->driver('bkash')?->complete($attempt) ?? [false, 'bKash is disabled.'];

        if (! $verified) {
            $this->payments->fail($attempt, $result);

            return $this->back($attempt, 'failed');
        }

        return $this->back($attempt, $this->payments->settle($attempt, $result) ? 'success' : 'failed');
    }

    public function paypalIpn(Request $request)
    {
        $attempt = $this->attempt('paypal', 'reference', $request->input('custom'));
        [$verified, $result] = $this->payments->driver('paypal')?->verifyIpn($attempt, $request->getContent(), $request->all()) ?? [false, 'PayPal is disabled.'];

        if ($verified) {
            $this->payments->settle($attempt, $result);
        } else {
            $this->payments->fail($attempt, $result);
        }

        return response('OK');
    }

    private function confirmSslcommerz(PaymentAttempt $attempt, Request $request): bool
    {
        if ($attempt->status === 'paid') {
            return true;
        }

        [$verified, $result] = $this->payments->driver('sslcommerz')?->verify($attempt, (string) $request->input('val_id')) ?? [false, 'SSLCommerz is disabled.'];

        if (! $verified) {
            $this->payments->fail($attempt, $result);

            return false;
        }

        return $this->payments->settle($attempt, $result);
    }

    private function attempt(string $gateway, string $column, mixed $value): PaymentAttempt
    {
        abort_unless(is_string($value) && $value !== '', 404);

        return PaymentAttempt::where('gateway', $gateway)->where($column, $value)->firstOrFail();
    }

    private function back(PaymentAttempt $attempt, string $outcome): RedirectResponse
    {
        return redirect("/invoices/{$attempt->invoice_id}?payment={$outcome}");
    }
}
