<?php

namespace App\Payments;

use App\Models\Gateway;
use App\Models\PaymentAttempt;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/** PayPal Payments Standard. Only the signed-off IPN marks an invoice paid, never the return page. */
class PayPalDriver implements PaymentDriver
{
    public function __construct(private Gateway $gateway) {}

    public function charge(string $balance): array
    {
        $amount = bcdiv($balance, (string) $this->gateway->config['usd_rate'], 2);

        if (bccomp($amount, '0.01', 2) < 0) {
            throw new RuntimeException('This amount is too small to pay by PayPal.');
        }

        return [$amount, 'USD'];
    }

    public function start(PaymentAttempt $attempt): string
    {
        $invoice = $attempt->invoice;
        $host = $this->gateway->test_mode ? 'https://www.sandbox.paypal.com' : 'https://www.paypal.com';

        return "{$host}/cgi-bin/webscr?".http_build_query([
            'cmd' => '_xclick',
            'business' => $this->gateway->config['email'],
            'item_name' => "Invoice {$invoice->number}",
            'amount' => $attempt->charge_amount,
            'currency_code' => $attempt->charge_currency,
            'custom' => $attempt->reference,
            'no_shipping' => 1,
            'notify_url' => url('/pay/paypal/ipn'),
            'return' => url("/invoices/{$invoice->id}?payment=processing"),
            'cancel_return' => url("/invoices/{$invoice->id}?payment=cancelled"),
        ]);
    }

    /** @return array{0: bool, 1: string} verified, then the transaction id or the reason it failed */
    public function verifyIpn(PaymentAttempt $attempt, string $rawBody, array $fields): array
    {
        $host = $this->gateway->test_mode ? 'https://ipnpb.sandbox.paypal.com' : 'https://ipnpb.paypal.com';

        try {
            $reply = Http::timeout(30)
                ->withBody('cmd=_notify-validate&'.$rawBody, 'application/x-www-form-urlencoded')
                ->post("{$host}/cgi-bin/webscr")
                ->body();
        } catch (ConnectionException) {
            return [false, 'Could not reach PayPal to verify the IPN.'];
        }

        return match (true) {
            trim($reply) !== 'VERIFIED' => [false, 'PayPal did not verify this IPN.'],
            ($fields['payment_status'] ?? null) !== 'Completed' => [false, 'PayPal payment status is '.($fields['payment_status'] ?? 'unknown').'.'],
            strcasecmp((string) ($fields['receiver_email'] ?? ''), (string) $this->gateway->config['email']) !== 0 => [false, 'Receiver email does not match.'],
            ($fields['mc_currency'] ?? null) !== $attempt->charge_currency => [false, 'Currency does not match.'],
            bccomp((string) ($fields['mc_gross'] ?? '0'), (string) $attempt->charge_amount, 2) !== 0 => [false, 'Amount does not match.'],
            empty($fields['txn_id']) => [false, 'PayPal sent no transaction id.'],
            default => [true, (string) $fields['txn_id']],
        };
    }
}
