<?php

namespace Tests\Feature;

use App\Mail\VerificationCode;
use App\Models\Client;
use App\Models\EmailLog;
use App\Models\User;
use App\Services\TicketService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ClientAccountTest extends TestCase
{
    use RefreshDatabase;

    private function signIn(string $email = 'mine@example.com'): Client
    {
        $client = Client::firstOrCreate(['email' => $email], ['name' => 'Mine', 'password' => 'correct-horse']);
        $this->loginClientWithCode($email, 'correct-horse');

        return $client;
    }

    public function test_customer_edits_details_but_not_the_login_email(): void
    {
        $client = $this->signIn();

        $this->putJson('/api/client/account/profile', ['name' => 'New Name', 'company' => 'Acme', 'country' => 'AE', 'email' => 'hijack@example.com'])
            ->assertOk()
            ->assertJsonPath('name', 'New Name')
            ->assertJsonPath('email', 'mine@example.com');
        $this->assertSame('AE', $client->refresh()->country);
        $this->putJson('/api/client/account/profile', ['name' => 'X', 'country' => 'Bangladesh'])->assertJsonValidationErrors('country');
    }

    public function test_contacts_get_support_replies_and_emails_are_kept_without_sign_in_codes(): void
    {
        $client = $this->signIn();
        $this->postJson('/api/client/account/contacts', ['name' => 'Dev', 'email' => 'Dev@Example.com', 'receives_support' => true])->assertCreated();
        $this->postJson('/api/client/account/contacts', ['name' => 'Acct', 'email' => 'acct@example.com', 'receives_support' => false])->assertCreated();
        $this->postJson('/api/client/account/contacts', ['name' => 'Dup', 'email' => 'dev@example.com'])->assertJsonValidationErrors('email');

        $staff = User::factory()->create();
        $tickets = app(TicketService::class);
        $ticket = $tickets->open($client, ['department' => 'support', 'subject' => 'Help', 'priority' => 'medium', 'message' => 'Hi']);
        $tickets->reply($ticket, 'Fixed it', $staff);
        Mail::to($client->email)->send(new VerificationCode('123456', 'Your sign-in code', 'Code', 'Intro', 'Enter it', 'Footer'));

        $sent = EmailLog::where('client_id', $client->id)->pluck('to')->all();
        $this->assertEqualsCanonicalizing(['mine@example.com', 'dev@example.com'], $sent);
        $this->assertFalse(EmailLog::where('subject', 'Your sign-in code')->exists());

        $list = $this->getJson('/api/client/account/emails')->assertOk()->assertJsonCount(2, 'data')->assertJsonMissingPath('data.0.body')->json('data');
        $this->getJson("/api/client/account/emails/{$list[0]['id']}")->assertOk()->assertSee('Fixed it');

        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);
        $theirs = EmailLog::create(['client_id' => $other->id, 'to' => 'other@example.com', 'subject' => 'Private']);
        $this->getJson("/api/client/account/emails/{$theirs->id}")->assertNotFound();
    }

    public function test_support_token_lasts_an_hour_and_staff_can_see_it(): void
    {
        $client = $this->signIn();
        $this->getJson('/api/client/account/support-pin')->assertJsonPath('pin', null);
        $pin = $this->postJson('/api/client/account/support-pin')->assertOk()->json('pin');
        $this->assertMatchesRegularExpression('/^\d{6}$/', $pin);

        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin, 'web')->getJson("/api/clients/{$client->id}")->assertJsonPath('support_pin', $pin)->assertJsonMissingPath('password');

        $this->travel(61)->minutes();
        $this->getJson("/api/clients/{$client->id}")->assertJsonPath('support_pin', null);
    }

    public function test_support_token_history_and_cancellation(): void
    {
        $client = $this->signIn();
        $this->postJson('/api/client/account/support-pin')->assertOk();

        $data = $this->getJson('/api/client/account/support-pin')->assertOk()->json();
        $this->assertNotEmpty($data['active']);
        $this->assertCount(1, $data['tokens']);
        $this->assertSame('active', $data['tokens'][0]['status']);

        // Cancel token
        $tokenId = $data['tokens'][0]['id'];
        $res = $this->postJson("/api/client/account/support-pin/cancel?id={$tokenId}")->assertOk()->json();
        $this->assertNull($res['active']);
        $this->assertSame('cancelled', $res['tokens'][0]['status']);
    }

    public function test_sessions_are_listed_and_other_devices_can_be_signed_out(): void
    {
        $client = $this->signIn();
        $this->assertSame(1, $client->sessions()->count(), 'Signing in records the session.');

        // JSON test requests send no cookies by default, so pin this device's session id explicitly.
        $sid = str_repeat('a', 40);
        $this->withCredentials()->withCookie(config('session.cookie'), $sid);
        $current = $client->sessions()->create(['session_id' => $sid]);
        DB::table('sessions')->insert(['id' => 'other-device', 'payload' => '', 'last_activity' => time(), 'ip_address' => '10.0.0.9']);
        $other = $client->sessions()->create(['session_id' => 'other-device', 'ip_address' => '10.0.0.9', 'user_agent' => 'Mozilla/5.0 (iPhone)']);

        $this->getJson('/api/client/account/sessions')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['id' => $other->id, 'current' => false])
            ->assertJsonFragment(['id' => $current->id, 'current' => true]);
        $this->assertSame(2, $client->sessions()->count(), 'The login session that no longer exists is forgotten.');

        $this->deleteJson("/api/client/account/sessions/{$current->id}")->assertUnprocessable();
        $this->deleteJson('/api/client/account/sessions')->assertOk()->assertJsonPath('ended', 1);
        $this->assertFalse(DB::table('sessions')->where('id', 'other-device')->exists());
        $this->getJson('/api/client/me')->assertOk();
    }
}
