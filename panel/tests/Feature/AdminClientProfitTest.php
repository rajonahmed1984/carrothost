<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Registrar;
use App\Models\RegistrarCharge;
use App\Models\RegistrarDeposit;
use App\Models\Service;
use App\Models\User;
use App\Services\BillingService;
use App\Services\CreditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminClientProfitTest extends TestCase
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
        $this->client = Client::create(['name' => 'Amirul', 'email' => 'amirul@example.com']);
    }

    private function profit(): array
    {
        return $this->getJson("/api/clients/{$this->client->id}")->assertOk()->json('profit');
    }

    private function paidInvoice(string $amount, string $gateway = 'bkash', ?string $fee = null): Invoice
    {
        $invoice = app(BillingService::class)->createInvoice($this->client, [['description' => 'Hosting', 'amount' => $amount, 'kind' => 'other']], today(), applyCredit: false);
        $payment = app(BillingService::class)->recordPayment($invoice, $gateway, 'TX-'.$invoice->id, $amount);
        $fee === null || $payment->update(['fee' => $fee]);

        return $invoice->refresh();
    }

    public function test_revenue_is_cash_received_less_fees_and_refunds(): void
    {
        $paid = $this->paidInvoice('1000.00', fee: '20.00');
        $this->paidInvoice('500.00', 'manual');

        $profit = $this->profit();
        $this->assertSame('1500.00', $profit['revenue']);
        $this->assertSame('20.00', $profit['expenses']['gateway_fees']);
        $this->assertSame('1480.00', $profit['net']);
        $this->assertEquals(98.7, $profit['margin']);
        $this->assertSame('1500.00', $this->getJson("/api/clients/{$this->client->id}")->json('gross_revenue'));

        // Cash sent back leaves revenue; the original payment id is on the invoice.
        $payment = $paid->payments()->first();
        $this->postJson("/api/invoices/{$paid->id}/refund", ['payment_id' => $payment->id, 'amount' => '100', 'type' => 'record'])->assertOk();
        $this->assertSame('1400.00', $this->profit()['revenue']);
    }

    public function test_credit_spending_credit_refunds_and_mass_pay_children_are_not_counted_as_cash(): void
    {
        // 600 of credit is bought (an Add Funds invoice paid in cash), then spent on a 400 invoice.
        $funds = app(BillingService::class)->createInvoice($this->client, [['description' => 'Add Funds', 'amount' => '600.00', 'kind' => 'add_funds']], today());
        $cash = app(BillingService::class)->recordPayment($funds, 'bkash', 'FUNDS-1', '600.00');
        $spent = app(BillingService::class)->createInvoice($this->client, [['description' => 'Hosting', 'amount' => '400.00', 'kind' => 'other']], today());
        $this->assertSame('paid', $spent->fresh()->status, 'the credit paid it');
        $this->assertSame('600.00', $this->profit()['revenue'], 'spending credit adds no cash');

        // Part of the Add Funds money given back as credit stays with us: revenue does not drop.
        $this->postJson("/api/invoices/{$funds->id}/refund", ['payment_id' => $cash->id, 'amount' => '100', 'type' => 'credit'])->assertOk();
        $this->assertSame('600.00', $this->profit()['revenue']);

        // Two invoices paid through one Mass Pay bundle: the bundle's payment is the cash.
        $a = $this->paidlessInvoice('300.00');
        $b = $this->paidlessInvoice('200.00');
        $bundle = Invoice::findOrFail($this->postJson('/api/invoices/bulk', ['invoice_ids' => [$a->id, $b->id], 'action' => 'mass_pay'])->assertOk()->json('invoice_id'));
        app(BillingService::class)->recordPayment($bundle, 'bkash', 'BUNDLE-1', '500.00');
        $this->assertSame('paid', $a->fresh()->status);

        // Cash in: 600 + 500. Not 600 + 400 (credit) + 500 + 500 (children).
        $this->assertSame('1100.00', $this->profit()['revenue']);
    }

    private function paidlessInvoice(string $amount): Invoice
    {
        return app(BillingService::class)->createInvoice($this->client, [['description' => 'Hosting', 'amount' => $amount, 'kind' => 'other']], today(), applyCredit: false);
    }

    public function test_domain_cost_comes_from_the_registrar_ledger(): void
    {
        Registrar::create(['code' => 'stargate', 'currency' => 'USD', 'reseller_id' => '1', 'api_key' => 'k']);
        $domain = Domain::create(['client_id' => $this->client->id, 'name' => 'acme.com', 'registrar' => 'stargate', 'action' => 'register', 'recurring_amount' => 1600, 'status' => 'active']);
        // $100 cost 12,000 + 300 fee = 123 BDT a dollar; the domain's charge took $10.
        RegistrarDeposit::create(['registrar_code' => 'stargate', 'paid_on' => today()->subDays(20), 'method' => 'card', 'amount_bdt' => 12000, 'fee_bdt' => 300, 'credited' => 100]);
        RegistrarCharge::create(['registrar_code' => 'stargate', 'type' => 'debit', 'charged_at' => today()->subDays(10), 'amount' => 10, 'domain_id' => $domain->id, 'action' => 'register']);
        // Someone else's domain at the same registrar must not leak in.
        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);
        $theirs = Domain::create(['client_id' => $other->id, 'name' => 'other.com', 'registrar' => 'stargate', 'action' => 'register', 'recurring_amount' => 1600, 'status' => 'active']);
        RegistrarCharge::create(['registrar_code' => 'stargate', 'type' => 'debit', 'charged_at' => today()->subDays(9), 'amount' => 5, 'domain_id' => $theirs->id, 'action' => 'register']);

        $this->paidInvoice('1600.00');

        $profit = $this->profit();
        $this->assertSame('1230.00', $profit['expenses']['domains']);
        $this->assertSame('1230.00', $profit['expenses']['total']);
        $this->assertSame('370.00', $profit['net']);
        $this->assertFalse($profit['notes']['estimated_domain_cost']);
    }

    public function test_vps_cost_is_its_monthly_cost_for_every_month_it_has_run(): void
    {
        $vps = Product::create(['name' => 'VPS 1', 'type' => 'vps', 'cost_amount' => '500.00', 'cost_currency' => 'BDT']);
        $make = fn (array $extra = []) => Service::create(['client_id' => $this->client->id, 'product_id' => $vps->id, 'cycle' => 'monthly', 'recurring_amount' => '900.00', 'status' => 'active', ...$extra]);
        // Started two months back: this month and the two before it.
        $make(['registered_at' => now()->subMonths(2)->startOfMonth()]);
        // Its own cost, ended last month after running four months.
        $make(['cost_amount' => '100.00', 'cost_currency' => 'BDT', 'registered_at' => now()->subMonths(4)->startOfMonth(), 'status' => 'terminated', 'termination_date' => now()->subMonth()->toDateString()]);
        // A shared hosting account carries no cost here.
        $shared = Product::create(['name' => 'Starter', 'type' => 'shared_hosting', 'cost_amount' => '999.00']);
        Service::create(['client_id' => $this->client->id, 'product_id' => $shared->id, 'cycle' => 'monthly', 'recurring_amount' => '400.00', 'status' => 'active']);

        $profit = $this->profit();
        $this->assertSame('1900.00', $profit['expenses']['vps']); // 3 x 500 + 4 x 100
        $this->assertSame(0, $profit['notes']['missing_vps_cost']);
    }

    public function test_a_live_vps_without_any_cost_is_flagged(): void
    {
        $vps = Product::create(['name' => 'VPS 1', 'type' => 'vps']);
        Service::create(['client_id' => $this->client->id, 'product_id' => $vps->id, 'cycle' => 'monthly', 'recurring_amount' => '900.00', 'status' => 'active']);

        $profit = $this->profit();
        $this->assertSame('0.00', $profit['expenses']['vps']);
        $this->assertSame(1, $profit['notes']['missing_vps_cost']);
    }

    public function test_a_client_with_nothing_has_no_margin(): void
    {
        $profit = $this->profit();

        $this->assertSame(['revenue' => '0.00', 'net' => '0.00', 'margin' => null], ['revenue' => $profit['revenue'], 'net' => $profit['net'], 'margin' => $profit['margin']]);
    }
}
