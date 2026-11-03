<?php

namespace Tests\Feature;

use App\Mail\TicketNotification;
use App\Models\Client;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SupportTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $admin = User::factory()->create(['name' => 'Rafi', 'email' => 'staff@example.com']);
        $admin->forceFill(['is_admin' => true])->save();

        return $admin;
    }

    /** A fresh session, as when someone else picks up the browser. */
    private function signOut(): void
    {
        $this->flushSession();
        Auth::forgetGuards();
    }

    private function signIn(string $email = 'mine@example.com'): Client
    {
        $client = Client::create(['name' => 'Mine', 'email' => $email, 'password' => 'correct-horse']);
        $this->postJson('/api/client/login', ['email' => $email, 'password' => 'correct-horse'])->assertOk();

        return $client;
    }

    private function openTicket(): int
    {
        return $this->postJson('/api/client/tickets', [
            'department' => 'billing', 'subject' => 'Charged twice', 'priority' => 'high', 'message' => 'Invoice 1001 was paid twice.',
        ])->assertCreated()->json('id');
    }

    public function test_customer_opens_a_ticket_and_staff_are_emailed(): void
    {
        Mail::fake();
        $this->admin();
        $this->signIn();

        $id = $this->openTicket();

        $this->getJson("/api/client/tickets/{$id}")
            ->assertOk()
            ->assertJsonPath('status', 'open')
            ->assertJsonPath('department_name', 'Billing')
            ->assertJsonPath('replies.0.message', 'Invoice 1001 was paid twice.');
        Mail::assertSent(TicketNotification::class, fn ($mail) => $mail->hasTo('staff@example.com'));
        $this->getJson('/api/client/tickets')->assertJsonPath('tickets.0.subject', 'Charged twice');
    }

    public function test_staff_reply_answers_the_ticket_and_customer_reply_reopens_it(): void
    {
        Mail::fake();
        $admin = $this->admin();
        $this->signIn();
        $id = $this->openTicket();
        $this->signOut();

        $this->actingAs($admin, 'web')->getJson('/api/badges')->assertJsonPath('awaiting_tickets', 1);
        $this->postJson("/api/tickets/{$id}/replies", ['message' => 'Refunded.'])->assertOk()->assertJsonPath('status', 'answered');
        $this->getJson('/api/badges')->assertJsonPath('awaiting_tickets', 0);
        Mail::assertSent(TicketNotification::class, fn ($mail) => $mail->hasTo('mine@example.com'));

        $this->signOut();
        $this->postJson('/api/client/login', ['email' => 'mine@example.com', 'password' => 'correct-horse'])->assertOk();
        $this->getJson("/api/client/tickets/{$id}")->assertJsonPath('replies.1.author', 'Rafi')->assertJsonPath('replies.1.staff', true)->assertDontSee('staff@example.com');
        $this->postJson("/api/client/tickets/{$id}/close")->assertJsonPath('status', 'closed');
        $this->postJson("/api/client/tickets/{$id}/replies", ['message' => 'Still charged.'])->assertJsonPath('status', 'customer_reply');
    }

    public function test_customer_cannot_see_or_use_another_clients_ticket_or_service(): void
    {
        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);
        $ticket = $other->tickets()->create(['number' => '111111', 'department' => 'support', 'subject' => 'Theirs', 'last_reply_at' => now()]);
        $this->signIn();

        $this->getJson("/api/client/tickets/{$ticket->id}")->assertNotFound();
        $this->postJson("/api/client/tickets/{$ticket->id}/replies", ['message' => 'x'])->assertNotFound();
        $this->postJson("/api/client/tickets/{$ticket->id}/close")->assertNotFound();
        $this->getJson('/api/client/tickets')->assertDontSee('Theirs');
    }

    public function test_attachments_are_private_and_validated(): void
    {
        Storage::fake('local');
        $this->signIn();

        $this->postJson('/api/client/tickets', [
            'department' => 'support', 'subject' => 'Bad file', 'priority' => 'low', 'message' => 'x',
            'attachment' => UploadedFile::fake()->create('run.php', 10, 'text/x-php'),
        ])->assertUnprocessable()->assertJsonValidationErrors('attachment');

        $id = $this->postJson('/api/client/tickets', [
            'department' => 'support', 'subject' => 'Screenshot', 'priority' => 'low', 'message' => 'See attached.',
            'attachment' => UploadedFile::fake()->image('error.png'),
        ])->assertCreated()->json('id');

        $reply = Ticket::findOrFail($id)->replies()->first();
        $this->assertSame('error.png', $reply->attachment_name);
        Storage::disk('local')->assertExists($reply->attachment_path);
        $this->getJson("/api/client/tickets/{$id}")->assertJsonMissingPath('replies.0.attachment_path');
        $this->get("/api/client/tickets/{$id}/replies/{$reply->id}/attachment")->assertOk();

        $this->signOut();
        $this->signIn('other@example.com');
        $this->get("/api/client/tickets/{$id}/replies/{$reply->id}/attachment")->assertNotFound();
    }

    public function test_chat_round_trip_with_unread_counts_and_polling(): void
    {
        $admin = $this->admin();
        $client = $this->signIn();

        $first = $this->postJson('/api/client/chat', ['message' => 'Hello?'])->assertCreated()->assertJsonPath('staff', false)->json('id');
        $this->postJson('/api/client/chat', [])->assertUnprocessable();
        $this->signOut();

        $this->actingAs($admin, 'web')->getJson('/api/badges')->assertJsonPath('unread_chat', 1);
        $this->getJson('/api/chats')->assertJsonPath('data.0.id', $client->id)->assertJsonPath('data.0.unread', 1)->assertJsonPath('data.0.last_message', 'Hello?');
        $this->getJson("/api/chats/{$client->id}")->assertJsonPath('items.0.message', 'Hello?');
        $this->getJson('/api/badges')->assertJsonPath('unread_chat', 0);
        $this->postJson("/api/chats/{$client->id}", ['message' => 'Hi, how can we help?'])->assertCreated()->assertJsonPath('author', 'Rafi');
        $this->signOut();

        $this->postJson('/api/client/login', ['email' => 'mine@example.com', 'password' => 'correct-horse'])->assertOk();
        $this->getJson('/api/client/badges')->assertJsonPath('unread_chat', 1);
        $this->getJson("/api/client/chat?after_id={$first}")->assertJsonCount(1, 'items')->assertJsonPath('items.0.staff', true)->assertJsonPath('seen_up_to', $first + 1);
        $this->getJson('/api/client/badges')->assertJsonPath('unread_chat', 0);
    }

    public function test_client_chat_is_scoped_to_the_signed_in_client(): void
    {
        $other = Client::create(['name' => 'Other', 'email' => 'other@example.com']);
        $theirs = $other->chatMessages()->create(['message' => 'Private note']);
        $this->signIn();

        $this->getJson('/api/client/chat')->assertOk()->assertJsonCount(0, 'items')->assertDontSee('Private note');
        $this->get("/api/client/chat/{$theirs->id}/attachment")->assertNotFound();
        $this->getJson('/api/chats')->assertUnauthorized();
    }
}
