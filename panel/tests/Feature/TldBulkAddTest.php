<?php

namespace Tests\Feature;

use App\Models\Registrar;
use App\Models\RegistrarTld;
use App\Models\Tld;
use App\Models\User;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TldBulkAddTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);
    }

    public function test_fixed_prices_add_every_new_tld_and_skip_the_rest(): void
    {
        Tld::create(['tld' => '.com', 'register_price' => 1500, 'renew_price' => 1700, 'transfer_price' => 1500]);

        $result = $this->postJson('/api/tlds/bulk-add', [
            'tlds' => ['.NET', 'xyz', ' .com.bd ', '.com', 'bad tld!', 'xyz'],
            'mode' => 'fixed', 'register_price' => 1200, 'renew_price' => 1400, 'transfer_price' => 1200,
            'registrar' => 'stargate', 'epp_required' => false,
        ])->assertOk()->json();

        $this->assertSame(['.net', '.xyz', '.com.bd'], $result['added']);
        $this->assertSame(['.com'], $result['skipped']);
        $this->assertSame(['bad tld!'], $result['invalid']);
        $this->assertSame('1700.00', (string) Tld::where('tld', '.com')->value('renew_price'), 'An existing TLD keeps its prices.');

        $net = Tld::where('tld', '.net')->first();
        $this->assertSame(['1200.00', '1400.00', 'stargate', false, true], [(string) $net->register_price, (string) $net->renew_price, $net->registrar, $net->epp_required, $net->is_active]);
        $this->assertSame(Tld::max('sort_order'), Tld::where('tld', '.com.bd')->value('sort_order'), 'New TLDs go to the end, in the order given.');
    }

    public function test_markup_prices_each_tld_from_the_registrar_cost(): void
    {
        Settings::save(['usd_rate' => '120']);
        Registrar::create(['code' => 'stargate', 'currency' => 'USD', 'reseller_id' => '1', 'api_key' => 'k']);
        RegistrarTld::create(['registrar_code' => 'stargate', 'tld' => '.net', 'currency' => 'USD', 'register_cost' => '10.00', 'renew_cost' => '12.00', 'transfer_cost' => null]);

        $result = $this->postJson('/api/tlds/bulk-add', ['tlds' => ['.net', '.io'], 'mode' => 'markup', 'registrar' => 'stargate', 'markup_percent' => 25, 'round_to' => 10])->assertOk()->json();

        // 10 x 120 x 1.25 = 1500; 12 x 120 x 1.25 = 1800; no transfer cost falls back to register.
        $net = Tld::where('tld', '.net')->first();
        $this->assertSame(['1500.00', '1800.00', '1500.00'], [(string) $net->register_price, (string) $net->renew_price, (string) $net->transfer_price]);
        $this->assertSame(['.io'], $result['no_cost']);
        $this->assertFalse(Tld::where('tld', '.io')->exists());
    }

    public function test_markup_rounds_up_and_needs_a_registrar_and_rate(): void
    {
        $this->postJson('/api/tlds/bulk-add', ['tlds' => ['.net'], 'mode' => 'markup', 'markup_percent' => 10])->assertJsonValidationErrors('registrar');

        Registrar::create(['code' => 'stargate', 'currency' => 'USD', 'reseller_id' => '1', 'api_key' => 'k']);
        RegistrarTld::create(['registrar_code' => 'stargate', 'tld' => '.net', 'currency' => 'USD', 'register_cost' => '9.99', 'renew_cost' => '9.99', 'transfer_cost' => '9.99']);
        $this->postJson('/api/tlds/bulk-add', ['tlds' => ['.net'], 'mode' => 'markup', 'registrar' => 'stargate', 'markup_percent' => 10])->assertJsonValidationErrors('markup_percent');

        Settings::save(['usd_rate' => '121']);
        $this->postJson('/api/tlds/bulk-add', ['tlds' => ['.net'], 'mode' => 'markup', 'registrar' => 'stargate', 'markup_percent' => 10, 'round_to' => 50])->assertOk();
        // 9.99 x 121 x 1.1 = 1329.67, up to the next 50.
        $this->assertSame('1350.00', (string) Tld::where('tld', '.net')->value('register_price'));
    }
}
