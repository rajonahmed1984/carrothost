<?php

namespace Tests\Feature;

use App\Mail\CustomerNotice;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\User;
use App\Services\BillingService;
use App\Services\CreditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminInvoiceTabsTest extends TestCase
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
        $this->client = Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
    }

    private function invoice(string $amount = '5000.00'): Invoice
    {
        return app(BillingService::class)->createInvoice($this->client, [['description' => 'Hosting', 'amount' => $amount, 'kind' => 'other']], today());
    }

    public function test_add_payment_with_method_date_and_fee(): void
    {
        $invoice = $this->invoice();

        $this->postJson("/api/invoices/{$invoice->id}/payments", ['gateway' => 'bkash', 'transaction_id' => 'DK1', 'amount' => '2000', 'fee' => '30', 'date' => today()->subDays(2)->toDateString()])
            ->assertOk()->assertJsonPath('balance', '3000.00')->assertJsonPath('payments.0.gateway_name', 'bKash')->assertJsonPath('payments.0.fee', '30.00')
            ->assertJsonPath('status', 'unpaid');
        $this->assertSame(today()->subDays(2)->toDateString(), $invoice->payments()->first()->created_at->toDateString());

        $this->postJson("/api/invoices/{$invoice->id}/payments", ['gateway' => 'nope', 'transaction_id' => 'X', 'amount' => '1'])->assertJsonValidationErrors('gateway');
        $this->postJson("/api/invoices/{$invoice->id}/payments", ['gateway' => 'manual', 'transaction_id' => 'DK2', 'amount' => '3000'])->assertOk()->assertJsonPath('status', 'paid');
    }

    public function test_apply_part_of_the_credit_and_take_it_back(): void
    {
        app(CreditService::class)->add($this->client, '1000.00', 'Goodwill');
        $invoice = $this->invoice(); // createInvoice applies all 1000 credit straight away
        $this->postJson("/api/invoices/{$invoice->id}/credit", ['action' => 'remove'])->assertOk()->assertJsonPath('credit_applied', '0.00')->assertJsonPath('total', '5000.00');
        $this->assertSame('1000.00', $this->client->fresh()->credit_balance);

        $this->postJson("/api/invoices/{$invoice->id}/credit", ['action' => 'apply', 'amount' => '400'])->assertOk()
            ->assertJsonPath('credit_applied', '400.00')->assertJsonPath('subtotal', '5000.00')->assertJsonPath('balance', '4600.00');
        $this->assertSame('600.00', $this->client->fresh()->credit_balance);
    }

    public function test_refunds_are_recorded_and_capped(): void
    {
        $invoice = $this->invoice('1000.00');
        $payment = app(BillingService::class)->recordPayment($invoice, 'bkash', 'DK9', '1000.00');

        $this->postJson("/api/invoices/{$invoice->id}/refund", ['payment_id' => $payment->id, 'amount' => '300', 'type' => 'credit'])->assertOk()
            ->assertJsonPath('status', 'paid')->assertJsonPath('payments.1.amount', '-300.00')->assertJsonPath('payments.1.refund_of', $payment->id);
        $this->assertSame('300.00', $this->client->fresh()->credit_balance);

        $this->postJson("/api/invoices/{$invoice->id}/refund", ['payment_id' => $payment->id, 'amount' => '701', 'type' => 'record'])->assertJsonValidationErrors('amount');
        $this->postJson("/api/invoices/{$invoice->id}/refund", ['payment_id' => $payment->id, 'amount' => '700', 'type' => 'record', 'transaction_id' => 'RF-1'])
            ->assertOk()->assertJsonPath('status', 'refunded');
    }

    public function test_notes_and_emails(): void
    {
        $invoice = $this->invoice();

        $this->putJson("/api/invoices/{$invoice->id}/notes", ['admin_notes' => 'Called client'])->assertOk()->assertJsonPath('admin_notes', 'Called client');
        $this->postJson("/api/invoices/{$invoice->id}/email", ['template' => 'paid'])->assertJsonValidationErrors('template');
        $this->postJson("/api/invoices/{$invoice->id}/email", ['template' => 'reminder'])->assertOk()->assertJsonPath('message', 'Email sent to acme@example.com.');
        Mail::assertSent(CustomerNotice::class, fn ($m) => str_contains($m->subjectLine, 'reminder') || str_contains($m->subjectLine, 'Overdue'));
    }
}
