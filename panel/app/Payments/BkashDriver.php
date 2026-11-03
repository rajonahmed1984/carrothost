<?php

namespace App\Payments;

use App\Models\Gateway;
use App\Models\PaymentAttempt;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/** bKash Tokenized Checkout v2. The grant token comes from a separate token service. */
class BkashDriver implements PaymentDriver
{
    public function __construct(private Gateway $gateway) {}

    public function charge(string $balance): array
    {
        return [$balance, 'BDT'];
    }

    public function start(PaymentAttempt $attempt): string
    {
        try {
            $response = $this->client()->post($this->base().'/tokenized-checkout/payment/create', [
                'amount' => $attempt->charge_amount,
                'currency' => $attempt->charge_currency,
                'intent' => 'sale',
                'payerReference' => 'Customer',
                'merchantInvoiceNumber' => $attempt->reference,
                'callbackURL' => url('/pay/bkash/callback'),
            ]);
        } catch (ConnectionException) {
            throw new RuntimeException('Could not reach bKash.');
        }

        $url = $response->json('bkashURL');
        $paymentId = $response->json('paymentID') ?? $response->json('paymentId');

        if (! $url || ! $paymentId) {
            throw new RuntimeException('bKash could not start the payment: '.($response->json('statusMessage') ?: 'unknown error'));
        }

        $attempt->update(['external_id' => $paymentId]);

        return $url;
    }

    /** @return array{0: bool, 1: string} verified, then the transaction id or the reason it failed */
    public function complete(PaymentAttempt $attempt): array
    {
        $body = ['paymentId' => $attempt->external_id];

        try {
            $client = $this->client();
            $response = $client->post($this->base().'/tokenized-checkout/payment/execute', $body);
            $data = $response->json();

            // A dropped execute may still have charged the customer, so ask before failing it.
            if (! $response->successful() || empty($data['transactionStatus'])) {
                $data = $client->post($this->base().'/tokenized-checkout/query/payment', $body)->json();
            }
        } catch (ConnectionException) {
            return [false, 'Could not reach bKash to confirm. Check this payment in the bKash merchant panel.'];
        }

        $invoiceNumber = $data['merchantInvoiceNumber'] ?? $data['merchantInvoice'] ?? null;
        $transactionId = $data['trxID'] ?? $data['trxId'] ?? null;

        return match (true) {
            ($data['transactionStatus'] ?? null) !== 'Completed' => [false, (string) ($data['statusMessage'] ?? 'bKash did not complete the payment.')],
            ! $transactionId => [false, 'bKash returned no transaction id.'],
            $invoiceNumber !== null && $invoiceNumber !== $attempt->reference => [false, 'Invoice reference does not match.'],
            bccomp((string) ($data['amount'] ?? '0'), (string) $attempt->charge_amount, 2) !== 0 => [false, 'Amount does not match.'],
            default => [true, (string) $transactionId],
        };
    }

    private function client(): PendingRequest
    {
        return Http::timeout(30)->acceptJson()->withHeaders([
            'Authorization' => $this->token(),
            'X-APP-Key' => (string) $this->gateway->config['app_key'],
        ]);
    }

    private function token(): string
    {
        $token = Http::timeout(30)
            ->acceptJson()
            ->withToken((string) $this->gateway->config['token_secret'])
            ->get((string) $this->gateway->config['token_url'])
            ->json('id_token');

        if (! $token) {
            throw new RuntimeException('Could not get a bKash token. Check the Token API URL and secret.');
        }

        return $token;
    }

    private function base(): string
    {
        return $this->gateway->test_mode ? 'https://tokenized.sandbox.bka.sh/v2' : 'https://tokenized.pay.bka.sh/v2';
    }
}
