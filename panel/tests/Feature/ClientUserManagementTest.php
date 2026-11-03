<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ClientUser;
use App\Models\EmailLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientUserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function signInClient(): Client
    {
        $client = Client::create([
            'name' => 'Iftekhar Mahmud',
            'company' => 'Dhaka Stream',
            'email' => 'iftekhar@example.com',
            'country' => 'BD',
            'status' => 'active',
        ]);

        ClientUser::create([
            'client_id' => $client->id,
            'first_name' => 'Iftekhar',
            'last_name' => 'Mahmud',
            'email' => 'iftekhar@example.com',
            'is_owner' => true,
            'status' => 'active',
            'email_verified_at' => now(),
            'permissions' => 'profile,contacts,products,manageproducts,productsso,domains,managedomains,invoices,quotes,tickets,affiliates,emails,orders',
        ]);

        $this->actingAs($client, 'client');

        return $client;
    }

    private function signInAdmin(): User
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $this->actingAs($admin, 'web');

        return $admin;
    }

    public function test_client_can_invite_user_and_receive_verification_email(): void
    {
        $client = $this->signInClient();

        $response = $this->postJson('/api/client/account/contacts', [
            'first_name' => 'Maidul',
            'last_name' => 'Islam',
            'email' => 'maidul@example.com',
            'permissions' => ['invoices', 'tickets', 'products'],
        ])->assertCreated();

        $user = ClientUser::where('email', 'maidul@example.com')->first();
        $this->assertNotNull($user);
        $this->assertSame('pending_verification', $user->status);
        $this->assertNotNull($user->verification_token);
        $this->assertFalse($user->is_owner);
        $this->assertContains('invoices', $user->permissions_list);

        // Check verification email was logged
        $email = EmailLog::where('client_id', $client->id)->where('to', 'maidul@example.com')->first();
        $this->assertNotNull($email);
        $this->assertStringContainsString('verify_token=', $email->body);
    }

    public function test_user_can_verify_email_token_and_move_to_pending_approval(): void
    {
        $client = $this->signInClient();

        $this->postJson('/api/client/account/contacts', [
            'first_name' => 'Minhaz',
            'last_name' => 'Rahman',
            'email' => 'minhaz@example.com',
            'permissions' => ['domains', 'invoices'],
        ])->assertCreated();

        $user = ClientUser::where('email', 'minhaz@example.com')->first();
        $token = $user->verification_token;

        // Public verification endpoint
        $res = $this->postJson('/api/contacts/verify', ['token' => $token])->assertOk();
        $this->assertSame('pending_approval', $res->json('user.status'));

        $user->refresh();
        $this->assertSame('pending_approval', $user->status);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNull($user->verification_token);
    }

    public function test_admin_can_view_users_approve_and_manage_permissions(): void
    {
        $client = $this->signInClient();

        $subUser = ClientUser::create([
            'client_id' => $client->id,
            'first_name' => 'Masud',
            'last_name' => 'Karim',
            'email' => 'masud@example.com',
            'status' => 'pending_approval',
            'is_owner' => false,
            'permissions' => 'invoices',
            'email_verified_at' => now(),
        ]);

        $admin = $this->signInAdmin();

        // Admin views users
        $res = $this->getJson("/api/clients/{$client->id}/users")->assertOk();
        $this->assertCount(2, $res->json());

        // Admin approves user
        $this->postJson("/api/clients/{$client->id}/users/{$subUser->id}/approve")->assertOk();
        $this->assertSame('active', $subUser->refresh()->status);

        // Admin updates user details, 2FA, permissions, and make owner
        $this->putJson("/api/clients/{$client->id}/users/{$subUser->id}", [
            'first_name' => 'Masud',
            'last_name' => 'Karim',
            'email' => 'masud@example.com',
            'language' => 'English',
            'two_factor' => true,
            'is_owner' => true,
            'status' => 'active',
            'permissions' => ['invoices', 'tickets', 'domains', 'products'],
        ])->assertOk();

        $subUser->refresh();
        $this->assertTrue($subUser->is_owner);
        $this->assertTrue($subUser->two_factor);
        $this->assertContains('domains', $subUser->permissions_list);

        // Previous owner is no longer owner
        $prevOwner = ClientUser::where('email', 'iftekhar@example.com')->first();
        $this->assertFalse($prevOwner->is_owner);
    }

    public function test_admin_can_associate_and_remove_user(): void
    {
        $client = $this->signInClient();
        $admin = $this->signInAdmin();

        // Admin associates user
        $res = $this->postJson("/api/clients/{$client->id}/users", [
            'first_name' => 'Direct',
            'last_name' => 'User',
            'email' => 'direct@example.com',
            'language' => 'English',
            'two_factor' => false,
            'is_owner' => false,
            'status' => 'active',
            'permissions' => ['tickets'],
        ])->assertCreated();

        $directUser = ClientUser::where('email', 'direct@example.com')->first();
        $this->assertNotNull($directUser);

        // Admin removes user
        $this->deleteJson("/api/clients/{$client->id}/users/{$directUser->id}")->assertNoContent();
        $this->assertDatabaseMissing('client_users', ['id' => $directUser->id]);

        // Cannot remove sole owner
        $owner = ClientUser::where('email', 'iftekhar@example.com')->first();
        $this->deleteJson("/api/clients/{$client->id}/users/{$owner->id}")->assertStatus(422);
    }
}

