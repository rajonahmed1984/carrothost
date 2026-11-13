<?php

namespace Tests\Feature;

use App\Jobs\ProvisionService;
use App\Mail\AdminNotice;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\Server;
use App\Models\Service;
use App\Models\User;
use App\Services\AutomationService;
use App\Services\BillingService;
use App\Services\RenewalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ServiceCancellationTest extends TestCase
{
    use RefreshDatabase;

    private Client $client;

    private Service $service;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Queue::fake();
        $this->admin = User::factory()->create(['email' => 'boss@example.com']);
        $this->admin->forceFill(['is_admin' => true])->save();

        $group = ProductGroup::create(['name' => 'Hosting', 'slug' => 'hosting', 'is_visible' => true]);
        $product = Product::create(['name' => 'Starter', 'type' => 'shared_hosting', 'module' => 'cpanel', 'product_group_id' => $group->id, 'is_active' => true, 'setup_mode' => 'accept']);
        $product->prices()->create(['cycle' => 'monthly', 'price' => '300.00']);
        $server = Server::create(['name' => 'WHM 1', 'hostname' => 'whm.example.com', 'module' => 'cpanel', 'is_active' => true]);
        $this->client = Client::create(['name' => 'Insight Dhaka', 'email' => 'buyer@example.com', 'password' => 'secret-pass-1']);
        $this->service = $this->client->services()->create([
            'product_id' => $product->id, 'server_id' => $server->id, 'remote_id' => 'shopcom', 'domain' => 'shop.com',
            'cycle' => 'monthly', 'recurring_amount' => '300.00', 'status' => 'active', 'next_due_date' => today()->addDays(10)->toDateString(),
        ]);
    }

    private function renewalLine(?Service $service = null, string $amount = '300.00'): array
    {
        return ['description' => 'Renewal', 'amount' => $amount, 'kind' => 'renewal', 'service_id' => ($service ?? $this->service)->id];
    }

    private function request(string $type = 'end_of_period')
    {
        $this->loginClientWithCode('buyer@example.com', 'secret-pass-1');

        return $this->postJson("/api/client/services/{$this->service->id}/cancel", ['type' => $type, 'reason' => 'Moving to another host']);
    }

    private function asAdmin(): static
    {
        $this->flushSession();
        Auth::forgetGuards();

        return $this->actingAs($this->admin, 'web');
    }

    private function decide(string $decision)
    {
        return $this->asAdmin()->postJson("/api/services/{$this->service->id}/cancellation", ['decision' => $decision]);
    }

    public function test_a_request_changes_nothing_but_shows_under_pending_cancellation_and_emails_the_admins(): void
    {
        $renewal = app(BillingService::class)->createInvoice($this->client, [$this->renewalLine()], today()->addDays(10));

        $this->request()->assertOk()->assertJsonPath('cancellation.type', 'end_of_period')->assertJsonPath('cancellation.accepted_at', null);

        $this->service->refresh();
        $this->assertSame('active', $this->service->status);
        $this->assertSame('Moving to another host', $this->service->cancellation_reason);
        $this->assertSame('unpaid', $renewal->fresh()->status);
        Queue::assertNotPushed(ProvisionService::class);

        Mail::assertQueued(AdminNotice::class, fn (AdminNotice $m) => $m->hasTo('boss@example.com')
            && $m->subjectLine === 'Cancellation request - Insight Dhaka (shop.com)'
            && str_contains($m->render(), 'Moving to another host') && str_contains($m->url, 'status=pending_cancellation'));

        $this->asAdmin()->getJson('/api/services?status=pending_cancellation')
            ->assertOk()->assertJsonPath('data.0.id', $this->service->id)->assertJsonPath('data.0.cancellation_type', 'end_of_period');

        // Asking again is refused.
        $this->flushSession();
        Auth::forgetGuards();
        $this->request('immediate')->assertUnprocessable();
    }

    public function test_accepting_an_immediate_request_cancels_the_service_suspends_the_account_and_its_invoices(): void
    {
        $renewal = app(BillingService::class)->createInvoice($this->client, [$this->renewalLine()], today()->addDays(10));
        $other = $this->client->services()->create(['product_id' => $this->service->product_id, 'domain' => 'blog.com', 'cycle' => 'monthly', 'recurring_amount' => '200.00', 'status' => 'active', 'next_due_date' => today()->addDays(10)->toDateString()]);
        $merged = app(BillingService::class)->createInvoice($this->client, [$this->renewalLine(), $this->renewalLine($other, '200.00')], today()->addDays(10));
        $this->request('immediate')->assertOk();

        $this->decide('accept')->assertOk()->assertJsonPath('status', 'cancelled')->assertJsonPath('provision_status', 'queued');

        $this->assertSame('cancelled', $renewal->fresh()->status);
        // The merged invoice keeps billing the other service.
        $this->assertSame('unpaid', $merged->fresh()->status);
        $this->assertSame('200.00', (string) $merged->fresh()->total);
        Queue::assertPushed(ProvisionService::class, fn ($job) => $job->serviceId === $this->service->id && $job->action === 'cancel');
        // Cancelled: out of the pending list.
        $this->getJson('/api/services?status=pending_cancellation')->assertJsonCount(0, 'data');
    }

    public function test_an_accepted_end_of_period_request_waits_for_the_due_date(): void
    {
        $this->request()->assertOk();
        $this->decide('accept')->assertOk()->assertJsonPath('status', 'active');
        Queue::assertNotPushed(ProvisionService::class);

        // Not billed again, and nothing happens before the due date.
        app(RenewalService::class)->generateInvoices();
        $this->assertSame(0, Invoice::count());
        app(AutomationService::class)->terminate();
        $this->assertSame('active', $this->service->fresh()->status);

        $this->travelTo(today()->addDays(10));
        $this->assertSame(1, app(AutomationService::class)->terminate());
        $this->assertSame('cancelled', $this->service->fresh()->status);
        Queue::assertPushed(ProvisionService::class, fn ($job) => $job->action === 'cancel');
    }

    public function test_rejecting_keeps_the_service_and_lets_the_client_ask_again(): void
    {
        $this->request()->assertOk();
        $this->decide('reject')->assertOk()->assertJsonPath('status', 'active')->assertJsonPath('cancellation_requested_at', null);

        $this->getJson('/api/services?status=pending_cancellation')->assertJsonCount(0, 'data');
        $this->decide('accept')->assertUnprocessable();
    }

    public function test_a_paid_invoice_is_left_alone(): void
    {
        $paid = app(BillingService::class)->createInvoice($this->client, [$this->renewalLine()], today());
        app(BillingService::class)->recordPayment($paid, 'manual', 'TX-1', '300.00');

        $this->request('immediate')->assertOk();
        $this->decide('accept')->assertOk();

        $this->assertSame('paid', $paid->fresh()->status);
    }

    public function test_the_cancel_job_suspends_the_account_and_keeps_it_cancelled(): void
    {
        $module = \Mockery::mock(\App\Provisioning\ProvisioningModule::class);
        $module->shouldReceive('suspend')->once()->withArgs(fn ($s, $reason) => $reason === 'Cancelled at client request');
        // The job builds the module from the server itself, so the action is called with a stub.
        $job = new ProvisionService($this->service->id, 'cancel');
        $method = new \ReflectionMethod($job, 'cancel');
        $this->assertSame(['auto_suspended' => false], $method->invoke($job, $module, $this->service));
    }
}
