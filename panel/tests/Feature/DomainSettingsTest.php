<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\ProductGroup;
use App\Models\Tld;
use App\Models\User;
use App\Services\RenewalService;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DomainSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Tld::create(['tld' => '.com', 'register_price' => '1500.00', 'renew_price' => '1600.00', 'transfer_price' => '1400.00']);
    }

    private function signIn(): Client
    {
        $client = Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => 'correct-horse']);
        $this->loginClientWithCode('mine@example.com', 'correct-horse');

        return $client;
    }

    public function test_admin_saves_domain_settings_and_customers_see_them(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        $this->actingAs($admin)->postJson('/api/settings', [
            'company_name' => 'Carrot', 'time_zone' => 'UTC', 'currency' => 'BDT', 'invoice_due_days' => 0, 'renewal_notice_days' => 14,
            'suspend_after_days' => 3, 'ticket_auto_close_days' => 0,
            'domain_allow_register' => '1', 'domain_allow_transfer' => '0', 'domain_allow_own' => '1', 'domain_auto_renew' => '0',
            'nameserver_1' => 'NS1.Carrothost.com', 'nameserver_2' => 'ns2.carrothost.com', 'nameserver_3' => '',
        ])->assertOk()
            ->assertJsonPath('settings.domain_allow_transfer', false)
            ->assertJsonPath('settings.nameserver_1', 'ns1.carrothost.com')
            ->assertJsonPath('settings.nameserver_3', null);

        $this->postJson('/api/settings', ['company_name' => 'Carrot', 'nameserver_1' => 'not a host'])->assertJsonValidationErrors('nameserver_1');

        $this->signIn();
        $this->getJson('/api/client/store/domains')
            ->assertOk()
            ->assertJsonPath('register', true)
            ->assertJsonPath('transfer', false)
            ->assertJsonPath('nameservers', ['ns1.carrothost.com', 'ns2.carrothost.com'])
            ->assertJsonPath('tlds.0.tld', '.com');
    }

    public function test_customer_orders_a_domain_with_the_defaults(): void
    {
        Settings::save(['domain_auto_renew' => false, 'nameserver_1' => 'ns1.carrothost.com', 'nameserver_2' => 'ns2.carrothost.com']);
        $client = $this->signIn();

        $id = $this->postJson('/api/client/orders/domain', ['name' => 'Example.com', 'action' => 'register', 'years' => 2])->assertCreated()->json('invoice_id');

        $this->assertSame('3000.00', Invoice::find($id)->total);
        $domain = $client->domains()->sole();
        $this->assertSame('example.com', $domain->name);
        $this->assertFalse($domain->auto_renew);
        $this->assertSame(['ns1.carrothost.com', 'ns2.carrothost.com'], $domain->nameservers);

        Settings::save(['domain_allow_transfer' => false]);
        $this->postJson('/api/client/orders/domain', ['name' => 'other.com', 'action' => 'transfer', 'years' => 1])->assertJsonValidationErrors('action');
    }

    public function test_hosting_order_can_register_its_domain_when_allowed(): void
    {
        $product = ProductGroup::create(['name' => 'Shared', 'slug' => 'shared'])->products()->create(['name' => 'Starter', 'type' => 'shared_hosting']);
        $product->prices()->create(['cycle' => 'annually', 'price' => '4200.00']);
        $client = $this->signIn();

        $id = $this->postJson('/api/client/orders', ['product_id' => $product->id, 'cycle' => 'annually', 'domain' => 'shop.com', 'domain_action' => 'register'])
            ->assertCreated()->json('invoice_id');
        $this->assertSame('5700.00', Invoice::find($id)->total);
        $this->assertSame('shop.com', $client->domains()->sole()->name);

        Settings::save(['domain_allow_own' => false]);
        $this->postJson('/api/client/orders', ['product_id' => $product->id, 'cycle' => 'annually', 'domain' => 'mine.com'])
            ->assertJsonValidationErrors('domain_action');
    }

    public function test_domains_set_not_to_renew_get_no_renewal_invoice(): void
    {
        $client = Client::create(['name' => 'A', 'email' => 'a@example.com']);
        $base = ['client_id' => $client->id, 'action' => 'register', 'recurring_amount' => '1600.00', 'status' => 'active', 'expires_at' => now()->addDays(5)];
        $renewing = Domain::create([...$base, 'name' => 'keep.com']);
        $lapsing = Domain::create([...$base, 'name' => 'drop.com', 'auto_renew' => false]);

        $this->assertSame(1, app(RenewalService::class)->generateInvoices());
        $this->assertNotNull($renewing->refresh()->renewal_invoiced_for);
        $this->assertNull($lapsing->refresh()->renewal_invoiced_for);

        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin)->putJson("/api/domains/{$lapsing->id}", ['auto_renew' => true, 'nameservers' => ['NS1.Example.net', '', 'ns2.example.net']])
            ->assertOk()
            ->assertJsonPath('auto_renew', true)
            ->assertJsonPath('nameservers', ['ns1.example.net', 'ns2.example.net']);
    }
}
