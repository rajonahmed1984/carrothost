<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Product;
use App\Models\Server;
use App\Models\Service;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ServiceToolsTest extends TestCase
{
    use RefreshDatabase;

    private Client $client;

    private Product $starter;

    private Product $standard;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);
        $this->client = Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        $this->starter = Product::create(['name' => 'Starter', 'type' => 'shared_hosting', 'module' => 'webuzo', 'module_package' => 'starter']);
        $this->starter->prices()->createMany([['cycle' => 'annually', 'price' => 3650], ['cycle' => 'monthly', 'price' => 400]]);
        $this->standard = Product::create(['name' => 'Standard', 'type' => 'shared_hosting', 'module' => 'webuzo', 'module_package' => 'standard']);
        $this->standard->prices()->createMany([['cycle' => 'annually', 'price' => 7300], ['cycle' => 'monthly', 'price' => 800]]);
    }

    private function service(array $extra = []): Service
    {
        return Service::create([
            'client_id' => $this->client->id, 'product_id' => $this->starter->id, 'domain' => 'acme.com', 'cycle' => 'annually',
            'recurring_amount' => 3650, 'status' => 'active', 'next_due_date' => today()->addDays(100), ...$extra,
        ]);
    }

    public function test_upgrade_raises_an_invoice_that_applies_the_change_when_paid(): void
    {
        $service = $this->service();

        $quote = $this->getJson("/api/services/{$service->id}/upgrade?product_id={$this->standard->id}&cycle=annually")->assertOk()->json('quote');
        $this->assertSame(100, $quote['days_left']);
        $days = $quote['cycle_days'];
        $this->assertSame(number_format((7300 - 3650) * 100 / $days, 2, '.', ''), $quote['amount_due']);

        $invoiceId = $this->postJson("/api/services/{$service->id}/upgrade", ['product_id' => $this->standard->id, 'cycle' => 'annually'])
            ->assertOk()->assertJsonPath('service.pending_upgrade.new_product.name', 'Standard')->json('invoice_id');
        $this->assertSame($this->starter->id, $service->refresh()->product_id, 'Nothing changes before payment.');
        $this->postJson("/api/services/{$service->id}/upgrade", ['product_id' => $this->standard->id, 'cycle' => 'monthly'])->assertJsonValidationErrors('product_id');

        $invoice = \App\Models\Invoice::find($invoiceId);
        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX-1', (string) $invoice->total);

        $service->refresh();
        $this->assertSame($this->standard->id, $service->product_id);
        $this->assertSame('7300.00', $service->recurring_amount);
        $this->assertSame(today()->addDays(100)->toDateString(), $service->next_due_date->toDateString(), 'Same cycle keeps the due date.');
        $this->assertSame('active', $service->status);
    }

    public function test_a_change_with_nothing_to_pay_applies_at_once_and_cancelled_invoices_free_the_service(): void
    {
        $service = $this->service(['next_due_date' => today()->subDay()]);

        $invoiceId = $this->postJson("/api/services/{$service->id}/upgrade", ['product_id' => $this->starter->id, 'cycle' => 'monthly'])->assertOk()->json('invoice_id');
        $this->assertNotNull($invoiceId);
        // A due date in the past leaves no credit, so the new monthly price is owed.
        $pending = $service->upgrades()->first();
        $this->assertSame('pending', $pending->status);
        $this->postJson("/api/invoices/{$pending->invoice_id}/cancel")->assertOk();

        $downgrade = $this->service(['domain' => 'two.com', 'product_id' => $this->standard->id, 'recurring_amount' => 7300]);
        $this->postJson("/api/services/{$downgrade->id}/upgrade", ['product_id' => $this->starter->id, 'cycle' => 'annually'])
            ->assertOk()->assertJsonPath('invoice_id', null);
        $this->assertSame($this->starter->id, $downgrade->refresh()->product_id);
        $this->assertSame('3650.00', $downgrade->recurring_amount);

        // The cancelled invoice no longer blocks a new change.
        $this->getJson("/api/services/{$service->id}")->assertJsonPath('pending_upgrade', null);
        $this->assertSame('cancelled', $pending->refresh()->status);
    }

    public function test_transfer_welcome_and_delete(): void
    {
        $service = $this->service();
        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);

        $this->postJson("/api/services/{$service->id}/transfer", ['client_id' => $this->client->id])->assertJsonValidationErrors('client_id');
        $this->postJson("/api/services/{$service->id}/transfer", ['client_id' => $other->id])->assertOk()->assertJsonPath('client.id', $other->id);

        $this->postJson("/api/services/{$service->id}/welcome")->assertOk()->assertJsonPath('message', 'Welcome email sent to other@example.com.');
        Mail::assertSent(\App\Mail\CustomerNotice::class, fn ($m) => $m->hasTo('other@example.com') && str_contains($m->subjectLine, 'is ready'));

        $this->deleteJson("/api/services/{$service->id}")->assertNoContent();
        $this->assertNull(Service::find($service->id));
    }

    public function test_usage_login_and_password_go_through_the_webuzo_module(): void
    {
        $server = Server::create(['name' => 'Earth', 'module' => 'webuzo', 'hostname' => 'earth.test', 'port' => 2005, 'username' => 'root', 'credentials' => 'key']);
        $service = $this->service(['server_id' => $server->id, 'remote_id' => 'acmeuser']);
        Http::fake([
            'earth.test:2005/*act=users*' => Http::response(['users' => ['acmeuser' => ['user' => 'acmeuser', 'domain' => 'acme.com', 'email' => 'a@b.c', 'resource' => [
                'disk' => ['label' => 'Disk Usage', 'used' => '695 MiB', 'limit' => '5 GiB', 'percent' => 13.57, 'used_bytes' => 728707072, 'limit_bytes' => 5368709120],
                'bandwidth' => ['label' => 'Bandwidth Usage', 'used' => '396 MiB', 'limit' => '244 GiB', 'percent' => 0.16, 'used_bytes' => 414819163, 'limit_bytes' => 262144000000],
                'inode' => ['label' => 'Inode Usage', 'used' => '22650', 'limit' => 'unlimited', 'percent' => 0],
            ]]]]),
            'earth.test:2003/*act=sso*' => Http::response(['done' => ['url' => 'https://earth.test:2003/sess1/?as=token']]),
            'earth.test:2003/*act=changepassword*' => Http::response(['done' => true]),
        ]);

        $this->getJson("/api/services/{$service->id}")->assertJsonPath('has_tools', true);
        $this->postJson("/api/services/{$service->id}/usage")->assertOk()
            ->assertJsonPath('disk_usage', 695)->assertJsonPath('disk_limit', 5120)->assertJsonPath('bw_limit', 250000)
            ->assertJsonPath('usage_metrics.2.limit', null);
        $this->postJson("/api/services/{$service->id}/sso")->assertOk()->assertJsonPath('url', 'https://earth.test:2003/sess1/?as=token');
        $this->postJson("/api/services/{$service->id}/password", ['password' => 'NewPass1234'])->assertOk();
        $this->assertSame('NewPass1234', $service->refresh()->credentials['password']);
        Http::assertSent(fn ($r) => str_contains($r->url(), 'loginAs=acmeuser') && str_contains($r->url(), 'act=changepassword') && $r['newpass'] === 'NewPass1234');
    }
}
