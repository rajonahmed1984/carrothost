<?php

namespace Tests\Feature;

use App\Mail\CustomerNotice;
use App\Models\Client;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Service;
use App\Models\User;
use App\Services\BillingService;
use App\Services\CreditService;
use App\Services\RenewalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminRecordInvoiceTest extends TestCase
{
    use RefreshDatabase;

    private Client $client;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);
        $this->client = Client::create(['name' => 'Saiful Islam', 'email' => 'saiful@example.com']);
    }

    private function domain(array $overrides = []): Domain
    {
        return Domain::create(['client_id' => $this->client->id, 'name' => 'theteesta.com', 'action' => 'register', 'years' => 1, 'recurring_amount' => '1600.00', 'status' => 'active', 'expires_at' => '2027-07-16', ...$overrides]);
    }

    private function service(array $overrides = []): Service
    {
        $product = Product::create(['name' => 'Starter', 'type' => 'shared_hosting']);

        return Service::create(['client_id' => $this->client->id, 'product_id' => $product->id, 'domain' => 'acme.com', 'cycle' => 'annually', 'recurring_amount' => '4200.00', 'status' => 'active', 'next_due_date' => '2027-01-10', ...$overrides]);
    }

    public function test_renewal_invoice_for_a_domain_shows_the_term_and_blocks_a_second_one(): void
    {
        $domain = $this->domain();

        $invoice = $this->postJson('/api/invoices/from-records', ['domains' => [$domain->id], 'mode' => 'renewal'])
            ->assertCreated()
            ->assertJsonPath('items.0.description', 'Domain renewal: theteesta.com (1 yr) (16/07/2027 - 15/07/2028)')
            ->assertJsonPath('items.0.period_start', '2027-07-16')
            ->assertJsonPath('items.0.period_end', '2028-07-15')
            ->assertJsonPath('items.0.record_only', false)
            ->assertJsonPath('total', '1600.00')
            ->json();

        $this->assertSame('2027-07-16', $domain->fresh()->renewal_invoiced_for->toDateString());
        Mail::assertSent(CustomerNotice::class);

        $this->postJson('/api/invoices/from-records', ['domains' => [$domain->id], 'mode' => 'renewal'])
            ->assertStatus(422)->assertJsonValidationErrors('records');
        $this->assertSame(1, Invoice::count());

        // Paying it renews the domain once, as before.
        app(BillingService::class)->recordPayment(Invoice::find($invoice['id']), 'bkash', 'TX1', '1600.00');
        $this->assertSame('2028-07-16', $domain->fresh()->expires_at->toDateString());
    }

    public function test_invoice_for_a_renewal_already_done_by_hand_does_not_move_the_date_again(): void
    {
        // The domain was renewed in the panel: it now expires 16/07/2027, the term just paid ran 16/07/2026 - 15/07/2027.
        $domain = $this->domain();
        app(CreditService::class)->add($this->client, '5000.00', 'Goodwill');

        $invoice = $this->postJson('/api/invoices/from-records', ['domains' => [$domain->id], 'mode' => 'already_renewed'])
            ->assertCreated()
            ->assertJsonPath('items.0.description', 'Domain renewal: theteesta.com (1 yr) (16/07/2026 - 15/07/2027)')
            ->assertJsonPath('items.0.record_only', true)
            ->json();

        // Quiet by default, and credit does not pay it behind the admin's back.
        Mail::assertNothingSent();
        $this->assertSame('unpaid', Invoice::find($invoice['id'])->status);
        $this->assertSame('5000.00', $this->client->fresh()->credit_balance);
        $this->assertNull($domain->fresh()->renewal_invoiced_for);

        app(BillingService::class)->recordPayment(Invoice::find($invoice['id']), 'bkash', 'TX2', '1600.00');
        $this->assertSame('paid', Invoice::find($invoice['id'])->status);
        $this->assertSame('2027-07-16', $domain->fresh()->expires_at->toDateString(), 'paying a record-only line must not renew again');
        $this->assertSame('bkash', $domain->fresh()->payment_method);

        $this->postJson('/api/invoices/from-records', ['domains' => [$domain->id], 'mode' => 'already_renewed'])->assertStatus(422);
    }

    public function test_services_and_domains_go_on_one_invoice_and_a_service_period_follows_its_cycle(): void
    {
        $service = $this->service(['cycle' => 'quarterly', 'recurring_amount' => '1000.00', 'next_due_date' => '2027-01-31']);
        $domain = $this->domain(['years' => 2, 'recurring_amount' => '3200.00']);

        $this->postJson('/api/invoices/from-records', ['services' => [$service->id], 'domains' => [$domain->id], 'mode' => 'renewal', 'due_date' => '2027-02-01', 'notify' => false])
            ->assertCreated()
            ->assertJsonPath('total', '4200.00')
            ->assertJsonPath('due_date', '2027-02-01')
            ->assertJsonPath('items.0.description', 'Renewal: Starter - acme.com (31/01/2027 - 29/04/2027)')
            ->assertJsonPath('items.1.description', 'Domain renewal: theteesta.com (2 yr) (16/07/2027 - 15/07/2029)');
        Mail::assertNothingSent();
    }

    public function test_one_record_can_have_its_own_period(): void
    {
        $domain = $this->domain();

        $this->postJson('/api/invoices/from-records', ['domains' => [$domain->id], 'mode' => 'already_renewed', 'period_start' => '2026-07-16', 'period_end' => '2027-07-15'])
            ->assertCreated()->assertJsonPath('items.0.period_start', '2026-07-16');
        $this->postJson('/api/invoices/from-records', ['domains' => [$this->domain(['name' => 'other.com'])->id], 'mode' => 'renewal', 'period_start' => '2027-07-16', 'period_end' => '2027-07-01'])
            ->assertJsonValidationErrors('period_end');
    }

    public function test_records_of_two_clients_or_unbillable_records_are_refused(): void
    {
        $mine = $this->domain();
        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);
        $theirs = Domain::create(['client_id' => $other->id, 'name' => 'other.com', 'action' => 'register', 'recurring_amount' => '1000.00', 'status' => 'active', 'expires_at' => '2027-01-01']);

        $this->postJson('/api/invoices/from-records', ['domains' => [$mine->id, $theirs->id], 'mode' => 'renewal'])->assertJsonValidationErrors('records');

        $cancelled = $this->service(['status' => 'terminated']);
        $noDate = $this->service(['next_due_date' => null]);
        $free = $this->service(['recurring_amount' => '0.00']);
        foreach ([$cancelled, $noDate, $free] as $service) {
            $this->postJson('/api/invoices/from-records', ['services' => [$service->id], 'mode' => 'renewal'])->assertStatus(422);
        }

        $this->postJson('/api/invoices/from-records', ['mode' => 'renewal'])->assertJsonValidationErrors('records');
        $this->postJson('/api/invoices/from-records', ['domains' => [$mine->id], 'mode' => 'weird'])->assertJsonValidationErrors('mode');
        $this->assertSame(0, Invoice::count());
    }

    public function test_the_daily_renewal_run_adds_the_period_to_its_invoices_and_skips_a_hand_made_one(): void
    {
        $service = $this->service(['next_due_date' => today()->addDays(3)->toDateString()]);
        $domain = $this->domain(['expires_at' => today()->addDays(5)->toDateString(), 'auto_renew' => true]);

        $this->postJson('/api/invoices/from-records', ['domains' => [$domain->id], 'mode' => 'renewal'])->assertCreated();
        $this->assertSame(1, app(RenewalService::class)->generateInvoices(), 'the domain already has its invoice');

        $item = Invoice::latest('id')->first()->items()->first();
        $start = today()->addDays(3);
        $this->assertSame("Renewal: Starter - acme.com ({$start->format('d/m/Y')} - {$start->copy()->addYear()->subDay()->format('d/m/Y')})", $item->description);
        $this->assertSame($start->toDateString(), $item->period_start->toDateString());
        $this->assertSame($service->id, $item->service_id);
    }

    public function test_new_orders_carry_the_period_too(): void
    {
        $product = Product::create(['name' => 'Starter', 'type' => 'shared_hosting']);
        $product->prices()->create(['cycle' => 'annually', 'price' => '4200.00', 'setup_fee' => '0.00']);

        $invoice = app(BillingService::class)->createOrder($this->client, [['product_id' => $product->id, 'cycle' => 'annually', 'domain' => 'acme.com']])->invoices()->first();

        $end = today()->addYear()->subDay();
        $this->assertSame("Starter (annually) - acme.com (".today()->format('d/m/Y').' - '.$end->format('d/m/Y').')', $invoice->items()->first()->description);
    }
}
