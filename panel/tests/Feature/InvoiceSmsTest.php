<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\SmsLog;
use App\Models\User;
use App\Services\AutomationService;
use App\Services\BillingService;
use App\Services\CreditService;
use App\Services\SmsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class InvoiceSmsTest extends TestCase
{
    use RefreshDatabase;

    private const GATEWAY = 'https://www.24bulksmsbd.com/api/smsSendApi';

    private array $reply = ['status' => 'success', 'message' => 'SMS sent successfully'];

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'sms.enabled' => true,
            'sms.api_url' => self::GATEWAY,
            'sms.customer_id' => '1681',
            'sms.api_key' => 'test-key',
        ]);
        Http::fake([self::GATEWAY => fn () => Http::response($this->reply)]);
    }

    private function client(?string $phone = '+880.1705-651960'): Client
    {
        return Client::create(['name' => 'Rahim', 'email' => uniqid('rahim').'@example.com', 'phone' => $phone]);
    }

    private function invoice(Client $client, string $amount = '1000.00', ?string $due = null): Invoice
    {
        return app(BillingService::class)->createInvoice($client, [['description' => 'Hosting', 'amount' => $amount]], $due ? now()->parse($due) : now()->addDays(7));
    }

    public function test_a_new_invoice_texts_the_client(): void
    {
        $invoice = $this->invoice($this->client());

        Http::assertSent(fn (Request $r) => $r->url() === self::GATEWAY
            && $r['customer_id'] === '1681' && $r['api_key'] === 'test-key'
            && $r['mobile_no'] === '8801705651960'
            && str_contains($r['message'], "invoice #{$invoice->number} of BDT 1,000.00 has been created")
            && str_contains($r['message'], url("invoices/{$invoice->id}")));

        $this->assertDatabaseHas('sms_logs', ['invoice_id' => $invoice->id, 'event' => 'invoice_created', 'status' => 'sent', 'mobile' => '8801705651960']);
    }

    public function test_payment_texts_a_confirmation(): void
    {
        $invoice = $this->invoice($this->client());
        app(BillingService::class)->recordPayment($invoice, 'manual', 'TX1', '1000.00');

        $this->assertDatabaseHas('sms_logs', ['invoice_id' => $invoice->id, 'event' => 'invoice_paid', 'status' => 'sent']);
        Http::assertSentCount(2);
    }

    public function test_an_invoice_paid_by_credit_gets_only_the_paid_sms(): void
    {
        $client = $this->client();
        app(CreditService::class)->add($client, '5000.00', 'Opening balance');

        $invoice = $this->invoice($client);

        $this->assertSame('paid', $invoice->refresh()->status);
        $this->assertSame(['invoice_paid'], SmsLog::pluck('event')->all());
    }

    public function test_reminders_text_the_client_once_per_notice(): void
    {
        config(['billing.reminders.before_due_days' => 0, 'billing.reminders.overdue_days' => [1, 7, 14]]);
        $invoice = $this->invoice($this->client(), '500.00', now()->subDays(2)->toDateString());

        app(AutomationService::class)->invoiceReminders();
        app(AutomationService::class)->invoiceReminders();

        $reminders = SmsLog::where('event', 'invoice_reminder')->get();
        $this->assertCount(1, $reminders);
        $this->assertStringContainsString("invoice #{$invoice->number} of BDT 500.00 is unpaid", $reminders[0]->message);
    }

    public function test_switched_off_events_and_numbers_the_gateway_cannot_reach_send_nothing(): void
    {
        config(['sms.invoice.created' => false]);
        $this->invoice($this->client());
        $this->assertSame(0, SmsLog::count());

        config(['sms.invoice.created' => true]);
        $foreign = $this->invoice(Client::create(['name' => 'Bob', 'email' => 'bob@example.com', 'phone' => '+1 415 555 0100']));
        $this->assertDatabaseHas('sms_logs', ['invoice_id' => $foreign->id, 'status' => 'skipped']);

        config(['sms.enabled' => false]);
        $this->invoice($this->client('01811111111'));

        Http::assertNothingSent();
    }

    public function test_a_gateway_rejection_is_logged_as_failed(): void
    {
        $this->reply = ['status' => 'failed', 'message' => 'IP not whitelisted'];

        $invoice = $this->invoice($this->client());

        $this->assertDatabaseHas('sms_logs', ['invoice_id' => $invoice->id, 'status' => 'failed', 'response' => 'IP not whitelisted']);
    }

    public function test_mobile_numbers_are_normalised(): void
    {
        $sms = app(SmsService::class);

        $this->assertSame('8801711210583', $sms->normalizeMobile('1711-210583'));
        $this->assertSame('8801747424667', $sms->normalizeMobile('+880.1747424667'));
        $this->assertSame('8801811111111', $sms->normalizeMobile('01811111111'));
        $this->assertSame('8801811111111', $sms->normalizeMobile('02-9999999, 01811111111'));
        $this->assertNull($sms->normalizeMobile('+1 415 555 0100'));
        $this->assertNull($sms->normalizeMobile(null));
    }

    public function test_admin_saves_sms_settings_and_sends_a_test(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        config(['sms.api_key' => null]);

        $form = [
            'company_name' => 'Carrot Host', 'time_zone' => 'Asia/Dhaka', 'currency' => 'BDT', 'invoice_due_days' => 0, 'renewal_notice_days' => 14,
            'suspension_enabled' => '0', 'suspend_after_days' => 3, 'unsuspension_enabled' => '0', 'ticket_auto_close_days' => 0, 'recaptcha_enabled' => '0',
            'sms_enabled' => '1', 'sms_api_url' => self::GATEWAY, 'sms_customer_id' => '1681',
            'sms_invoice_created_enabled' => '1', 'sms_invoice_paid_enabled' => '0', 'sms_invoice_reminder_enabled' => '1',
            'sms_invoice_created_template' => 'Hi {{client_name}}, pay {{invoice_total}}',
            'sms_invoice_paid_template' => config('sms.templates.invoice_paid'),
        ];

        $this->actingAs($admin)->postJson('/api/settings', $form)->assertJsonValidationErrors('sms_api_key');

        $this->postJson('/api/settings', $form + ['sms_api_key' => 'secret-key'])
            ->assertOk()
            ->assertJsonPath('settings.sms_enabled', true)
            ->assertJsonPath('settings.sms_invoice_paid_enabled', false)
            ->assertJsonPath('secrets.sms_api_key', true)
            ->assertJsonMissingPath('settings.sms_api_key');

        $this->assertSame('secret-key', config('sms.api_key'));
        $this->assertNotSame('secret-key', \App\Models\Setting::find('sms_api_key')->value);
        $this->assertSame('Hi {{client_name}}, pay {{invoice_total}}', config('sms.templates.invoice_created'));
        // The unchanged default is stored blank.
        $this->assertNull(\App\Models\Setting::find('sms_invoice_paid_template')->value);

        $this->postJson('/api/settings/test-sms', ['mobile' => '12345'])->assertJsonValidationErrors('mobile');
        $this->postJson('/api/settings/test-sms', ['mobile' => '01811111111'])->assertOk();
        Http::assertSent(fn (Request $r) => $r['mobile_no'] === '8801811111111' && $r['api_key'] === 'secret-key');

        $this->getJson('/api/settings/sms-logs')->assertOk()->assertJsonPath('0.event', 'test')->assertJsonPath('0.status', 'sent');
    }
}
