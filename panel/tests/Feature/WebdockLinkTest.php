<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Product;
use App\Models\Server;
use App\Models\Service;
use App\Models\User;
use App\Provisioning\WebdockModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WebdockLinkTest extends TestCase
{
    use RefreshDatabase;

    private Server $account;

    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);

        $this->account = Server::create(['name' => 'Webdock', 'module' => 'webdock', 'hostname' => 'api.webdock.io', 'credentials' => 'TOKEN']);
        $product = Product::create(['name' => 'AMD Epyc Custom Profile', 'type' => 'vps', 'module' => 'webdock', 'module_package' => 'dk/epyc']);
        $client = Client::create(['name' => 'Md. Reajul Islam FCA', 'email' => 'reajul@example.com', 'password' => 'correct-horse']);
        $this->service = Service::create([
            'client_id' => $client->id, 'product_id' => $product->id, 'domain' => 'acnabin.carrothost.com', 'cycle' => 'monthly',
            'recurring_amount' => 5800, 'status' => 'active', 'next_due_date' => today()->addDays(20),
        ]);
    }

    public function test_pasted_domains_and_links_become_the_slug(): void
    {
        $this->assertSame('acnabin1', WebdockModule::normalizeSlug('acnabin1.vps.webdock.cloud'));
        $this->assertSame('acnabin1', WebdockModule::normalizeSlug('https://webdock.io/en/dash/server/acnabin1'));
        $this->assertSame('acnabin1', WebdockModule::normalizeSlug(' ACNABIN1 '));
    }

    public function test_saving_a_pasted_domain_links_the_vps_to_the_only_webdock_account(): void
    {
        $this->putJson("/api/services/{$this->service->id}", ['remote_id' => 'acnabin1.vps.webdock.cloud', 'username' => 'fida02'])->assertOk();

        $this->service->refresh();
        $this->assertSame('acnabin1', $this->service->remote_id);
        $this->assertSame($this->account->id, $this->service->server_id);
        $this->assertSame('fida02', $this->service->credentials['username']);

        // With two accounts the admin must say which one.
        $other = Service::create([...$this->service->only('client_id', 'product_id', 'cycle', 'recurring_amount', 'status')]);
        Server::create(['name' => 'Webdock 2', 'module' => 'webdock', 'hostname' => 'api.webdock.io', 'credentials' => 'TOKEN2']);
        $this->putJson("/api/services/{$other->id}", ['remote_id' => 'other1'])->assertJsonValidationErrors('server_id');
    }

    public function test_the_picker_lists_account_servers_and_their_shell_users(): void
    {
        Service::create([...$this->service->only('client_id', 'product_id', 'cycle', 'recurring_amount', 'status'), 'server_id' => $this->account->id, 'remote_id' => 'taken1']);
        Http::fake([
            'api.webdock.io/v1/servers' => Http::response([
                ['slug' => 'acnabin1', 'name' => 'acnabin', 'status' => 'running', 'ipv4' => '92.113.149.230', 'location' => 'dk', 'profile' => 'epyc', 'image' => 'debian12', 'aliases' => ['acnabin.carrothost.com', 'acnabin1.vps.webdock.cloud']],
                ['slug' => 'taken1', 'name' => 'Another', 'status' => 'stopped', 'ipv4' => '92.113.149.1'],
            ]),
            'api.webdock.io/v1/servers/acnabin1/shellUsers' => Http::response([['id' => 7, 'username' => 'fida02', 'group' => 'sudo']]),
        ]);

        $servers = $this->getJson("/api/services/{$this->service->id}/webdock/servers")->assertOk()->assertJsonPath('account.id', $this->account->id)->json('servers');
        $this->assertSame('acnabin1', $servers[0]['slug']);
        $this->assertNull($servers[0]['linked_to']);
        $this->assertNotNull($servers[1]['linked_to']);

        $this->getJson("/api/services/{$this->service->id}/webdock/servers/acnabin1/users")->assertOk()->assertJsonPath('users.0.username', 'fida02');
    }

    public function test_the_customer_sees_the_vps_itself_once_linked(): void
    {
        $this->putJson("/api/services/{$this->service->id}", ['remote_id' => 'acnabin1', 'dedicated_ip' => '92.113.149.230', 'username' => 'fida02'])->assertOk();
        auth('web')->logout();
        $this->loginClientWithCode('reajul@example.com', 'correct-horse');

        $this->getJson("/api/client/services/{$this->service->id}")->assertOk()
            ->assertJsonPath('is_vps', true)
            ->assertJsonPath('server_ip', '92.113.149.230')
            ->assertJsonPath('server.hostname', 'acnabin.carrothost.com')
            ->assertJsonPath('nameservers', []);
    }
}
