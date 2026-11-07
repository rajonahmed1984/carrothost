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

    public function test_accepting_sets_a_vps_hostname_and_ip(): void
    {
        Queue::fake();
        $product = Product::create(['name' => 'BDIX VPS', 'type' => 'vps', 'module' => null, 'setup_mode' => 'accept']);
        $product->prices()->create(['cycle' => 'monthly', 'price' => '2500.00']);
        $client = Client::create(['name' => 'A', 'email' => 'a@example.com']);
        $order = app(BillingService::class)->createOrder($client, [['product_id' => $product->id, 'cycle' => 'monthly', 'domain' => 'vps.a.com']]);
        $service = $order->services()->sole();
        $admin = $this->actingAs($this->admin());

        $admin->postJson("/api/orders/{$order->id}/accept", ['run_module_create' => false, 'services' => [['id' => $service->id, 'hostname' => 'bad host']]])
            ->assertJsonValidationErrors('services.0.hostname');

        $admin->postJson("/api/orders/{$order->id}/accept", ['run_module_create' => false, 'send_welcome_email' => false, 'services' => [
            ['id' => $service->id, 'username' => 'enhanced', 'hostname' => 'Server1.A.com', 'dedicated_ip' => '103.10.20.30'],
        ]])->assertOk();

        $service->refresh();
        $this->assertSame(['server1.a.com', '103.10.20.30', 'active'], [$service->domain, $service->dedicated_ip, $service->status]);
    }

    public function test_a_hand_made_vps_is_accepted_with_its_ssh_login_and_emailed_to_the_client(): void
    {
        Queue::fake();
        \Illuminate\Support\Facades\Mail::fake();
        $product = Product::create(['name' => 'BDIX Enhanced', 'type' => 'vps', 'module' => null, 'setup_mode' => 'accept']);
        $product->prices()->create(['cycle' => 'monthly', 'price' => '2500.00']);
        $client = Client::create(['name' => 'Rajon', 'email' => 'r@example.com']);
        $orders = [];
        foreach (['vps.a.com', 'vps.b.com'] as $host) {
            $orders[] = app(BillingService::class)->createOrder($client, [['product_id' => $product->id, 'cycle' => 'monthly', 'domain' => $host]]);
        }
        [$first, $second] = $orders;
        $service = $first->services()->sole();
        $admin = $this->actingAs($this->admin());

        $setup = $admin->getJson("/api/orders/{$first->id}")->assertOk()->json("setup.{$service->id}");
        $this->assertSame(['root', '', 22, true], [$setup['username'], $setup['password'], $setup['port'], $setup['manual_vps']]);

        // The email is the client's copy of the login, so it needs the IP and password.
        $admin->postJson("/api/orders/{$first->id}/accept", ['services' => [['id' => $service->id, 'hostname' => 'vps.a.com']]])
            ->assertJsonValidationErrors("services.{$service->id}.dedicated_ip");

        $admin->postJson("/api/orders/{$first->id}/accept", ['run_module_create' => true, 'send_welcome_email' => true, 'services' => [
            ['id' => $service->id, 'username' => 'root', 'password' => 'zWxQvH6dlZLM8w45CEZe', 'port' => 2222, 'hostname' => 'vps.a.com', 'dedicated_ip' => '103.159.37.159'],
        ]])->assertOk();

        $service->refresh();
        Queue::assertNothingPushed();
        $this->assertSame(['active', 'done', 'vps.a.com', '103.159.37.159'], [$service->status, $service->provision_status, $service->remote_id, $service->dedicated_ip]);
        $this->assertSame(['username' => 'root', 'password' => 'zWxQvH6dlZLM8w45CEZe', 'port' => 2222], $service->credentials->toArray());
        \Illuminate\Support\Facades\Mail::assertSent(\App\Mail\CustomerNotice::class, fn ($m) => $m->subjectLine === 'Your server vps.a.com is ready'
            && str_contains($m->richBody, '103.159.37.159') && str_contains($m->richBody, '2222') && str_contains($m->richBody, 'zWxQvH6dlZLM8w45CEZe'));

        // Many VPSes share the user root.
        $other = $second->services()->sole();
        $admin->postJson("/api/orders/{$second->id}/accept", ['send_welcome_email' => false, 'services' => [['id' => $other->id, 'username' => 'root', 'dedicated_ip' => '103.159.37.160']]])->assertOk();

        // The client sees the same login on the service page; the admin can change the port there.
        $admin->putJson("/api/services/{$service->id}", ['ssh_port' => 22, 'domain' => 'server1.a.com'])->assertOk()
            ->assertJsonPath('ssh_port', 22)->assertJsonPath('remote_id', 'server1.a.com');
        $this->actingAs($client, 'client')->getJson("/api/client/services/{$service->id}")->assertOk()
            ->assertJsonPath('ssh', ['hostname' => 'server1.a.com', 'ip' => '103.159.37.159', 'port' => 22, 'username' => 'root']);
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
