<?php

namespace Tests\Feature;

use App\Mail\CustomerNotice;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentAttempt;
use App\Models\User;
use App\Services\BillingService;
use App\Services\CreditService;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ClientTabsTest extends TestCase
{
    use RefreshDatabase;

    private Client $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com']);
        $this->actingAs(tap(User::factory()->create(), fn (User $admin) => $admin->forceFill(['is_admin' => true])->save()));
    }

    private function invoice(string $amount, string $due = 'today'): Invoice
    {
        return app(BillingService::class)->createInvoice($this->client, [['description' => 'Hosting', 'amount' => $amount]], now()->parse($due));
    }

    private function bulk(string $action, array $invoices)
    {
        return $this->postJson('/api/invoices/bulk', ['action' => $action, 'invoice_ids' => array_map(fn (Invoice $i) => $i->id, $invoices)]);
    }

    public function test_mark_paid_unpaid_and_cancelled(): void
    {
        [$a, $b] = [$this->invoice('100.00'), $this->invoice('50.00')];

        $this->bulk('mark_paid', [$a])->assertOk()->assertJsonPath('message', '1 invoice(s) marked paid.');
        $this->assertSame('paid', $a->refresh()->status);
        $this->assertSame('100.00', $a->payments()->sole()->amount);

        $this->bulk('mark_unpaid', [$a, $b])->assertJsonPath('message', '1 invoice(s) marked unpaid. 1 skipped (already unpaid).');
        $this->assertSame('unpaid', $a->refresh()->status);
        $this->assertNull($a->paid_at);

        $this->bulk('mark_cancelled', [$b])->assertOk();
        $this->assertSame('cancelled', $b->refresh()->status);

        $this->bulk('mark_unpaid', [$b])->assertOk()->assertJsonPath('message', '1 invoice(s) marked unpaid.');
        $this->assertSame('unpaid', $b->refresh()->status);
    }

    public function test_cancelling_gives_back_the_credit_it_used(): void
    {
        app(CreditService::class)->add($this->client, '30.00', 'Goodwill');
        $invoice = $this->invoice('100.00');
        $this->assertSame('70.00', $invoice->refresh()->total);

        $this->bulk('mark_cancelled', [$invoice])->assertOk();

        $this->assertSame('cancelled', $invoice->refresh()->status);
        $this->assertSame('100.00', $invoice->total);
        $this->assertSame('30.00', $this->client->refresh()->credit_balance);
    }

    public function test_merge_and_duplicate(): void
    {
        [$a, $b] = [$this->invoice('100.00', '+3 days'), $this->invoice('50.00', '+1 day')];

        $merged = Invoice::findOrFail($this->bulk('merge', [$a, $b])->assertOk()->json('invoice_id'));

        $this->assertSame('150.00', $merged->total);
        $this->assertSame(now()->addDay()->toDateString(), $merged->due_date->toDateString());
        $this->assertSame(['cancelled', 'cancelled'], [$a->refresh()->status, $b->refresh()->status]);

        $dupId = $this->bulk('duplicate', [$merged])->assertOk()->json('invoice_id');
        $dup = Invoice::findOrFail($dupId);
        $this->assertSame(['150.00', 'unpaid'], [$dup->total, $dup->status]);

        // An imported invoice without item rows falls back to its total rather than creating 0.00.
        $noItems = Invoice::create(['client_id' => $this->client->id, 'number' => '3887', 'status' => 'cancelled', 'currency' => 'BDT', 'total' => '4200.00', 'due_date' => today()]);
        $copyId = $this->bulk('duplicate', [$noItems])->assertOk()->json('invoice_id');
        $this->assertSame('4200.00', Invoice::findOrFail($copyId)->total);
    }

    public function test_paying_a_mass_pay_invoice_pays_each_bundled_invoice(): void
    {
        [$a, $b] = [$this->invoice('100.00'), $this->invoice('40.00')];

        $bundle = Invoice::findOrFail($this->bulk('mass_pay', [$a, $b])->assertOk()->json('invoice_id'));
        $this->assertSame('140.00', $bundle->total);

        app(BillingService::class)->recordPayment($bundle, 'bkash', 'TRX9', '140.00');

        $this->assertSame(['paid', 'paid', 'paid'], [$bundle->refresh()->status, $a->refresh()->status, $b->refresh()->status]);
        $this->assertSame('40.00', $b->payments()->sole()->amount);
        $this->assertSame('0.00', $this->client->refresh()->credit_balance);
    }

    public function test_reminder_and_delete(): void
    {
        Mail::fake();
        $unpaid = $this->invoice('100.00', '-2 days');
        PaymentAttempt::create([
            'invoice_id' => $unpaid->id,
            'gateway' => 'bkash',
            'reference' => 'ATT-1',
            'amount' => '100.00',
            'charge_amount' => '100.00',
            'charge_currency' => 'BDT',
            'status' => 'failed',
        ]);
        $paid = $this->invoice('20.00');
        app(BillingService::class)->recordPayment($paid, 'manual', 'T1', '20.00');

        $this->bulk('reminder', [$unpaid])->assertOk();
        Mail::assertSent(CustomerNotice::class, fn (CustomerNotice $m) => $m->subjectLine === "Overdue invoice {$unpaid->number}" && $m->hasFrom('billing@carrothost.com'));

        $this->bulk('delete', [$unpaid, $paid])->assertJsonPath('message', '1 invoice(s) deleted. 1 with payments kept: delete their transactions first.');
        $this->assertModelMissing($unpaid);
        $this->deleteJson("/api/invoices/{$paid->id}")->assertJsonValidationErrors('invoice');
    }

    public function test_edit_keeps_credit_lines_and_recomputes_the_total(): void
    {
        app(CreditService::class)->add($this->client, '10.00', 'Goodwill');
        $invoice = $this->invoice('100.00');
        $line = $invoice->items()->where('description', 'Hosting')->sole();

        $this->putJson("/api/invoices/{$invoice->id}", [
            'due_date' => now()->addWeek()->toDateString(),
            'items' => [['id' => $line->id, 'description' => 'Hosting (fixed)', 'amount' => '80'], ['description' => 'Setup', 'amount' => '15']],
        ])->assertOk();

        $this->assertSame('85.00', $invoice->refresh()->total);
        $this->assertSame(['Hosting (fixed)', 'Credit applied', 'Setup'], $invoice->items()->orderBy('id')->pluck('description')->all());
    }

    public function test_transactions_can_be_edited_and_deleting_one_reopens_the_invoice(): void
    {
        $invoice = $this->invoice('100.00');
        $payment = app(BillingService::class)->recordPayment($invoice, 'bkash', 'TRX1', '100.00');

        $this->putJson("/api/transactions/{$payment->id}", ['date' => '2026-01-05', 'transaction_id' => 'TRX1-FIX', 'fee' => '1.85'])->assertOk();
        $this->assertSame(['TRX1-FIX', '1.85', '2026-01-05'], [$payment->refresh()->transaction_id, $payment->fee, $payment->created_at->toDateString()]);
        $this->getJson("/api/clients/{$this->client->id}")->assertJsonPath('transaction_totals.fees', '1.85')->assertJsonPath('transactions.0.gateway_name', 'bKash');

        $this->deleteJson("/api/transactions/{$payment->id}")->assertNoContent();
        $this->assertModelMissing($payment);
        $this->assertSame('unpaid', $invoice->refresh()->status);
    }

    public function test_emails_resend_delete_and_owner_password(): void
    {
        Mail::fake();
        Notification::fake();
        $log = $this->client->emailLogs()->create(['to' => 'rahim@example.com', 'subject' => 'Welcome', 'body' => '<p>Hi</p>']);

        $this->postJson("/api/clients/{$this->client->id}/emails/{$log->id}/resend")->assertOk()->assertJsonPath('message', 'Sent again to rahim@example.com.');
        $this->deleteJson("/api/clients/{$this->client->id}/emails/{$log->id}")->assertNoContent();
        $this->assertModelMissing($log);

        $owner = $this->client->users()->create(['email' => 'rahim@example.com', 'first_name' => 'Rahim', 'is_owner' => true, 'status' => 'active']);
        $this->postJson("/api/clients/{$this->client->id}/users/{$owner->id}/password-reset")->assertOk();
        Notification::assertSentTo($this->client, ResetPassword::class);

        $this->putJson("/api/clients/{$this->client->id}/users/{$owner->id}/password", ['password' => 'short'])->assertJsonValidationErrors('password');
        $this->putJson("/api/clients/{$this->client->id}/users/{$owner->id}/password", ['password' => 'a-new-long-password'])->assertOk();
        $this->assertTrue(Hash::check('a-new-long-password', $this->client->refresh()->password));
    }

    public function test_ticket_stats_count_by_period(): void
    {
        $this->client->tickets()->create(['number' => '111111', 'department' => 'support', 'subject' => 'Now']);
        $this->client->tickets()->create(['number' => '222222', 'department' => 'billing', 'subject' => 'Old', 'created_at' => now()->subYear()->startOfYear()->addDay()]);

        $this->getJson("/api/clients/{$this->client->id}")
            ->assertJsonPath('ticket_stats.this_month', 1)
            ->assertJsonPath('ticket_stats.last_year', 1)
            ->assertJsonPath('tickets.0.department_name', 'Technical Support');
    }
}
