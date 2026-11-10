<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\Registrar;
use App\Services\RenewalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ClientDomainManageTest extends TestCase
{
    use RefreshDatabase;

    private Client $client;

    private Domain $domain;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Registrar::create(['code' => 'resellcube', 'reseller_id' => '123', 'api_key' => 'key']);
        $this->client = Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com', 'password' => 'correct-horse', 'phone' => '+880.1711-210583', 'city' => 'Dhaka']);
        $this->domain = Domain::create([
            'client_id' => $this->client->id, 'name' => 'rahim.com', 'action' => 'register', 'registrar' => 'resellcube', 'registrar_order_id' => '555',
            'recurring_amount' => '1638.00', 'years' => 1, 'status' => 'active', 'expires_at' => today()->addDays(190), 'nameservers' => ['ns1.old.com', 'ns2.old.com'],
        ]);
        $this->loginClientWithCode('rahim@example.com', 'correct-horse');
    }

    private function fakeRegistrar(array $extra = []): void
    {
        Http::fake([
            'httpapi.com/api/domains/details.json*' => Http::response([
                'currentstatus' => 'Active', 'orderstatus' => ['transferlock'], 'endtime' => (string) today()->addDays(190)->timestamp,
                'ns1' => 'ns1.old.com', 'ns2' => 'ns2.old.com', 'isprivacyprotected' => 'false', 'privacyprotectedallowed' => 'true', 'domsecret' => 'EPP-123',
                'registrantcontact' => ['name' => 'Rahim', 'emailaddr' => 'rahim@example.com', 'country' => 'BD'],
            ]),
            'httpapi.com/api/domains/modify-ns.json' => Http::response(['actionstatus' => 'Success']),
            'httpapi.com/api/domains/disable-theft-protection.json' => Http::response(['actionstatus' => 'Success']),
            'httpapi.com/api/domains/modify-privacy-protection.json' => Http::response(['actionstatus' => 'Success']),
            'httpapi.com/api/dns/activate.json' => Http::response(['status' => 'Success']),
            'httpapi.com/api/dns/manage/search-records.json*' => fn (Request $r) => Http::response(str_contains($r->url(), 'type=A&') || str_ends_with($r->url(), 'type=A')
                ? ['recsonpage' => '1', 'recsindb' => '1', '1' => ['type' => 'A', 'host' => 'www', 'value' => '203.0.113.10', 'timetolive' => '14400', 'status' => 'Active']]
                : ['recsonpage' => '0', 'recsindb' => '0']),
            'httpapi.com/api/dns/manage/add-mx-record.json' => Http::response(['status' => 'Success']),
            'httpapi.com/api/dns/manage/delete-ipv4-record.json' => Http::response(['status' => 'Success']),
            ...$extra,
        ]);
    }

    public function test_live_status_nameservers_lock_and_privacy_go_to_the_registrar(): void
    {
        $this->fakeRegistrar();
        $id = $this->domain->id;

        $this->getJson("/api/client/domains/{$id}")->assertOk()->assertJsonPath('manageable', true)->assertJsonPath('can_renew', true);
        $this->getJson("/api/client/domains/{$id}/registrar")->assertOk()
            ->assertJsonPath('available', true)->assertJsonPath('locked', true)->assertJsonPath('privacy', false)
            ->assertJsonPath('contact.email', 'rahim@example.com')->assertJsonPath('contact_defaults.phone_cc', '880')
            ->assertDontSee('EPP-123');

        $this->putJson("/api/client/domains/{$id}/nameservers", ['nameservers' => ['ns1.new.com']])->assertJsonValidationErrors('nameservers');
        $this->putJson("/api/client/domains/{$id}/nameservers", ['nameservers' => ['NS1.New.com', 'ns2.new.com', '', 'bad host']])->assertJsonValidationErrors('nameservers.3');
        $this->putJson("/api/client/domains/{$id}/nameservers", ['nameservers' => ['NS1.New.com', 'ns2.new.com', '']])->assertOk()->assertJsonPath('nameservers', ['ns1.new.com', 'ns2.new.com']);
        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'modify-ns.json') && str_contains($r->body(), 'ns=ns1.new.com&ns=ns2.new.com'));

        $this->postJson("/api/client/domains/{$id}/lock", ['on' => false])->assertOk()->assertJsonPath('registrar_lock', false);
        $this->postJson("/api/client/domains/{$id}/privacy", ['on' => true])->assertOk()->assertJsonPath('id_protection', true);

        $this->postJson("/api/client/domains/{$id}/epp")->assertOk()->assertJsonPath('epp_code', 'EPP-123');
        $this->getJson("/api/client/domains/{$id}")->assertJsonPath('activity.0.title', 'EPP code viewed')->assertJsonPath('activity.0.by', 'You');
    }

    public function test_dns_records_are_listed_added_and_deleted(): void
    {
        $this->fakeRegistrar();
        $id = $this->domain->id;

        $this->getJson("/api/client/domains/{$id}/dns")->assertOk()->assertJsonCount(1, 'records')->assertJsonPath('records.0.host', 'www');
        $this->postJson("/api/client/domains/{$id}/dns", ['type' => 'A', 'host' => 'www', 'value' => 'not-an-ip'])->assertJsonValidationErrors('value');
        $this->postJson("/api/client/domains/{$id}/dns", ['type' => 'SRV', 'host' => 'x', 'value' => 'y'])->assertJsonValidationErrors('type');
        $this->postJson("/api/client/domains/{$id}/dns", ['type' => 'MX', 'host' => '@', 'value' => 'Mail.Rahim.com.', 'priority' => 5, 'ttl' => 3600])->assertOk();
        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'add-mx-record.json') && $r['value'] === 'mail.rahim.com' && $r['host'] === '' && $r['priority'] === '5' && $r['ttl'] === '3600');

        $this->postJson("/api/client/domains/{$id}/dns/delete", ['type' => 'A', 'host' => 'www', 'value' => '203.0.113.10'])->assertOk();
        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'delete-ipv4-record.json') && $r['host'] === 'www');
        $this->assertTrue(ActivityLog::where('action', 'domain.dns.added')->where('subject_id', $id)->exists());
    }

    public function test_renew_raises_one_invoice_that_the_daily_run_does_not_repeat(): void
    {
        $id = $this->domain->id;

        $invoiceId = $this->postJson("/api/client/domains/{$id}/renew")->assertOk()->json('invoice_id');
        $this->assertSame($invoiceId, $this->postJson("/api/client/domains/{$id}/renew")->json('invoice_id'), 'An unpaid renewal invoice is reused.');
        $this->assertSame('1638.00', Invoice::find($invoiceId)->total);
        $this->getJson("/api/client/domains/{$id}")->assertJsonPath('can_renew', false)->assertJsonPath('renewal_invoice.id', $invoiceId);

        $this->travelTo(today()->addDays(180));
        $this->assertSame(0, app(RenewalService::class)->generateInvoices());
    }

    public function test_pending_and_foreign_domains_are_kept_out(): void
    {
        Http::fake();
        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);
        $theirs = Domain::create(['client_id' => $other->id, 'name' => 'theirs.com', 'action' => 'register', 'registrar' => 'resellcube', 'recurring_amount' => 1, 'status' => 'active']);
        $transfer = Domain::create(['client_id' => $this->client->id, 'name' => 'moving.com', 'action' => 'transfer', 'registrar' => 'resellcube', 'recurring_amount' => 1, 'status' => 'pending']);

        $this->postJson("/api/client/domains/{$theirs->id}/lock", ['on' => false])->assertNotFound();
        $this->getJson("/api/client/domains/{$theirs->id}/dns")->assertNotFound();
        $this->getJson("/api/client/domains/{$transfer->id}/registrar")->assertOk()->assertJsonPath('available', false);
        $this->postJson("/api/client/domains/{$transfer->id}/epp")->assertJsonValidationErrors('registrar');
        $this->postJson("/api/client/domains/{$transfer->id}/renew")->assertJsonValidationErrors('domain');

        // A pending transfer takes the auth code and nameservers for later.
        $this->putJson("/api/client/domains/{$transfer->id}/auth-code", ['auth_code' => 'AUTH-9'])->assertOk()->assertJsonPath('has_auth_code', true)->assertJsonMissingPath('epp_code');
        $this->assertSame('AUTH-9', $transfer->refresh()->epp_code);
        $this->putJson("/api/client/domains/{$transfer->id}/nameservers", ['nameservers' => ['ns1.x.com', 'ns2.x.com']])->assertOk();
        $this->putJson("/api/client/domains/{$this->domain->id}/auth-code", ['auth_code' => 'AUTH-9'])->assertJsonValidationErrors('auth_code');
        Http::assertNothingSent();
    }
}
