<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Domain;
use App\Models\Gateway;
use App\Models\DomainReminder;
use App\Models\Tld;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDomainTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_edits_every_domain_field_and_sees_reminders(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $client = Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        $domain = Domain::create(['client_id' => $client->id, 'name' => 'acme.com', 'action' => 'register', 'recurring_amount' => '1600.00', 'status' => 'active', 'expires_at' => '2027-02-16']);
        DomainReminder::create(['domain_id' => $domain->id, 'type' => 1, 'recipients' => 'acme@example.com', 'days_before_expiry' => 30, 'sent_on' => '2027-01-17']);
        Tld::create(['tld' => '.com', 'register_price' => 1500, 'renew_price' => 1700, 'transfer_price' => 1500]);
        Gateway::create(['code' => 'bkash', 'is_enabled' => true, 'config' => []]);
        $this->actingAs($admin);

        $this->getJson("/api/domains/{$domain->id}")->assertOk()
            ->assertJsonPath('registered_at', today()->toDateString())
            ->assertJsonPath('reminders.0.days_before_expiry', 30)
            ->assertJsonPath('client_domains.0.name', 'acme.com')
            ->assertJsonMissingPath('epp_code');

        $this->putJson("/api/domains/{$domain->id}", [
            'auto_renew' => false, 'nameservers' => ['ns1.example.com', 'ns2.example.com'],
            'years' => 2, 'recalculate' => true, 'first_payment_amount' => '1500', 'next_due_date' => '2027-02-01',
            'payment_method' => 'bkash', 'status' => 'grace', 'registrar' => 'resellcube', 'registrar_lock' => false, 'id_protection' => true,
        ])->assertOk()
            ->assertJsonPath('recurring_amount', '3400.00')
            ->assertJsonPath('next_due_date', '2027-02-01')
            ->assertJsonPath('expires_at', '2027-02-16')
            ->assertJsonPath('status', 'grace')
            ->assertJsonPath('registrar_lock', false)
            ->assertJsonPath('id_protection', true)
            ->assertJsonPath('nameservers.1', 'ns2.example.com');

        $this->putJson("/api/domains/{$domain->id}", ['auto_renew' => false, 'status' => 'stolen', 'payment_method' => 'nope'])
            ->assertJsonValidationErrors(['status', 'payment_method']);
    }
}
