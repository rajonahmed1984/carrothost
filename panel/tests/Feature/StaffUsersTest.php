<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** Admins manage staff users; support users only reach customers, tickets and chat. */
class StaffUsersTest extends TestCase
{
    use RefreshDatabase;

    private function staff(string $role = 'admin', array $extra = []): User
    {
        $user = User::factory()->create();
        $user->forceFill(['is_admin' => true, 'role' => $role, 'is_active' => true, ...$extra])->save();

        return $user->refresh();
    }

    public function test_existing_staff_default_to_admin(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['is_admin' => true])->save();

        $this->assertSame('admin', $user->refresh()->role);
        $this->assertTrue($user->is_active);
    }

    public function test_admin_adds_edits_and_lists_staff(): void
    {
        $this->actingAs($this->staff());

        $id = $this->postJson('/api/users', ['name' => 'Sara', 'email' => 'sara@example.com', 'role' => 'support', 'password' => 'a-long-password-1'])
            ->assertCreated()->assertJsonPath('role', 'support')->assertJsonPath('is_active', true)->json('id');

        $sara = User::find($id);
        $this->assertTrue($sara->is_admin);
        $this->assertTrue(Hash::check('a-long-password-1', $sara->password));

        $this->putJson("/api/users/{$id}", ['name' => 'Sara K', 'email' => 'sara@example.com', 'role' => 'admin', 'is_active' => true, 'password' => ''])
            ->assertOk()->assertJsonPath('role', 'admin');
        $this->assertTrue(Hash::check('a-long-password-1', $sara->refresh()->password));

        $this->getJson('/api/users?role=admin')->assertOk()->assertJsonPath('total', 2);
        $this->getJson('/api/users?q=Sara')->assertOk()->assertJsonPath('data.0.email', 'sara@example.com');
    }

    public function test_short_passwords_and_duplicate_emails_are_refused(): void
    {
        $admin = $this->staff();
        $this->actingAs($admin);

        $this->postJson('/api/users', ['name' => 'X', 'email' => $admin->email, 'role' => 'support', 'password' => 'short'])
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_the_last_admin_cannot_be_removed_or_demoted_and_nobody_changes_themselves(): void
    {
        $admin = $this->staff();
        $other = $this->staff();
        $this->actingAs($admin);

        $this->putJson("/api/users/{$admin->id}", ['name' => 'Me', 'email' => $admin->email, 'role' => 'support', 'is_active' => true])->assertJsonValidationErrors('role');
        $this->putJson("/api/users/{$admin->id}", ['name' => 'Me', 'email' => $admin->email, 'role' => 'admin', 'is_active' => false])->assertJsonValidationErrors('is_active');
        $this->deleteJson("/api/users/{$admin->id}")->assertJsonValidationErrors('user');

        // Disabling the other admin leaves this one as the last active admin.
        $this->putJson("/api/users/{$other->id}", ['name' => 'Other', 'email' => $other->email, 'role' => 'admin', 'is_active' => false])->assertOk();
        $this->actingAs($other->refresh());
        $this->getJson('/api/me')->assertForbidden();

        $support = $this->staff('support');
        $this->actingAs($admin);
        $this->putJson("/api/users/{$support->id}", ['name' => 'S', 'email' => $support->email, 'role' => 'admin', 'is_active' => true])->assertOk();
    }

    public function test_a_user_with_replies_is_disabled_not_deleted(): void
    {
        $this->actingAs($this->staff());
        $support = $this->staff('support');
        $client = \App\Models\Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        DB::table('chat_messages')->insert(['client_id' => $client->id, 'user_id' => $support->id, 'message' => 'Hi', 'created_at' => now(), 'updated_at' => now()]);

        $this->deleteJson("/api/users/{$support->id}")->assertJsonValidationErrors('user');

        $quiet = $this->staff('support');
        $this->deleteJson("/api/users/{$quiet->id}")->assertNoContent();
        $this->assertModelMissing($quiet);
    }

    public function test_support_reaches_customers_and_tickets_but_not_admin_areas(): void
    {
        $this->actingAs($this->staff('support'));
        $client = \App\Models\Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        $product = \App\Models\Product::create(['name' => 'Starter', 'type' => 'shared_hosting', 'module' => 'cpanel']);
        $service = \App\Models\Service::create([
            'client_id' => $client->id, 'product_id' => $product->id, 'cycle' => 'annually', 'recurring_amount' => 100,
            'status' => 'active', 'remote_id' => 'acme', 'provision_status' => 'done',
        ]);

        $this->getJson("/api/clients/{$client->id}")->assertOk();
        $this->getJson("/api/services/{$service->id}")->assertOk();
        $this->postJson("/api/services/{$service->id}/action", ['action' => 'terminate'])->assertForbidden();
        $this->postJson("/api/services/{$service->id}/credentials")->assertForbidden();
        $this->putJson("/api/services/{$service->id}", ['status' => 'terminated'])->assertForbidden();
        $this->postJson("/api/clients/{$client->id}/impersonate")->assertForbidden();
        $this->assertSame('active', $service->refresh()->status);

        $this->getJson('/api/me')->assertOk()->assertJsonPath('role', 'support');
        $this->getJson('/api/tickets')->assertOk();
        $this->getJson('/api/chats')->assertOk();
        $this->getJson('/api/clients')->assertOk();
        $this->getJson('/api/services')->assertOk();
        $this->getJson('/api/invoices')->assertOk();

        $this->getJson('/api/users')->assertForbidden();
        $this->postJson('/api/users', [])->assertForbidden();
        $this->getJson('/api/dashboard')->assertForbidden();
        $this->getJson('/api/settings')->assertForbidden();
        $this->getJson('/api/servers')->assertForbidden();
        $this->getJson('/api/transactions')->assertForbidden();
        $this->postJson('/api/clients', ['name' => 'X'])->assertForbidden();
    }

    public function test_a_disabled_user_cannot_sign_in(): void
    {
        $user = $this->staff('support', ['is_active' => false, 'password' => 'a-long-password-1']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'a-long-password-1']);

        $this->assertGuest();
    }
}
