<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Tld;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TldManagementTest extends TestCase
{
    use RefreshDatabase;

    private function tld(string $name, array $attributes = []): Tld
    {
        return Tld::create(['tld' => $name, 'register_price' => '1500.00', 'renew_price' => '1600.00', 'transfer_price' => '1400.00', ...$attributes]);
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        return $admin;
    }

    public function test_table_saves_order_switches_and_spotlight_limit(): void
    {
        $com = $this->tld('.com');
        $net = $this->tld('.net');
        $this->actingAs($this->admin());

        $this->putJson('/api/tlds', ['rows' => [
            ['id' => $net->id, 'registrar' => 'resellcube', 'epp_required' => false, 'is_spotlight' => true, 'is_active' => true],
            ['id' => $com->id, 'registrar' => null, 'epp_required' => true, 'is_spotlight' => false, 'is_active' => false],
        ]])->assertOk()
            ->assertJsonPath('0.tld', '.net')
            ->assertJsonPath('0.registrar', 'resellcube')
            ->assertJsonPath('0.is_spotlight', true)
            ->assertJsonPath('1.is_active', false);

        $many = collect(range(1, 9))->map(fn ($n) => ['id' => $this->tld(".t{$n}")->id, 'registrar' => null, 'epp_required' => true, 'is_spotlight' => true, 'is_active' => true]);
        $this->putJson('/api/tlds', ['rows' => $many->all()])->assertJsonValidationErrors('rows');
    }

    public function test_bulk_pricing_changes_only_the_given_prices_of_ticked_tlds(): void
    {
        $com = $this->tld('.com');
        $net = $this->tld('.net');
        $this->actingAs($this->admin());

        $this->postJson('/api/tlds/pricing', ['ids' => [$com->id]])->assertJsonValidationErrors('register_price');
        $this->postJson('/api/tlds/pricing', ['ids' => [$com->id], 'register_price' => '999', 'renew_price' => ''])->assertOk();

        $this->assertSame('999.00', $com->refresh()->register_price);
        $this->assertSame('1600.00', $com->renew_price);
        $this->assertSame('1500.00', $net->refresh()->register_price);
    }

    public function test_transfers_need_the_epp_code_when_the_tld_says_so(): void
    {
        $this->tld('.com');
        $this->tld('.bd', ['epp_required' => false]);
        $client = Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => 'correct-horse']);
        $this->postJson('/api/client/login', ['email' => 'mine@example.com', 'password' => 'correct-horse'])->assertOk();

        $this->getJson('/api/client/store/domains')->assertJsonPath('tlds.0.tld', '.bd')->assertJsonPath('tlds.0.epp_required', false)->assertJsonPath('tlds.1.epp_required', true);

        $this->postJson('/api/client/orders/domain', ['name' => 'mine.com', 'action' => 'transfer', 'years' => 1])->assertJsonValidationErrors('epp_code');
        $this->postJson('/api/client/orders/domain', ['name' => 'mine.com', 'action' => 'transfer', 'years' => 1, 'epp_code' => ' Ab#12 '])->assertCreated();
        $this->postJson('/api/client/orders/domain', ['name' => 'mine.bd', 'action' => 'transfer', 'years' => 1])->assertCreated();

        $domain = $client->domains()->where('name', 'mine.com')->sole();
        $this->assertSame('Ab#12', $domain->epp_code);
        $this->assertArrayNotHasKey('epp_code', $domain->toArray());

        $this->actingAs($this->admin(), 'web')->getJson("/api/domains/{$domain->id}")->assertJsonMissingPath('epp_code');
        $this->getJson("/api/domains/{$domain->id}/epp")->assertOk()->assertJsonPath('epp_code', 'Ab#12');
    }
}
