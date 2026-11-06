<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProvisionService;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Order;
use App\Models\Service;
use App\Provisioning\AccountCredentials;
use App\Services\BillingService;
use App\Services\CustomerMailer;
use App\Services\InvoiceActions;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        return Order::with(['client:id,name,email', 'invoices:id,order_id,number,status,total'])
            ->withCount(['services', 'domains'])
            ->when($request->query('status'), function ($q, $status) {
                if ($status === 'all_active') {
                    return $q->whereIn('status', ['active', 'pending']);
                }
                if ($status === 'all') {
                    return $q;
                }
                return $q->where('status', $status);
            })
            ->when($request->query('q'), function ($q, $search) {
                $q->where(function ($w) use ($search) {
                    $w->where('id', 'like', "%{$search}%")
                        ->orWhere('order_number', 'like', "%{$search}%")
                        ->orWhere('amount', 'like', "%{$search}%")
                        ->orWhere('payment_method', 'like', "%{$search}%")
                        ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(min($request->integer('per_page', 25), 100));
    }

    public function show(Order $order)
    {
        $order->load([
            'client',
            'services.product:id,name,type,module,server_id',
            'services.server:id,name',
            'domains',
            'invoices:id,order_id,number,status,total,due_date',
        ]);
        $used = [];

        return [
            ...$order->toArray(),
            // Orders placed before the amount was saved fall back to their invoices.
            'amount' => (float) $order->amount > 0 ? $order->amount : number_format((float) $order->invoices->sum('total'), 2, '.', ''),
            // A fresh, unique username and a strong password for each account not yet created, as WHMCS offers.
            // A service waiting for accept was never created, even when it has a username: orders
            // imported from WHMCS carry the one WHMCS planned to use, so it is offered for editing.
            'setup' => $order->services->filter(fn (Service $s) => ! $s->remote_id || $s->provision_status === 'awaiting_accept')->mapWithKeys(function (Service $s) use (&$used) {
                $username = $s->credentials['username'] ?? ($s->provision_status === 'awaiting_accept' ? $s->remote_id : null);
                if (! $username) {
                    $username = AccountCredentials::username((string) ($s->domain ?: $s->product->name), $s->id);
                    // Two accounts in one order must not get the same name.
                    for ($n = 1; in_array($username, $used, true); $n++) {
                        $username = substr($username, 0, 8 - strlen((string) $n)).$n;
                    }
                }
                $used[] = $username;

                return [$s->id => [
                    'username' => $username,
                    'password' => AccountCredentials::password(),
                    'server_id' => $s->server_id ?? $s->product->server_id,
                    'module' => $s->product->module,
                ]];
            }),
        ];
    }

    /**
     * Sets up the services waiting for an admin, with the username, password and server chosen
     * on the order page. Without "Run Module Create" they are only marked active (set up by hand).
     */
    public function accept(Request $request, Order $order, CustomerMailer $mailer)
    {
        $data = $request->validate([
            'run_module_create' => 'boolean',
            'send_welcome_email' => 'boolean',
            'services' => 'array',
            'services.*.id' => 'required|integer',
            'services.*.username' => ['nullable', 'string', 'max:16', 'regex:'.AccountCredentials::USERNAME_PATTERN],
            'services.*.password' => 'nullable|string|min:8|max:64',
            // The registrar each domain goes to; null means none (handled by hand).
            'domains' => 'array',
            'domains.*.id' => 'required|integer',
            'domains.*.registrar' => ['nullable', Rule::in(array_keys(config('billing.registrars')))],
            'services.*.server_id' => 'nullable|integer|exists:servers,id',
        ], ['services.*.username.regex' => 'A username starts with a letter and has only lowercase letters and digits.']);
        $runModule = $request->boolean('run_module_create', true);
        $welcome = $request->boolean('send_welcome_email', true);
        $chosen = collect($data['services'] ?? [])->keyBy('id');

        $waiting = $order->services()->where('provision_status', 'awaiting_accept')->get();

        if ($waiting->isEmpty()) {
            throw ValidationException::withMessages(['order' => 'Nothing in this order is waiting to be accepted.']);
        }

        foreach ($waiting as $service) {
            $username = $chosen[$service->id]['username'] ?? null;
            if ($username && AccountCredentials::taken($username, $service->id)) {
                throw ValidationException::withMessages(["services.{$service->id}.username" => "The username {$username} is already used by another account."]);
            }
        }

        $order->update(['status' => 'active']);

        foreach ($waiting as $service) {
            $pick = $chosen[$service->id] ?? [];
            // A username carried over from WHMCS is only a plan until the account is created.
            $credentials = array_filter(['username' => $pick['username'] ?? $service->remote_id, 'password' => $pick['password'] ?? null]);
            $changes = ['status' => 'active'];
            if ($credentials) {
                $changes['credentials'] = $credentials;
            }
            if (! empty($pick['server_id'])) {
                $changes['server_id'] = $pick['server_id'];
            }

            if ($runModule) {
                // Cleared so the create job runs: it skips accounts that already have a remote id.
                $service->update([...$changes, 'remote_id' => null, 'provision_status' => 'queued']);
                ProvisionService::dispatch($service->id, 'create', $welcome);
            } else {
                // Set up by hand: keep the login given here as the account's.
                $service->update([...$changes, 'provision_status' => 'done', 'remote_id' => $credentials['username'] ?? $service->remote_id]);
                if ($welcome && $credentials) {
                    $mailer->serviceWelcome($service->refresh());
                }
            }
        }

        $registrars = collect($data['domains'] ?? [])->keyBy('id');
        foreach ($order->domains as $domain) {
            $domain->update([
                'status' => 'active',
                ...$registrars->has($domain->id) ? ['registrar' => $registrars[$domain->id]['registrar'] ?? null] : [],
            ]);
        }

        ActivityLog::record('order.accepted', $order);
        $mailer->orderAccepted($order);

        return $this->show($order);
    }

    public function cancel(Order $order)
    {
        if ($order->status === 'cancelled') {
            throw ValidationException::withMessages(['order' => 'This order is already cancelled.']);
        }

        $order->update(['status' => 'cancelled']);
        $order->invoices()->where('status', 'unpaid')->update(['status' => 'cancelled']);
        ActivityLog::record('order.cancelled', $order);

        return $this->show($order);
    }

    public function store(Request $request, BillingService $billing)
    {
        $data = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'services' => 'array',
            'services.*.product_id' => 'required|exists:products,id',
            'services.*.cycle' => ['required', Rule::in(array_keys(config('billing.cycles')))],
            'services.*.domain' => ['nullable', 'regex:/^([a-z0-9-]+\.)+[a-z]{2,}$/i'],
            'domains' => 'array',
            'domains.*.name' => ['required', 'regex:/^([a-z0-9-]+\.)+[a-z]{2,}$/i'],
            'domains.*.action' => 'required|in:register,transfer',
            'domains.*.years' => 'required|integer|between:1,10',
            'domains.*.epp_code' => 'nullable|string|max:255',
        ]);

        if (empty($data['services']) && empty($data['domains'])) {
            return response()->json(['message' => 'Add at least one service or domain.'], 422);
        }

        $order = $billing->createOrder(Client::findOrFail($data['client_id']), $data['services'] ?? [], $data['domains'] ?? []);
        ActivityLog::record('order.created', $order);

        return response()->json($order->load('invoices'), 201);
    }

    public function batchAction(Request $request, CustomerMailer $mailer, InvoiceActions $invoices)
    {
        $data = $request->validate([
            'order_ids' => 'required|array',
            'order_ids.*' => 'integer|exists:orders,id',
            'action' => 'required|in:accept,cancel,delete',
        ]);

        $orders = Order::whereIn('id', $data['order_ids'])->get();
        $skipped = [];

        foreach ($orders as $order) {
            if ($data['action'] === 'accept') {
                $waiting = $order->services()->where('provision_status', 'awaiting_accept')->get();
                foreach ($waiting as $service) {
                    $service->update(['provision_status' => 'queued']);
                    ProvisionService::dispatch($service->id, 'create');
                }
                $order->update(['status' => 'active']);
                ActivityLog::record('order.accepted', $order);
                $mailer->orderAccepted($order);
            } elseif ($data['action'] === 'cancel') {
                $order->update(['status' => 'cancelled']);
                $order->invoices()->where('status', 'unpaid')->update(['status' => 'cancelled']);
                ActivityLog::record('order.cancelled', $order);
            } elseif ($data['action'] === 'delete') {
                // The same as deleting one order: its invoices, services and domains go too, with the same checks.
                try {
                    $this->deleteOrder($order, $invoices);
                } catch (ValidationException $e) {
                    $skipped[] = '#'.($order->order_number ?: $order->id).': '.collect($e->errors())->flatten()->first();
                }
            }
        }

        $done = count($orders) - count($skipped);

        return response()->json([
            'ok' => true,
            'count' => $done,
            'skipped' => $skipped,
            'message' => $data['action'] === 'delete'
                ? "{$done} order(s) deleted.".($skipped ? ' Not deleted: '.implode(' ', $skipped) : '')
                : null,
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,active,fraud,cancelled',
        ]);

        $order->update(['status' => $data['status']]);
        ActivityLog::record('order.status_updated', $order, ['status' => $data['status']]);

        return $this->show($order);
    }

    public function resendVerification(Order $order)
    {
        $client = $order->client;
        if ($client) {
            $client->emailLogs()->create([
                'to' => $client->email,
                'subject' => 'Please Confirm Your Email Address - CarrotHost',
                'body' => "Hello {$client->name},\n\nPlease verify your email address to confirm ownership of your account.\n\nThank you,\nCarrotHost Team",
            ]);
        }
        ActivityLog::record('order.verification_resent', $order);

        return response()->json(['ok' => true]);
    }

    public function saveNotes(Request $request, Order $order)
    {
        $order->update(['notes' => $request->input('notes')]);
        return $this->show($order);
    }

    /**
     * Deletes the order with its services, domains and invoices, so nothing is left behind in the
     * client area. Refused once money came in or something was set up; cancel or terminate first.
     */
    public function destroy(Order $order, InvoiceActions $invoices)
    {
        $this->deleteOrder($order, $invoices);

        return response()->json(['ok' => true]);
    }

    private function deleteOrder(Order $order, InvoiceActions $invoices): void
    {
        $order->load(['services', 'domains', 'invoices']);

        if ($order->invoices->contains(fn ($i) => $i->payments()->exists())) {
            throw ValidationException::withMessages(['order' => 'This order has payments. Use Cancel & Refund instead of deleting it.']);
        }
        if ($live = $order->services->first(fn (Service $s) => $s->remote_id || in_array($s->provision_status, ['queued', 'running'], true))) {
            throw ValidationException::withMessages(['order' => 'The account '.($live->remote_id ?: $live->domain).' is set up (or being set up) on the server. Terminate it from the service page first, or cancel the order instead.']);
        }
        if ($order->domains->contains(fn ($d) => $d->registrar_order_id)) {
            throw ValidationException::withMessages(['order' => 'A domain in this order is registered at the registrar. Cancel the order instead.']);
        }

        DB::transaction(function () use ($order, $invoices) {
            // Deleting an invoice also returns any credit applied to it.
            $order->invoices->each(fn ($invoice) => $invoices->delete($invoice));
            ActivityLog::record('order.deleted', $order->client, [
                'order' => $order->order_number ?: $order->id,
                'services' => $order->services->map(fn ($s) => trim(($s->product?->name ?? 'Service').' '.$s->domain))->all(),
                'domains' => $order->domains->pluck('name')->all(),
                'invoices' => $order->invoices->pluck('number')->all(),
            ]);
            $order->services->each->delete();
            $order->domains->each->delete();
            $order->delete();
        });
    }
}
