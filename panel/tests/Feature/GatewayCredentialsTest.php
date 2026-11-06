<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Gateway;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class GatewayCredentialsTest extends TestCase
{
    use RefreshDatabase;

    private const LIVE = 'https://tokenized.pay.bka.sh/v1.2.0-beta';

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        return $admin;
    }

    private function bkashDirect(): array
    {
        return ['display_name' => 'bKash', 'username' => '01700000000', 'password' => 'pw', 'app_key' => 'APPKEY', 'app_secret' => 'APPSECRET'];
    }

    public function test_bkash_pays_with_username_password_app_key_and_secret(): void
    {
        Queue::fake();
        Cache::flush();
        Gateway::create(['code' => 'bkash', 'is_enabled' => true, 'test_mode' => false, 'config' => $this->bkashDirect()]);
        $client = Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com', 'password' => 'correct-horse']);
        $invoice = app(BillingService::class)->createInvoice($client, [['description' => 'Hosting', 'amount' => '1500.00']], now()->addDays(7));

        Http::fake([
            self::LIVE.'/tokenized/checkout/token/grant' => Http::response(['id_token' => 'GRANT', 'expires_in' => 3600]),
            self::LIVE.'/tokenized/checkout/create' => Http::response(['bkashURL' => 'https://bkash.test/pay', 'paymentID' => 'PID9', 'statusCode' => '0000']),
            self::LIVE.'/tokenized/checkout/execute' => Http::response(['transactionStatus' => 'Completed', 'trxID' => 'TRX9', 'amount' => '1500.00', 'merchantInvoiceNumber' => null]),
        ]);

        $this->actingAs($client, 'client')->postJson("/api/client/invoices/{$invoice->id}/pay", ['gateway' => 'bkash'])->assertJson(['redirect_url' => 'https://bkash.test/pay']);
        $this->get('/pay/bkash/callback?paymentID=PID9&status=success')->assertRedirect("/invoices/{$invoice->id}?payment=success");

        $this->assertSame('paid', $invoice->refresh()->status);
        $this->assertSame('TRX9', Payment::first()->transaction_id);
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/token/grant') && $r->hasHeader('username', '01700000000') && $r->hasHeader('password', 'pw') && $r['app_key'] === 'APPKEY' && $r['app_secret'] === 'APPSECRET');
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/tokenized/checkout/create') && $r->hasHeader('Authorization', 'GRANT') && $r->hasHeader('X-APP-Key', 'APPKEY') && $r['mode'] === '0011');
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/tokenized/checkout/execute') && $r['paymentID'] === 'PID9');
        // One grant token served both calls.
        $this->assertSame(1, collect(Http::recorded())->filter(fn ($pair) => str_ends_with($pair[0]->url(), '/token/grant'))->count());
    }

    public function test_admin_saves_bkash_credentials_and_tests_them(): void
    {
        Cache::flush();
        $this->actingAs($this->admin());

        $this->putJson('/api/gateways/bkash', ['is_enabled' => true, 'test_mode' => false, 'config' => ['display_name' => 'bKash', 'app_key' => 'APPKEY', 'username' => '01700000000']])
            ->assertJsonValidationErrors('is_enabled');
        $this->putJson('/api/gateways/bkash', ['is_enabled' => true, 'test_mode' => false, 'config' => $this->bkashDirect()])->assertOk();

        Http::fake([self::LIVE.'/tokenized/checkout/token/grant' => Http::sequence()
            ->push(['statusCode' => '2001', 'statusMessage' => 'Invalid App Key'])
            ->push(['id_token' => 'GRANT'])]);
        $this->postJson('/api/gateways/bkash/test')->assertJsonValidationErrors('gateway');
        $this->postJson('/api/gateways/bkash/test')->assertOk()->assertJsonPath('message', 'Connected to bKash (live). The credentials work.');
    }

    public function test_sslcommerz_and_paypal_connection_tests(): void
    {
        $this->actingAs($this->admin());
        Gateway::create(['code' => 'sslcommerz', 'is_enabled' => true, 'test_mode' => false, 'config' => ['display_name' => 'SSLCommerz', 'store_id' => 'store', 'store_password' => 'wrong']]);
        Http::fake(['securepay.sslcommerz.com/*' => Http::response(['status' => 'FAILED', 'failedreason' => 'Store Credential Error Or Store is De-active'])]);
        $this->postJson('/api/gateways/sslcommerz/test')->assertJsonValidationErrors('gateway');

        Gateway::create(['code' => 'paypal', 'is_enabled' => true, 'test_mode' => false, 'config' => ['display_name' => 'PayPal', 'email' => 'pay@example.com', 'api_username' => 'u', 'api_password' => 'p', 'api_signature' => 's']]);
        Http::fake(['api-3t.paypal.com/*' => Http::response('ACK=Success&L_AMT0=10.00')]);
        $this->postJson('/api/gateways/paypal/test')->assertOk()->assertJsonPath('message', 'Connected to PayPal (live). The API credentials work; payments go to pay@example.com.');
    }
}
