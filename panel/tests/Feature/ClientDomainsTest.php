<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Domain;
use App\Services\RenewalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientDomainsTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_sees_and_manages_only_their_own_domains(): void
    {
        $mine = Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => 'correct-horse']);
        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);
        $base = ['action' => 'register', 'recurring_amount' => '1600.00', 'status' => 'active', 'expires_at' => now()->addDays(10)];
        $domain = Domain::create([...$base, 'client_id' => $mine->id, 'name' => 'mine.com', 'nameservers' => ['ns1.carrothost.com', 'ns2.carrothost.com']]);
        $theirs = Domain::create([...$base, 'client_id' => $other->id, 'name' => 'theirs.com']);
        $this->postJson('/api/client/login', ['email' => 'mine@example.com', 'password' => 'correct-horse'])->assertOk();

        $this->getJson('/api/client/domains')->assertOk()->assertJsonCount(1)->assertJsonPath('0.name', 'mine.com')->assertDontSee('theirs.com');
        $this->getJson("/api/client/domains/{$domain->id}")->assertOk()->assertJsonPath('nameservers.1', 'ns2.carrothost.com')->assertJsonPath('expires_at', now()->addDays(10)->toDateString())->assertJsonMissingPath('epp_code');
        $this->getJson("/api/client/domains/{$theirs->id}")->assertNotFound();
        $this->putJson("/api/client/domains/{$theirs->id}", ['auto_renew' => false])->assertNotFound();

        $this->putJson("/api/client/domains/{$domain->id}", ['auto_renew' => false])->assertOk()->assertJsonPath('auto_renew', false);
        $this->assertSame(1, app(RenewalService::class)->generateInvoices(), 'Only the other client\'s domain is still renewing.');
        $this->assertNull($domain->refresh()->renewal_invoiced_for);
    }
}
