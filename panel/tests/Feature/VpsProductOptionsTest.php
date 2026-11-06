<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\Server;
use App\Models\Service;
use App\Models\User;
use App\Provisioning\WebdockModule;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class VpsProductOptionsTest extends TestCase
{
    use RefreshDatabase;

    private ProductGroup $group;

    private Server $server;

    private Client $client;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Queue::fake();
        $this->group = ProductGroup::create(['name' => 'Cloud VPS', 'slug' => 'cloud-vps', 'is_visible' => true]);
        $this->server = Server::create(['name' => 'Webdock', 'module' => 'webdock', 'hostname' => 'api.webdock.io', 'credentials' => 'TOKEN']);
        $this->client = Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com', 'password' => 'correct-horse']);
    }

    private function vps(string $name, string $package, int $price, array $config = []): Product
    {
        $product = Product::create([
            'name' => $name, 'type' => 'vps', 'module' => 'webdock', 'module_package' => $package, 'product_group_id' => $this->group->id,
            'server_id' => $this->server->id, 'setup_mode' => 'payment', 'module_config' => $config ?: null,
        ]);
        $product->prices()->create(['cycle' => 'monthly', 'price' => $price]);

        return $product;
    }

    private function service(Product $product): Service
    {
        return Service::create([
            'client_id' => $this->client->id, 'product_id' => $product->id, 'server_id' => $this->server->id, 'remote_id' => 'rahimvps1',
            'cycle' => 'monthly', 'recurring_amount' => $product->prices->first()->price, 'status' => 'active', 'next_due_date' => today()->addDays(20),
            'credentials' => ['username' => 'rahim', 'password' => 'Secret-123', 'shell_ready' => true],
        ]);
    }

    private function login(): void
    {
        $this->postJson('/api/client/login', ['email' => 'rahim@example.com', 'password' => 'correct-horse'])->assertOk();
    }

    public function test_admin_saves_os_and_permission_settings_on_the_product(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        Http::fake(['api.webdock.io/v1/images' => Http::response([['slug' => 'ubuntu2404', 'name' => 'Ubuntu 24.04'], ['slug' => 'debian12', 'name' => 'Debian 12']])]);

        $this->actingAs($admin)->getJson('/api/products/images?module=webdock')->assertOk()->assertJsonPath('images.1.slug', 'debian12');

        $body = [
            'name' => 'VPS Small', 'type' => 'vps', 'module' => 'webdock', 'module_package' => 'dk/bit24', 'server_id' => $this->server->id,
            'prices' => [['cycle' => 'monthly', 'price' => 1000]],
            'module_config' => ['default_image' => 'debian12', 'images' => [['slug' => 'debian12', 'name' => 'Debian 12']], 'client_actions' => ['start', 'reboot'], 'client_upgrade' => false],
        ];
        $this->postJson('/api/products', [...$body, 'module_config' => [...$body['module_config'], 'client_actions' => ['format-disk']]])->assertJsonValidationErrors('module_config.client_actions.0');

        $id = $this->postJson('/api/products', $body)->assertCreated()->json('id');
        $config = Product::find($id)->vpsConfig();
        $this->assertSame('debian12', $config['default_image']);
        $this->assertSame(['start', 'reboot'], $config['client_actions']);
        $this->assertFalse($config['client_upgrade']);
    }

    public function test_customer_picks_an_offered_os_and_the_vps_is_built_with_it(): void
    {
        $product = $this->vps('VPS Small', 'dk/bit24', 1000, ['default_image' => 'ubuntu2404', 'images' => [['slug' => 'ubuntu2404', 'name' => 'Ubuntu 24.04'], ['slug' => 'debian12', 'name' => 'Debian 12']]]);
        $this->login();

        $store = collect($this->getJson('/api/client/store')->json())->firstWhere('slug', 'cloud-vps');
        $this->assertSame(['ubuntu2404', 'debian12'], array_column($store['products'][0]['os_choices'], 'slug'));

        $this->postJson('/api/client/orders', ['product_id' => $product->id, 'cycle' => 'monthly', 'vps_image' => 'windows'])->assertJsonValidationErrors('vps_image');
        $this->postJson('/api/client/orders', ['product_id' => $product->id, 'cycle' => 'monthly', 'vps_image' => 'debian12'])->assertCreated();

        $service = Service::where('product_id', $product->id)->latest('id')->first();
        $this->assertSame(['image' => 'debian12'], $service->module_options);

        Http::fake(['api.webdock.io/v1/servers' => Http::response(['slug' => 'vps'.$service->id])]);
        (new WebdockModule($this->server))->create($service->load('product'));
        Http::assertSent(fn (Request $r) => $r->url() === 'https://api.webdock.io/v1/servers' && $r['imageSlug'] === 'debian12' && $r['locationId'] === 'dk' && $r['profileSlug'] === 'bit24');
    }

    public function test_customers_only_get_the_actions_and_os_list_the_product_allows(): void
    {
        $product = $this->vps('VPS Small', 'dk/bit24', 1000, ['client_actions' => ['start', 'stop', 'reboot', 'reinstall'], 'images' => [['slug' => 'debian12', 'name' => 'Debian 12']]]);
        $service = $this->service($product);
        Http::fake([
            'api.webdock.io/v1/servers/rahimvps1/metrics/now' => Http::response([]),
            'api.webdock.io/v1/servers/rahimvps1' => Http::response(['slug' => 'rahimvps1', 'status' => 'running', 'ipv4' => '203.0.113.5', 'location' => 'dk', 'profile' => 'bit24']),
            'api.webdock.io/v1/images' => Http::response([['slug' => 'ubuntu2404', 'name' => 'Ubuntu 24.04'], ['slug' => 'debian12', 'name' => 'Debian 12']]),
            'api.webdock.io/v1/servers/rahimvps1/actions/reinstall' => Http::response(['ok' => true]),
        ]);
        $this->login();

        $this->getJson("/api/client/services/{$service->id}/vps")->assertOk()->assertJsonPath('actions', ['start', 'stop', 'reboot', 'reinstall']);
        $this->getJson("/api/client/services/{$service->id}")->assertJsonPath('vps_actions', ['start', 'stop', 'reboot', 'reinstall']);
        $this->getJson("/api/client/services/{$service->id}/vps/images")->assertOk()->assertJsonCount(1)->assertJsonPath('0.slug', 'debian12');

        $this->postJson("/api/client/services/{$service->id}/vps/console")->assertJsonValidationErrors('vps');
        $this->postJson("/api/client/services/{$service->id}/sso")->assertJsonValidationErrors('service');
        $this->postJson("/api/client/services/{$service->id}/change-password", ['password' => 'NewPass1234', 'password_confirmation' => 'NewPass1234'])->assertJsonValidationErrors('service');
        $this->postJson("/api/client/services/{$service->id}/vps/reinstall", ['image' => 'ubuntu2404'])->assertJsonValidationErrors('image');
        $this->postJson("/api/client/services/{$service->id}/vps/reinstall", ['image' => 'debian12'])->assertOk();
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/actions/reinstall') && $r['imageSlug'] === 'debian12');
    }

    public function test_vps_upgrades_go_up_within_the_data_centre_and_resize_when_paid(): void
    {
        $small = $this->vps('VPS Small', 'dk/bit24', 1000);
        $big = $this->vps('VPS Big', 'dk/bit48', 2000);
        $this->vps('VPS Tiny', 'dk/bit12', 500);
        $this->vps('VPS Big Finland', 'fi/bit48', 2000);
        $service = $this->service($small);
        $this->login();

        $this->getJson("/api/client/services/{$service->id}")->assertJsonPath('can_upgrade', true);
        $names = collect($this->getJson("/api/client/services/{$service->id}/upgrade")->json('products'))->pluck('name')->all();
        $this->assertSame(['VPS Big', 'VPS Small'], $names);

        $invoiceId = $this->postJson("/api/client/services/{$service->id}/upgrade", ['product_id' => $big->id, 'cycle' => 'monthly'])->assertOk()->json('invoice_id');

        Http::fake(['api.webdock.io/v1/servers/rahimvps1/actions/resize' => Http::response(['ok' => true])]);
        $invoice = \App\Models\Invoice::find($invoiceId);
        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX-1', (string) $invoice->total);

        $this->assertSame($big->id, $service->refresh()->product_id);
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/servers/rahimvps1/actions/resize') && $r['profileSlug'] === 'bit48');
    }

    public function test_upgrades_can_be_turned_off_per_product(): void
    {
        $small = $this->vps('VPS Small', 'dk/bit24', 1000, ['client_upgrade' => false]);
        $big = $this->vps('VPS Big', 'dk/bit48', 2000);
        $service = $this->service($small);
        $this->login();

        $this->getJson("/api/client/services/{$service->id}")->assertJsonPath('can_upgrade', false);
        $this->postJson("/api/client/services/{$service->id}/upgrade", ['product_id' => $big->id, 'cycle' => 'monthly'])->assertJsonValidationErrors('product_id');
    }
}
