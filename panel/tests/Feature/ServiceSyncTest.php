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
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Sleep;
use Tests\TestCase;

/** Admin edits to a service reach the server, and fields tied together stay in step. */
class ServiceSyncTest extends TestCase
{
    use RefreshDatabase;

    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);

        $server = Server::create(['name' => 'S1', 'module' => 'cpanel', 'hostname' => 'whm.test', 'username' => 'root', 'credentials' => 'token']);
        $product = Product::create(['name' => 'Starter', 'type' => 'shared_hosting', 'module' => 'cpanel', 'module_package' => 'starter']);
        $product->prices()->create(['cycle' => 'annually', 'price' => 4200]);
        $product->prices()->create(['cycle' => 'monthly', 'price' => 400]);
        $client = Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        $this->service = Service::create([
            'client_id' => $client->id, 'product_id' => $product->id, 'server_id' => $server->id, 'domain' => 'acme.com',
            'cycle' => 'annually', 'recurring_amount' => 4200, 'status' => 'active', 'remote_id' => 'acme',
            'provision_status' => 'done', 'credentials' => ['username' => 'acme', 'password' => 'secret'],
        ]);
    }

    public function test_suspending_in_the_form_suspends_on_the_server_without_an_overdue_notice(): void
    {
        Http::fake(['*' => Http::response(['metadata' => ['result' => 1]])]);

        $this->putJson("/api/services/{$this->service->id}", ['status' => 'suspended'])->assertOk()
            ->assertJsonPath('status', 'suspended')
            ->assertJsonPath('provision_status', 'done')
            ->assertJsonPath('auto_suspended', false)
            ->assertJsonPath('notices.0', 'Suspended acme on the server.');

        Http::assertSent(fn ($r) => str_contains($r->url(), 'suspendacct') && $r['user'] === 'acme');
    }

    public function test_suspend_button_runs_at_once_and_reports_a_server_failure(): void
    {
        Http::fake([
            '*unsuspendacct*' => Http::response(['metadata' => ['result' => 0, 'reason' => 'Account is locked.']]),
            '*' => Http::response(['metadata' => ['result' => 1]]),
        ]);

        $this->postJson("/api/services/{$this->service->id}/action", ['action' => 'suspend'])->assertOk()
            ->assertJsonPath('status', 'suspended')
            ->assertJsonPath('provision_status', 'done');

        $this->postJson("/api/services/{$this->service->id}/action", ['action' => 'unsuspend'])->assertStatus(422)
            ->assertJsonValidationErrors('action');
        $this->assertSame('suspended', $this->service->refresh()->status);
    }

    public function test_actions_on_an_account_without_a_server_never_go_to_another_server(): void
    {
        Http::fake(['*' => Http::response(['metadata' => ['result' => 1]])]);
        $this->service->update(['server_id' => null, 'status' => 'suspended']);

        (new ProvisionService($this->service->id, 'terminate', true, false))->handle();

        Http::assertNothingSent();
        $this->assertSame('failed', $this->service->refresh()->provision_status);
        $this->assertSame('suspended', $this->service->status);
    }

    public function test_terminate_marks_the_date_and_counts_an_account_already_gone_as_done(): void
    {
        Http::fake([
            '*removeacct*' => Http::response(['metadata' => ['result' => 0, 'reason' => 'User does not exist.']]),
            '*accountsummary*' => Http::response(['metadata' => ['result' => 1], 'data' => ['acct' => []]]),
        ]);

        (new ProvisionService($this->service->id, 'terminate', true, false))->handle();

        $this->service->refresh();
        $this->assertSame('terminated', $this->service->status);
        $this->assertSame('done', $this->service->provision_status);
        $this->assertSame(today()->toDateString(), $this->service->termination_date->toDateString());
    }

    public function test_terminate_still_fails_when_the_server_cannot_be_reached(): void
    {
        Http::fake(['*' => Http::response('down', 500)]);

        (new ProvisionService($this->service->id, 'terminate', true, false))->handle();

        $this->assertSame('failed', $this->service->refresh()->provision_status);
        $this->assertSame('active', $this->service->status);
    }

    public function test_unsuspend_fails_when_the_server_says_done_but_keeps_the_account_suspended(): void
    {
        Sleep::fake();
        $this->service->update(['status' => 'suspended']);
        Http::fake([
            '*accountsummary*' => Http::response(['metadata' => ['result' => 1], 'data' => ['acct' => [['domain' => 'acme.com', 'suspended' => 1]]]]),
            '*' => Http::response(['metadata' => ['result' => 1]]),
        ]);

        $this->postJson("/api/services/{$this->service->id}/action", ['action' => 'unsuspend'])->assertStatus(422)
            ->assertJsonValidationErrors('action');

        $this->service->refresh();
        $this->assertSame('suspended', $this->service->status);
        $this->assertSame('failed', $this->service->provision_status);
        $this->assertStringContainsString('still shows the account as suspended', $this->service->provision_error);
    }

    public function test_webuzo_unsuspend_never_sends_the_sub_users_only_skip(): void
    {
        Sleep::fake();
        $server = Server::create(['name' => 'W1', 'module' => 'webuzo', 'hostname' => 'earth.test', 'username' => 'root', 'credentials' => 'key']);
        $product = Product::create(['name' => 'Web', 'type' => 'shared_hosting', 'module' => 'webuzo', 'module_package' => 'starter']);
        $this->service->update(['status' => 'suspended', 'server_id' => $server->id, 'product_id' => $product->id, 'remote_id' => 'probashix']);

        // Like the real server: skip=1 answers done but leaves the account suspended.
        $suspended = true;
        Http::fake(function ($request) use (&$suspended) {
            if (isset($request['unsuspend'])) {
                if (($request['skip'] ?? null) != 1) {
                    $suspended = false;
                }

                return Http::response(['done' => ['msg' => 'The user has been unsuspended']]);
            }

            return Http::response(['users' => ['probashix' => ['user' => 'probashix', 'domain' => 'acme.com', 'status' => $suspended ? 'suspended' : 'active']]]);
        });

        $this->postJson("/api/services/{$this->service->id}/action", ['action' => 'unsuspend'])->assertOk();

        $this->assertSame('active', $this->service->refresh()->status);
        Http::assertNotSent(fn ($r) => isset($r['unsuspend']) && ($r['skip'] ?? null) == 1);
    }

    public function test_unsuspend_can_be_resent_for_an_active_service(): void
    {
        Http::fake([
            '*accountsummary*' => Http::response(['metadata' => ['result' => 1], 'data' => ['acct' => [['domain' => 'acme.com', 'suspended' => 0]]]]),
            '*' => Http::response(['metadata' => ['result' => 1]]),
        ]);

        $this->postJson("/api/services/{$this->service->id}/action", ['action' => 'unsuspend'])->assertOk()
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('provision_status', 'done');

        Http::assertSent(fn ($r) => str_contains($r->url(), 'unsuspendacct') && $r['user'] === 'acme');
    }

    public function test_status_can_be_saved_in_the_panel_only(): void
    {
        Queue::fake();

        $this->putJson("/api/services/{$this->service->id}", ['status' => 'suspended', 'apply_to_server' => false])->assertOk()
            ->assertJsonPath('provision_status', 'done');

        Queue::assertNothingPushed();
    }

    public function test_reactivating_unsuspends_and_termination_is_never_automatic(): void
    {
        Queue::fake();
        Http::fake(['*' => Http::response(['metadata' => ['result' => 1]])]);
        $this->service->update(['status' => 'suspended']);

        $this->putJson("/api/services/{$this->service->id}", ['status' => 'active'])->assertOk()
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('provision_status', 'done');
        Http::assertSent(fn ($r) => str_contains($r->url(), 'unsuspendacct'));

        $this->putJson("/api/services/{$this->service->id}", ['status' => 'terminated'])->assertOk();
        Queue::assertNotPushed(ProvisionService::class, fn ($job) => $job->action === 'terminate');
    }

    public function test_blank_recurring_amount_uses_the_product_price(): void
    {
        $this->putJson("/api/services/{$this->service->id}", ['recurring_amount' => null, 'cycle' => 'monthly', 'quantity' => 2])->assertOk()
            ->assertJsonPath('recurring_amount', '800.00')
            ->assertJsonPath('options.products.0.prices.annually', '4200.00');
    }

    public function test_renaming_the_account_carries_over_to_a_matching_username(): void
    {
        $this->putJson("/api/services/{$this->service->id}", ['remote_id' => 'acmenew'])->assertOk()
            ->assertJsonPath('remote_id', 'acmenew')
            ->assertJsonPath('username', 'acmenew');

        // A username set to its own value is left alone.
        $this->putJson("/api/services/{$this->service->id}", ['username' => 'owner'])->assertOk();
        $this->putJson("/api/services/{$this->service->id}", ['remote_id' => 'acme3'])->assertOk()->assertJsonPath('username', 'owner');
    }

    public function test_changing_product_can_change_the_package_on_the_server(): void
    {
        Http::fake(['*' => Http::response(['metadata' => ['result' => 1]])]);
        $pro = Product::create(['name' => 'Pro', 'type' => 'shared_hosting', 'module' => 'cpanel', 'module_package' => 'pro']);

        $this->putJson("/api/services/{$this->service->id}", ['product_id' => $pro->id, 'change_package' => true])->assertOk()
            ->assertJsonPath('notices.0', 'Package changed on the server to pro.');

        Http::assertSent(fn ($r) => str_contains($r->url(), 'changepackage') && $r['pkg'] === 'pro');
    }

    public function test_check_with_server_lists_differences_and_applies_the_picked_ones(): void
    {
        // The server reads as running until it is suspended.
        $suspended = 0;
        Http::fake(function ($request) use (&$suspended) {
            if (str_contains($request->url(), 'suspendacct')) {
                $suspended = 1;

                return Http::response(['metadata' => ['result' => 1]]);
            }

            return Http::response(['metadata' => ['result' => 1], 'data' => ['acct' => [[
                'user' => 'acme', 'domain' => 'acme.net', 'ip' => '203.0.113.5', 'plan' => 'starter', 'suspended' => $suspended,
            ]]]]);
        });
        $this->service->update(['status' => 'suspended', 'dedicated_ip' => '203.0.113.9']);

        $this->getJson("/api/services/{$this->service->id}/server-state")->assertOk()
            ->assertJsonPath('differences', ['domain' => true, 'dedicated_ip' => true, 'status' => true, 'package' => false]);

        $this->postJson("/api/services/{$this->service->id}/server-state", ['use' => ['domain', 'dedicated_ip', 'status']])->assertOk()
            ->assertJsonPath('domain', 'acme.net')
            ->assertJsonPath('dedicated_ip', '203.0.113.5')
            ->assertJsonPath('status', 'suspended')
            ->assertJsonPath('provision_status', 'done');

        Http::assertSent(fn ($r) => str_contains($r->url(), 'suspendacct') && $r['user'] === 'acme');
    }

    public function test_payment_methods_list_only_gateways_that_are_on(): void
    {
        Gateway::create(['code' => 'manual', 'is_enabled' => true, 'config' => ['display_name' => 'Bank Transfer']]);
        Gateway::create(['code' => 'paypal', 'is_enabled' => false, 'config' => []]);
        $this->service->update(['payment_method' => 'bkash']);

        $methods = collect($this->getJson("/api/services/{$this->service->id}")->assertOk()->json('options.payment_methods'))->pluck('name', 'code');

        $this->assertSame(['manual' => 'Bank Transfer', 'bkash' => 'bKash (turned off)'], $methods->all());
        $this->putJson("/api/services/{$this->service->id}", ['payment_method' => 'paypal'])->assertJsonValidationErrors('payment_method');
    }

    public function test_paying_an_invoice_sets_the_services_payment_method(): void
    {
        Queue::fake();
        $this->service->update(['payment_method' => 'manual', 'next_due_date' => today()]);
        $invoice = Invoice::create(['client_id' => $this->service->client_id, 'number' => '9001', 'subtotal' => 4200, 'total' => 4200, 'currency' => 'BDT', 'status' => 'unpaid', 'due_date' => today()]);
        $invoice->items()->create(['description' => 'Renewal', 'amount' => 4200, 'kind' => 'renewal', 'service_id' => $this->service->id]);

        app(BillingService::class)->recordPayment($invoice, 'bkash', 'TX9', '4200.00');

        $this->assertSame('bkash', $this->service->refresh()->payment_method);
    }
}
