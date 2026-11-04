<?php

namespace Tests\Feature;

use App\Mail\CustomerNotice;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ClientMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_messages_the_selected_clients_only(): void
    {
        Mail::fake();
        $this->actingAs(tap(User::factory()->create(), fn (User $admin) => $admin->forceFill(['is_admin' => true])->save()));
        $rahim = Client::create(['name' => 'Rahim <b>&</b>', 'email' => 'rahim@example.com']);
        $karim = Client::create(['name' => 'Karim', 'email' => 'karim@example.com']);
        Client::create(['name' => 'Left Out', 'email' => 'out@example.com']);

        $this->postJson('/api/clients/message', [
            'client_ids' => [$rahim->id, $karim->id],
            'sender' => 'billing',
            'subject' => 'Hello {name}',
            'message' => '<p>Dear <strong style="color: #c2410c">{name}</strong>,</p><script>alert(1)</script><p onclick="x()">Maintenance <a href="javascript:x()">tonight</a>.</p>',
        ])->assertOk()->assertJsonPath('message', 'Message queued for 2 client(s).');

        Mail::assertQueuedCount(2);
        Mail::assertQueued(CustomerNotice::class, fn (CustomerNotice $mail) => $mail->hasTo('karim@example.com')
            && $mail->hasFrom('billing@carrothost.com')
            && $mail->subjectLine === 'Hello Karim'
            && $mail->richBody === '<p>Dear <strong style="color: #c2410c">Karim</strong>,</p><p>Maintenance <a>tonight</a>.</p>'
            && $mail->body === "Dear Karim,\n\nMaintenance tonight.");
        // A client's name is text in the email, never markup.
        Mail::assertQueued(CustomerNotice::class, fn (CustomerNotice $mail) => $mail->hasTo('rahim@example.com')
            && str_contains($mail->richBody, 'Rahim &lt;b&gt;&amp;&lt;/b&gt;'));
        Mail::assertNotQueued(CustomerNotice::class, fn (CustomerNotice $mail) => $mail->hasTo('out@example.com'));
    }

    public function test_an_empty_editor_is_rejected(): void
    {
        $this->actingAs(tap(User::factory()->create(), fn (User $admin) => $admin->forceFill(['is_admin' => true])->save()));
        $client = Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com']);

        $this->postJson('/api/clients/message', ['client_ids' => [$client->id], 'sender' => 'support', 'subject' => 'Hi', 'message' => '<p>&nbsp;</p><script>x</script>'])
            ->assertJsonValidationErrors('message');
    }

    public function test_message_needs_a_known_sender_and_an_admin(): void
    {
        $client = Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com']);
        $body = ['client_ids' => [$client->id], 'sender' => 'support', 'subject' => 'Hi', 'message' => 'Hello'];

        $this->postJson('/api/clients/message', $body)->assertUnauthorized();

        $this->actingAs(tap(User::factory()->create(), fn (User $admin) => $admin->forceFill(['is_admin' => true])->save()));
        $this->postJson('/api/clients/message', [...$body, 'sender' => 'ceo'])->assertJsonValidationErrors('sender');
    }
}
