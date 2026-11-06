<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Product;
use App\Models\Service;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class OrderDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_bulk_delete_removes_invoices_and_services_and_skips_paid_orders(): void
    {
        Mail::fake();
        Queue::fake();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);

        $product = Product::create(['name' => 'Starter', 'type' => 'shared_hosting', 'setup_mode' => 'manual']);
        $product->prices()->create(['cycle' => 'annually', 'price' => 1000]);
        $client = Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com']);
        $billing = app(BillingService::class);

        $unpaid = $billing->createOrder($client, [['product_id' => $product->id, 'cycle' => 'annually', 'domain' => 'a.com']]);
        $paid = $billing->createOrder($client, [['product_id' => $product->id, 'cycle' => 'annually', 'domain' => 'b.com']]);
        $paidInvoice = $paid->invoices()->first();
        $billing->recordPayment($paidInvoice, 'manual', 'TX-1', (string) $paidInvoice->total);
        $unpaidInvoiceId = $unpaid->invoices()->value('id');

        $this->postJson('/api/orders/batch-action', ['order_ids' => [$unpaid->id, $paid->id], 'action' => 'delete'])
            ->assertOk()->assertJsonPath('count', 1)->assertJsonCount(1, 'skipped');

        $this->assertModelMissing($unpaid);
        $this->assertNull(Invoice::find($unpaidInvoiceId), 'The invoice goes with the order.');
        $this->assertFalse(Service::where('domain', 'a.com')->exists(), 'So does the service.');

        $this->assertModelExists($paid);
        $this->assertTrue(Service::where('domain', 'b.com')->exists());
    }
}
