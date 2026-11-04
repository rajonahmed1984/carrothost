<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Gateway;
use App\Models\Invoice;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreditTest extends TestCase
{
    use RefreshDatabase;

    private Client $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com']);
    }

    private function admin(): User
    {
        return tap(User::factory()->create(), fn (User $admin) => $admin->forceFill(['is_admin' => true])->save());
    }

    private function invoice(string $amount, string $due = 'today'): Invoice
    {
        return app(BillingService::class)->createInvoice($this->client, [['description' => 'Hosting', 'amount' => $amount]], now()->parse($due));
    }

    public function test_added_credit_pays_due_invoices_oldest_first(): void
    {
        $later = $this->invoice('100.00', '+10 days');
        $sooner = $this->invoice('100.00', '+1 day');

        $this->actingAs($this->admin())
            ->postJson("/api/clients/{$this->client->id}/credits", ['type' => 'add', 'amount' => '150', 'description' => 'Refund'])
            ->assertOk()->assertJsonPath('balance', '0.00');

        $this->assertSame('paid', $sooner->refresh()->status);
        $this->assertSame('0.00', $sooner->total);
        $this->assertSame('unpaid', $later->refresh()->status);
        $this->assertSame('50.00', $later->total);
        $this->assertSame(['-50.00'], $later->items()->where('description', 'Credit applied')->pluck('amount')->all());

        $this->getJson("/api/clients/{$this->client->id}/credits")->assertOk()
            ->assertJsonPath('data.0.description', "Credit Applied to Invoice #{$later->number}")
            ->assertJsonPath('data.2.description', 'Refund')
            ->assertJsonPath('data.2.amount', '150.00')
            ->assertJsonPath('data.2.user.name', User::first()->name);
    }

    public function test_a_new_invoice_uses_the_credit_already_held(): void
    {
        $this->actingAs($this->admin())->postJson("/api/clients/{$this->client->id}/credits", ['type' => 'add', 'amount' => '500', 'description' => 'Goodwill']);

        $invoice = $this->invoice('120.00');

        $this->assertSame('paid', $invoice->refresh()->status);
        $this->assertSame('380.00', $this->client->refresh()->credit_balance);
    }

    public function test_credit_cannot_be_removed_below_zero(): void
    {
        $this->actingAs($this->admin());
        $this->postJson("/api/clients/{$this->client->id}/credits", ['type' => 'add', 'amount' => '20', 'description' => 'Goodwill']);

        $this->postJson("/api/clients/{$this->client->id}/credits", ['type' => 'remove', 'amount' => '25', 'description' => 'Oops'])->assertJsonValidationErrors('amount');
        $this->postJson("/api/clients/{$this->client->id}/credits", ['type' => 'remove', 'amount' => '20', 'description' => 'Refunded'])->assertOk()->assertJsonPath('balance', '0.00');
    }

    public function test_paid_add_funds_invoice_becomes_credit_that_pays_due_invoices(): void
    {
        Gateway::create(['code' => 'manual', 'is_enabled' => true, 'config' => ['instructions' => 'BRAC Bank 123']]);
        $due = $this->invoice('300.00');

        $this->actingAs($this->client, 'client')->getJson('/api/client/credits')->assertOk()
            ->assertJsonPath('bank_transfer', true)->assertJsonPath('limits.min_deposit', '100.00');
        $id = $this->postJson('/api/client/credits', ['amount' => '1000', 'gateway' => 'manual'])
            ->assertOk()->assertJsonPath('redirect_url', null)->json('invoice_id');

        $funds = Invoice::findOrFail($id);
        $this->assertSame('unpaid', $funds->status);
        $this->assertSame('1000.00', $funds->total);

        app(BillingService::class)->recordPayment($funds, 'manual', 'S92558606', '1000.00');

        $this->assertSame('paid', $funds->refresh()->status);
        $this->assertSame('paid', $due->refresh()->status);
        $this->assertSame('700.00', $this->client->refresh()->credit_balance);
        $this->getJson('/api/client/credits')
            ->assertJsonPath('balance', '700.00')
            ->assertJsonPath('history.0.description', "Credit Applied to Invoice #{$due->number}")
            ->assertJsonPath('history.1.description', 'Add Funds via Manual / Bank (TRXID: S92558606)')
            ->assertJsonPath('history.1.amount', '1000.00');
    }

    public function test_add_funds_respects_the_limits_and_payment_methods(): void
    {
        config(['billing.credit' => ['min_deposit' => '100.00', 'max_deposit' => '5000.00', 'max_balance' => '6000.00']]);
        Gateway::create(['code' => 'manual', 'is_enabled' => true, 'config' => ['instructions' => 'BRAC Bank 123']]);
        $this->client->update(['credit_balance' => '2000.00']);
        $this->actingAs($this->client, 'client');

        $this->postJson('/api/client/credits', ['amount' => '50', 'gateway' => 'manual'])->assertJsonValidationErrors('amount');
        $this->postJson('/api/client/credits', ['amount' => '5001', 'gateway' => 'manual'])->assertJsonValidationErrors('amount');
        $this->postJson('/api/client/credits', ['amount' => '4500', 'gateway' => 'manual'])->assertJsonValidationErrors('amount');
        $this->postJson('/api/client/credits', ['amount' => '500', 'gateway' => 'bkash'])->assertJsonValidationErrors('gateway');
        $this->assertSame(0, Invoice::count());
    }
}
