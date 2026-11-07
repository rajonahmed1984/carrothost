<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Gateway;
use App\Models\Product;
use App\Models\Service;
use App\Models\User;
use App\Services\RenewalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_edits_a_service_and_its_stored_login(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $client = Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        $product = Product::create(['name' => 'Starter', 'type' => 'shared_hosting']);
        $product->prices()->create(['cycle' => 'annually', 'price' => 4000]);
        $service = Service::create([
            'client_id' => $client->id, 'product_id' => $product->id, 'domain' => 'acme.com', 'cycle' => 'monthly',
            'recurring_amount' => 400, 'status' => 'active', 'credentials' => ['username' => 'acme', 'password' => 'old-secret'],
        ]);
        // Only gateways that are on can be picked as the payment method.
        Gateway::create(['code' => 'bkash', 'is_enabled' => true, 'config' => []]);
        $this->actingAs($admin);

        $this->getJson("/api/services/{$service->id}")->assertOk()
            ->assertJsonPath('username', 'acme')
            ->assertJsonPath('has_password', true)
            ->assertJsonPath('registered_at', today()->toDateString())
            ->assertJsonMissingPath('credentials')
            ->assertJsonPath('client_services.0.name', 'Starter - acme.com');

        $this->putJson("/api/services/{$service->id}", [
            'cycle' => 'annually', 'quantity' => 2, 'recalculate' => true, 'password' => 'new-secret',
            'payment_method' => 'bkash', 'override_suspend_until' => today()->addDays(5)->toDateString(),
            'admin_notes' => 'VIP', 'terminate_end_of_cycle' => false, 'terminate_reason' => 'ignored',
        ])->assertOk()
            ->assertJsonPath('recurring_amount', '8000.00')
            ->assertJsonPath('cycle', 'annually')
            ->assertJsonPath('admin_notes', 'VIP')
            ->assertJsonPath('terminate_reason', null);

        $this->assertSame(['username' => 'acme', 'password' => 'new-secret'], $service->refresh()->credentials->toArray());

        // The override keeps an overdue service from being suspended.
        $service->update(['next_due_date' => today()->subDays(60)]);
        app(RenewalService::class)->suspendOverdue();
        $this->assertSame('active', $service->refresh()->status);

        $this->putJson("/api/services/{$service->id}", ['status' => 'gone', 'dedicated_ip' => 'nope'])->assertJsonValidationErrors(['status', 'dedicated_ip']);
    }
}
