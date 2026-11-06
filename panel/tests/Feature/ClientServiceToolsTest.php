<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\Server;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ClientServiceToolsTest extends TestCase
{
    use RefreshDatabase;

    private Client $client;

    private ProductGroup $group;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->group = ProductGroup::create(['name' => 'Shared Hosting', 'slug' => 'shared-hosting']);
        $this->client = Client::create(['name' => 'Acme', 'email' => 'acme@example.com', 'password' => 'correct-horse']);
        $this->postJson('/api/client/login', ['email' => 'acme@example.com', 'password' => 'correct-horse'])->assertOk();
    }

    private function product(string $name, string $module, int $price, array $extra = []): Product
    {
        $product = Product::create(['name' => $name, 'type' => 'shared_hosting', 'module' => $module, 'module_package' => strtolower($name), 'product_group_id' => $this->group->id, ...$extra]);
        $product->prices()->create(['cycle' => 'annually', 'price' => $price]);

        return $product;
    }

    private function service(Product $product, Server $server, array $extra = []): Service
    {
        return Service::create([
            'client_id' => $this->client->id, 'product_id' => $product->id, 'server_id' => $server->id, 'remote_id' => 'acmeuser', 'domain' => 'acme.com',
            'cycle' => 'annually', 'recurring_amount' => 3650, 'status' => 'active', 'next_due_date' => today()->addDays(100),
            'credentials' => ['username' => 'acmeuser', 'password' => 'Old-pass-1'], ...$extra,
        ]);
    }

    private function webuzo(): Server
    {
        Http::fake([
            'earth.test:2005/*act=users*' => Http::response(['users' => ['acmeuser' => ['user' => 'acmeuser', 'domain' => 'acme.com', 'email' => 'a@b.c', 'resource' => [
                'disk' => ['label' => 'Disk Usage', 'used' => '695 MiB', 'limit' => '5 GiB', 'percent' => 13.57, 'used_bytes' => 728707072, 'limit_bytes' => 5368709120],
                'bandwidth' => ['label' => 'Bandwidth Usage', 'used' => '396 MiB', 'limit' => '244 GiB', 'percent' => 0.16, 'used_bytes' => 414819163, 'limit_bytes' => 262144000000],
            ]]]]),
            'earth.test:2003/*act=sso*' => Http::response(['done' => ['url' => 'https://earth.test:2003/sess1/?as=token']]),
            'earth.test:2003/*act=changepassword*' => Http::response(['done' => true]),
        ]);

        return Server::create(['name' => 'Earth', 'module' => 'webuzo', 'hostname' => 'earth.test', 'port' => 2005, 'username' => 'root', 'credentials' => 'key']);
    }

    public function test_a_webuzo_customer_signs_in_refreshes_usage_and_changes_the_password(): void
    {
        $service = $this->service($this->product('Starter', 'webuzo', 3650), $this->webuzo());

        $this->getJson("/api/client/services/{$service->id}")->assertOk()
            ->assertJsonPath('has_tools', true)
            ->assertJsonPath('panel_apps', [])
            ->assertJsonPath('server.hostname', 'earth.test')
            ->assertJsonPath('panel_url', 'https://earth.test:2003');

        // The list's Quick Action signs in the same way instead of opening the login page.
        $this->getJson('/api/client/services')->assertOk()->assertJsonPath('0.can_sso', true);
        $this->postJson("/api/client/services/{$service->id}/sso")->assertOk()->assertJsonPath('url', 'https://earth.test:2003/sess1/?as=token');
        // Webuzo has no deep links, so asking for one is refused.
        $this->postJson("/api/client/services/{$service->id}/sso", ['app' => 'email'])->assertJsonValidationErrors('app');

        $this->postJson("/api/client/services/{$service->id}/usage")->assertOk()
            ->assertJsonPath('usage.disk_used', 695)->assertJsonPath('usage.disk_limit', 5120)->assertJsonPath('usage.metrics.0.label', 'Disk Usage');

        $this->postJson("/api/client/services/{$service->id}/change-password", ['password' => 'weakpass12', 'password_confirmation' => 'weakpass12'])->assertJsonValidationErrors('password');
        $this->postJson("/api/client/services/{$service->id}/change-password", ['password' => 'NewPass1234', 'password_confirmation' => 'Other1234x'])->assertJsonValidationErrors('password');
        $this->postJson("/api/client/services/{$service->id}/change-password", ['password' => 'NewPass1234', 'password_confirmation' => 'NewPass1234'])->assertOk()
            ->assertJsonPath('activity.0.title', 'Account password changed')
            ->assertJsonPath('activity.0.by', 'You')
            ->assertJsonPath('activity.1.title', 'Signed in to the control panel')
            ->assertDontSee('NewPass1234');
        $this->assertSame('NewPass1234', $service->refresh()->credentials['password']);
        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'loginAs=acmeuser') && str_contains($r->url(), 'act=changepassword') && $r['newpass'] === 'NewPass1234');
    }

    public function test_cpanel_logins_can_open_email_and_databases(): void
    {
        Http::fake(['whm.test:2087/json-api/create_user_session*' => Http::response(['metadata' => ['result' => 1], 'data' => ['url' => 'https://whm.test:2083/cpsess1/login/?session=x']])]);
        $server = Server::create(['name' => 'WHM', 'module' => 'cpanel', 'hostname' => 'whm.test', 'username' => 'root', 'credentials' => 'TOKEN']);
        $service = $this->service($this->product('Standard', 'cpanel', 7000), $server);

        $this->getJson("/api/client/services/{$service->id}")->assertJsonPath('panel_apps', ['email', 'databases', 'files', 'backups']);
        $this->postJson("/api/client/services/{$service->id}/sso", ['app' => 'databases'])->assertOk()->assertJsonPath('url', 'https://whm.test:2083/cpsess1/login/?session=x');
        $this->postJson("/api/client/services/{$service->id}/sso", ['app' => 'shell'])->assertJsonValidationErrors('app');

        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'create_user_session') && str_contains($r->url(), 'app=Database_MySQL') && str_contains($r->url(), 'user=acmeuser'));
    }

    public function test_tools_need_a_live_account_of_your_own(): void
    {
        $server = $this->webuzo();
        $product = $this->product('Starter', 'webuzo', 3650);
        $pending = $this->service($product, $server, ['status' => 'pending', 'remote_id' => null]);
        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);
        $theirs = $this->service($product, $server, ['client_id' => $other->id]);

        $this->getJson("/api/client/services/{$pending->id}")->assertJsonPath('has_tools', false)->assertJsonPath('server', null);
        $this->postJson("/api/client/services/{$pending->id}/sso")->assertJsonValidationErrors('service');
        $this->postJson("/api/client/services/{$theirs->id}/sso")->assertNotFound();
        $this->postJson("/api/client/services/{$theirs->id}/change-password", ['password' => 'NewPass1234', 'password_confirmation' => 'NewPass1234'])->assertNotFound();
        Http::assertNothingSent();
    }

    public function test_customers_upgrade_only_to_active_plans_in_the_same_category_and_panel(): void
    {
        $server = $this->webuzo();
        $starter = $this->product('Starter', 'webuzo', 3650);
        $standard = $this->product('Standard', 'webuzo', 7300);
        $this->product('Retired', 'webuzo', 9000, ['is_active' => false]);
        $this->product('Cpanel Pro', 'cpanel', 9000);
        $elsewhere = Product::create(['name' => 'Other Group', 'type' => 'shared_hosting', 'module' => 'webuzo']);
        $elsewhere->prices()->create(['cycle' => 'annually', 'price' => 100]);
        $service = $this->service($starter, $server);

        $this->getJson("/api/client/services/{$service->id}")->assertJsonPath('can_upgrade', true);
        $options = $this->getJson("/api/client/services/{$service->id}/upgrade?product_id={$standard->id}&cycle=annually")->assertOk();
        $this->assertSame(['Standard', 'Starter'], collect($options->json('products'))->pluck('name')->all());
        $this->assertNotNull($options->json('quote.amount_due'));

        $this->postJson("/api/client/services/{$service->id}/upgrade", ['product_id' => $elsewhere->id, 'cycle' => 'annually'])->assertJsonValidationErrors('product_id');

        $invoiceId = $this->postJson("/api/client/services/{$service->id}/upgrade", ['product_id' => $standard->id, 'cycle' => 'annually'])->assertOk()->json('invoice_id');
        $this->assertNotNull($invoiceId);
        $this->getJson("/api/client/services/{$service->id}")
            ->assertJsonPath('can_upgrade', false)
            ->assertJsonPath('pending_upgrade.invoice_id', $invoiceId)
            ->assertJsonPath('pending_upgrade.new_product', 'Standard');
        $this->assertTrue(ActivityLog::where('action', 'service.upgrade.requested')->where('subject_id', $service->id)->exists());
    }
}
