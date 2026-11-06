<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\Registrar;
use App\Models\RegistrarCharge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RegistrarLedgerTest extends TestCase
{
    use RefreshDatabase;

    private Client $client;

    protected function setUp(): void
    {
        parent::setUp();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);
        $this->client = Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        Registrar::create(['code' => 'stargate', 'currency' => 'USD', 'reseller_id' => '123', 'api_key' => 'key']);
    }

    private function domain(string $name): Domain
    {
        return Domain::create(['client_id' => $this->client->id, 'name' => $name, 'registrar' => 'stargate', 'action' => 'register', 'recurring_amount' => 1600, 'status' => 'active']);
    }

    private function sale(Domain $domain, string $amount, string $paidAt): void
    {
        $invoice = Invoice::create(['client_id' => $this->client->id, 'status' => 'paid', 'total' => $amount, 'due_date' => substr($paidAt, 0, 10), 'paid_at' => $paidAt, 'number' => 'INV-'.$domain->id]);
        $invoice->items()->create(['description' => "Renew {$domain->name}", 'amount' => $amount, 'kind' => 'renewal', 'domain_id' => $domain->id]);
    }

    public function test_charges_cost_what_the_oldest_deposits_cost_including_fees(): void
    {
        $one = $this->domain('one.com');
        $two = $this->domain('two.com');
        // $100 for 12,000 + 300 fee = 123/$; then $100 for 12,500 + 500 fee = 130/$.
        $this->postJson('/api/registrars/stargate/deposits', ['paid_on' => '2026-01-05', 'method' => 'card', 'amount_bdt' => 12000, 'fee_bdt' => 300, 'credited' => 100])->assertOk();
        $this->postJson('/api/registrars/stargate/deposits', ['paid_on' => '2026-02-05', 'method' => 'bank', 'amount_bdt' => 12500, 'fee_bdt' => 500, 'credited' => 100])->assertOk();

        $this->postJson('/api/registrars/stargate/charges', ['type' => 'debit', 'charged_at' => '2026-01-10', 'amount' => 90, 'domain_id' => $one->id, 'action' => 'renew'])->assertOk();
        // 10 left at 123, then 20 at 130 = 1230 + 2600.
        $book = $this->postJson('/api/registrars/stargate/charges', ['type' => 'debit', 'charged_at' => '2026-02-10', 'amount' => 30, 'domain_id' => $two->id, 'action' => 'renew'])->assertOk()->json();

        $this->assertSame([3830.0, 11070.0], array_map(fn ($c) => (float) $c['cost_bdt'], $book['charges']));
        $this->assertEquals(['credited' => 200, 'spent' => 120, 'balance' => 80, 'balance_bdt' => 10400, 'fees_bdt' => 800], array_intersect_key($book['wallet'], array_flip(['credited', 'spent', 'balance', 'balance_bdt', 'fees_bdt'])));

        $this->sale($one, '12000.00', '2026-01-09 10:00:00');
        $report = $this->getJson('/api/registrars/profit?from=2026-01&to=2026-02&registrar=stargate')->assertOk()->json();
        $this->assertEquals(['sales' => 12000, 'cost' => 11070, 'profit' => 930, 'estimated' => 0], $report['totals']['2026-01']);
        $this->assertEquals(-3830, $report['totals']['2026-02']['profit']);
        $this->assertSame('two.com', $report['checks']['done_not_paid'][0]['domain']);
        $this->assertSame([], $report['checks']['paid_not_done']);
        $this->assertSame('.com', $report['tlds'][0]['tld']);
    }

    public function test_sync_copies_charges_and_matches_domains(): void
    {
        $domain = $this->domain('example.com');
        $this->sale($domain, '1600.00', now()->subDays(20)->toDateTimeString());
        $paidNotDone = $this->domain('forgotten.com');
        $this->sale($paidNotDone, '1600.00', now()->subDays(10)->toDateTimeString());
        Http::fake(['httpapi.com/api/billing/reseller-transactions/search.json*' => Http::response([
            'recsonpage' => '3', 'recsindb' => '3',
            '1' => ['reseller_transaction.transactionid' => '901', 'reseller_transaction.transactiontype' => 'invoice', 'reseller_transaction.transactiondate' => (string) now()->subDays(19)->timestamp, 'reseller_transaction.description' => 'Renewal of example.com for 1 year', 'reseller_transaction.sellingamount' => '-11.50'],
            '2' => ['reseller_transaction.transactionid' => '902', 'reseller_transaction.transactiontype' => 'receipt', 'reseller_transaction.transactiondate' => (string) now()->subDays(30)->timestamp, 'reseller_transaction.description' => 'Funds added', 'reseller_transaction.sellingamount' => '200'],
            '3' => ['reseller_transaction.transactionid' => '903', 'reseller_transaction.transactiontype' => 'debit', 'reseller_transaction.transactiondate' => (string) now()->subDays(5)->timestamp, 'reseller_transaction.description' => 'Privacy service', 'reseller_transaction.sellingamount' => '2'],
        ]),
            'httpapi.com/api/billing/reseller-balance.json*' => Http::response(['sellingcurrencybalance' => '42.75', 'lockedbalance' => '0']),
            'httpapi.com/api/products/category-keys-mapping.json*' => Http::response(['domorder' => [['domcno' => ['com']]]]),
            // Our cost, nested one level down as some brands send it. The selling list must not be used.
            'httpapi.com/api/products/reseller-cost-price.json*' => Http::response(['DOMCNO' => ['pricing' => [
                'addnewdomain' => ['1' => '9.00'], 'renewdomain' => ['1' => '10.00'], 'addtransferdomain' => ['1' => '8.00'],
            ]]]),
            'httpapi.com/api/products/reseller-price.json*' => Http::response(['domcno' => ['addnewdomain' => ['1' => '99.00']]]),
        ]);

        $first = $this->postJson('/api/registrars/stargate/sync')->assertOk()->json('message');
        $this->assertStringStartsWith('Synced: 3 transaction(s) read, 2 new charge(s) added. 1 top-up(s) skipped', $first);
        $this->assertStringContainsString('TLD cost prices: 1 of 1 TLDs priced.', $first);
        $this->assertStringStartsWith('Synced: 3 transaction(s) read, 0 new charge(s) added.', $this->postJson('/api/registrars/stargate/sync')->json('message'));
        $this->assertSame('42.75', Registrar::where('code', 'stargate')->first()->api_balance);

        // An "invoice" is a charge even when the registrar signs it negative.
        $renewal = RegistrarCharge::where('external_id', '901')->first();
        $this->assertSame([$domain->id, 'renew', 'debit', '11.50'], [$renewal->domain_id, $renewal->action, $renewal->type, $renewal->amount]);

        $checks = $this->getJson('/api/registrars/profit?from='.now()->subMonths(2)->format('Y-m').'&to='.now()->format('Y-m'))->assertOk()->json('checks');
        $this->assertSame(['forgotten.com'], array_column($checks['paid_not_done'], 'domain'));
        $this->assertSame('Privacy service', $checks['unmatched'][0]['description']);

        // forgotten.com has no charge, so it is priced from the .com renew price, once a USD rate is known.
        $range = '/api/registrars/profit?from='.now()->subMonths(2)->format('Y-m').'&to='.now()->format('Y-m');
        $report = $this->getJson($range)->json();
        $this->assertSame([['registrar' => 'stargate', 'tld' => '.com', 'action' => 'renew', 'reason' => 'no_rate']], $report['unpriced']);

        \App\Support\Settings::save(['usd_rate' => '120']);
        $report = $this->getJson($range)->json();
        $this->assertSame([], $report['unpriced']);
        $this->assertEquals(1200, $report['grand']['estimated']);
        $byDomain = collect($report['domains'])->keyBy('domain');
        $this->assertEquals([1600, 1200, 400, 'estimated'], [$byDomain['forgotten.com']['sales'], $byDomain['forgotten.com']['cost'], $byDomain['forgotten.com']['profit'], $byDomain['forgotten.com']['cost_source']]);
        $this->assertSame('actual', $byDomain['example.com']['cost_source'], 'A synced charge replaces the estimate.');

        $synced = RegistrarCharge::where('external_id', '903')->first();
        $this->deleteJson("/api/registrars/stargate/charges/{$synced->id}")->assertJsonValidationErrors('charge');
        $this->putJson("/api/registrars/stargate/charges/{$synced->id}", ['domain_id' => $domain->id, 'action' => 'other', 'amount' => 999])->assertOk();
        $this->assertSame(['2.00', $domain->id], [$synced->fresh()->amount, $synced->fresh()->domain_id], 'A synced amount cannot be changed.');
    }

    public function test_tld_prices_fall_back_to_the_reseller_price_list_and_report_when_unreadable(): void
    {
        Http::preventStrayRequests();
        $tldSync = app(\App\Services\RegistrarTldSync::class);
        $registrar = Registrar::where('code', 'stargate')->first();
        $mapping = ['httpapi.com/api/products/category-keys-mapping.json*' => Http::response(['domorder' => [['dotnet' => ['net']]]])];

        // Neither list readable: nothing priced, and a sample goes to the log.
        \Illuminate\Support\Facades\Log::spy();
        Http::fake([...$mapping, 'httpapi.com/api/products/reseller-cost-price.json*' => Http::sequence()->push(['unexpected' => 'shape'])->push([]),
            'httpapi.com/api/products/reseller-price.json*' => Http::sequence()->push(['unexpected' => 'shape'])->push(['dotnet' => ['addnewdomain' => ['2' => '24.00']]])]);
        $result = $tldSync->sync($registrar);
        $this->assertSame([0, null], [$result['priced'], $result['source']]);
        \Illuminate\Support\Facades\Log::shouldHaveReceived('warning')->withArgs(fn ($message) => str_contains($message, 'no cost prices could be read'));

        // An empty cost list falls back to the reseller price list.
        $result = $tldSync->sync($registrar);
        $this->assertSame([1, 'reseller price'], [$result['priced'], $result['source']]);
        // Sold for 2 years at least: the cost per year.
        $this->assertSame('12.00', \App\Models\RegistrarTld::where('tld', '.net')->value('register_cost'));
    }

    public function test_a_blocked_registrar_reports_the_reason(): void
    {
        Http::fake(['httpapi.com/*' => Http::response('<html>Attention Required! | Cloudflare</html>', 403)]);

        $this->postJson('/api/registrars/stargate/sync')->assertJsonValidationErrors('registrar');
        $this->assertStringContainsString('blocking', (string) Registrar::where('code', 'stargate')->value('sync_error'));
    }
}
