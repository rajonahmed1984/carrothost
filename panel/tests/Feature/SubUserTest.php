<?php

namespace Tests\Feature;

use App\Mail\PasswordResetLink;
use App\Mail\VerificationCode;
use App\Models\Client;
use App\Models\ClientUser;
use App\Models\User;
use App\Services\Auth\SubUsers;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SubUserTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'user-password-123';

    private Client $client;

    private ClientUser $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = Client::create(['name' => 'Dhaka Stream', 'email' => 'owner@example.com', 'password' => 'owner-password-123']);
        $this->user = $this->client->users()->create(['first_name' => 'Maidul', 'last_name' => 'Islam', 'email' => 'Maidul@Example.com', 'status' => 'active', 'permissions' => 'invoices,tickets']);
        $this->user->forceFill(['password' => self::PASSWORD])->save();
    }

    /** Password, then the code emailed to the user: every sign-in needs both. */
    private function signIn(): void
    {
        Mail::fake();
        $this->postJson('/api/client/login', ['email' => 'maidul@example.com', 'password' => self::PASSWORD])->assertOk()->assertJsonPath('requires_otp', true);

        $code = null;
        Mail::assertSent(VerificationCode::class, function (VerificationCode $mail) use (&$code) {
            $code = $mail->code;

            return true;
        });
        $this->postJson('/api/login/otp', ['otp' => $code])->assertOk();
    }

    public function test_a_user_signs_in_to_the_account_and_only_sees_what_they_may(): void
    {
        $invoice = app(BillingService::class)->createInvoice($this->client, [['description' => 'Hosting', 'amount' => '10.00']], now());

        $this->signIn();

        $this->assertAuthenticatedAs($this->client, 'client');
        $this->getJson('/api/client/me')->assertJsonPath('user.email', 'Maidul@Example.com')->assertJsonPath('user.permissions', ['invoices', 'tickets']);
        $this->getJson("/api/client/invoices/{$invoice->id}")->assertOk();
        $this->getJson('/api/client/tickets')->assertOk();
        $this->getJson('/api/client/services')->assertForbidden();
        $this->getJson('/api/client/domains')->assertForbidden();
        $this->getJson('/api/client/store')->assertForbidden();
        $this->getJson('/api/client/account/contacts')->assertForbidden();
        $this->user->update(['permissions' => 'invoices,tickets,contacts']);
        $this->getJson('/api/client/account/contacts')->assertOk();
        $this->putJson("/api/client/account/contacts/{$this->user->id}", ['permissions' => ['profile', 'orders']])->assertForbidden();
        $this->getJson('/api/client/account/sessions')->assertForbidden();
        $this->getJson('/api/client/overview')->assertOk()->assertJsonPath('services', [])->assertJsonCount(1, 'invoices');
        $this->assertNotNull($this->user->refresh()->last_login_at);
    }

    public function test_a_user_changes_their_own_password_never_the_owners(): void
    {
        $this->signIn();

        $this->postJson('/api/client/password', ['current_password' => 'wrong', 'password' => 'brand-new-password', 'password_confirmation' => 'brand-new-password'])->assertJsonValidationErrors('current_password');
        $this->postJson('/api/client/password', ['current_password' => self::PASSWORD, 'password' => 'brand-new-password', 'password_confirmation' => 'brand-new-password'])->assertOk();

        $this->assertTrue(Hash::check('brand-new-password', $this->user->refresh()->password));
        $this->assertTrue(Hash::check('owner-password-123', $this->client->refresh()->password));
    }

    public function test_removing_or_suspending_a_user_ends_their_session(): void
    {
        $this->signIn();
        $this->getJson('/api/client/me')->assertOk();

        $this->user->update(['status' => 'pending_approval']);

        $this->getJson('/api/client/me')->assertUnauthorized();
        $this->assertGuest('client');
    }

    public function test_the_login_code_goes_to_the_users_own_address(): void
    {
        Mail::fake();
        $this->user->update(['two_factor' => false]); // the old per-user switch no longer matters

        $this->postJson('/api/client/login', ['email' => 'maidul@example.com', 'password' => self::PASSWORD])->assertJsonPath('requires_otp', true);

        $code = null;
        Mail::assertSent(VerificationCode::class, function (VerificationCode $mail) use (&$code) {
            $code = $mail->code;

            return $mail->hasTo('Maidul@Example.com') && $mail->name === 'Maidul Islam';
        });
        $this->getJson('/api/login/otp')->assertJsonPath('email', 'Ma***l@Example.com');

        $this->postJson('/api/login/otp', ['otp' => $code])->assertOk();
        $this->assertAuthenticatedAs($this->client, 'client');
        $this->getJson('/api/client/services')->assertForbidden();
    }

    public function test_admin_sends_a_reset_link_or_sets_the_password(): void
    {
        Mail::fake();
        $this->actingAs(tap(User::factory()->create(), fn (User $admin) => $admin->forceFill(['is_admin' => true])->save()));

        $this->postJson("/api/clients/{$this->client->id}/users/{$this->user->id}/password-reset")->assertOk();

        $url = null;
        Mail::assertSent(PasswordResetLink::class, function (PasswordResetLink $mail) use (&$url) {
            $url = $mail->url;

            return $mail->hasTo('Maidul@Example.com') && $mail->hasFrom('support@carrothost.com');
        });
        $token = basename(parse_url($url, PHP_URL_PATH));

        $this->postJson('/api/client/reset-password', ['token' => $token, 'email' => 'maidul@example.com', 'password' => 'from-the-link-123', 'password_confirmation' => 'from-the-link-123'])->assertOk();
        $this->assertTrue(Hash::check('from-the-link-123', $this->user->refresh()->password));
        $this->assertSame(0, $this->client->emailLogs()->count(), 'Reset links must stay out of My Emails.');

        // The same link does not work twice.
        $this->postJson('/api/client/reset-password', ['token' => $token, 'email' => 'maidul@example.com', 'password' => 'again-again-123', 'password_confirmation' => 'again-again-123'])->assertJsonValidationErrors('email');

        $this->putJson("/api/clients/{$this->client->id}/users/{$this->user->id}/password", ['password' => 'set-by-admin-123'])->assertOk();
        $this->assertTrue(Hash::check('set-by-admin-123', $this->user->refresh()->password));
        $this->getJson("/api/clients/{$this->client->id}")->assertJsonPath('users.0.has_password', true);
    }

    public function test_forgot_password_reaches_users_too(): void
    {
        Mail::fake();

        $this->postJson('/api/client/forgot-password', ['email' => 'maidul@example.com'])->assertOk();

        Mail::assertSent(PasswordResetLink::class, fn (PasswordResetLink $mail) => $mail->hasTo('Maidul@Example.com'));
    }

    public function test_an_admin_logged_in_as_the_client_sees_everything(): void
    {
        // A user's session key left over in the browser must not limit the admin.
        $this->withSession([SubUsers::SESSION_KEY => $this->user->id])
            ->actingAs(tap(User::factory()->create(), fn (User $admin) => $admin->forceFill(['is_admin' => true])->save()))
            ->postJson("/api/clients/{$this->client->id}/impersonate")->assertOk();

        $this->getJson('/api/client/services')->assertOk();
        $this->getJson('/api/client/me')->assertJsonPath('user', null);
    }
}
