<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TransactionListTest extends TestCase
{
    use RefreshDatabase;

    public function test_lists_filters_sorts_and_totals_transactions(): void
    {
        Mail::fake();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);
        $billing = app(BillingService::class);
        $acme = Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        $zed = Client::create(['name' => 'Zed Ltd', 'email' => 'zed@example.com']);

        $a = $billing->recordPayment($billing->createInvoice($acme, [['description' => 'A', 'amount' => '1000', 'kind' => 'other']], today()), 'bkash', 'BK-1', '1000.00');
        $a->update(['fee' => '20.00', 'created_at' => now()->subDays(10)]);
        $billing->recordPayment($billing->createInvoice($zed, [['description' => 'Z', 'amount' => '500', 'kind' => 'other']], today()), 'manual', 'MN-1', '500.00');
        $a->invoice->payments()->create(['gateway' => 'bkash', 'transaction_id' => 'RF-1', 'amount' => '-100.00', 'currency' => 'BDT', 'meta' => ['refund_of' => $a->id]]);

        $this->getJson('/api/transactions')->assertOk()
            ->assertJsonPath('total', 3)
            ->assertJsonPath('totals', ['in' => '1500.00', 'fees' => '20.00', 'out' => '100.00', 'balance' => '1380.00'])
            ->assertJsonPath('data.0.invoice.client.name', 'Acme')
            ->assertJsonPath('data.0.gateway_name', 'bKash');

        $this->getJson('/api/transactions?q=zed')->assertJsonPath('total', 1)->assertJsonPath('totals.in', '500.00');
        $this->getJson('/api/transactions?gateway=bkash&direction=in')->assertJsonPath('total', 1)->assertJsonPath('data.0.transaction_id', 'BK-1');
        $this->getJson('/api/transactions?direction=out')->assertJsonPath('totals.out', '100.00')->assertJsonPath('totals.in', '0.00');
        $this->getJson('/api/transactions?from='.now()->subDays(11)->toDateString().'&to='.now()->subDays(9)->toDateString())->assertJsonPath('total', 1);
        $this->getJson('/api/transactions?sort=amount&dir=asc')->assertJsonPath('data.0.transaction_id', 'RF-1');
        $this->getJson('/api/transactions?sort=bogus')->assertJsonValidationErrors('sort');
    }
}
