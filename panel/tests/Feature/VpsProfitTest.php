<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Product;
use App\Models\Service;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class VpsProfitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Queue::fake();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);
        config(['billing.exchange_rates.USD' => 120]);
    }

    public function test_cost_is_set_on_the_product_and_overridden_per_vps(): void
    {
        $id = $this->postJson('/api/products', [
            'name' => 'VPS Small', 'type' => 'vps', 'prices' => [['cycle' => 'monthly', 'price' => 2500], ['cycle' => 'annually', 'price' => 27000]],
            'cost_amount' => '15', 'cost_currency' => 'USD',
        ])->assertCreated()->assertJsonPath('cost_amount', '15.00')->assertJsonPath('cost_currency', 'USD')->json('id');

        $client = Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com']);
        $service = Service::create(['client_id' => $client->id, 'product_id' => $id, 'cycle' => 'monthly', 'recurring_amount' => 2500, 'status' => 'active']);

        $this->putJson("/api/services/{$service->id}", ['cost_amount' => 3000])->assertOk()->assertJsonPath('cost_amount', '3000.00')->assertJsonPath('cost_currency', 'BDT');
        $this->putJson("/api/services/{$service->id}", ['cost_amount' => null])->assertOk()->assertJsonPath('cost_currency', null);
    }

    public function test_monthly_profit_per_vps(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 15));
        $small = Product::create(['name' => 'VPS Small', 'type' => 'vps', 'cost_amount' => 15, 'cost_currency' => 'USD']);
        $hosting = Product::create(['name' => 'Hosting', 'type' => 'shared_hosting']);
        $client = Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com']);
        $billing = app(BillingService::class);

        // Paid monthly in October and November: 2,500 a month against 15 USD (1,800 BDT).
        $monthly = Service::create(['client_id' => $client->id, 'product_id' => $small->id, 'domain' => 'a.example.com', 'cycle' => 'monthly', 'recurring_amount' => 2500, 'status' => 'active', 'registered_at' => '2026-10-01', 'next_due_date' => '2026-10-03']);
        foreach (['2026-10-03', '2026-11-03'] as $day) {
            $this->travelTo(\Carbon\Carbon::parse($day));
            $invoice = $billing->createInvoice($client, [['description' => 'VPS', 'amount' => '2500.00', 'kind' => 'renewal', 'service_id' => $monthly->id]], now());
            $billing->recordPayment($invoice, 'manual', "TX-{$day}", '2500.00');
        }

        // A custom VPS with its own cost, paid yearly in November: 24,000 spread is 2,000 a month.
        $custom = Service::create(['client_id' => $client->id, 'product_id' => $small->id, 'domain' => 'b.example.com', 'cycle' => 'annually', 'recurring_amount' => 24000, 'status' => 'active', 'registered_at' => '2026-11-01', 'cost_amount' => 1500, 'cost_currency' => 'BDT']);
        $invoice = $billing->createInvoice($client, [['description' => 'VPS', 'amount' => '24000.00', 'kind' => 'new', 'service_id' => $custom->id]], now());
        $billing->recordPayment($invoice, 'manual', 'TX-year', '24000.00');

        Service::create(['client_id' => $client->id, 'product_id' => $hosting->id, 'cycle' => 'monthly', 'recurring_amount' => 500, 'status' => 'active']);

        $r = $this->getJson('/api/vps/profit?from=2026-10&to=2026-11&spread=1')->assertOk()->json();

        $this->assertCount(2, $r['vps'], 'Only VPS products are counted.');
        $this->assertSame(['cost' => '1800.00', 'sales' => '2500.00', 'profit' => '700.00'], $r['vps'][0]['months']['2026-10']);
        $this->assertSame('product', $r['vps'][0]['monthly_cost']['source']);
        $this->assertSame(['cost' => '0.00', 'sales' => '0.00', 'profit' => '0.00'], $r['vps'][1]['months']['2026-10'], 'Not running yet in October.');
        $this->assertSame(['cost' => '1500.00', 'sales' => '2000.00', 'profit' => '500.00'], $r['vps'][1]['months']['2026-11']);
        $this->assertSame(['cost' => '3300.00', 'sales' => '4500.00', 'profit' => '1200.00'], $r['totals']['2026-11']);
        $this->assertSame('1900.00', $r['grand']['profit']);

        // Without spreading, the yearly payment lands in November in full.
        $this->assertSame('24000.00', $this->getJson('/api/vps/profit?from=2026-11&to=2026-11&spread=0')->json('vps.1.months.2026-11.sales'));
    }

    public function test_active_vps_without_a_cost_is_flagged(): void
    {
        $bare = Product::create(['name' => 'VPS Bare', 'type' => 'vps']);
        $client = Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com']);
        Service::create(['client_id' => $client->id, 'product_id' => $bare->id, 'cycle' => 'monthly', 'recurring_amount' => 1000, 'status' => 'active']);

        $this->getJson('/api/vps/profit?from='.now()->format('Y-m').'&to='.now()->format('Y-m'))->assertOk()
            ->assertJsonPath('missing_cost', 1)->assertJsonPath('vps.0.monthly_cost', null);
    }
}
