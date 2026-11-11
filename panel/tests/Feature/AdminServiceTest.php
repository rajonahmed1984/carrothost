<?php

namespace Tests\Feature;

use App\Jobs\ProvisionService;
use App\Models\Client;
use App\Models\Gateway;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Server;
use App\Models\Service;
use App\Models\User;
use App\Services\RenewalService;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AdminServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_edits_a_service_and_its_stored_login(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $client = Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        $product = Product::create(['name' => 'Starter', 'type' => 'shared_hosting']);
        $product->prices()->create(['cycle' => 'annually', 'price' => 4000]);
        $service = Service::create([
            'client_id' => $client->id, 'product_id' => $product->id, 'domain' => 'acme.com', 'cycle' => 'monthly',
            'recurring_amount' => 400, 'status' => 'active', 'credentials' => ['username' => 'acme', 'password' => 'old-secret'],
        ]);
        // Only gateways that are on can be picked as the payment method.
        Gateway::create(['code' => 'bkash', 'is_enabled' => true, 'config' => []]);
        $this->actingAs($admin);

        $this->getJson("/api/services/{$service->id}")->assertOk()
            ->assertJsonPath('username', 'acme')
            ->assertJsonPath('has_password', true)
            ->assertJsonPath('registered_at', today()->toDateString())
            ->assertJsonMissingPath('credentials')
            ->assertJsonPath('client_services.0.name', 'Starter - acme.com');

        $this->putJson("/api/services/{$service->id}", [
            'cycle' => 'annually', 'quantity' => 2, 'recalculate' => true, 'password' => 'new-secret',
            'payment_method' => 'bkash', 'override_suspend_until' => today()->addDays(5)->toDateString(),
            'admin_notes' => 'VIP', 'terminate_end_of_cycle' => false, 'terminate_reason' => 'ignored',
        ])->assertOk()
            ->assertJsonPath('recurring_amount', '8000.00')
            ->assertJsonPath('cycle', 'annually')
            ->assertJsonPath('admin_notes', 'VIP')
            ->assertJsonPath('terminate_reason', null);

        $this->assertSame(['username' => 'acme', 'password' => 'new-secret'], $service->refresh()->credentials->toArray());

        // The override keeps an overdue service from being suspended.
        $service->update(['next_due_date' => today()->subDays(60)]);
        app(RenewalService::class)->suspendOverdue();
        $this->assertSame('active', $service->refresh()->status);

        $this->putJson("/api/services/{$service->id}", ['status' => 'gone', 'dedicated_ip' => 'nope'])->assertJsonValidationErrors(['status', 'dedicated_ip']);
    }

    public function test_override_unsuspends_auto_suspended_service_until_date_and_cron_suspends_afterwards(): void
    {
        Queue::fake();
        Http::fake(['*' => Http::response(['done' => ['msg' => 'ok']])]);

        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);

        $server = Server::create(['name' => 'Earth', 'module' => 'webuzo', 'hostname' => 'earth.test', 'username' => 'root', 'credentials' => 'key']);
        $product = Product::create(['name' => 'Starter', 'type' => 'shared_hosting', 'module' => 'webuzo', 'module_package' => 'starter']);
        $client = Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        $service = Service::create([
            'client_id' => $client->id, 'product_id' => $product->id, 'server_id' => $server->id,
            'domain' => 'acme.com', 'cycle' => 'annually', 'recurring_amount' => 4200,
            'status' => 'suspended', 'auto_suspended' => true, 'remote_id' => 'probashix',
            'provision_status' => 'done', 'next_due_date' => today()->subDays(10)->toDateString(),
        ]);

        // Enabling Override Auto-Suspend with a date unsuspends an auto-suspended service right away.
        $until = today()->addDays(3)->toDateString();
        $this->putJson("/api/services/{$service->id}", ['override_suspend_until' => $until])
            ->assertOk()
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('auto_suspended', false);

        // Cron keeps it active through the override date.
        $this->assertSame(0, app(RenewalService::class)->suspendOverdue());
        Queue::assertNothingPushed();

        $this->travel(3)->days();
        $this->assertSame(0, app(RenewalService::class)->suspendOverdue());
        Queue::assertNothingPushed();

        // Once the override date has passed, the next cron suspends it again.
        $this->travel(1)->day();
        $this->assertSame(1, app(RenewalService::class)->suspendOverdue());
        Queue::assertPushed(ProvisionService::class, fn ($job) => $job->serviceId === $service->id && $job->action === 'suspend');
    }

    public function test_cron_unsuspends_auto_suspended_service_with_active_override_and_suspends_overdue_invoice(): void
    {
        Queue::fake();
        $client = Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        $product = Product::create(['name' => 'Starter', 'type' => 'shared_hosting', 'module' => 'webuzo']);

        // Case 1: An auto-suspended service with an active override is unsuspended on cron.
        $overridden = Service::create([
            'client_id' => $client->id, 'product_id' => $product->id,
            'domain' => 'grace.com', 'cycle' => 'monthly', 'recurring_amount' => 400,
            'status' => 'suspended', 'auto_suspended' => true, 'remote_id' => 'graceuser',
            'provision_status' => 'done', 'next_due_date' => today()->subDays(10)->toDateString(),
            'override_suspend_until' => today()->addDays(2)->toDateString(),
        ]);

        // Case 2: An active service with no next_due_date but an unpaid overdue invoice is suspended on cron.
        $invoiced = Service::create([
            'client_id' => $client->id, 'product_id' => $product->id,
            'domain' => 'unpaid.com', 'cycle' => 'monthly', 'recurring_amount' => 400,
            'status' => 'active', 'remote_id' => 'unpaiduser', 'provision_status' => 'done',
            'next_due_date' => null,
        ]);
        $invoice = Invoice::create(['client_id' => $client->id, 'number' => '10099', 'status' => 'unpaid', 'currency' => 'BDT', 'total' => '400.00', 'due_date' => today()->subDays(5)]);
        $invoice->items()->create(['description' => 'Hosting', 'amount' => '400.00', 'kind' => 'new', 'service_id' => $invoiced->id]);

        $this->assertSame(1, app(RenewalService::class)->suspendOverdue());
        Queue::assertPushed(ProvisionService::class, fn ($job) => $job->serviceId === $overridden->id && $job->action === 'unsuspend' && ! $job->billing);
        Queue::assertPushed(ProvisionService::class, fn ($job) => $job->serviceId === $invoiced->id && $job->action === 'suspend');

        $suspendSchedule = collect(app(Schedule::class)->events())->first(fn ($e) => str_ends_with((string) $e->command, 'billing:suspend-overdue'));
        $this->assertSame('* * * * *', $suspendSchedule?->expression);
    }
}
