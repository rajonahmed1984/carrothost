<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Ticket;
use App\Models\User;
use App\Services\BillingService;
use App\Services\RenewalService;
use App\Services\TicketService;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    private function valid(array $overrides = []): array
    {
        return [
            'company_name' => 'Carrot Cloud', 'time_zone' => 'Asia/Dhaka', 'currency' => 'BDT',
            'invoice_due_days' => 0, 'renewal_notice_days' => 14, 'suspension_enabled' => '1', 'suspend_after_days' => 3,
            'unsuspension_enabled' => '1', 'ticket_auto_close_days' => 0, 'recaptcha_enabled' => '0',
            ...$overrides,
        ];
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        return $admin;
    }

    public function test_saved_settings_override_config_and_reach_the_public_branding(): void
    {
        // USD as the default for new clients needs a USD rate.
        $this->actingAs($this->admin())->postJson('/api/settings', $this->valid(['currency' => 'USD']))->assertJsonValidationErrors('usd_rate');

        $this->postJson('/api/settings', $this->valid(['currency' => 'USD', 'usd_rate' => '121.5', 'pay_to_text' => "House 1\nDhaka"]))
            ->assertOk()
            ->assertJsonPath('settings.company_name', 'Carrot Cloud')
            ->assertJsonPath('settings.currency', 'USD');

        $this->assertSame('Carrot Cloud', config('app.name'));
        $this->assertSame('Carrot Cloud', config('mail.from.name'));
        $this->assertSame(121.5, config('billing.exchange_rates.USD'));
        // Admin figures stay in BDT; USD is what a new client starts in.
        $this->getJson('/api/auth/config')->assertJsonPath('branding.name', 'Carrot Cloud')
            ->assertJsonPath('branding.currency', 'BDT')->assertJsonPath('branding.default_currency', 'USD');

        $client = Client::create(['name' => 'A', 'email' => 'a@example.com']);
        $this->assertSame('USD', $client->currency);
        $invoice = app(BillingService::class)->createInvoice($client, [['description' => 'X', 'amount' => '1.00']], now());
        $this->assertSame('USD', $invoice->currency);
    }

    public function test_secrets_are_encrypted_never_returned_and_kept_when_blank(): void
    {
        $this->actingAs($this->admin());

        $this->postJson('/api/settings', $this->valid(['mail_host' => 'smtp.test', 'mail_port' => 587, 'mail_from_address' => 'billing@example.com', 'mail_password' => 'hunter2-secret']))
            ->assertOk()
            ->assertJsonPath('secrets.mail_password', true)
            ->assertDontSee('hunter2-secret');

        $this->assertNotSame('hunter2-secret', Setting::find('mail_password')->value);
        $this->assertSame('smtp', config('mail.default'));
        $this->assertSame('hunter2-secret', config('mail.mailers.smtp.password'));

        $this->postJson('/api/settings', $this->valid(['mail_host' => 'smtp.test', 'mail_port' => 587, 'mail_from_address' => 'billing@example.com']))->assertOk();
        $this->assertSame('hunter2-secret', config('mail.mailers.smtp.password'));
    }

    public function test_recaptcha_needs_keys_and_settings_need_an_admin(): void
    {
        $this->postJson('/api/settings', $this->valid())->assertUnauthorized();
        $this->actingAs(User::factory()->create())->postJson('/api/settings', $this->valid())->assertForbidden();

        config(['recaptcha.secret_key' => null]);
        $this->actingAs($this->admin())->postJson('/api/settings', $this->valid(['recaptcha_enabled' => '1', 'recaptcha_site_key' => 'site']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('recaptcha_secret_key');
    }

    public function test_logo_upload_and_removal(): void
    {
        Storage::fake('branding');
        $this->actingAs($this->admin());

        $this->postJson('/api/settings', $this->valid(['logo' => UploadedFile::fake()->create('logo.svg', 5, 'image/svg+xml')]))->assertJsonValidationErrors('logo');

        $this->postJson('/api/settings', $this->valid(['logo' => UploadedFile::fake()->image('logo.png')]))->assertOk()->assertJsonPath('custom_logo', true);
        $path = config('billing.logo_path');
        Storage::disk('branding')->assertExists($path);
        $this->getJson('/api/auth/config')->assertJsonPath('branding.logo_url', asset("uploads/branding/{$path}"));

        $this->postJson('/api/settings', $this->valid(['remove_logo' => '1']))->assertOk()->assertJsonPath('custom_logo', false);
        Storage::disk('branding')->assertMissing($path);
    }

    public function test_automation_settings_change_behaviour(): void
    {
        Settings::save(['invoice_due_days' => 7, 'suspension_enabled' => false, 'ticket_auto_close_days' => 3]);

        $product = Product::create(['name' => 'Starter', 'type' => 'other']);
        $product->prices()->create(['cycle' => 'monthly', 'price' => '10.00']);
        $client = Client::create(['name' => 'A', 'email' => 'a@example.com']);
        $order = app(BillingService::class)->createOrder($client, [['product_id' => $product->id, 'cycle' => 'monthly']]);
        $this->assertSame(now()->addDays(7)->toDateString(), $order->invoices()->first()->due_date->toDateString());

        $client->services()->first()->update(['status' => 'active', 'next_due_date' => now()->subDays(30)]);
        $this->assertSame(0, app(RenewalService::class)->suspendOverdue());

        $stale = $client->tickets()->create(['number' => '100001', 'department' => 'support', 'subject' => 'Old', 'status' => 'answered', 'last_reply_at' => now()->subDays(5)]);
        $fresh = $client->tickets()->create(['number' => '100002', 'department' => 'support', 'subject' => 'New', 'status' => 'answered', 'last_reply_at' => now()->subDay()]);
        $this->assertSame(1, app(TicketService::class)->autoClose());
        $this->assertSame('closed', $stale->refresh()->status);
        $this->assertSame('answered', $fresh->refresh()->status);
    }
}
