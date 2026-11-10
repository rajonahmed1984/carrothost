<?php

namespace Tests\Feature;

use App\Jobs\ProvisionService;
use App\Mail\CustomerNotice;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Domain;
use App\Models\Gateway;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Registrar;
use App\Models\Server;
use App\Models\Service;
use App\Models\Tld;
use App\Models\User;
use App\Provisioning\CpanelModule;
use App\Services\BillingService;
use App\Services\RenewalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class BillingFlowTest extends TestCase
{
    use RefreshDatabase;

    private function hostingProduct(?string $module = 'cpanel'): Product
    {
        $product = Product::create(['name' => 'Starter', 'type' => 'shared_hosting', 'module' => $module, 'module_package' => 'starter']);
        $product->prices()->create(['cycle' => 'annually', 'price' => '4200.00', 'setup_fee' => '100.00']);

        return $product;
    }

    private function client(): Client
    {
        return Client::create(['name' => 'Test Client', 'email' => 'client@example.com']);
    }

    private function orderInvoice(?string $module = 'cpanel'): Invoice
    {
        $order = app(BillingService::class)->createOrder($this->client(), [
            ['product_id' => $this->hostingProduct($module)->id, 'cycle' => 'annually', 'domain' => 'example.com'],
        ]);

        return $order->invoices()->first();
    }

    public function test_order_invoice_includes_setup_fee(): void
    {
        $this->assertSame('4300.00', $this->orderInvoice()->total);
    }

    public function test_order_mail_comes_from_sales_and_invoice_mail_from_billing(): void
    {
        Mail::fake();
        Queue::fake();
        $invoice = $this->orderInvoice(null);
        $from = fn (string $address, string $subject) => fn (CustomerNotice $mail) => $mail->hasTo('client@example.com') && $mail->hasFrom($address) && str_starts_with($mail->subjectLine, $subject);

        Mail::assertSent(CustomerNotice::class, $from('sales@carrothost.com', 'Order confirmation'));
        Mail::assertSent(CustomerNotice::class, $from('billing@carrothost.com', "New invoice {$invoice->number}"));

        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX1', '4300.00');
        Mail::assertSent(CustomerNotice::class, $from('billing@carrothost.com', 'Payment received'));

        $this->actingAs(tap(User::factory()->create(), fn (User $admin) => $admin->forceFill(['is_admin' => true])->save()));
        $this->postJson('/api/orders/batch-action', ['order_ids' => [$invoice->order_id], 'action' => 'accept'])->assertOk();
        Mail::assertSent(CustomerNotice::class, $from('sales@carrothost.com', 'Your order'));
    }

    public function test_full_payment_activates_service_and_queues_provisioning(): void
    {
        Queue::fake();
        $invoice = $this->orderInvoice();

        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX1', '4300.00');

        $service = Service::first();
        $this->assertSame('paid', $invoice->refresh()->status);
        $this->assertSame('active', $service->status);
        $this->assertSame(now()->addYear()->toDateString(), $service->next_due_date->toDateString());
        Queue::assertPushed(ProvisionService::class, 1);
    }

    public function test_redelivered_payment_is_not_counted_twice(): void
    {
        Queue::fake();
        $invoice = $this->orderInvoice();
        $billing = app(BillingService::class);

        $billing->recordPayment($invoice, 'manual', 'TX1', '4300.00');
        $billing->recordPayment($invoice, 'manual', 'TX1', '4300.00');

        $this->assertSame(1, Payment::count());
        Queue::assertPushed(ProvisionService::class, 1);
    }

    public function test_transaction_id_cannot_be_reused_on_another_invoice(): void
    {
        Queue::fake();
        $billing = app(BillingService::class);
        $invoice = $this->orderInvoice();
        $other = $billing->createInvoice($invoice->client, [['description' => 'Other', 'amount' => '10.00']], now());

        $billing->recordPayment($invoice, 'manual', 'TX1', '4300.00');

        $this->expectException(ValidationException::class);
        $billing->recordPayment($other, 'manual', 'TX1', '10.00');
    }

    public function test_partial_payment_does_not_activate(): void
    {
        Queue::fake();
        $invoice = $this->orderInvoice();

        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX1', '1000.00');

        $this->assertSame('unpaid', $invoice->refresh()->status);
        $this->assertSame('pending', Service::first()->status);
        Queue::assertNothingPushed();
    }

    public function test_manual_product_is_flagged_for_admin(): void
    {
        Queue::fake();
        $invoice = $this->orderInvoice(null);

        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX1', '4300.00');

        $this->assertSame('manual_required', Service::first()->provision_status);
        Queue::assertNothingPushed();
    }

    public function test_cpanel_provisioning_stores_encrypted_credentials(): void
    {
        Http::fake(['*' => Http::response(['metadata' => ['result' => 1]])]);
        Server::create(['name' => 'S1', 'module' => 'cpanel', 'hostname' => 'whm.test', 'username' => 'root', 'credentials' => 'token']);
        $invoice = $this->orderInvoice();

        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX1', '4300.00');

        $service = Service::first();
        $this->assertSame('done', $service->provision_status);
        $this->assertStringStartsWith('example', $service->remote_id);
        $this->assertArrayNotHasKey('credentials', $service->toArray());
        $this->assertStringNotContainsString($service->credentials['password'], (string) $service->getRawOriginal('credentials'));
        Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'whm root:token') && str_contains($request->url(), 'createacct'));
    }

    public function test_whm_rejection_is_recorded_as_failed(): void
    {
        Http::fake(['*' => Http::response(['metadata' => ['result' => 0, 'reason' => 'Domain exists']])]);
        Server::create(['name' => 'S1', 'module' => 'cpanel', 'hostname' => 'whm.test', 'username' => 'root', 'credentials' => 'token']);

        app(BillingService::class)->recordPayment($this->orderInvoice(), 'manual', 'TX1', '4300.00');

        $service = Service::first();
        $this->assertSame('failed', $service->provision_status);
        $this->assertStringContainsString('Domain exists', $service->provision_error);
    }

    public function test_webuzo_provisioning_uses_access_hash_and_plan(): void
    {
        Http::fake(['*' => Http::response(['done' => ['msg' => 'The User has been saved successfully']])]);
        Server::create(['name' => 'Earth', 'module' => 'webuzo', 'hostname' => 'wz.test', 'username' => 'root', 'credentials' => 'hash']);

        app(BillingService::class)->recordPayment($this->orderInvoice('webuzo'), 'manual', 'TX1', '4300.00');

        $service = Service::first();
        $this->assertSame('done', $service->provision_status);
        Http::assertSent(fn ($request) => str_contains($request->url(), 'wz.test:2005')
            && str_contains($request->url(), 'act=add_user')
            && str_contains($request->url(), 'apikey=hash')
            && $request['plan'] === 'starter'
            && $request['user'] === $service->remote_id);
    }

    public function test_webuzo_error_is_recorded_without_leaking_the_key(): void
    {
        Http::fake(['*' => Http::response(['error' => ['Domain already exists']])]);
        Server::create(['name' => 'Earth', 'module' => 'webuzo', 'hostname' => 'wz.test', 'username' => 'root', 'credentials' => 'secret-hash']);

        app(BillingService::class)->recordPayment($this->orderInvoice('webuzo'), 'manual', 'TX1', '4300.00');

        $service = Service::first();
        $this->assertSame('failed', $service->provision_status);
        $this->assertStringContainsString('Domain already exists', $service->provision_error);
        $this->assertStringNotContainsString('secret-hash', $service->provision_error);
    }

    public function test_cpanel_password_auth_uses_basic_auth(): void
    {
        Http::fake(['*' => Http::response(['metadata' => ['result' => 1]])]);
        $server = Server::create(['name' => 'HH', 'module' => 'cpanel', 'hostname' => 'whm.test', 'username' => 'reseller', 'auth_type' => 'password', 'credentials' => 'pw']);

        (new CpanelModule($server))->testConnection();

        Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Basic '.base64_encode('reseller:pw')));
    }

    public function test_registrar_key_is_encrypted_hidden_and_block_is_explained(): void
    {
        Http::fake(['*' => Http::response('<title>Attention Required! | Cloudflare</title>', 403)]);
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        $this->actingAs($admin)->putJson('/api/registrars/stargate', ['reseller_id' => '1', 'api_key' => 'super-secret'])->assertOk();

        $this->assertStringNotContainsString('super-secret', (string) Registrar::first()->getRawOriginal('api_key'));
        $this->actingAs($admin)->getJson('/api/registrars')->assertOk()->assertDontSee('super-secret')->assertJsonFragment(['has_api_key' => true]);
        $this->actingAs($admin)->postJson('/api/registrars/stargate/test')->assertOk()->assertJson(['ok' => false])->assertDontSee('super-secret');
    }

    public function test_module_without_driver_falls_back_to_manual(): void
    {
        app(BillingService::class)->recordPayment($this->orderInvoice('webdock'), 'manual', 'TX1', '4300.00');

        $this->assertSame('manual_required', Service::first()->provision_status);
    }

    public function test_renewal_invoice_is_raised_once_and_payment_extends_due_date(): void
    {
        Queue::fake();
        $billing = app(BillingService::class);
        $renewals = app(RenewalService::class);
        $billing->recordPayment($this->orderInvoice(), 'manual', 'TX1', '4300.00');

        $service = Service::first();
        $due = now()->addDays(5)->startOfDay();
        $service->update(['next_due_date' => $due->toDateString()]);

        $this->assertSame(1, $renewals->generateInvoices());
        $this->assertSame(0, $renewals->generateInvoices());

        $renewal = Invoice::latest('id')->first();
        $this->assertSame('4200.00', $renewal->total);

        $billing->recordPayment($renewal, 'manual', 'TX2', '4200.00');

        $this->assertSame($due->copy()->addYear()->toDateString(), $service->refresh()->next_due_date->toDateString());
    }

    public function test_overdue_service_suspends_and_payment_unsuspends(): void
    {
        Queue::fake();
        $billing = app(BillingService::class);
        $renewals = app(RenewalService::class);
        $billing->recordPayment($this->orderInvoice(), 'manual', 'TX1', '4300.00');

        $service = Service::first();
        $service->update(['remote_id' => 'example1', 'provision_status' => 'done', 'next_due_date' => now()->subDays(10)->toDateString()]);

        $this->assertSame(1, $renewals->suspendOverdue());
        Queue::assertPushed(ProvisionService::class, fn ($job) => $job->action === 'suspend');

        $service->update(['status' => 'suspended', 'auto_suspended' => true, 'provision_status' => 'done']);
        $renewals->generateInvoices();
        $billing->recordPayment(Invoice::latest('id')->first(), 'manual', 'TX2', '4200.00');

        Queue::assertPushed(ProvisionService::class, fn ($job) => $job->action === 'unsuspend');
    }

    public function test_admin_suspension_survives_renewal_payment(): void
    {
        Queue::fake();
        $billing = app(BillingService::class);
        $billing->recordPayment($this->orderInvoice(), 'manual', 'TX1', '4300.00');

        $service = Service::first();
        $service->update(['status' => 'suspended', 'auto_suspended' => false, 'remote_id' => 'example1', 'next_due_date' => now()->addDays(5)->toDateString()]);
        app(RenewalService::class)->generateInvoices();
        $billing->recordPayment(Invoice::latest('id')->first(), 'manual', 'TX2', '4200.00');

        Queue::assertNotPushed(ProvisionService::class, fn ($job) => $job->action === 'unsuspend');
    }

    public function test_domain_pricing_uses_longest_suffix_and_waits_for_admin(): void
    {
        Tld::create(['tld' => '.bd', 'register_price' => 1, 'renew_price' => 1, 'transfer_price' => 1]);
        Tld::create(['tld' => '.com.bd', 'register_price' => 1500, 'renew_price' => 1500, 'transfer_price' => 1500]);

        $order = app(BillingService::class)->createOrder($this->client(), [], [
            ['name' => 'Example.com.bd', 'action' => 'register', 'years' => 2],
        ]);
        $invoice = $order->invoices()->first();

        $this->assertSame('3000.00', $invoice->total);

        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX1', '3000.00');

        $domain = Domain::first();
        $this->assertSame('example.com.bd', $domain->name);
        $this->assertSame('pending', $domain->status);
        $this->assertSame('manual_required', $domain->provision_status);
    }

    public function test_api_requires_an_admin(): void
    {
        $this->getJson('/api/clients')->assertUnauthorized();

        $this->actingAs(User::factory()->create())->getJson('/api/clients')->assertForbidden();

        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin)->getJson('/api/clients')->assertOk();
    }

    public function test_client_list_counts_active_services_and_hides_inactive_clients(): void
    {
        Queue::fake();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $product = Product::create(['name' => 'Starter', 'type' => 'other']);
        $product->prices()->create(['cycle' => 'monthly', 'price' => '10.00']);
        $active = Client::create(['name' => 'Habib', 'email' => 'habib@example.com', 'phone' => '01711000000']);
        Client::create(['name' => 'Gone', 'email' => 'gone@example.com', 'status' => 'inactive']);
        app(BillingService::class)->createOrder($active, [['product_id' => $product->id, 'cycle' => 'monthly'], ['product_id' => $product->id, 'cycle' => 'monthly']]);
        $active->services()->first()->update(['status' => 'active']);
        $this->actingAs($admin);

        $this->getJson('/api/clients')->assertJsonPath('total', 2);
        $this->getJson('/api/clients?hide_inactive=1')
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.active_services_count', 1)
            ->assertJsonPath('data.0.services_count', 2)
            ->assertJsonPath('data.0.active_domains_count', 0);
        $this->getJson('/api/clients?q=01711')->assertJsonPath('data.0.name', 'Habib');
    }

    public function test_login_rejects_non_admin(): void
    {
        $user = User::factory()->create(['password' => 'secret-password']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'secret-password'])->assertUnprocessable();
        $this->assertGuest();
    }

    public function test_unconnected_gateway_cannot_be_enabled(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        $this->actingAs($admin)->putJson('/api/gateways/stripe', ['is_enabled' => true])->assertUnprocessable();
        $this->actingAs($admin)->putJson('/api/gateways/bkash', ['is_enabled' => true])->assertUnprocessable();
        $this->actingAs($admin)->putJson('/api/gateways/manual', ['is_enabled' => true, 'config' => ['instructions' => 'Bank A/C']])->assertOk();
    }

    public function test_gateway_secret_is_encrypted_write_only_and_kept_when_blank(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $config = ['display_name' => 'Card', 'store_id' => 'store', 'store_password' => 'top-secret'];

        $this->actingAs($admin)->putJson('/api/gateways/sslcommerz', ['is_enabled' => true, 'test_mode' => true, 'config' => $config])->assertOk();
        $this->actingAs($admin)->getJson('/api/gateways')->assertOk()->assertDontSee('top-secret');
        $this->assertStringNotContainsString('top-secret', (string) Gateway::first()->getRawOriginal('config'));

        $this->actingAs($admin)->putJson('/api/gateways/sslcommerz', ['is_enabled' => true, 'config' => [...$config, 'store_password' => '']])->assertOk();
        $this->assertSame('top-secret', Gateway::first()->config['store_password']);
    }

    public function test_customer_logs_in_and_sees_only_their_own_data(): void
    {
        $mine = Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => 'correct-horse']);
        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);
        $billing = app(BillingService::class);
        $myInvoice = $billing->createInvoice($mine, [['description' => 'A', 'amount' => '10.00']], now());
        $theirInvoice = $billing->createInvoice($other, [['description' => 'B', 'amount' => '20.00']], now());

        $this->getJson('/api/client/me')->assertUnauthorized();
        $this->postJson('/api/client/login', ['email' => 'mine@example.com', 'password' => 'wrong-password'])->assertUnprocessable();
        $this->loginClientWithCode('mine@example.com', 'correct-horse')->assertJsonMissingPath('password');

        $this->getJson('/api/client/overview')->assertOk()->assertSee($myInvoice->number)->assertDontSee($theirInvoice->number);
        $this->getJson('/api/client/invoices')->assertOk()->assertJsonCount(1)->assertJsonPath('0.number', $myInvoice->number)->assertJsonStructure([['created_at', 'paid_at']]);
        $this->getJson("/api/client/invoices/{$myInvoice->id}")
            ->assertOk()
            ->assertJsonPath('client.email', 'mine@example.com')
            ->assertJsonPath('company.name', config('app.name'))
            ->assertJsonStructure(['created_at', 'paid_at', 'items' => [['kind', 'service_id', 'domain_id']]])
            ->assertJsonMissingPath('client.password');
        $this->getJson("/api/client/invoices/{$theirInvoice->id}")->assertNotFound();
    }

    public function test_customer_dashboard_lists_renewals_and_activity(): void
    {
        Queue::fake();
        $client = Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => 'correct-horse']);
        $product = Product::create(['name' => 'Starter', 'type' => 'other']);
        $product->prices()->create(['cycle' => 'monthly', 'price' => '300.00']);
        $order = app(BillingService::class)->createOrder($client, [['product_id' => $product->id, 'cycle' => 'monthly']]);
        $client->services()->first()->update(['status' => 'active', 'next_due_date' => now()->addDays(20)]);
        $base = ['client_id' => $client->id, 'action' => 'register', 'recurring_amount' => '1600.00', 'status' => 'active'];
        Domain::create([...$base, 'name' => 'soon.com', 'expires_at' => now()->addDays(5)]);
        Domain::create([...$base, 'name' => 'later.com', 'expires_at' => now()->addDays(200)]);
        Domain::create([...$base, 'name' => 'lapsing.com', 'expires_at' => now()->addDays(3), 'auto_renew' => false]);
        $client->tickets()->create(['number' => '100001', 'department' => 'support', 'subject' => 'Help', 'status' => 'answered', 'last_reply_at' => now()]);
        $this->loginClientWithCode('mine@example.com', 'correct-horse');

        $this->getJson('/api/client/overview')
            ->assertOk()
            ->assertJsonPath('open_tickets', 1)
            ->assertJsonCount(2, 'renewals')
            ->assertJsonPath('renewals.0.name', 'soon.com')
            ->assertJsonPath('renewals.1.name', 'Starter')
            ->assertJsonPath('activity.0.title', 'Ticket #100001 answered')
            ->assertJsonFragment(['title' => "Invoice #{$order->invoices()->value('number')} issued"]);
    }

    public function test_customer_session_cannot_reach_the_admin_api(): void
    {
        Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => 'correct-horse']);

        $this->loginClientWithCode('mine@example.com', 'correct-horse');

        $this->getJson('/api/clients')->assertUnauthorized();
        $this->getJson('/api/dashboard')->assertUnauthorized();
    }

    public function test_closed_or_passwordless_client_cannot_log_in(): void
    {
        Client::create(['name' => 'Closed', 'email' => 'closed@example.com', 'password' => 'correct-horse', 'status' => 'closed']);
        Client::create(['name' => 'None', 'email' => 'none@example.com']);

        $this->postJson('/api/client/login', ['email' => 'closed@example.com', 'password' => 'correct-horse'])->assertUnprocessable();
        $this->postJson('/api/client/login', ['email' => 'none@example.com', 'password' => 'correct-horse'])->assertUnprocessable();
    }

    public function test_admin_login_and_detail_routes(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        Queue::fake();
        $invoice = $this->orderInvoice();
        $service = Service::first();

        foreach (["/api/clients/{$invoice->client_id}", "/api/orders/{$invoice->order_id}", "/api/services/{$service->id}", "/api/invoices/{$invoice->id}"] as $url) {
            $this->actingAs($admin)->getJson($url)->assertOk();
        }

        $this->get('/admin/login')->assertOk();
        $this->get('/login')->assertOk();
        $this->get('/invoices/1')->assertOk();
    }

    public function test_dashboard_reports_real_figures(): void
    {
        Queue::fake();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $invoice = $this->orderInvoice();
        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX1', '4300.00');

        $data = $this->actingAs($admin)->getJson('/api/dashboard')->assertOk()->json();

        $this->assertEquals(4300, $data['billing']['today']);
        $this->assertEquals(4300, $data['billing']['all_time']);
        $this->assertCount(24, $data['charts']['today']);
        $this->assertCount(30, $data['charts']['month']);
        $this->assertCount(12, $data['charts']['year']);
        $this->assertSame(1, end($data['charts']['month'])['new_orders']);
        $this->assertSame(1, end($data['charts']['month'])['activated_orders']);
        $this->assertEquals(4300, end($data['charts']['month'])['income']);
        $this->assertSame('Needs Attention', $data['health']['rating']);
    }

    public function test_client_login_is_recorded_for_activity(): void
    {
        Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => 'correct-horse']);

        $this->loginClientWithCode('mine@example.com', 'correct-horse');

        $this->assertNotNull(Client::first()->last_login_at);
    }

    public function test_client_view_summarises_billing_and_services(): void
    {
        Queue::fake();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $invoice = $this->orderInvoice();
        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX1', '4300.00');
        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);
        app(BillingService::class)->createInvoice($other, [['description' => 'X', 'amount' => '999.00']], now());

        $data = $this->actingAs($admin)->getJson("/api/clients/{$invoice->client_id}")->assertOk()->assertJsonMissingPath('password')->json();

        $this->assertSame(1, $data['invoice_totals']['paid']['count']);
        $this->assertEquals(4300, $data['gross_revenue']);
        $this->assertCount(1, $data['invoices']);
        $this->assertCount(1, $data['transactions']);
        $this->assertSame('shared_hosting', $data['service_counts'][0]['type']);

        // The log pages separately, newest first, and covers the client's invoices too.
        $log = $this->getJson("/api/clients/{$invoice->client_id}/log")->assertOk()->json();
        $this->assertSame('payment.recorded', $log['data'][0]['action']);
        $this->assertNotContains($other->id, array_column($log['data'], 'subject_id'));
    }

    public function test_admin_creates_invoice_and_saves_notes_for_client(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $client = $this->client();

        $this->actingAs($admin)->postJson("/api/clients/{$client->id}/invoices", ['due_date' => '2026-12-01', 'items' => [['description' => 'Setup', 'amount' => 500], ['description' => 'Extra', 'amount' => '250.50']]])->assertCreated()->assertJsonPath('total', '750.50');
        $this->actingAs($admin)->putJson("/api/clients/{$client->id}/notes", ['notes' => 'VIP'])->assertOk();

        $this->assertSame('VIP', $client->refresh()->notes);
    }

    public function test_client_with_live_services_cannot_be_closed_and_records_block_delete(): void
    {
        Queue::fake();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $invoice = $this->orderInvoice();
        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX1', '4300.00');
        $client = $invoice->client;

        $this->actingAs($admin)->postJson("/api/clients/{$client->id}/close")->assertUnprocessable();
        $this->actingAs($admin)->deleteJson("/api/clients/{$client->id}")->assertUnprocessable();
        $this->assertSame('active', $client->refresh()->status);

        $empty = Client::create(['name' => 'Empty', 'email' => 'empty@example.com']);
        $this->actingAs($admin)->postJson("/api/clients/{$empty->id}/close")->assertOk();
        $this->assertSame('closed', $empty->refresh()->status);
        $this->actingAs($admin)->postJson("/api/clients/{$empty->id}/reopen")->assertOk();
        $this->actingAs($admin)->deleteJson("/api/clients/{$empty->id}")->assertNoContent();
    }

    public function test_server_token_is_never_returned(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        Server::create(['name' => 'S1', 'module' => 'cpanel', 'hostname' => 'whm.test', 'credentials' => 'super-secret']);

        $this->actingAs($admin)->getJson('/api/servers')->assertOk()->assertDontSee('super-secret');
    }
}
