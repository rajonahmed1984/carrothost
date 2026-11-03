<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Registrar;
use App\Models\Tld;
use App\Models\User;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DomainLookupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Tld::create(['tld' => '.com', 'register_price' => '1500.00', 'renew_price' => '1600.00', 'transfer_price' => '1400.00', 'epp_required' => false]);
        Registrar::create(['code' => 'stargate', 'reseller_id' => '123', 'api_key' => 'key']);

        // free.com is available, taken.com is not, gold.com is available but premium, down.com errors.
        Http::fake(function (Request $request) {
            parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

            if (($query['domain-name'] ?? null) === 'down') {
                return Http::response('down', 500);
            }

            if (str_contains($request->url(), 'premium-check')) {
                return Http::response(['premium' => $query['domain-name'] === 'gold.com' ? 'true' : 'false']);
            }

            $domain = "{$query['domain-name']}.{$query['tlds']}";

            return Http::response([$domain => ['classkey' => 'domcno', 'status' => $domain === 'taken.com' ? 'regthroughothers' : 'available']]);
        });
    }

    private function signIn(): Client
    {
        $client = Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => 'correct-horse']);
        $this->postJson('/api/client/login', ['email' => 'mine@example.com', 'password' => 'correct-horse'])->assertOk();

        return $client;
    }

    public function test_admin_picks_a_configured_provider_and_premium_setting(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);

        $this->getJson('/api/tlds/lookup')->assertOk()->assertJsonPath('provider', null)->assertJsonCount(2, 'providers');
        $this->putJson('/api/tlds/lookup', ['provider' => 'resellcube', 'premium_enabled' => false])->assertJsonValidationErrors('provider');
        $this->putJson('/api/tlds/lookup', ['provider' => 'stargate', 'premium_enabled' => true])
            ->assertOk()
            ->assertJsonPath('provider', 'stargate')
            ->assertJsonPath('premium_enabled', true);

        $this->putJson('/api/tlds/lookup', ['provider' => null, 'premium_enabled' => true])->assertOk()->assertJsonPath('provider', null);
    }

    public function test_lookup_reports_each_status_and_blocks_bad_orders(): void
    {
        Settings::save(['domain_lookup_provider' => 'stargate', 'domain_premium_enabled' => true]);
        $this->signIn();

        $this->getJson('/api/client/store/domains')->assertJsonPath('lookup', true)->assertJsonPath('premium', true);
        $this->getJson('/api/client/store/domains/lookup?name=free.com')->assertOk()->assertJsonPath('status', 'available');
        $this->getJson('/api/client/store/domains/lookup?name=taken.com')->assertJsonPath('status', 'taken');
        $this->getJson('/api/client/store/domains/lookup?name=gold.com')->assertJsonPath('status', 'premium');
        $this->getJson('/api/client/store/domains/lookup?name=www.free.com')->assertJsonValidationErrors('name');

        $this->postJson('/api/client/orders/domain', ['name' => 'taken.com', 'action' => 'register', 'years' => 1])->assertJsonValidationErrors('name');
        $this->postJson('/api/client/orders/domain', ['name' => 'gold.com', 'action' => 'register', 'years' => 1])
            ->assertJsonPath('errors.name.0', 'gold.com is a premium domain. Open a ticket and we will quote its price.');
        $this->postJson('/api/client/orders/domain', ['name' => 'free.com', 'action' => 'transfer', 'years' => 1])->assertJsonValidationErrors('name');
        $this->postJson('/api/client/orders/domain', ['name' => 'taken.com', 'action' => 'transfer', 'years' => 1])->assertCreated();
        $this->postJson('/api/client/orders/domain', ['name' => 'free.com', 'action' => 'register', 'years' => 1])->assertCreated();
    }

    public function test_without_a_provider_or_when_the_registrar_fails_orders_go_through(): void
    {
        $this->signIn();
        $this->getJson('/api/client/store/domains/lookup?name=taken.com')->assertJsonPath('status', 'unknown');
        $this->postJson('/api/client/orders/domain', ['name' => 'taken.com', 'action' => 'register', 'years' => 1])->assertCreated();
        Http::assertNothingSent();

        Settings::save(['domain_lookup_provider' => 'stargate']);
        $this->getJson('/api/client/store/domains/lookup?name=down.com')->assertJsonPath('status', 'unknown');
        $this->postJson('/api/client/orders/domain', ['name' => 'down.com', 'action' => 'register', 'years' => 1])->assertCreated();
    }
}
