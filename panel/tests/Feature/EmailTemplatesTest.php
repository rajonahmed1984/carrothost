<?php

namespace Tests\Feature;

use App\Mail\CustomerNotice;
use App\Models\Client;
use App\Models\User;
use App\Services\BillingService;
use App\Support\EmailTemplates;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailTemplatesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);
    }

    private function invoice(): \App\Models\Invoice
    {
        $client = Client::create(['name' => 'Karim Rahman', 'email' => 'karim@example.com']);

        return app(BillingService::class)->createInvoice($client, [['description' => 'Hosting <b>Plan</b>', 'amount' => '500.00']], now()->addDays(7));
    }

    public function test_templates_are_listed_in_groups(): void
    {
        $groups = collect($this->getJson('/api/settings/email-templates')->assertOk()->json('groups'));

        $this->assertSame(['General Messages', 'Product/Service Messages', 'Domain Messages', 'Invoice Messages', 'Support Messages'], $groups->pluck('name')->all());
        $invoice = collect($groups->firstWhere('key', 'invoice')['templates']);
        $this->assertSame(['invoice_created', 'invoice_payment_reminder', 'invoice_overdue', 'invoice_payment_confirmation'], $invoice->pluck('key')->all());
        $this->assertTrue($invoice->firstWhere('key', 'invoice_created')['is_active']);
        $this->assertTrue(collect($groups->firstWhere('key', 'general')['templates'])->firstWhere('key', 'login_code')['locked']);
    }

    public function test_an_edited_template_is_what_the_customer_gets(): void
    {
        Mail::fake();
        $this->putJson('/api/settings/email-templates/invoice_created', [
            'subject' => 'Bill {$invoice_number} for {$client_first_name}',
            'body' => '<p>Hi {$client_name}, pay {$invoice_total} <a href="{$invoice_link}">here</a>.</p>{$invoice_items}<script>alert(1)</script>',
        ])->assertOk()->assertJsonPath('customized', true);

        $invoice = $this->invoice();

        Mail::assertSent(CustomerNotice::class, function (CustomerNotice $m) use ($invoice) {
            return $m->subjectLine === "Bill {$invoice->number} for Karim"
                && str_contains($m->richBody, 'Hi Karim Rahman, pay BDT 500.00')
                && str_contains($m->richBody, 'href="'.url("invoices/{$invoice->id}").'"')
                && str_contains($m->richBody, 'Hosting &lt;b&gt;Plan&lt;/b&gt;')
                && ! str_contains($m->richBody, '<script');
        });
    }

    public function test_a_turned_off_template_sends_nothing_and_locked_ones_stay_on(): void
    {
        Mail::fake();
        $this->postJson('/api/settings/email-templates/invoice_created/toggle', ['is_active' => false])->assertOk();
        $this->invoice();
        Mail::assertNothingSent();

        $this->postJson('/api/settings/email-templates/login_code/toggle', ['is_active' => false])->assertJsonValidationErrors('is_active');
        $this->putJson('/api/settings/email-templates/login_code', ['subject' => 'Code', 'body' => '<p>No code here</p>'])->assertJsonValidationErrors('body');
        $this->assertTrue(EmailTemplates::current('login_code')['is_active']);
    }

    public function test_reset_preview_and_unknown_keys(): void
    {
        $this->putJson('/api/settings/email-templates/order_accepted', ['subject' => 'Changed', 'body' => '<p>Changed</p>'])->assertOk();
        $this->deleteJson('/api/settings/email-templates/order_accepted')->assertOk()
            ->assertJsonPath('customized', false)->assertJsonPath('subject', 'Your order #{$order_number} has been accepted');

        $this->postJson('/api/settings/email-templates/invoice_created/preview', ['subject' => 'Invoice {$invoice_number}', 'body' => '<p>{$client_name} {$unknown_field}</p>'])
            ->assertOk()->assertJsonPath('subject', 'Invoice 10021')->assertJsonPath('html', '<p>Md Shoriful Islam </p>');

        $this->getJson('/api/settings/email-templates/nope')->assertNotFound();
    }
}
