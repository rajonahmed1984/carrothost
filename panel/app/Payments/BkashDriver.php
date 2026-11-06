<?php

namespace App\Payments;

use App\Models\Gateway;
use App\Models\PaymentAttempt;
use App\Support\Currency;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * bKash Tokenized Checkout, two ways:
 *  - Direct (v1.2.0-beta): the panel asks bKash for the grant token with the merchant's
 *    username, password, app key and app secret. Used when those are filled in.
 *  - Token service (v2): an older setup where a separate service hands out the grant token.
 */
class BkashDriver implements PaymentDriver
{
    public const LIVE_URL = 'https://tokenized.pay.bka.sh/v1.2.0-beta';

    public const SANDBOX_URL = 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

    public function __construct(private Gateway $gateway) {}

    /** bKash takes BDT only, so a USD invoice is charged its BDT value at the current rate. */
    public function charge(string $balance, string $currency): array
    {
        return [Currency::convert($balance, $currency, 'BDT'), 'BDT'];
    }

    public function start(PaymentAttempt $attempt): string
    {
        $body = [
            'amount' => $attempt->charge_amount,
            'currency' => $attempt->charge_currency,
            'intent' => 'sale',
            'payerReference' => 'Customer',
            'merchantInvoiceNumber' => $attempt->reference,
            'callbackURL' => url('/pay/bkash/callback'),
        ];

        try {
            $response = $this->client()->post($this->url('create'), $this->direct() ? ['mode' => '0011', ...$body] : $body);
        } catch (ConnectionException) {
            throw new RuntimeException('Could not reach bKash.');
        }

        $url = $response->json('bkashURL');
        $paymentId = $response->json('paymentID') ?? $response->json('paymentId');

        if (! $url || ! $paymentId) {
            throw new RuntimeException('bKash could not start the payment: '.($response->json('statusMessage') ?: $response->json('errorMessage') ?: 'unknown error'));
        }

        $attempt->update(['external_id' => $paymentId]);

        return $url;
    }

    /** @return array{0: bool, 1: string} verified, then the transaction id or the reason it failed */
    public function complete(PaymentAttempt $attempt): array
    {
        $body = $this->direct() ? ['paymentID' => $attempt->external_id] : ['paymentId' => $attempt->external_id];

        try {
            $client = $this->client();
            $response = $client->post($this->url('execute'), $body);
            $data = $response->json();

            // A dropped execute may still have charged the customer, so ask before failing it.
            if (! $response->successful() || empty($data['transactionStatus'])) {
                $data = $client->post($this->url('query'), $body)->json();
            }
        } catch (ConnectionException) {
            return [false, 'Could not reach bKash to confirm. Check this payment in the bKash merchant panel.'];
        }

        $invoiceNumber = $data['merchantInvoiceNumber'] ?? $data['merchantInvoice'] ?? null;
        $transactionId = $data['trxID'] ?? $data['trxId'] ?? null;

        return match (true) {
            ($data['transactionStatus'] ?? null) !== 'Completed' => [false, (string) ($data['statusMessage'] ?? $data['errorMessage'] ?? 'bKash did not complete the payment.')],
            ! $transactionId => [false, 'bKash returned no transaction id.'],
            $invoiceNumber !== null && $invoiceNumber !== $attempt->reference => [false, 'Invoice reference does not match.'],
            bccomp((string) ($data['amount'] ?? '0'), (string) $attempt->charge_amount, 2) !== 0 => [false, 'Amount does not match.'],
            default => [true, (string) $transactionId],
        };
    }

    /** Asks bKash for a grant token, to check the credentials. Throws with the reason when it fails. */
    public function testConnection(): string
    {
        $this->token(fresh: true);

        return $this->direct()
            ? 'Connected to bKash ('.($this->gateway->test_mode ? 'sandbox' : 'live').'). The credentials work.'
            : 'The token service returned a bKash token.';
    }

    /** Username, password and app secret filled in: the panel gets tokens from bKash itself. */
    private function direct(): bool
    {
        $c = $this->gateway->config;

        return filled($c['username'] ?? null) && filled($c['password'] ?? null) && filled($c['app_secret'] ?? null);
    }

    private function url(string $action): string
    {
        if ($this->direct()) {
            $base = rtrim((string) (($this->gateway->config['base_url'] ?? '') ?: ($this->gateway->test_mode ? self::SANDBOX_URL : self::LIVE_URL)), '/');

            return $base.[
                'grant' => '/tokenized/checkout/token/grant',
                'create' => '/tokenized/checkout/create',
                'execute' => '/tokenized/checkout/execute',
                'query' => '/tokenized/checkout/payment/status',
            ][$action];
        }

        $base = $this->gateway->test_mode ? 'https://tokenized.sandbox.bka.sh/v2' : 'https://tokenized.pay.bka.sh/v2';

        return $base.['create' => '/tokenized-checkout/payment/create', 'execute' => '/tokenized-checkout/payment/execute', 'query' => '/tokenized-checkout/query/payment'][$action];
    }

    private function client(): PendingRequest
    {
        return Http::timeout(30)->acceptJson()->withHeaders([
            'Authorization' => $this->token(),
            'X-APP-Key' => (string) $this->gateway->config['app_key'],
        ]);
    }

    private function token(bool $fresh = false): string
    {
        return $this->direct() ? $this->grantToken($fresh) : $this->serviceToken();
    }

    /** A grant token lasts an hour; one is kept for 50 minutes so each payment does not ask again. */
    private function grantToken(bool $fresh): string
    {
        $c = $this->gateway->config;
        $key = 'bkash.grant.'.sha1(implode('|', [$this->url('grant'), $c['username'], $c['app_key']]));

        if ($fresh) {
            Cache::forget($key);
        }

        return Cache::remember($key, now()->addMinutes(50), function () use ($c) {
            try {
                $response = Http::timeout(30)->acceptJson()
                    ->withHeaders(['username' => (string) $c['username'], 'password' => (string) $c['password']])
                    ->post($this->url('grant'), ['app_key' => (string) $c['app_key'], 'app_secret' => (string) $c['app_secret']]);
            } catch (ConnectionException) {
                throw new RuntimeException('Could not reach bKash.');
            }

            $token = $response->json('id_token');
            if (! $token) {
                throw new RuntimeException('bKash refused the credentials: '.($response->json('statusMessage') ?: $response->json('msg') ?: $response->json('errorMessage') ?: 'HTTP '.$response->status()).'. Check the username, password, app key and app secret, and Sandbox mode.');
            }

            return (string) $token;
        });
    }

    private function serviceToken(): string
    {
        $token = Http::timeout(30)
            ->acceptJson()
            ->withToken((string) ($this->gateway->config['token_secret'] ?? ''))
            ->get((string) ($this->gateway->config['token_url'] ?? ''))
            ->json('id_token');

        if (! $token) {
            throw new RuntimeException('Could not get a bKash token. Fill in the username, password, app key and app secret, or check the Token API URL and secret.');
        }

        return $token;
    }
}
