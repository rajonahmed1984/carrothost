<?php

namespace Tests\Feature;

use App\Jobs\ProvisionService;
use App\Models\Client;
use App\Models\Gateway;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentAttempt;
use App\Services\BillingService;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class OnlinePaymentTest extends TestCase
{
    use RefreshDatabase;

    private Client $client;

    private Invoice $invoice;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        $this->client = Client::create(['name' => 'Payer', 'email' => 'payer@example.com', 'password' => 'correct-horse']);
        $this->invoice = app(BillingService::class)->createInvoice($this->client, [['description' => 'Hosting', 'amount' => '4200.00']], now());
    }

    private function enable(string $code, array $config, bool $sandbox = false): void
    {
        Gateway::create(['code' => $code, 'is_enabled' => true, 'test_mode' => $sandbox, 'config' => $config]);
    }

    private function sslAttempt(string $charge = '4200.00'): PaymentAttempt
    {
        $this->enable('sslcommerz', ['store_id' => 'store', 'store_password' => 'pw']);

        return PaymentAttempt::create(['invoice_id' => $this->invoice->id, 'gateway' => 'sslcommerz', 'reference' => 'REF1', 'amount' => '4200.00', 'charge_amount' => $charge, 'charge_currency' => 'BDT']);
    }

    private function fakeValidation(array $overrides = []): void
    {
        Http::fake(['*validationserverAPI*' => Http::response([...['status' => 'VALID', 'tran_id' => 'REF1', 'amount' => '4200.00', 'currency_type' => 'BDT', 'bank_tran_id' => 'BANK1', 'risk_level' => '0'], ...$overrides])]);
    }

    public function test_customer_starts_sslcommerz_payment_for_the_balance(): void
    {
        $this->enable('sslcommerz', ['store_id' => 'store', 'store_password' => 'pw']);
        Http::fake(['*gwprocess*' => Http::response(['status' => 'SUCCESS', 'GatewayPageURL' => 'https://pay.test/abc'])]);

        $this->actingAs($this->client, 'client')
            ->postJson("/api/client/invoices/{$this->invoice->id}/pay", ['gateway' => 'sslcommerz'])
            ->assertOk()
            ->assertJson(['redirect_url' => 'https://pay.test/abc']);

        $this->assertSame('4200.00', PaymentAttempt::first()->charge_amount);
        Http::assertSent(fn ($r) => str_contains($r->url(), 'securepay.sslcommerz.com') && $r['total_amount'] === '4200.00');
    }

    public function test_another_customer_cannot_pay_or_see_this_invoice(): void
    {
        $this->enable('sslcommerz', ['store_id' => 'store', 'store_password' => 'pw']);
        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);

        $this->actingAs($other, 'client')->postJson("/api/client/invoices/{$this->invoice->id}/pay", ['gateway' => 'sslcommerz'])->assertNotFound();
    }

    public function test_disabled_gateway_is_refused_and_not_listed(): void
    {
        $this->actingAs($this->client, 'client')->postJson("/api/client/invoices/{$this->invoice->id}/pay", ['gateway' => 'bkash'])->assertUnprocessable();
        $this->actingAs($this->client, 'client')->getJson("/api/client/invoices/{$this->invoice->id}")->assertOk()->assertJsonPath('gateways', []);
    }

    public function test_gateway_outage_shows_a_generic_message_without_secrets(): void
    {
        $this->enable('sslcommerz', ['store_id' => 'store', 'store_password' => 'top-secret']);
        Http::fake(['*' => Http::response(['status' => 'FAILED', 'failedreason' => 'Store Credential Error'])]);

        $this->actingAs($this->client, 'client')
            ->postJson("/api/client/invoices/{$this->invoice->id}/pay", ['gateway' => 'sslcommerz'])
            ->assertUnprocessable()
            ->assertDontSee('top-secret')
            ->assertDontSee('Credential');
    }

    public function test_sslcommerz_success_is_verified_with_the_server_and_credits_once(): void
    {
        $this->sslAttempt();
        $this->fakeValidation();

        $this->post('/pay/sslcommerz/success', ['tran_id' => 'REF1', 'val_id' => 'V1'])->assertRedirect("/invoices/{$this->invoice->id}?payment=success");
        $this->post('/pay/sslcommerz/ipn', ['tran_id' => 'REF1', 'val_id' => 'V1'])->assertOk();

        $this->assertSame(1, Payment::count());
        $this->assertSame('paid', $this->invoice->refresh()->status);
    }

    #[DataProvider('tamperedValidations')]
    public function test_sslcommerz_rejects_results_that_do_not_match(array $overrides): void
    {
        $this->sslAttempt();
        $this->fakeValidation($overrides);

        $this->post('/pay/sslcommerz/success', ['tran_id' => 'REF1', 'val_id' => 'V1'])->assertRedirect("/invoices/{$this->invoice->id}?payment=failed");

        $this->assertSame(0, Payment::count());
        $this->assertSame('unpaid', $this->invoice->refresh()->status);
    }

    public static function tamperedValidations(): array
    {
        return [
            'invalid status' => [['status' => 'INVALID_TRANSACTION']],
            'lower amount' => [['amount' => '1.00']],
            'other transaction' => [['tran_id' => 'REF2']],
            'other currency' => [['currency_type' => 'USD']],
            'risky' => [['risk_level' => '1']],
        ];
    }

    public function test_forged_callback_without_gateway_confirmation_cannot_pay(): void
    {
        $this->sslAttempt();
        Http::fake(['*' => Http::response(['status' => 'INVALID_TRANSACTION'])]);

        $this->post('/pay/sslcommerz/success', ['tran_id' => 'REF1', 'val_id' => 'forged', 'status' => 'VALID', 'amount' => '4200.00']);

        $this->assertSame('unpaid', $this->invoice->refresh()->status);
    }

    public function test_unknown_reference_is_not_found(): void
    {
        $this->post('/pay/sslcommerz/success', ['tran_id' => 'NOPE'])->assertNotFound();
    }

    private function bkashAttempt(): PaymentAttempt
    {
        $this->enable('bkash', ['app_key' => 'key', 'token_url' => 'https://tokens.test/api/bkash-token', 'token_secret' => 'secret']);

        return PaymentAttempt::create(['invoice_id' => $this->invoice->id, 'gateway' => 'bkash', 'reference' => 'REF1', 'external_id' => 'PID1', 'amount' => '4200.00', 'charge_amount' => '4200.00', 'charge_currency' => 'BDT']);
    }

    public function test_bkash_payment_uses_token_service_and_v2_api(): void
    {
        $this->enable('bkash', ['app_key' => 'key', 'token_url' => 'https://tokens.test/api/bkash-token', 'token_secret' => 'secret']);
        Http::fake([
            'tokens.test/*' => Http::response(['id_token' => 'grant']),
            '*/tokenized-checkout/payment/create' => Http::response(['bkashURL' => 'https://bkash.test/pay', 'paymentID' => 'PID1']),
            '*/tokenized-checkout/payment/execute' => Http::response(['transactionStatus' => 'Completed', 'trxID' => 'TRX1', 'amount' => '4200.00']),
        ]);

        $this->actingAs($this->client, 'client')->postJson("/api/client/invoices/{$this->invoice->id}/pay", ['gateway' => 'bkash'])->assertJson(['redirect_url' => 'https://bkash.test/pay']);
        $this->get('/pay/bkash/callback?paymentID=PID1&status=success')->assertRedirect("/invoices/{$this->invoice->id}?payment=success");

        $this->assertSame('TRX1', Payment::first()->transaction_id);
        Http::assertSent(fn ($r) => str_contains($r->url(), 'tokens.test') && $r->hasHeader('Authorization', 'Bearer secret'));
        Http::assertSent(fn ($r) => str_contains($r->url(), 'tokenized.pay.bka.sh/v2/tokenized-checkout/payment/create') && $r->hasHeader('Authorization', 'grant') && $r->hasHeader('X-APP-Key', 'key'));
    }

    public function test_bkash_falls_back_to_query_when_execute_fails(): void
    {
        $this->bkashAttempt();
        Http::fake([
            'tokens.test/*' => Http::response(['id_token' => 'grant']),
            '*/payment/execute' => Http::response([], 500),
            '*/query/payment' => Http::response(['transactionStatus' => 'Completed', 'trxID' => 'TRX1', 'amount' => '4200.00']),
        ]);

        $this->get('/pay/bkash/callback?paymentID=PID1&status=success');

        $this->assertSame('paid', $this->invoice->refresh()->status);
    }

    public function test_bkash_cancel_and_wrong_amount_do_not_pay(): void
    {
        $attempt = $this->bkashAttempt();
        Http::fake([
            'tokens.test/*' => Http::response(['id_token' => 'grant']),
            '*/payment/execute' => Http::response(['transactionStatus' => 'Completed', 'trxID' => 'TRX1', 'amount' => '1.00']),
        ]);

        $this->get('/pay/bkash/callback?paymentID=PID1&status=cancel')->assertRedirect("/invoices/{$this->invoice->id}?payment=cancelled");
        $this->assertSame('cancelled', $attempt->refresh()->status);

        $this->get('/pay/bkash/callback?paymentID=PID1&status=success')->assertRedirect("/invoices/{$this->invoice->id}?payment=failed");
        $this->assertSame('unpaid', $this->invoice->refresh()->status);
    }

    private function paypalAttempt(): PaymentAttempt
    {
        $this->enable('paypal', ['email' => 'shop@example.com', 'usd_rate' => '120']);

        return PaymentAttempt::create(['invoice_id' => $this->invoice->id, 'gateway' => 'paypal', 'reference' => 'REF1', 'amount' => '4200.00', 'charge_amount' => '35.00', 'charge_currency' => 'USD']);
    }

    private function ipn(array $overrides = []): array
    {
        return [...['custom' => 'REF1', 'payment_status' => 'Completed', 'receiver_email' => 'shop@example.com', 'mc_currency' => 'USD', 'mc_gross' => '35.00', 'txn_id' => 'PP1'], ...$overrides];
    }

    public function test_paypal_charge_converts_to_usd_at_the_configured_rate(): void
    {
        $this->enable('paypal', ['email' => 'shop@example.com', 'usd_rate' => '120']);

        $url = app(PaymentService::class)->begin($this->invoice, 'paypal');

        $this->assertStringContainsString('amount=35.00', $url);
        $this->assertStringContainsString('currency_code=USD', $url);
        $this->assertSame('4200.00', PaymentAttempt::first()->amount);
    }

    public function test_verified_paypal_ipn_credits_the_full_invoice_amount(): void
    {
        $this->paypalAttempt();
        Http::fake(['*ipnpb.paypal.com*' => Http::response('VERIFIED')]);

        $this->post('/pay/paypal/ipn', $this->ipn())->assertOk();

        $this->assertSame('paid', $this->invoice->refresh()->status);
        $this->assertSame('4200.00', Payment::first()->amount);
        Queue::assertNothingPushed();
    }

    #[DataProvider('badIpns')]
    public function test_paypal_rejects_bad_ipn(string $reply, array $overrides): void
    {
        $this->paypalAttempt();
        Http::fake(['*' => Http::response($reply)]);

        $this->post('/pay/paypal/ipn', $this->ipn($overrides))->assertOk();

        $this->assertSame('unpaid', $this->invoice->refresh()->status);
    }

    public static function badIpns(): array
    {
        return [
            'not verified' => ['INVALID', []],
            'pending' => ['VERIFIED', ['payment_status' => 'Pending']],
            'other receiver' => ['VERIFIED', ['receiver_email' => 'thief@example.com']],
            'lower amount' => ['VERIFIED', ['mc_gross' => '1.00']],
            'other currency' => ['VERIFIED', ['mc_currency' => 'BDT']],
        ];
    }

    public function test_payment_on_a_cancelled_invoice_is_flagged_not_lost(): void
    {
        $attempt = $this->sslAttempt();
        $this->invoice->update(['status' => 'cancelled']);
        $this->fakeValidation();

        $this->post('/pay/sslcommerz/success', ['tran_id' => 'REF1', 'val_id' => 'V1'])->assertRedirect("/invoices/{$this->invoice->id}?payment=failed");

        $this->assertStringContainsString('not credited', $attempt->refresh()->failure_reason);
    }
}
