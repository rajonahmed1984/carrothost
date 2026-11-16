<?php

namespace Tests\Feature;

use App\Models\Registrar;
use App\Models\Tld;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PublicDomainTest extends TestCase
{
    use RefreshDatabase;

    public function test_tld_prices_are_public_and_skip_inactive_tlds(): void
    {
        Tld::create(['tld' => '.com', 'register_price' => '1500.00', 'renew_price' => '1600.00', 'transfer_price' => '1400.00', 'epp_required' => false]);
        Tld::create(['tld' => '.old', 'register_price' => '10.00', 'renew_price' => '10.00', 'transfer_price' => '10.00', 'epp_required' => false, 'is_active' => false]);

        $this->getJson('/api/public/domains/tlds')
            ->assertOk()
            ->assertJsonCount(1, 'tlds')
            ->assertJsonPath('tlds.0.tld', '.com')
            ->assertJsonPath('tlds.0.register_price', '1500.00');
    }

    public function test_lookup_is_public_and_validates_the_name(): void
    {
        Tld::create(['tld' => '.com', 'register_price' => '1500.00', 'renew_price' => '1600.00', 'transfer_price' => '1400.00', 'epp_required' => false]);

        // No lookup provider is configured, so the answer is unknown rather than an error.
        $this->getJson('/api/public/domains/lookup?name=example.com')->assertOk()->assertJsonPath('status', 'unknown');
        $this->getJson('/api/public/domains/lookup?name=nonsense')->assertStatus(422);
    }

    public function test_cors_allows_the_marketing_site(): void
    {
        $this->getJson('/api/public/domains/tlds', ['Origin' => 'https://carrothost.com'])
            ->assertHeader('Access-Control-Allow-Origin', 'https://carrothost.com');
    }

    public function test_an_extension_we_do_not_sell_is_reported_not_errored(): void
    {
        Tld::create(['tld' => '.com', 'register_price' => '1500.00', 'renew_price' => '1600.00', 'transfer_price' => '1400.00', 'epp_required' => false]);

        $this->getJson('/api/public/domains/lookup?name=example.xyz')->assertOk()->assertJsonPath('status', 'unsupported');
    }

    public function test_a_failing_premium_check_does_not_hide_an_available_name(): void
    {
        Tld::create(['tld' => '.com', 'register_price' => '1500.00', 'renew_price' => '1600.00', 'transfer_price' => '1400.00', 'epp_required' => false]);
        Registrar::create(['code' => 'stargate', 'reseller_id' => '123', 'api_key' => 'key']);
        Settings::save(['domain_lookup_provider' => 'stargate']);

        Http::fake(fn ($request) => str_contains($request->url(), 'premium-check')
            ? Http::response('not enabled', 500)
            : Http::response(['free.com' => ['classkey' => 'domcno', 'status' => 'available']]));

        $this->getJson('/api/public/domains/lookup?name=free.com')->assertOk()->assertJsonPath('status', 'available');
    }
}
