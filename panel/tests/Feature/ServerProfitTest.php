<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Server;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServerProfitTest extends TestCase
{
    use RefreshDatabase;

    public function test_costs_and_sales_give_monthly_profit(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);
        $server = Server::create(['name' => 'Earth', 'module' => 'webuzo', 'hostname' => 'earth.test']);
        $other = Server::create(['name' => 'Mars', 'module' => 'cpanel', 'hostname' => 'mars.test']);
        $client = Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        $product = Product::create(['name' => 'Starter', 'type' => 'shared_hosting']);
        $yearly = Service::create(['client_id' => $client->id, 'product_id' => $product->id, 'server_id' => $server->id, 'cycle' => 'annually', 'recurring_amount' => 12000, 'status' => 'active']);
        $monthly = Service::create(['client_id' => $client->id, 'product_id' => $product->id, 'server_id' => $server->id, 'cycle' => 'monthly', 'recurring_amount' => 500, 'status' => 'active']);
        $elsewhere = Service::create(['client_id' => $client->id, 'product_id' => $product->id, 'server_id' => $other->id, 'cycle' => 'monthly', 'recurring_amount' => 999, 'status' => 'active']);

        $paid = function (Service $service, string $amount, string $when, string $status = 'paid') use ($client) {
            $invoice = Invoice::create(['client_id' => $client->id, 'status' => $status, 'total' => $amount, 'due_date' => $when, 'paid_at' => $status === 'paid' ? "{$when} 10:00:00" : null]);
            $invoice->items()->create(['description' => 'Hosting', 'amount' => $amount, 'kind' => 'renewal', 'service_id' => $service->id]);
        };
        $paid($yearly, '12000.00', '2026-01-15');
        $paid($monthly, '500.00', '2026-02-03');
        $paid($monthly, '500.00', '2026-03-03', 'unpaid'); // not paid: no sale
        $paid($elsewhere, '999.00', '2026-02-10');

        // 3000 a month from January, 2000 from March.
        $this->postJson("/api/servers/{$server->id}/costs", ['starts_on' => '2026-01', 'amount' => '3000'])->assertOk()->assertJsonCount(1);
        $this->postJson("/api/servers/{$server->id}/costs", ['starts_on' => '2026-03', 'amount' => '2000', 'note' => 'Cheaper plan'])->assertOk()->assertJsonPath('0.starts_on', '2026-03');

        $cash = $this->getJson("/api/servers/profit?from=2026-01&to=2026-03&spread=0&server_id={$server->id}")->assertOk()->json();
        $this->assertSame(['cost' => '3000.00', 'sales' => '12000.00', 'profit' => '9000.00'], $cash['totals']['2026-01']);
        $this->assertSame(['cost' => '3000.00', 'sales' => '500.00', 'profit' => '-2500.00'], $cash['totals']['2026-02']);
        $this->assertSame(['cost' => '2000.00', 'sales' => '0.00', 'profit' => '-2000.00'], $cash['totals']['2026-03']);

        $spread = $this->getJson("/api/servers/profit?from=2026-01&to=2026-03&spread=1&server_id={$server->id}")->json();
        $this->assertSame('1000.00', $spread['totals']['2026-01']['sales']);
        $this->assertSame('1500.00', $spread['totals']['2026-02']['sales']);
        $this->assertSame('-1000.00', $spread['totals']['2026-03']['profit']);

        $all = $this->getJson('/api/servers/profit?from=2026-02&to=2026-02&spread=0')->json();
        $this->assertSame('1499.00', $all['grand']['sales']);
        $this->assertCount(2, $all['servers']);

        $costId = $this->getJson("/api/servers/{$server->id}/costs")->json('0.id');
        $this->deleteJson("/api/servers/{$other->id}/costs/{$costId}")->assertNotFound();
        $this->deleteJson("/api/servers/{$server->id}/costs/{$costId}")->assertOk()->assertJsonCount(1);
        $this->getJson('/api/servers/profit?from=2026-05&to=2026-01')->assertJsonValidationErrors('to');
    }
}
