<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Invoice;
use App\Services\Auth\LoginService;
use App\Services\Auth\SubUsers;
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

    /** The dashboard. A user of the account only gets the parts their permissions cover. */
    public function overview(Request $request, SubUsers $subUsers)
    {
        $client = $request->user('client');
        $user = $subUsers->current($request);
        $can = fn (string $permission) => ! $user || $user->hasPermission($permission);

        return [
            'services' => $can('products') ? $client->services()
                ->with('product:id,name')
                ->latest()
                ->get(['id', 'product_id', 'domain', 'cycle', 'recurring_amount', 'status', 'next_due_date']) : [],
            'domains' => $can('domains') ? $client->domains()
                ->latest()
                ->get(['id', 'name', 'status', 'expires_at', 'recurring_amount']) : [],
            'invoices' => $can('invoices') ? $client->invoices()
                ->latest()
                ->limit(200)
                ->get(['id', 'number', 'status', 'currency', 'total', 'due_date']) : [],
            'open_tickets' => $can('tickets') ? $client->tickets()->where('status', '!=', 'closed')->count() : 0,
            'renewals' => $this->renewals($client, $can),
            'activity' => $this->activity($client, $can),
        ];
    }

    /** Live services and domains falling due in the next 90 days, soonest first. */
    private function renewals(Client $client, callable $can): array
    {
        $until = today()->addDays(90);

        $services = ! $can('products') ? collect() : $client->services()->with('product:id,name')->where('status', 'active')
            ->whereNotNull('next_due_date')->whereDate('next_due_date', '<=', $until)->get()
            ->map(fn ($s) => ['type' => 'service', 'id' => $s->id, 'name' => $s->product->name, 'detail' => $s->domain, 'due' => $s->next_due_date->toDateString(), 'amount' => $s->recurring_amount]);

        $domains = ! $can('domains') ? collect() : $client->domains()->where('status', 'active')->where('auto_renew', true)
            ->whereNotNull('expires_at')->whereDate('expires_at', '<=', $until)->get()
            ->map(fn ($d) => ['type' => 'domain', 'id' => $d->id, 'name' => $d->name, 'detail' => "{$d->years} yr renewal", 'due' => $d->expires_at->toDateString(), 'amount' => $d->recurring_amount]);

        return $services->concat($domains)->sortBy('due')->take(5)->values()->all();
    }

    /** A customer-facing feed built from tickets, invoices, services and domains (the admin log is not shown). */
    private function activity(Client $client, callable $can): array
    {
        $tickets = ! $can('tickets') ? collect() : $client->tickets()->latest('last_reply_at')->limit(5)->get()->map(fn ($t) => [
            'type' => 'ticket',
            'title' => "Ticket #{$t->number} ".(['open' => 'opened', 'answered' => 'answered', 'customer_reply' => 'updated', 'on_hold' => 'on hold', 'closed' => 'closed'][$t->status] ?? $t->status),
            'detail' => $t->subject,
            'link' => "/tickets/{$t->id}",
            'at' => ($t->last_reply_at ?? $t->created_at)?->toIso8601String(),
        ]);

        $invoices = ! $can('invoices') ? collect() : $client->invoices()->whereIn('status', ['paid', 'unpaid'])->latest('updated_at')->limit(5)->get()->map(fn ($i) => [
            'type' => 'invoice',
            'title' => "Invoice #{$i->number} ".($i->status === 'paid' ? 'paid' : 'issued'),
            'detail' => $i->status === 'paid' ? "Amount: {$i->currency} {$i->total}" : "Due {$i->due_date->toDateString()}: {$i->currency} {$i->total}",
            'link' => "/invoices/{$i->id}",
            'at' => ($i->status === 'paid' ? $i->paid_at : null)?->toIso8601String() ?? $i->created_at?->toIso8601String(),
        ]);

        $services = ! $can('products') ? collect() : $client->services()->with('product:id,name')->latest()->limit(5)->get()->map(fn ($s) => [
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
        $methods = PaymentService::customerMethods();
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
            'payment_instructions' => $unpaid ? $methods['payment_instructions'] : null,
            'gateways' => $unpaid ? $methods['gateways'] : [],
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
        $user = app(SubUsers::class)->current($request);

        return [
            ...$client->only('id', 'name', 'email'),
            'otp_enabled' => $client->requiresLoginOtp(), // always on: every sign-in needs the emailed code
            // Everything in the client area is shown in this.
            'currency' => $client->currencyCode(),
            'has_password' => $user ? true : $client->password !== null, // a user always signed in with their own
            'impersonating' => $request->session()->has(LoginService::IMPERSONATOR),
            // Set when a user of the account (not its owner) is signed in. Null permissions = everything.
            'user' => $user ? ['name' => $user->name, 'email' => $user->email, 'permissions' => $user->permissions_list] : null,
        ];
    }
}
