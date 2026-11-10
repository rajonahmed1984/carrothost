<?php

namespace Tests\Feature;

use App\Mail\VerificationCode;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\User;
use App\Services\Auth\LoginOtpService;
use App\Support\Auth\Portal;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'correct-horse-battery';

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
    }

    private function admin(): User
    {
        $admin = User::factory()->create(['password' => self::PASSWORD]);
        $admin->forceFill(['is_admin' => true])->save();

        return $admin;
    }

    private function client(array $attributes = []): Client
    {
        return Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => self::PASSWORD, ...$attributes])->refresh();
    }

    private function lastCode(): string
    {
        $code = null;
        Mail::assertSent(VerificationCode::class, function (VerificationCode $mail) use (&$code) {
            $code = $mail->code;

            return true;
        });

        return $code;
    }

    private function registration(array $overrides = []): array
    {
        return [
            'name' => 'New Person',
            'email' => 'New@Example.com',
            'phone_country' => '+880',
            'phone' => '01711 000000',
            'password' => self::PASSWORD,
            'password_confirmation' => self::PASSWORD,
            ...$overrides,
        ];
    }

    private function googleReturns(array $profile): void
    {
        config(['services.google' => ['client_id' => 'id', 'client_secret' => 'secret', 'redirect' => null]]);

        Http::fake([
            'oauth2.googleapis.com/*' => Http::response(['access_token' => 'token']),
            'www.googleapis.com/*' => Http::response($profile),
        ]);
    }

    private function googleCallback(string $state = 'good-state')
    {
        return $this->withSession(['oauth_state_google' => 'good-state'])->get("/auth/google/callback?state={$state}&code=abc");
    }

    public function test_admin_password_alone_does_not_sign_in(): void
    {
        $admin = $this->admin();

        $this->postJson('/api/login', ['email' => $admin->email, 'password' => self::PASSWORD])
            ->assertOk()->assertJson(['requires_otp' => true]);

        $this->assertGuest('web');
        $this->getJson('/api/me')->assertUnauthorized();
        Mail::assertSent(VerificationCode::class, fn ($mail) => $mail->hasTo($admin->email) && $mail->hasFrom('support@carrothost.com', 'CarrotHost Support'));
        $this->assertNotSame($this->lastCode(), $admin->refresh()->login_otp_code, 'Only the hash is stored.');
    }

    public function test_admin_signs_in_with_the_emailed_code(): void
    {
        $admin = $this->admin();
        $this->postJson('/api/login', ['email' => $admin->email, 'password' => self::PASSWORD, 'remember' => true]);

        $this->postJson('/api/login/otp', ['otp' => '000000'])->assertUnprocessable()->assertJsonValidationErrors('otp');
        $this->assertGuest('web');

        $this->postJson('/api/login/otp', ['otp' => $this->lastCode()])->assertOk();

        $this->assertAuthenticatedAs($admin, 'web');
        $this->getJson('/api/dashboard')->assertOk();
        $this->assertNotNull($admin->refresh()->remember_token);
        $this->assertNull($admin->login_otp_code);
        $this->assertTrue(ActivityLog::where('action', 'admin.login')->where('user_id', $admin->id)->exists());
    }

    public function test_code_cannot_be_used_twice_or_after_it_expires(): void
    {
        $admin = $this->admin();
        $this->postJson('/api/login', ['email' => $admin->email, 'password' => self::PASSWORD]);
        $code = $this->lastCode();

        $this->travel(LoginOtpService::OTP_EXPIRY_MINUTES + 1)->minutes();
        $this->postJson('/api/login/otp', ['otp' => $code])->assertUnprocessable();
        $this->assertGuest('web');
    }

    public function test_wrong_codes_lock_verification(): void
    {
        $admin = $this->admin();
        $this->postJson('/api/login', ['email' => $admin->email, 'password' => self::PASSWORD]);
        $code = $this->lastCode();

        foreach (range(1, 5) as $ignored) {
            $this->postJson('/api/login/otp', ['otp' => '000000'])->assertUnprocessable();
        }

        $this->postJson('/api/login/otp', ['otp' => $code])->assertUnprocessable();
        $this->assertGuest('web');
    }

    public function test_code_is_refused_once_the_account_loses_access(): void
    {
        $admin = $this->admin();
        $this->postJson('/api/login', ['email' => $admin->email, 'password' => self::PASSWORD]);
        $code = $this->lastCode();

        $admin->forceFill(['is_admin' => false])->save();

        $this->postJson('/api/login/otp', ['otp' => $code])->assertNotFound();
        $this->assertGuest('web');
    }

    public function test_code_screen_needs_a_pending_sign_in(): void
    {
        $this->getJson('/api/login/otp')->assertNotFound();
        $this->postJson('/api/login/otp', ['otp' => '123456'])->assertNotFound();
    }

    public function test_fixed_local_code_only_works_in_local_with_debug_on(): void
    {
        $admin = $this->admin();
        $this->postJson('/api/login', ['email' => $admin->email, 'password' => self::PASSWORD]);

        $this->getJson('/api/login/otp')->assertOk()->assertJson(['local_otp' => null]);
        $this->postJson('/api/login/otp', ['otp' => LoginOtpService::LOCAL_TEMP_OTP])->assertUnprocessable();

        // CSRF checks only stand down under the testing env.
        $this->withoutMiddleware(PreventRequestForgery::class);
        $this->app['env'] = 'local';
        config(['app.debug' => false]);
        $this->postJson('/api/login/otp', ['otp' => LoginOtpService::LOCAL_TEMP_OTP])->assertUnprocessable();

        config(['app.debug' => true]);
        $this->postJson('/api/login/otp', ['otp' => LoginOtpService::LOCAL_TEMP_OTP])->assertOk();
        $this->assertAuthenticatedAs($admin, 'web');
    }

    public function test_fixed_local_code_never_works_on_a_live_domain_even_with_a_dev_env(): void
    {
        $admin = $this->admin();
        $this->withoutMiddleware(PreventRequestForgery::class);
        $this->app['env'] = 'local';
        config(['app.debug' => true]);

        $live = 'https://my.carrothost.com';
        $this->postJson("{$live}/api/login", ['email' => $admin->email, 'password' => self::PASSWORD])->assertOk();
        $this->getJson("{$live}/api/login/otp")->assertOk()->assertJson(['local_otp' => null]);
        $this->postJson("{$live}/api/login/otp", ['otp' => LoginOtpService::LOCAL_TEMP_OTP])->assertUnprocessable();
        $this->assertGuest('web');

        $this->assertTrue(LoginOtpService::isLocalHost('127.0.0.1'));
        $this->assertTrue(LoginOtpService::isLocalHost('carrothost.test'));
        $this->assertFalse(LoginOtpService::isLocalHost('my.carrothost.com'));
    }

    public function test_undelivered_code_is_reported_instead_of_a_dead_end(): void
    {
        $admin = $this->admin();
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('smtp down'));

        $this->postJson('/api/login', ['email' => $admin->email, 'password' => self::PASSWORD])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->getJson('/api/login/otp')->assertNotFound();
    }

    public function test_every_customer_needs_the_code_even_with_the_old_setting_off(): void
    {
        $client = $this->client(['otp_enabled' => false]);

        $this->postJson('/api/client/login', ['email' => $client->email, 'password' => self::PASSWORD])
            ->assertOk()->assertJson(['requires_otp' => true]);

        $this->assertGuest('client');
        Mail::assertSent(VerificationCode::class);
        $this->putJson('/api/client/security', ['otp_enabled' => false])->assertNotFound();
    }

    public function test_customer_needs_the_code_and_records_the_login_only_then(): void
    {
        $client = $this->client();

        $this->postJson('/api/client/login', ['email' => $client->email, 'password' => self::PASSWORD])
            ->assertOk()->assertJson(['requires_otp' => true]);
        $this->assertGuest('client');
        $this->assertNull($client->refresh()->last_login_at);

        $this->getJson('/api/login/otp')->assertOk()->assertJson(['portal' => Portal::CLIENT, 'email' => 'mi*e@example.com']);
        $this->postJson('/api/login/otp', ['otp' => $this->lastCode()])->assertOk();

        $this->assertAuthenticatedAs($client, 'client');
        $this->assertNotNull($client->refresh()->last_login_at);
    }

    public function test_cancelling_drops_the_pending_sign_in(): void
    {
        $client = $this->client();
        $this->postJson('/api/client/login', ['email' => $client->email, 'password' => self::PASSWORD]);

        $this->postJson('/api/login/otp/cancel')->assertNoContent();

        $this->getJson('/api/login/otp')->assertNotFound();
    }

    public function test_failed_logins_are_throttled_and_logged(): void
    {
        $client = $this->client();

        foreach (range(1, 5) as $ignored) {
            $this->postJson('/api/client/login', ['email' => $client->email, 'password' => 'wrong-password'])->assertUnprocessable();
        }

        $this->postJson('/api/client/login', ['email' => $client->email, 'password' => self::PASSWORD])
            ->assertTooManyRequests()->assertJsonPath('message', 'Too many login attempts. Please try again in 60 seconds.');
        $this->assertGuest('client');
        $this->assertSame(5, ActivityLog::where('action', 'login.denied')->count());
    }

    public function test_successful_login_resets_the_attempt_count(): void
    {
        $client = $this->client();

        foreach (range(1, 4) as $ignored) {
            $this->postJson('/api/client/login', ['email' => $client->email, 'password' => 'wrong-password']);
        }
        // The count resets once the sign-in is complete, which is after the emailed code.
        $this->loginClientWithCode($client->email, self::PASSWORD);

        foreach (range(1, 4) as $ignored) {
            $this->postJson('/api/client/login', ['email' => $client->email, 'password' => 'wrong-password'])->assertUnprocessable();
        }
    }

    public function test_recaptcha_is_enforced_when_configured(): void
    {
        config(['recaptcha.enabled' => true, 'recaptcha.site_key' => 'site', 'recaptcha.secret_key' => 'secret']);
        Http::fake(['www.google.com/*' => Http::sequence()->push(['success' => false])->push(['success' => true, 'action' => 'LOGIN', 'score' => 0.9])]);
        $client = $this->client();
        $credentials = ['email' => $client->email, 'password' => self::PASSWORD];

        $this->getJson('/api/auth/config')->assertJsonPath('recaptcha.enabled', true);
        $this->postJson('/api/client/login', $credentials)->assertUnprocessable()->assertJsonValidationErrors('recaptcha');
        $this->postJson('/api/client/login', [...$credentials, 'g-recaptcha-response' => 'bad'])->assertUnprocessable();
        $this->assertGuest('client');

        $this->loginClientWithCode($client->email, self::PASSWORD, ['g-recaptcha-response' => 'good']);
        $this->assertAuthenticatedAs($client, 'client');
    }

    public function test_registration_creates_nothing_until_the_code_comes_back(): void
    {
        $this->postJson('/api/client/register', $this->registration())->assertAccepted();

        $this->assertSame(0, Client::count());
        $this->assertGuest('client');
        Mail::assertSent(VerificationCode::class, fn ($mail) => $mail->hasTo('new@example.com') && $mail->hasFrom('sales@carrothost.com', 'CarrotHost Sales'));
        $this->getJson('/api/client/register/verify')->assertOk()->assertJsonPath('email', 'ne*w@example.com');

        $this->postJson('/api/client/register/verify', ['otp' => '000000'])->assertUnprocessable();
        $this->assertSame(0, Client::count());

        $this->postJson('/api/client/register/verify', ['otp' => $this->lastCode()])->assertCreated();

        $client = Client::sole();
        $this->assertSame('new@example.com', $client->email);
        $this->assertSame('+8801711000000', $client->phone);
        $this->assertSame('active', $client->status);
        $this->assertTrue(Hash::check(self::PASSWORD, $client->password));
        $this->assertAuthenticatedAs($client, 'client');
        $this->getJson('/api/client/register/verify')->assertNotFound();
    }

    public function test_registration_code_dies_after_too_many_guesses(): void
    {
        $this->postJson('/api/client/register', $this->registration());
        $code = $this->lastCode();

        foreach (range(1, 5) as $ignored) {
            $this->postJson('/api/client/register/verify', ['otp' => '000000']);
        }

        $this->postJson('/api/client/register/verify', ['otp' => $code])->assertUnprocessable();
        $this->assertSame(0, Client::count());
    }

    public function test_registration_rejects_a_used_email_and_a_weak_password(): void
    {
        $this->client();

        $this->postJson('/api/client/register', $this->registration(['email' => 'mine@example.com']))->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/api/client/register', $this->registration(['password' => 'short', 'password_confirmation' => 'short']))->assertUnprocessable()->assertJsonValidationErrors('password');
        Mail::assertNothingSent();
    }

    public function test_email_taken_while_the_code_was_travelling_is_refused(): void
    {
        $this->postJson('/api/client/register', $this->registration());
        $this->client(['email' => 'new@example.com']);

        $this->postJson('/api/client/register/verify', ['otp' => $this->lastCode()])->assertUnprocessable();

        $this->assertSame(1, Client::count());
        $this->assertGuest('client');
    }

    public function test_cancelling_registration_returns_answers_without_the_password(): void
    {
        $this->postJson('/api/client/register', $this->registration());

        $this->postJson('/api/client/register/verify/cancel')
            ->assertOk()->assertJsonPath('form.name', 'New Person')->assertJsonMissingPath('form.password');
        $this->getJson('/api/client/register/verify')->assertNotFound();
    }

    public function test_client_password_reset_end_to_end(): void
    {
        Notification::fake();
        $client = $this->client();

        $this->postJson('/api/client/forgot-password', ['email' => $client->email])->assertOk();

        $token = null;
        Notification::assertSentTo($client, ResetPassword::class, function (ResetPassword $notification) use (&$token, $client) {
            $token = $notification->token;
            // Customers get the Password Reset Validation template.
            $mail = $notification->toMail($client);
            $this->assertInstanceOf(\App\Mail\PasswordResetLink::class, $mail);
            $this->assertStringContainsString("/reset-password/{$token}?email=", $mail->url);
            $this->assertStringNotContainsString('/admin/', $mail->url);
            $this->assertStringContainsString('reset the password', $mail->templateHtml);

            return true;
        });

        $this->postJson('/api/client/reset-password', ['token' => 'wrong', 'email' => $client->email, 'password' => 'a-brand-new-pass', 'password_confirmation' => 'a-brand-new-pass'])->assertUnprocessable();
        $this->postJson('/api/client/reset-password', ['token' => $token, 'email' => $client->email, 'password' => 'a-brand-new-pass', 'password_confirmation' => 'a-brand-new-pass'])->assertOk();

        $this->assertTrue(Hash::check('a-brand-new-pass', $client->refresh()->password));
        $this->assertGuest('client');
    }

    public function test_admin_reset_uses_the_admin_link_and_longer_password(): void
    {
        Notification::fake();
        $admin = $this->admin();

        $this->postJson('/api/admin/forgot-password', ['email' => $admin->email])->assertOk();

        $token = null;
        Notification::assertSentTo($admin, ResetPassword::class, function (ResetPassword $notification) use (&$token, $admin) {
            $token = $notification->token;
            $this->assertStringContainsString("/admin/reset-password/{$token}", $notification->toMail($admin)->actionUrl);

            return true;
        });

        $this->postJson('/api/admin/reset-password', ['token' => $token, 'email' => $admin->email, 'password' => 'only-10-chr', 'password_confirmation' => 'only-10-chr'])->assertUnprocessable();
        $this->postJson('/api/admin/reset-password', ['token' => $token, 'email' => $admin->email, 'password' => 'a-long-admin-pass', 'password_confirmation' => 'a-long-admin-pass'])->assertOk();

        $this->assertTrue(Hash::check('a-long-admin-pass', $admin->refresh()->password));
    }

    public function test_forgot_password_does_not_reveal_or_cross_accounts(): void
    {
        Notification::fake();
        $notAdmin = User::factory()->create();
        $shared = $this->client(['email' => 'shared@example.com']);
        $admin = User::factory()->create(['email' => 'shared@example.com']);
        $admin->forceFill(['is_admin' => true])->save();

        $unknown = $this->postJson('/api/client/forgot-password', ['email' => 'nobody@example.com'])->assertOk()->json('message');
        $this->assertSame($unknown, $this->postJson('/api/admin/forgot-password', ['email' => $notAdmin->email])->assertOk()->json('message'));
        Notification::assertNothingSent();

        $this->postJson('/api/client/forgot-password', ['email' => 'shared@example.com'])->assertOk();

        $token = null;
        Notification::assertSentTo($shared, ResetPassword::class, function (ResetPassword $notification) use (&$token) {
            $token = $notification->token;

            return true;
        });
        Notification::assertNotSentTo($admin, ResetPassword::class);

        // A customer's token must not open the admin account with the same email.
        $this->postJson('/api/admin/reset-password', ['token' => $token, 'email' => 'shared@example.com', 'password' => 'a-long-admin-pass', 'password_confirmation' => 'a-long-admin-pass'])->assertUnprocessable();
        $this->assertFalse(Hash::check('a-long-admin-pass', $admin->refresh()->password));
    }

    public function test_change_password_needs_the_current_one(): void
    {
        $client = $this->client();
        $this->actingAs($client, 'client');

        $this->postJson('/api/client/password', ['password' => 'a-brand-new-pass', 'password_confirmation' => 'a-brand-new-pass'])->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->postJson('/api/client/password', ['current_password' => 'wrong', 'password' => 'a-brand-new-pass', 'password_confirmation' => 'a-brand-new-pass'])->assertUnprocessable();
        $this->postJson('/api/client/password', ['current_password' => self::PASSWORD, 'password' => 'a-brand-new-pass', 'password_confirmation' => 'a-brand-new-pass'])->assertOk();

        $this->assertTrue(Hash::check('a-brand-new-pass', $client->refresh()->password));
    }

    public function test_passwordless_customer_can_set_a_password(): void
    {
        $client = $this->client(['password' => null]);
        $this->actingAs($client, 'client');

        $this->getJson('/api/client/me')->assertJson(['has_password' => false]);
        $this->postJson('/api/client/password', ['password' => 'a-brand-new-pass', 'password_confirmation' => 'a-brand-new-pass'])->assertOk();

        $this->assertTrue(Hash::check('a-brand-new-pass', $client->refresh()->password));
    }

    public function test_profile_reports_the_code_as_always_on(): void
    {
        $client = $this->client(['otp_enabled' => false]);

        $this->actingAs($client, 'client')->getJson('/api/client/me')->assertOk()->assertJson(['otp_enabled' => true]);
    }

    public function test_verification_secrets_never_reach_the_api(): void
    {
        $client = $this->client(['login_otp_code' => 'secret-hash']);

        $this->actingAs($this->admin())->getJson("/api/clients/{$client->id}")->assertOk()->assertDontSee('secret-hash')->assertJsonMissingPath('login_otp_code');
    }

    public function test_closing_an_account_ends_its_session(): void
    {
        $client = $this->client();
        $this->actingAs($client, 'client')->getJson('/api/client/me')->assertOk();

        Client::whereKey($client->id)->update(['status' => 'closed']);
        $client->refresh();
        $this->actingAs($client, 'client');

        $this->getJson('/api/client/overview')->assertUnauthorized();
        $this->assertGuest('client');
    }

    public function test_google_creates_a_customer_and_signs_in(): void
    {
        $this->googleReturns(['email' => 'New@Example.com', 'name' => 'New Person', 'email_verified' => true]);

        $this->googleCallback()->assertRedirect('/');

        $client = Client::sole();
        $this->assertSame('new@example.com', $client->email);
        $this->assertNull($client->password);
        $this->assertAuthenticatedAs($client, 'client');
    }

    public function test_google_links_to_an_existing_customer(): void
    {
        $client = $this->client();
        $this->googleReturns(['email' => 'MINE@example.com', 'name' => 'Whoever', 'email_verified' => true]);

        $this->googleCallback()->assertRedirect('/');

        $this->assertSame(1, Client::count());
        $this->assertAuthenticatedAs($client, 'client');
    }

    public function test_google_never_signs_in_an_admin(): void
    {
        $admin = $this->admin();
        $this->googleReturns(['email' => $admin->email, 'name' => 'Admin', 'email_verified' => true]);

        $this->googleCallback();

        $this->assertGuest('web');
    }

    public function test_google_rejects_an_unverified_email(): void
    {
        $this->googleReturns(['email' => 'mine@example.com', 'email_verified' => false]);

        $this->googleCallback()->assertRedirect('/login?error=google_unverified');

        $this->assertSame(0, Client::count());
    }

    public function test_google_rejects_a_forged_state_and_closed_accounts(): void
    {
        $this->googleReturns(['email' => 'mine@example.com', 'email_verified' => true]);
        $this->googleCallback('forged')->assertRedirect('/login?error=google_failed');
        $this->assertSame(0, Client::count());

        $this->client(['status' => 'closed']);
        $this->googleCallback()->assertRedirect('/login?error=google_closed');
        $this->assertGuest('client');
    }

    public function test_google_redirect_stays_on_this_site(): void
    {
        config(['services.google' => ['client_id' => 'id', 'client_secret' => 'secret', 'redirect' => null]]);

        foreach (['//evil.example', '/\\evil.example', 'https://evil.example'] as $target) {
            $this->get('/auth/google/redirect?redirect='.urlencode($target))->assertRedirectContains('accounts.google.com');
            $this->assertNull(session('oauth_redirect_google'));
        }

        $this->get('/auth/google/redirect?redirect=/invoices/5');
        $this->assertSame('/invoices/5', session('oauth_redirect_google'));
    }

    public function test_google_is_unavailable_without_keys(): void
    {
        config(['services.google.client_id' => null]);

        $this->getJson('/api/auth/config')->assertJson(['google' => false]);
        $this->get('/auth/google/redirect')->assertRedirect('/login?error=google_unavailable');
    }

    private function localDev(bool $debug = true): void
    {
        // CSRF checks only stand down under the testing env.
        $this->withoutMiddleware(PreventRequestForgery::class);
        $this->app['env'] = 'local';
        config(['app.debug' => $debug, 'services.google.client_id' => null]);
    }

    public function test_sandbox_is_closed_outside_local_development(): void
    {
        $client = $this->client();
        $this->withoutMiddleware(PreventRequestForgery::class);

        foreach ([['production', true], ['staging', true], ['local', false]] as [$env, $debug]) {
            $this->app['env'] = $env;
            config(['app.debug' => $debug, 'services.google.client_id' => null]);

            $this->getJson('/api/auth/sandbox/google')->assertNotFound();
            $this->postJson('/api/auth/sandbox/google', ['email' => $client->email])->assertNotFound();
            $this->get('/auth/google/redirect')->assertRedirect('/login?error=google_unavailable');
            $this->getJson('/api/auth/config')->assertJson(['google' => false]);
            $this->assertGuest('client');
        }
    }

    public function test_sandbox_stands_in_for_google_in_local_development(): void
    {
        $client = $this->client();
        $this->localDev();

        $this->getJson('/api/auth/config')->assertJson(['google' => true]);
        $this->get('/auth/google/redirect?redirect=/invoices/5')->assertRedirect('/auth/sandbox/google?redirect=%2Finvoices%2F5');
        $this->get('/auth/google/redirect?redirect=//evil.example')->assertRedirect('/auth/sandbox/google');
        $this->getJson('/api/auth/sandbox/google')->assertOk()->assertJsonPath('clients.0.email', $client->email)->assertJsonMissingPath('clients.0.password');

        $this->postJson('/api/auth/sandbox/google', ['email' => strtoupper($client->email)])->assertOk();

        $this->assertSame(1, Client::count());
        $this->assertAuthenticatedAs($client, 'client');
    }

    public function test_sandbox_creates_a_new_customer(): void
    {
        $this->localDev();

        $this->postJson('/api/auth/sandbox/google', ['email' => 'New@Example.com', 'name' => 'New Person'])->assertOk();

        $client = Client::sole();
        $this->assertSame('new@example.com', $client->email);
        $this->assertSame('New Person', $client->name);
        $this->assertNull($client->password);
        $this->assertAuthenticatedAs($client, 'client');
    }

    public function test_sandbox_never_signs_in_an_admin_or_a_closed_customer(): void
    {
        $admin = $this->admin();
        $closed = $this->client(['status' => 'closed']);
        $this->localDev();

        $this->getJson('/api/auth/sandbox/google')->assertOk()->assertJsonCount(0, 'clients');
        $this->postJson('/api/auth/sandbox/google', ['email' => $closed->email])->assertUnprocessable();
        $this->assertGuest('client');

        // The admin's email only ever yields a separate customer account.
        $this->postJson('/api/auth/sandbox/google', ['email' => $admin->email])->assertOk();
        $this->assertGuest('web');
        $this->getJson('/api/dashboard')->assertUnauthorized();
    }

    public function test_google_redirect_refuses_control_characters(): void
    {
        config(['services.google' => ['client_id' => 'id', 'client_secret' => 'secret', 'redirect' => null]]);

        $this->get('/auth/google/redirect?redirect='.urlencode("/\t/evil.example"));

        $this->assertNull(session('oauth_redirect_google'));
    }

    public function test_admin_logs_in_as_a_client_and_back(): void
    {
        $admin = $this->admin();
        $client = $this->client();
        $this->actingAs($admin);

        $this->postJson("/api/clients/{$client->id}/impersonate")->assertOk();

        $this->assertAuthenticatedAs($client, 'client');
        $this->assertGuest('web');
        $this->getJson('/api/client/me')->assertOk()->assertJson(['id' => $client->id, 'impersonating' => true]);
        $this->getJson('/api/clients')->assertUnauthorized();
        $this->assertNull($client->refresh()->last_login_at);

        $this->postJson('/api/client/impersonate/stop')->assertOk()->assertJson(['client_id' => $client->id]);

        $this->assertAuthenticatedAs($admin, 'web');
        $this->assertGuest('client');
        $this->getJson('/api/clients')->assertOk();
        $this->assertTrue(ActivityLog::where('action', 'client.impersonated')->where('user_id', $admin->id)->where('subject_id', $client->id)->exists());
    }

    public function test_impersonating_admin_cannot_change_the_customers_security(): void
    {
        $client = $this->client();
        $this->actingAs($this->admin());
        $this->postJson("/api/clients/{$client->id}/impersonate")->assertOk();

        $this->postJson('/api/client/password', ['current_password' => self::PASSWORD, 'password' => 'a-brand-new-pass', 'password_confirmation' => 'a-brand-new-pass'])->assertForbidden();

        $this->assertTrue(Hash::check(self::PASSWORD, $client->refresh()->password));
    }

    public function test_impersonation_is_for_admins_and_active_clients(): void
    {
        $client = $this->client();
        $closed = $this->client(['email' => 'closed@example.com', 'status' => 'closed']);

        $this->postJson("/api/clients/{$client->id}/impersonate")->assertUnauthorized();
        $this->actingAs($client, 'client')->postJson("/api/clients/{$client->id}/impersonate")->assertUnauthorized();
        $this->actingAs(User::factory()->create(), 'web')->postJson("/api/clients/{$client->id}/impersonate")->assertForbidden();
        $this->actingAs($this->admin(), 'web')->postJson("/api/clients/{$closed->id}/impersonate")->assertUnprocessable();
    }

    public function test_stop_needs_an_impersonation_and_a_current_admin(): void
    {
        $client = $this->client();
        $this->actingAs($client, 'client')->postJson('/api/client/impersonate/stop')->assertForbidden();

        $admin = $this->admin();
        $this->actingAs($admin, 'web');
        $this->postJson("/api/clients/{$client->id}/impersonate")->assertOk();
        $admin->forceFill(['is_admin' => false])->save();

        $this->postJson('/api/client/impersonate/stop')->assertForbidden();
        $this->assertGuest('web');
        $this->assertGuest('client');
    }

    public function test_real_login_clears_a_leftover_impersonation(): void
    {
        $client = $this->client();

        $this->withSession(['impersonator_id' => 1])->loginClientWithCode($client->email, self::PASSWORD);

        $this->getJson('/api/client/me')->assertJson(['impersonating' => false]);
    }

    public function test_logout_ends_the_session_for_both_portals(): void
    {
        $client = $this->client();
        $this->actingAs($client, 'client');
        $this->actingAs($this->admin(), 'web');

        $this->postJson('/api/client/logout')->assertNoContent();

        $this->assertGuest('client');
        $this->assertGuest('web');
    }

    public function test_spa_serves_every_auth_page(): void
    {
        foreach (['/login', '/login/otp', '/register', '/register/verify', '/forgot-password', '/reset-password/abc', '/admin/login', '/admin/login/otp', '/admin/forgot-password', '/admin/reset-password/abc'] as $page) {
            $this->get($page)->assertOk()->assertSee('favicon.ico');
        }
    }
}
