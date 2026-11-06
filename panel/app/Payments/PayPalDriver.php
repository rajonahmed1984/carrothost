<?php

namespace App\Payments;

use App\Models\Gateway;
use App\Models\PaymentAttempt;
use App\Support\Currency;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/** PayPal Payments Standard. Only the signed-off IPN marks an invoice paid, never the return page. */
class PayPalDriver implements PaymentDriver
{
    public function __construct(private Gateway $gateway) {}

    public function charge(string $balance, string $currency): array
    {
        // A USD invoice is charged as it is.
        if (strtoupper($currency) === 'USD') {
            return [$balance, 'USD'];
        }

        // The gateway's own rate, else the one in Settings > Currencies.
        $rate = (float) ($this->gateway->config['usd_rate'] ?? 0) > 0 ? (float) $this->gateway->config['usd_rate'] : Currency::bdtRate('USD');
        if (! $rate) {
            throw new RuntimeException('PayPal needs a USD rate. Set BDT per 1 USD in Settings > Currencies.');
        }
        $amount = bcdiv($balance, number_format($rate, 4, '.', ''), 2);

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

    /**
     * Checkout needs only the email (PayPal Standard, confirmed by IPN). With the classic API
     * username, password and signature saved, it also asks PayPal for the balance to prove they work.
     */
    public function testConnection(): string
    {
        $c = $this->gateway->config;
        if (! filter_var($c['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Enter the PayPal email that receives payments.');
        }
        if (blank($c['api_username'] ?? null) || blank($c['api_password'] ?? null) || blank($c['api_signature'] ?? null)) {
            return "PayPal checkout needs only the email ({$c['email']}). Add the API username, password and signature to check the account itself.";
        }

        try {
            $reply = Http::asForm()->timeout(30)->post($this->gateway->test_mode ? 'https://api-3t.sandbox.paypal.com/nvp' : 'https://api-3t.paypal.com/nvp', [
                'METHOD' => 'GetBalance', 'VERSION' => '204',
                'USER' => $c['api_username'], 'PWD' => $c['api_password'], 'SIGNATURE' => $c['api_signature'],
            ])->body();
        } catch (\Illuminate\Http\Client\ConnectionException) {
            throw new RuntimeException('Could not reach PayPal.');
        }
        parse_str($reply, $answer);

        if (! str_starts_with(strtoupper((string) ($answer['ACK'] ?? '')), 'SUCCESS')) {
            throw new RuntimeException('PayPal refused the API credentials: '.($answer['L_LONGMESSAGE0'] ?? $answer['L_SHORTMESSAGE0'] ?? 'no answer').'. Check them and Sandbox mode.');
        }

        return 'Connected to PayPal ('.($this->gateway->test_mode ? 'sandbox' : 'live').'). The API credentials work; payments go to '.$c['email'].'.';
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
