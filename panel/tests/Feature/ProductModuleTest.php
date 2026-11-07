<?php

namespace Tests\Feature;

use App\Jobs\ProvisionService;
use App\Models\Client;
use App\Models\Product;
use App\Models\Server;
use App\Models\User;
use App\Services\BillingService;
use App\Services\RenewalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ProductModuleTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        return $admin;
    }

    private function orderFor(string $setupMode): array
    {
        $product = Product::create(['name' => 'Starter', 'type' => 'shared_hosting', 'module' => 'webuzo', 'module_package' => 'starter', 'setup_mode' => $setupMode]);
        $product->prices()->create(['cycle' => 'monthly', 'price' => '300.00']);
        $client = Client::create(['name' => 'A', 'email' => 'a@example.com']);
        $order = app(BillingService::class)->createOrder($client, [['product_id' => $product->id, 'cycle' => 'monthly', 'domain' => 'a.com']]);

        return [$order, $order->services()->sole(), $order->invoices()->sole()];
    }

    public function test_accepting_an_unpaid_order_sets_it_up_now(): void
    {
        Queue::fake();
        Server::create(['name' => 'Webuzo 1', 'module' => 'webuzo', 'hostname' => 'wz.test', 'username' => 'admin', 'credentials' => 'key']);
        [$order, $service, $invoice] = $this->orderFor('payment');

        $this->assertMatchesRegularExpression('/^\d{10}$/', (string) $order->order_number, 'A random 10-digit number, not the ID.');
        $this->assertNotSame((string) $order->id, $order->order_number);
        $this->assertSame('unpaid', $invoice->status);

        $this->actingAs($this->admin())->postJson("/api/orders/{$order->id}/accept", ['run_module_create' => true])->assertOk();
        $this->assertSame('queued', $service->refresh()->provision_status);
        // It falls due with the unpaid invoice, so overdue suspension can catch it.
        $this->assertSame($invoice->due_date->toDateString(), $service->next_due_date?->toDateString());
        Queue::assertPushed(ProvisionService::class, 1);

        // Nothing is left to accept, and paying later does not create it again.
        $this->postJson("/api/orders/{$order->id}/accept")->assertJsonValidationErrors('order');
        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX-1', '300.00');
        Queue::assertPushed(ProvisionService::class, 1);
    }

    public function test_plans_are_loaded_live_from_the_server(): void
    {
        Http::fake(['*' => Http::response(['plans' => [
            'starter' => ['plan' => 'starter', 'plan_name' => 'Starter'],
            'advanced-plus' => ['plan' => 'advanced-plus', 'plan_name' => 'Advanced Plus'],
        ]])]);
        Server::create(['name' => 'Webuzo 1', 'module' => 'webuzo', 'hostname' => 'wz.test', 'username' => 'admin', 'credentials' => 'key']);

        $this->actingAs($this->admin())->getJson('/api/products/packages?module=webuzo')
            ->assertOk()
            ->assertJsonPath('server', 'Webuzo 1')
            ->assertJsonPath('packages.1', ['id' => 'advanced-plus', 'name' => 'Advanced Plus']);

        $this->getJson('/api/products/packages?module=cpanel')->assertUnprocessable()->assertJsonPath('message', 'Add a server for this module first.');
    }

    public function test_product_saves_server_and_setup_mode(): void
    {
        $cpanel = Server::create(['name' => 'WHM', 'module' => 'cpanel', 'hostname' => 'whm.test']);
        $webuzo = Server::create(['name' => 'WZ', 'module' => 'webuzo', 'hostname' => 'wz.test']);
        $body = ['name' => 'Starter', 'type' => 'shared_hosting', 'module' => 'webuzo', 'module_package' => 'starter', 'setup_mode' => 'accept', 'prices' => [['cycle' => 'monthly', 'price' => '300']]];
        $this->actingAs($this->admin());

        $this->postJson('/api/products', [...$body, 'server_id' => $cpanel->id])->assertJsonValidationErrors('server_id');

        $id = $this->postJson('/api/products', [...$body, 'server_id' => $webuzo->id])->assertCreated()->json('id');
        $this->getJson("/api/products/{$id}")->assertOk()->assertJsonPath('server_id', $webuzo->id)->assertJsonPath('setup_mode', 'accept');
    }

    public function test_setup_on_order_provisions_before_payment_and_suspends_if_unpaid(): void
    {
        Queue::fake();
        [, $service, $invoice] = $this->orderFor('order');

        Queue::assertPushed(ProvisionService::class, fn ($job) => $job->serviceId === $service->id && $job->action === 'create');
        $this->assertSame('active', $service->status);
        $this->assertSame($invoice->due_date->toDateString(), $service->next_due_date->toDateString());

        // The first invoice already covers this due date, so no renewal invoice is raised for it.
        $this->assertSame(0, app(RenewalService::class)->generateInvoices());

        $service->update(['provision_status' => 'done', 'remote_id' => 'auser']);
        $this->travel(10)->days();
        $this->assertSame(1, app(RenewalService::class)->suspendOverdue());
    }

    public function test_paying_an_order_set_up_on_order_does_not_create_it_twice(): void
    {
        Queue::fake();
        [, $service, $invoice] = $this->orderFor('order');
        $service->update(['provision_status' => 'done', 'remote_id' => 'auser']);

        app(BillingService::class)->recordPayment($invoice, 'manual', 'T1', '300.00');

        Queue::assertPushed(ProvisionService::class, 1);
        $this->assertSame('done', $service->refresh()->provision_status);
    }

    public function test_accept_mode_waits_for_the_admin(): void
    {
        Queue::fake();
        [$order, $service, $invoice] = $this->orderFor('accept');
        app(BillingService::class)->recordPayment($invoice, 'manual', 'T1', '300.00');

        Queue::assertNothingPushed();
        $this->assertSame('awaiting_accept', $service->refresh()->provision_status);

        $this->actingAs($this->admin())->postJson("/api/orders/{$order->id}/accept")->assertOk();
        Queue::assertPushed(ProvisionService::class, fn ($job) => $job->serviceId === $service->id && $job->action === 'create');
        $this->postJson("/api/orders/{$order->id}/accept")->assertJsonValidationErrors('order');
    }

    public function test_an_imported_order_offers_its_planned_username_and_creates_the_account(): void
    {
        Queue::fake();
        [$order, $service] = $this->orderFor('accept');
        // Pending, waiting for accept, with a planned username.
        $service->update(['provision_status' => 'awaiting_accept', 'remote_id' => 'borhanud']);
        $domain = \App\Models\Domain::create(['client_id' => $service->client_id, 'order_id' => $order->id, 'name' => 'borhan.com', 'action' => 'register', 'registrar' => 'resellcube', 'recurring_amount' => 1600]);

        $setup = $this->actingAs($this->admin())->getJson("/api/orders/{$order->id}")->assertOk()->json("setup.{$service->id}");
        $this->assertSame('borhanud', $setup['username']);
        $this->assertNotEmpty($setup['password']);

        $this->postJson("/api/orders/{$order->id}/accept", [
            'run_module_create' => true,
            'services' => [['id' => $service->id, 'username' => 'borhan1', 'password' => 'Str0ng-Pass!x']],
            'domains' => [['id' => $domain->id, 'registrar' => null]],
        ])->assertOk();

        $service->refresh();
        // Cleared, or the create job would think the account already exists and skip it.
        $this->assertNull($service->remote_id);
        $this->assertSame(['queued', 'borhan1'], [$service->provision_status, $service->credentials['username']]);
        Queue::assertPushed(ProvisionService::class, fn ($job) => $job->serviceId === $service->id && $job->action === 'create');
        $this->assertNull($domain->refresh()->registrar, 'None was chosen.');
    }

    public function test_dashboard_cards_lead_to_matching_lists(): void
    {
        [, $waiting] = $this->orderFor('accept');
        $waiting->update(['provision_status' => 'awaiting_accept']);
        $suspended = \App\Models\Service::create(['client_id' => $waiting->client_id, 'product_id' => $waiting->product_id, 'cycle' => 'monthly', 'recurring_amount' => '300.00', 'status' => 'suspended', 'provision_status' => 'done']);
        $this->actingAs($this->admin());

        $dashboard = $this->getJson('/api/dashboard')->assertOk();
        $dashboard->assertJsonPath('suspended_services', 1)->assertJsonPath('pending_module_actions_split.services', 1);

        $this->assertSame([$suspended->id], array_column($this->getJson('/api/services?status=suspended')->json('data'), 'id'));
        $this->assertSame([$waiting->id], array_column($this->getJson('/api/services?status=needs_action')->json('data'), 'id'));
        $this->getJson('/api/domains?status=needs_action')->assertOk()->assertJsonPath('total', 0);
    }

    public function test_manual_mode_never_provisions(): void
    {
        Queue::fake();
        [, $service, $invoice] = $this->orderFor('manual');
        app(BillingService::class)->recordPayment($invoice, 'manual', 'T1', '300.00');

        Queue::assertNothingPushed();
        $this->assertSame('manual_required', $service->refresh()->provision_status);
    }

    public function test_job_uses_the_products_server(): void
    {
        Http::fake(['*' => Http::response(['done' => ['msg' => 'saved']])]);
        Server::create(['name' => 'Empty', 'module' => 'webuzo', 'hostname' => 'empty.test']);
        $pinned = Server::create(['name' => 'Pinned', 'module' => 'webuzo', 'hostname' => 'pinned.test']);
        [, $service, $invoice] = $this->orderFor('payment');
        $service->product->update(['server_id' => $pinned->id]);

        app(BillingService::class)->recordPayment($invoice, 'manual', 'T1', '300.00');

        $this->assertSame($pinned->id, $service->refresh()->server_id);
        Http::assertSent(fn ($request) => str_contains($request->url(), 'pinned.test'));
    }
}
