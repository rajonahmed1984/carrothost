<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\Server;
use App\Models\Service;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ClientServicesTest extends TestCase
{
    use RefreshDatabase;

    private function service(Client $client, array $attributes = []): Service
    {
        $group = ProductGroup::firstOrCreate(['name' => 'Webuzo Hosting'], ['slug' => 'webuzo-hosting']);
        $product = Product::firstOrCreate(['name' => 'Standard'], ['type' => 'shared_hosting', 'module' => 'cpanel', 'product_group_id' => $group->id]);
        $server = Server::firstOrCreate(['hostname' => 'hkg112.example.com'], ['name' => 'HK', 'module' => 'cpanel']);

        return Service::create([
            'client_id' => $client->id, 'product_id' => $product->id, 'server_id' => $server->id, 'domain' => 'erestu.net', 'cycle' => 'annually',
            'recurring_amount' => '6999.18', 'status' => 'active', 'next_due_date' => now()->addDays(111),
            'credentials' => ['username' => 'erestu', 'password' => 'S3cret-pass'], ...$attributes,
        ]);
    }

    public function test_customer_lists_and_opens_only_their_own_services(): void
    {
        Queue::fake();
        $mine = Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => 'correct-horse']);
        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);
        $service = $this->service($mine);
        $theirs = $this->service($other, ['domain' => 'theirs.net']);
        $this->service($mine, ['domain' => 'old.net', 'status' => 'terminated']);
        $invoice = app(BillingService::class)->createInvoice($mine, [['description' => 'Renewal', 'amount' => '6999.18', 'kind' => 'renewal', 'service_id' => $service->id]], now());
        $this->loginClientWithCode('mine@example.com', 'correct-horse');

        $list = $this->getJson('/api/client/services')->assertOk()->assertJsonCount(2)->assertDontSee('theirs.net')->assertDontSee('S3cret-pass')->json();
        $live = collect($list)->firstWhere('domain', 'erestu.net');
        $this->assertSame('https://hkg112.example.com:2083', $live['panel_url']);
        $this->assertSame('Webuzo Hosting', $live['product']['group']);
        $this->assertSame(now()->addDays(111)->toDateString(), $live['next_due_date']);
        $this->assertNull(collect($list)->firstWhere('domain', 'old.net')['panel_url']);

        $this->getJson("/api/client/services/{$service->id}")
            ->assertOk()
            ->assertJsonPath('has_password', true)
            ->assertJsonPath('username', 'erestu')
            ->assertJsonPath('invoices.0.id', $invoice->id)
            ->assertDontSee('S3cret-pass');
        $this->getJson("/api/client/services/{$theirs->id}")->assertNotFound();

        $this->postJson("/api/client/services/{$service->id}/password")->assertOk()->assertJsonPath('password', 'S3cret-pass');
        $this->assertTrue(ActivityLog::where('action', 'service.credentials.viewed_by_client')->where('subject_id', $service->id)->exists());
        $this->postJson("/api/client/services/{$theirs->id}/password")->assertNotFound();
    }
}
