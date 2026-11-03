<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Gateway;
use App\Models\Invoice;
use App\Services\Auth\LoginService;
use App\Services\PaymentService;
use App\Support\Auth\Portal;
use Illuminate\Http\Request;

/** The customer's own data. Every query starts from the signed-in client. */
class AccountController extends Controller
{
    public function login(Request $request, LoginService $login)
    {
        return $login->authenticate($request, Portal::CLIENT);
    }

    public function logout(Request $request, LoginService $login)
    {
        $login->logout($request);

        return response()->noContent();
    }

    public function me(Request $request)
    {
        return $this->profile($request);
    }

    /** The emailed code at sign-in is the customer's own choice, so an admin logged in as them cannot change it. */
    public function security(Request $request)
    {
        abort_if($request->session()->has(LoginService::IMPERSONATOR), 403, 'Security settings cannot be changed while logged in as a client.');

        $data = $request->validate(['otp_enabled' => 'required|boolean']);
        $request->user('client')->update($data);
        ActivityLog::record($data['otp_enabled'] ? 'client.otp_enabled' : 'client.otp_disabled', $request->user('client'));

        return $this->profile($request);
    }

    public function overview(Request $request)
    {
        $client = $request->user('client');

        return [
            'services' => $client->services()
                ->with('product:id,name')
                ->latest()
                ->get(['id', 'product_id', 'domain', 'cycle', 'recurring_amount', 'status', 'next_due_date']),
            'domains' => $client->domains()
                ->latest()
                ->get(['id', 'name', 'status', 'expires_at', 'recurring_amount']),
            'invoices' => $client->invoices()
                ->latest()
                ->limit(200)
                ->get(['id', 'number', 'status', 'currency', 'total', 'due_date']),
            'open_tickets' => $client->tickets()->where('status', '!=', 'closed')->count(),
            'renewals' => $this->renewals($client),
            'activity' => $this->activity($client),
        ];
    }

    /** Live services and domains falling due in the next 90 days, soonest first. */
    private function renewals(Client $client): array
    {
        $until = today()->addDays(90);

        $services = $client->services()->with('product:id,name')->where('status', 'active')
            ->whereNotNull('next_due_date')->whereDate('next_due_date', '<=', $until)->get()
            ->map(fn ($s) => ['type' => 'service', 'id' => $s->id, 'name' => $s->product->name, 'detail' => $s->domain, 'due' => $s->next_due_date->toDateString(), 'amount' => $s->recurring_amount]);

        $domains = $client->domains()->where('status', 'active')->where('auto_renew', true)
            ->whereNotNull('expires_at')->whereDate('expires_at', '<=', $until)->get()
            ->map(fn ($d) => ['type' => 'domain', 'id' => $d->id, 'name' => $d->name, 'detail' => "{$d->years} yr renewal", 'due' => $d->expires_at->toDateString(), 'amount' => $d->recurring_amount]);

        return $services->concat($domains)->sortBy('due')->take(5)->values()->all();
    }

    /** A customer-facing feed built from tickets, invoices, services and domains (the admin log is not shown). */
    private function activity(Client $client): array
    {
        $tickets = $client->tickets()->latest('last_reply_at')->limit(5)->get()->map(fn ($t) => [
            'type' => 'ticket',
            'title' => "Ticket #{$t->number} ".(['open' => 'opened', 'answered' => 'answered', 'customer_reply' => 'updated', 'on_hold' => 'on hold', 'closed' => 'closed'][$t->status] ?? $t->status),
            'detail' => $t->subject,
            'link' => "/tickets/{$t->id}",
            'at' => ($t->last_reply_at ?? $t->created_at)?->toIso8601String(),
        ]);

        $invoices = $client->invoices()->whereIn('status', ['paid', 'unpaid'])->latest('updated_at')->limit(5)->get()->map(fn ($i) => [
            'type' => 'invoice',
            'title' => "Invoice #{$i->number} ".($i->status === 'paid' ? 'paid' : 'issued'),
            'detail' => $i->status === 'paid' ? "Amount: {$i->currency} {$i->total}" : "Due {$i->due_date->toDateString()}: {$i->currency} {$i->total}",
            'link' => "/invoices/{$i->id}",
            'at' => ($i->status === 'paid' ? $i->paid_at : null)?->toIso8601String() ?? $i->created_at?->toIso8601String(),
        ]);

        $services = $client->services()->with('product:id,name')->latest()->limit(5)->get()->map(fn ($s) => [
            'type' => 'service',
            'title' => "{$s->product->name} ordered",
            'detail' => $s->domain,
            'link' => '/services',
            'at' => $s->created_at?->toIso8601String(),
        ]);

        return $tickets->concat($invoices)->concat($services)->filter(fn ($a) => $a['at'])->sortByDesc('at')->take(6)->values()->all();
    }

    public function invoices(Request $request)
    {
        return $request->user('client')->invoices()
            ->latest()
            ->latest('id')
            ->get(['id', 'number', 'status', 'currency', 'total', 'due_date', 'paid_at', 'created_at']);
    }

    public function invoice(Request $request, int $id, PaymentService $payments)
    {
        /** @var Invoice $invoice */
        $invoice = $request->user('client')->invoices()->findOrFail($id);
        $enabled = Gateway::where('is_enabled', true)->get()->keyBy('code');
        $unpaid = $invoice->status === 'unpaid';

        $client = $request->user('client');

        return [
            ...$invoice->only('id', 'number', 'status', 'currency', 'total', 'due_date', 'paid_at', 'created_at'),
            'balance' => $payments->balance($invoice),
            'pay_to' => config('billing.pay_to'),
            'company' => ['name' => config('app.name'), 'email' => config('billing.company_email')],
            'client' => $client->only('name', 'company', 'email', 'phone', 'address', 'city', 'country'),
            'items' => $invoice->items()->get(['id', 'description', 'amount', 'kind', 'service_id', 'domain_id']),
            'payments' => $invoice->payments()->oldest()->get(['id', 'gateway', 'transaction_id', 'amount', 'created_at'])
                ->map(fn ($payment) => [...$payment->toArray(), 'gateway_name' => config("billing.gateways.{$payment->gateway}.name", $payment->gateway)]),
            'payment_instructions' => $unpaid ? ($enabled->get('manual')?->config['instructions'] ?? null) : null,
            'gateways' => $unpaid
                ? $enabled->except('manual')
                    ->filter(fn (Gateway $gateway) => config("billing.gateways.{$gateway->code}.driver"))
                    ->map(fn (Gateway $gateway) => [
                        'code' => $gateway->code,
                        'name' => $gateway->config['display_name'] ?? config("billing.gateways.{$gateway->code}.name"),
                        'button' => $gateway->config['button_label'] ?? null,
                    ])
                    ->values()
                : [],
        ];
    }

    public function pay(Request $request, int $id, PaymentService $payments)
    {
        $invoice = $request->user('client')->invoices()->findOrFail($id);
        $data = $request->validate(['gateway' => 'required|string']);

        return ['redirect_url' => $payments->begin($invoice, $data['gateway'])];
    }

    private function profile(Request $request): array
    {
        $client = $request->user('client');

        return [
            ...$client->only('id', 'name', 'email', 'otp_enabled'),
            'has_password' => $client->password !== null,
            'impersonating' => $request->session()->has(LoginService::IMPERSONATOR),
        ];
    }
}
