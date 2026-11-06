<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Domain;
use App\Models\Gateway;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\Service;
use App\Models\Tld;
use App\Models\User;
use App\Payments\BkashDriver;
use App\Payments\PayPalDriver;
use App\Services\BillingService;
use App\Services\DashboardService;
use App\Services\RenewalService;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class MultiCurrencyTest extends TestCase
{
    use RefreshDatabase;

    private Product $hosting;

    private Product $fixed;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Settings::save(['usd_rate' => '120']);

        $group = ProductGroup::create(['name' => 'Hosting', 'slug' => 'hosting', 'is_visible' => true]);
        // 1200 BDT a year, no USD price: a USD client pays 10.00.
        $this->hosting = Product::create(['product_group_id' => $group->id, 'name' => 'Starter', 'type' => 'other', 'is_active' => true]);
        $this->hosting->prices()->create(['cycle' => 'annually', 'price' => '1200.00', 'setup_fee' => '240.00']);
        // A fixed USD price wins over the converted one.
        $this->fixed = Product::create(['product_group_id' => $group->id, 'name' => 'Pro', 'type' => 'other', 'is_active' => true]);
        $this->fixed->prices()->create(['cycle' => 'annually', 'price' => '3000.00', 'setup_fee' => '0', 'price_usd' => '24.99']);

        Tld::create(['tld' => '.com', 'register_price' => 1500, 'renew_price' => 1800, 'transfer_price' => 1500, 'renew_price_usd' => '14.99']);
    }

    private function client(string $currency): Client
    {
        return Client::create(['name' => "{$currency} client", 'email' => strtolower($currency).'@example.com', 'currency' => $currency]);
    }

    public function test_new_clients_start_in_the_default_currency(): void
    {
        $this->assertSame('BDT', Client::create(['name' => 'A', 'email' => 'a@example.com'])->currency);

        config(['billing.currency' => 'USD']);
        $this->assertSame('USD', Client::create(['name' => 'B', 'email' => 'b@example.com'])->currency);
    }

    public function test_usd_client_orders_are_priced_and_invoiced_in_usd(): void
    {
        $client = $this->client('USD');
        $order = app(BillingService::class)->createOrder($client, [
            ['product_id' => $this->hosting->id, 'cycle' => 'annually'],
            ['product_id' => $this->fixed->id, 'cycle' => 'annually'],
        ], [['name' => 'example.com', 'action' => 'register', 'years' => 2]]);

        $invoice = $order->invoices()->first();
        $this->assertSame('USD', $invoice->currency);
        // (1200 + 240) / 120 = 12.00; fixed 24.99; register 1500 / 120 = 12.50 x 2 years = 25.00.
        $this->assertSame(['12.00', '24.99', '25.00'], $invoice->items()->orderBy('id')->pluck('amount')->map(fn ($a) => (string) $a)->all());
        $this->assertSame('61.99', (string) $invoice->total);

        $this->assertSame('10.00', (string) Service::where('product_id', $this->hosting->id)->first()->recurring_amount);
        $this->assertSame('24.99', (string) Service::where('product_id', $this->fixed->id)->first()->recurring_amount);
        // Renewal uses the fixed USD renew price, times the years.
        $this->assertSame('29.98', (string) Domain::first()->recurring_amount);
    }

    public function test_bdt_client_orders_are_unchanged(): void
    {
        $order = app(BillingService::class)->createOrder($this->client('BDT'), [['product_id' => $this->fixed->id, 'cycle' => 'annually']]);

        $this->assertSame(['BDT', '3000.00'], [$order->invoices()->first()->currency, (string) $order->invoices()->first()->total]);
    }

    public function test_store_shows_each_client_their_own_prices(): void
    {
        $this->actingAs($this->client('USD'), 'client');
        $store = $this->getJson('/api/client/store')->assertOk()->json('0');
        $this->assertSame('USD', $store['currency']);
        $this->assertSame(['10.00', '24.99'], collect($store['products'])->pluck('prices.0.price')->sort()->values()->all());

        $tld = $this->getJson('/api/client/store/domains')->assertOk()->json();
        $this->assertSame(['USD', '12.50', '14.99'], [$tld['currency'], $tld['tlds'][0]['register_price'], $tld['tlds'][0]['renew_price']]);
        $this->getJson('/api/client/me')->assertJsonPath('currency', 'USD');
    }

    public function test_renewals_are_invoiced_in_the_clients_currency(): void
    {
        $client = $this->client('USD');
        Service::create(['client_id' => $client->id, 'product_id' => $this->hosting->id, 'cycle' => 'annually', 'recurring_amount' => '10.00', 'status' => 'active', 'next_due_date' => today()->addDays(3)]);

        app(RenewalService::class)->generateInvoices();

        $invoice = Invoice::first();
        $this->assertSame(['USD', '10.00'], [$invoice->currency, (string) $invoice->total]);
    }

    public function test_gateways_charge_in_their_own_currency(): void
    {
        $bkash = new BkashDriver(Gateway::create(['code' => 'bkash', 'is_enabled' => true, 'config' => []]));
        $this->assertSame(['1200.00', 'BDT'], $bkash->charge('10.00', 'USD'));
        $this->assertSame(['500.00', 'BDT'], $bkash->charge('500.00', 'BDT'));

        $paypal = new PayPalDriver(Gateway::create(['code' => 'paypal', 'is_enabled' => true, 'config' => ['email' => 'shop@example.com']]));
        $this->assertSame(['10.00', 'USD'], $paypal->charge('10.00', 'USD'));
        // No rate on the gateway: the one in Settings > Currencies.
        $this->assertSame(['10.00', 'USD'], $paypal->charge('1200.00', 'BDT'));
    }

    public function test_changing_a_clients_currency_converts_what_they_are_billed(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $client = $this->client('BDT');
        Service::create(['client_id' => $client->id, 'product_id' => $this->hosting->id, 'cycle' => 'annually', 'recurring_amount' => '1200.00', 'status' => 'active']);
        $unpaid = app(BillingService::class)->createInvoice($client, [['description' => 'Old', 'amount' => '100.00', 'kind' => 'other']], today());
        $this->assertSame('unpaid', $unpaid->fresh()->status);
        $client->forceFill(['credit_balance' => '600.00'])->save();

        $body = ['name' => $client->name, 'email' => $client->email, 'currency' => 'USD'];
        $this->actingAs($admin)->putJson("/api/clients/{$client->id}", $body)->assertJsonValidationErrors('currency');
        $this->assertSame('BDT', $client->fresh()->currency);

        $unpaid->update(['status' => 'cancelled']);
        $this->putJson("/api/clients/{$client->id}", $body)->assertOk();

        $client->refresh();
        $this->assertSame(['USD', '5.00', '10.00'], [$client->currency, (string) $client->credit_balance, (string) $client->services()->first()->recurring_amount]);
        $this->assertStringContainsString('Currency changed from BDT to USD', $client->credits()->latest('id')->first()->description);
    }

    public function test_reports_add_currencies_up_in_bdt(): void
    {
        $bdt = app(BillingService::class)->createInvoice($this->client('BDT'), [['description' => 'A', 'amount' => '1200.00', 'kind' => 'other']], today());
        $usd = app(BillingService::class)->createInvoice($this->client('USD'), [['description' => 'B', 'amount' => '10.00', 'kind' => 'other']], today());
        app(BillingService::class)->recordPayment($bdt, 'manual', 'T1', '1200.00');
        app(BillingService::class)->recordPayment($usd, 'manual', 'T2', '10.00');

        $this->assertSame('USD', Payment::where('transaction_id', 'T2')->value('currency'));
        $this->assertSame('2400.00', app(DashboardService::class)->billing()['today']);
    }

    public function test_usd_clients_cannot_be_left_without_a_rate(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->client('USD');

        $settings = array_filter($this->actingAs($admin)->getJson('/api/settings')->assertOk()->json('settings'), fn ($v) => $v !== null);
        $this->postJson('/api/settings', [...$settings, 'recaptcha_enabled' => false, 'usd_rate' => ''])->assertJsonValidationErrors('usd_rate');
        $this->assertSame(120.0, (float) config('billing.exchange_rates.USD'));
    }
}
