<?php

namespace App\Payments;

use App\Models\Gateway;
use App\Models\PaymentAttempt;
use App\Support\Currency;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class SslCommerzDriver implements PaymentDriver
{
    public function __construct(private Gateway $gateway) {}

    /** Charged in BDT; a USD invoice is charged its BDT value at the current rate. */
    public function charge(string $balance, string $currency): array
    {
        return [Currency::convert($balance, $currency, 'BDT'), 'BDT'];
    }

    public function start(PaymentAttempt $attempt): string
    {
        $client = $attempt->invoice->client;

        try {
            $response = Http::asForm()->timeout(30)->post($this->base().'/gwprocess/v4/api.php', [
                'store_id' => $this->gateway->config['store_id'],
                'store_passwd' => $this->gateway->config['store_password'],
                'total_amount' => $attempt->charge_amount,
                'currency' => $attempt->charge_currency,
                'tran_id' => $attempt->reference,
                'success_url' => url('/pay/sslcommerz/success'),
                'fail_url' => url('/pay/sslcommerz/fail'),
                'cancel_url' => url('/pay/sslcommerz/cancel'),
                'ipn_url' => url('/pay/sslcommerz/ipn'),
                'cus_name' => $client->name,
                'cus_email' => $client->email,
                'cus_add1' => $client->address ?: 'N/A',
                'cus_city' => $client->city ?: 'N/A',
                'cus_country' => $client->country ?: 'BD',
                'cus_phone' => $client->phone ?: 'N/A',
                'shipping_method' => 'NO',
                'product_name' => $attempt->invoice->number,
                'product_category' => 'Hosting',
                'product_profile' => 'non-physical-goods',
            ]);
        } catch (ConnectionException) {
            throw new RuntimeException('Could not reach SSLCommerz.');
        }

        $url = $response->json('GatewayPageURL');

        if ($response->json('status') !== 'SUCCESS' || ! $url) {
            throw new RuntimeException('SSLCommerz could not start the payment: '.($response->json('failedreason') ?: 'unknown error'));
        }

        return $url;
    }

    /** @return array{0: bool, 1: string} verified, then the transaction id or the reason it failed */
    public function verify(PaymentAttempt $attempt, string $valId): array
    {
        try {
            $response = Http::timeout(30)->get($this->base().'/validator/api/validationserverAPI.php', [
                'val_id' => $valId,
                'store_id' => $this->gateway->config['store_id'],
                'store_passwd' => $this->gateway->config['store_password'],
                'format' => 'json',
            ]);
        } catch (ConnectionException) {
            return [false, 'Could not reach SSLCommerz to validate.'];
        }

        $data = $response->json();

        return match (true) {
            ! in_array($data['status'] ?? null, ['VALID', 'VALIDATED'], true) => [false, 'SSLCommerz did not validate the payment.'],
            ($data['tran_id'] ?? null) !== $attempt->reference => [false, 'Transaction id does not match.'],
            ($data['currency_type'] ?? null) !== $attempt->charge_currency => [false, 'Currency does not match.'],
            bccomp((string) ($data['currency_amount'] ?? $data['amount'] ?? '0'), (string) $attempt->charge_amount, 2) !== 0 => [false, 'Amount does not match.'],
            (string) ($data['risk_level'] ?? '0') === '1' => [false, 'SSLCommerz flagged this payment as risky. Review it in the merchant panel.'],
            default => [true, (string) ($data['bank_tran_id'] ?? $valId)],
        };
    }

    private function base(): string
    {
        return $this->gateway->test_mode ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';
    }
}
