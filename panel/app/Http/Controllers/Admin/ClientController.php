<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\ClientUser;
use App\Models\Domain;
use App\Models\Gateway;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Service;
use App\Services\Auth\SubUsers;
use App\Services\BillingService;
use App\Services\ClientCurrency;
use App\Services\CreditService;
use App\Services\CustomerMailer;
use App\Support\EmailHtml;
use App\Support\Auth\Portal;
use App\Support\Currency;
use App\Support\MailFrom;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        return Client::withCount(['services', 'domains', 'services as active_services_count' => fn ($q) => $q->where('status', 'active'),
            'domains as active_domains_count' => fn ($q) => $q->where('status', 'active'),
        ])
            ->when(trim((string) $request->query('q')), fn ($query, $q) => $query->where(fn ($w) => $w
                ->where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%")
                ->orWhere('company', 'like', "%{$q}%")
                ->orWhere('phone', 'like', "%{$q}%")
                ->when(ctype_digit(ltrim($q, '#')), fn ($w) => $w->orWhere('id', (int) ltrim($q, '#')))))
            ->when($request->boolean('hide_inactive'), fn ($query) => $query->where('status', 'active'))
            ->latest('id')
            ->paginate(min($request->integer('per_page', 25), 500));
    }

    public function show(Client $client)
    {
        // Totals are in the client's currency; an invoice from before a currency change is converted.
        $currency = $client->currencyCode();
        $inClientCurrency = fn ($amount, $from) => (float) (Currency::bdtRate($from ?: 'BDT') && Currency::bdtRate($currency) ? Currency::convert((string) $amount, $from ?: 'BDT', $currency) : $amount);
        $invoiceTotals = $client->invoices()
            ->selectRaw('status, currency, count(*) as count, sum(total) as total')
            ->groupBy('status', 'currency')
            ->get()
            ->groupBy('status')
            ->map(fn ($rows) => (object) [
                'count' => $rows->sum('count'),
                'total' => Currency::fmt($rows->sum(fn ($r) => $inClientCurrency($r->total, $r->currency))),
            ]);
        $payments = Payment::whereIn('invoice_id', $client->invoices()->select('id'));
        $gateways = Gateway::all()->keyBy('code');
        $gatewayName = fn (string $code) => match ($code) {
            'credit' => 'Credit Balance',
            default => $gateways->get($code)?->config['display_name'] ?? config("billing.gateways.{$code}.name", $code),
        };

        return [
            ...$client->toArray(),
            'client_for' => $client->created_at->diffForHumans(null, true),
            'support_pin' => $client->activeSupportPin(),
            'support_pin_expires_at' => $client->activeSupportPin() ? $client->support_pin_expires_at : null,
            'invoice_totals' => collect(['paid', 'unpaid', 'cancelled'])->mapWithKeys(fn ($status) => [$status => [
                'count' => (int) ($invoiceTotals->get($status)?->count ?? 0),
                'total' => (string) ($invoiceTotals->get($status)?->total ?? '0'),
            ]]),
            'overdue_invoices' => $client->invoices()->where('status', 'unpaid')->whereDate('due_date', '<', today())->count(),
            'gross_revenue' => Currency::fmt((clone $payments)->selectRaw('currency, sum(amount) as total')->groupBy('currency')->get()
                ->sum(fn ($r) => $inClientCurrency($r->total, $r->currency))),
            'service_counts' => $client->services()
                ->join('products', 'products.id', '=', 'services.product_id')
                ->selectRaw('products.type as type, count(*) as total, sum(case when services.status = ? then 1 else 0 end) as active', ['active'])
                ->groupBy('products.type')
                ->get(),
            'services' => $client->services()->with('product:id,name,type', 'server:id,name')->latest()->get(),
            'domains' => $client->domains()->latest()->get(),
            'invoices' => $client->invoices()->with('payments:id,invoice_id,gateway')->latest('due_date')->latest('id')->limit(500)->get()
                ->map(fn (Invoice $i) => [
                    ...Arr::only($i->toArray(), ['id', 'number', 'status', 'currency', 'total', 'due_date', 'paid_at', 'created_at']), // toArray keeps due_date a plain Y-m-d
                    'payment_method' => $i->payments->pluck('gateway')->unique()->map($gatewayName)->implode(', ') ?: null,
                ]),
            'transactions' => (clone $payments)->with('invoice:id,number')->latest()->limit(500)->get()
                ->map(fn (Payment $p) => [...$p->toArray(), 'gateway_name' => $gatewayName($p->gateway)]),
            // In the client's currency, like the other totals.
            'transaction_totals' => [
                'in' => $in = Currency::fmt((clone $payments)->where('amount', '>', 0)->selectRaw('currency, sum(amount) as total')->groupBy('currency')->get()->sum(fn ($r) => $inClientCurrency($r->total, $r->currency))),
                'fees' => $fees = Currency::fmt((clone $payments)->selectRaw('currency, sum(fee) as total')->groupBy('currency')->get()->sum(fn ($r) => $inClientCurrency($r->total, $r->currency))),
                'out' => $out = Currency::fmt(-1 * (clone $payments)->where('amount', '<', 0)->selectRaw('currency, sum(amount) as total')->groupBy('currency')->get()->sum(fn ($r) => $inClientCurrency($r->total, $r->currency))),
                'balance' => bcsub(bcsub($in, $fees, 2), $out, 2),
            ],
            'ticket_stats' => [
                'this_month' => $client->tickets()->where('created_at', '>=', now()->startOfMonth())->count(),
                'last_month' => $client->tickets()->whereBetween('created_at', [now()->subMonthNoOverflow()->startOfMonth(), now()->startOfMonth()])->count(),
                'this_year' => $client->tickets()->where('created_at', '>=', now()->startOfYear())->count(),
                'last_year' => $client->tickets()->whereBetween('created_at', [now()->subYear()->startOfYear(), now()->startOfYear()])->count(),
            ],
            'users' => $client->users()->orderByDesc('is_owner')->orderBy('id')->get()->map(fn (ClientUser $u) => [
                'id' => $u->id,
                'first_name' => $u->first_name,
                'last_name' => $u->last_name,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'language' => $u->language,
                'two_factor' => $u->two_factor,
                'is_owner' => $u->is_owner,
                'permissions' => $u->permissions,
                'permissions_list' => $u->permissions_list,
                'status' => $u->status,
                'verification_token' => $u->verification_token,
                'email_verified_at' => $u->email_verified_at?->toISOString(),
                'last_login_at' => $u->last_login_at?->toISOString(),
                'has_password' => $u->is_owner || $u->password !== null,
                'created_at' => $u->created_at?->toISOString(),
            ]),
            'contacts' => $client->contacts()->latest()->get(),
            'tickets' => $client->tickets()->latest()->limit(500)->get()
                ->map(fn ($t) => [...$t->toArray(), 'department_name' => config("billing.ticket_departments.{$t->department}", $t->department)]),
            'emails' => $client->emailLogs()->latest('id')->limit(500)->get(),
        ];
    }

    /** Everything logged about the client and its invoices, services and domains, including its earlier history. */
    public function log(Client $client)
    {
        $invoiceIds = $client->invoices()->select('id');
        $serviceIds = $client->services()->select('id');
        $domainIds = $client->domains()->select('id');

        return ActivityLog::with('user:id,name')
            ->where(fn ($q) => $q
                ->where(fn ($w) => $w->where('subject_type', $client->getMorphClass())->where('subject_id', $client->id))
                ->orWhere(fn ($w) => $w->where('subject_type', (new Invoice)->getMorphClass())->whereIn('subject_id', $invoiceIds))
                ->orWhere(fn ($w) => $w->where('subject_type', (new Service)->getMorphClass())->whereIn('subject_id', $serviceIds))
                ->orWhere(fn ($w) => $w->where('subject_type', (new Domain)->getMorphClass())->whereIn('subject_id', $domainIds)))
            ->latest('created_at')
            ->latest('id')
            ->paginate(50);
    }

    public function notes(Request $request, Client $client)
    {
        $client->update($request->validate(['notes' => 'nullable|string|max:10000']));
        ActivityLog::record('client.notes_updated', $client);

        return ['ok' => true];
    }

    /** With Selected: Send Message. Queued, so a long list cannot time out the request. */
    public function message(Request $request, CustomerMailer $mailer)
    {
        $data = $request->validate([
            'client_ids' => 'required|array|min:1|max:5000',
            'client_ids.*' => 'integer',
            'sender' => ['required', Rule::in([MailFrom::SALES, MailFrom::SUPPORT, MailFrom::BILLING])],
            'subject' => 'required|string|max:200',
            'message' => 'required|string|max:'.EmailHtml::MAX_LENGTH,
        ]);

        $message = EmailHtml::clean($data['message']);
        if (trim(EmailHtml::toText($message)) === '' && ! str_contains($message, '<img')) {
            throw ValidationException::withMessages(['message' => 'Write a message first.']);
        }

        $clients = Client::whereIn('id', $data['client_ids'])->whereNotNull('email')->get();

        foreach ($clients as $client) {
            $mailer->message($client, $data['sender'], $data['subject'], $message);
        }

        ActivityLog::record('clients.messaged', context: ['count' => $clients->count(), 'subject' => $data['subject'], 'sender' => $data['sender']]);

        return ['message' => "Message queued for {$clients->count()} client(s)."];
    }

    /** Sends a logged email to the client again, exactly as it was. */
    public function resendEmail(Client $client, int $email)
    {
        $log = $client->emailLogs()->findOrFail($email);
        $from = MailFrom::for(MailFrom::SUPPORT);

        try {
            Mail::html((string) $log->body, fn ($message) => $message->from($from->address, $from->name)->to($log->to)->subject($log->subject));
        } catch (Throwable $e) {
            throw ValidationException::withMessages(['email' => 'Sending failed: '.$e->getMessage()]);
        }

        ActivityLog::record('client.email_resent', $client, ['subject' => $log->subject]);

        return ['message' => "Sent again to {$log->to}."];
    }

    public function destroyEmail(Client $client, int $email)
    {
        $client->emailLogs()->findOrFail($email)->delete();

        return response()->noContent();
    }

    /** The account owner signs in as the client, so these act on the client's own login. */
    /** The owner row stands for the client's own login; any other user has a login of their own. */
    public function sendPasswordReset(Client $client, int $userId, SubUsers $subUsers)
    {
        $user = $client->users()->findOrFail($userId);

        try {
            $this->isOwnerLogin($client, $user)
                ? Password::broker(Portal::broker(Portal::CLIENT))->sendResetLink(['email' => $client->email, ...Portal::scope(Portal::CLIENT)])
                : $subUsers->sendResetLink($user);
        } catch (Throwable $e) {
            throw ValidationException::withMessages(['email' => 'Sending failed: '.$e->getMessage()]);
        }

        ActivityLog::record('client.password_reset_sent', $client, ['email' => $user->email]);

        return ['message' => "Password reset link sent to {$user->email}."];
    }

    public function changePassword(Request $request, Client $client, int $userId, SubUsers $subUsers)
    {
        $user = $client->users()->findOrFail($userId);
        $data = $request->validate(['password' => 'required|string|min:'.Portal::minPassword(Portal::CLIENT)]);

        if ($this->isOwnerLogin($client, $user)) {
            $client->forceFill(['password' => $data['password']])->setRememberToken(Str::random(60));
            $client->save();
        } else {
            $subUsers->setPassword($user, $data['password']);
        }

        ActivityLog::record('client.password_changed', $client, ['email' => $user->email]);

        return ['message' => "Password changed for {$user->email}."];
    }

    private function isOwnerLogin(Client $client, ClientUser $user): bool
    {
        return $user->is_owner || strcasecmp($user->email, $client->email) === 0;
    }

    public function credits(Request $request, Client $client)
    {
        return $client->credits()->with('user:id,name', 'invoice:id,number')->latest('id')
            ->paginate(min($request->integer('per_page', 25), 100));
    }

    /** Manage Credits: add or remove credit by hand, with a reason the client also sees. */
    public function adjustCredit(Request $request, Client $client, CreditService $credits)
    {
        $data = $request->validate([
            'type' => 'required|in:add,remove',
            'amount' => 'required|numeric|min:0.01|max:9999999',
            'description' => 'required|string|max:255',
        ]);
        $amount = number_format((float) $data['amount'], 2, '.', '');

        $data['type'] === 'add'
            ? $credits->add($client, $amount, $data['description'], userId: $request->user()->id)
            : $credits->remove($client, $amount, $data['description'], $request->user()->id);

        return ['balance' => $client->refresh()->credit_balance];
    }

    public function invoice(Request $request, Client $client, BillingService $billing)
    {
        $data = $request->validate([
            'due_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.amount' => 'required|numeric|min:0.01',
        ]);

        $items = array_map(fn ($item) => [
            'description' => $item['description'],
            'amount' => number_format((float) $item['amount'], 2, '.', ''),
            'kind' => 'other',
        ], $data['items']);

        $invoice = $billing->createInvoice($client, $items, Carbon::parse($data['due_date']));
        ActivityLog::record('invoice.created', $invoice);

        return response()->json($invoice, 201);
    }

    /** Closing never touches servers: live services must be dealt with first. */
    public function close(Client $client)
    {
        if ($client->services()->whereIn('status', ['active', 'suspended'])->exists()) {
            throw ValidationException::withMessages(['client' => 'Terminate or cancel this client\'s live services first.']);
        }

        $client->update(['status' => 'closed']);
        ActivityLog::record('client.closed', $client);

        return ['ok' => true];
    }

    public function reopen(Client $client)
    {
        $client->update(['status' => 'active']);
        ActivityLog::record('client.reopened', $client);

        return ['ok' => true];
    }

    /** Billing history must survive, so only a client with no records can be deleted. */
    public function destroy(Client $client)
    {
        if ($client->invoices()->exists() || $client->services()->exists() || $client->domains()->exists() || Order::where('client_id', $client->id)->exists()) {
            throw ValidationException::withMessages(['client' => 'This client has billing records. Close the account instead.']);
        }

        $client->delete();
        ActivityLog::record('client.deleted', context: ['id' => $client->id, 'email' => $client->email]);

        return response()->noContent();
    }

    public function store(Request $request)
    {
        $client = Client::create($this->validated($request));
        ActivityLog::record('client.created', $client);

        return response()->json($client, 201);
    }

    public function update(Request $request, Client $client)
    {
        $data = $this->validated($request, $client);

        // A blank password on edit means "keep the current one".
        if (empty($data['password'])) {
            unset($data['password']);
        }

        // A new currency converts the client's services, domains and credit, so it has its own path.
        if (isset($data['currency']) && $data['currency'] !== $client->currencyCode()) {
            app(ClientCurrency::class)->change($client, $data['currency']);
        }
        unset($data['currency']);

        $client->update($data);
        ActivityLog::record('client.updated', $client);

        return $client;
    }

    public function users(Client $client)
    {
        return $client->users()->orderByDesc('is_owner')->orderBy('id')->get()->map(fn (ClientUser $u) => [
            'id' => $u->id,
            'first_name' => $u->first_name,
            'last_name' => $u->last_name,
            'name' => $u->name,
            'email' => $u->email,
            'phone' => $u->phone,
            'language' => $u->language,
            'two_factor' => $u->two_factor,
            'is_owner' => $u->is_owner,
            'permissions' => $u->permissions,
            'permissions_list' => $u->permissions_list,
            'status' => $u->status,
            'verification_token' => $u->verification_token,
            'email_verified_at' => $u->email_verified_at?->toISOString(),
            'last_login_at' => $u->last_login_at?->toISOString(),
            'created_at' => $u->created_at?->toISOString(),
        ]);
    }

    public function storeUser(Request $request, Client $client)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'language' => 'nullable|string|max:32',
            'two_factor' => 'boolean',
            'is_owner' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
            'status' => 'nullable|in:active,pending_approval,pending_verification,rejected',
        ]);

        if (!empty($data['is_owner'])) {
            $client->users()->update(['is_owner' => false]);
        }

        $perms = isset($data['permissions']) ? implode(',', $data['permissions']) : '';
        $user = $client->users()->create([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => strtolower($data['email']),
            'phone' => $data['phone'] ?? null,
            'language' => $data['language'] ?? 'English',
            'two_factor' => (bool) ($data['two_factor'] ?? false),
            'is_owner' => (bool) ($data['is_owner'] ?? false),
            'permissions' => $perms,
            'status' => $data['status'] ?? 'active',
            'email_verified_at' => now(),
        ]);

        ActivityLog::record('admin.client_user_created', $client, ['email' => $user->email]);

        return response()->json($user, 201);
    }

    public function updateUser(Request $request, Client $client, int $userId)
    {
        $user = $client->users()->findOrFail($userId);
        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'language' => 'nullable|string|max:32',
            'two_factor' => 'boolean',
            'is_owner' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
            'status' => 'nullable|in:active,pending_approval,pending_verification,rejected',
        ]);

        $previousStatus = $user->status;
        $newStatus = $data['status'] ?? $user->status;

        if (!empty($data['is_owner']) && !$user->is_owner) {
            $client->users()->where('id', '!=', $user->id)->update(['is_owner' => false]);
            $user->is_owner = true;
        }

        $perms = isset($data['permissions']) ? implode(',', $data['permissions']) : $user->permissions;

        $user->update([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => strtolower($data['email']),
            'phone' => $data['phone'] ?? $user->phone,
            'language' => $data['language'] ?? $user->language,
            'two_factor' => (bool) ($data['two_factor'] ?? $user->two_factor),
            'permissions' => $perms,
            'status' => $newStatus,
            'email_verified_at' => ($newStatus === 'active' && !$user->email_verified_at) ? now() : $user->email_verified_at,
        ]);

        if ($previousStatus !== 'active' && $newStatus === 'active') {
            $client->emailLogs()->create([
                'to' => $user->email,
                'subject' => 'Sub-Account Approved - CarrotHost',
                'body' => "Hello {$user->name},\n\nYour sub-account access for {$client->name} on CarrotHost has been approved by the administrator.\n\nYou may now sign in and access the authorized areas.\n\nThank you,\nCarrotHost Team",
            ]);
        }

        ActivityLog::record('admin.client_user_updated', $client, ['email' => $user->email]);

        return $user;
    }

    public function approveUser(Request $request, Client $client, int $userId, SubUsers $subUsers)
    {
        $user = $client->users()->findOrFail($userId);
        $user->update([
            'status' => 'active',
            'email_verified_at' => $user->email_verified_at ?: now(),
            'verification_token' => null,
            'verification_token_expires_at' => null,
        ]);

        $client->emailLogs()->create([
            'to' => $user->email,
            'subject' => 'Sub-Account Approved - CarrotHost',
            'body' => "Hello {$user->name},\n\nYour sub-account access for {$client->name} on CarrotHost has been approved by the administrator.\n\nYou may now sign in and access the authorized areas.\n\nThank you,\nCarrotHost Team",
        ]);

        ActivityLog::record('admin.client_user_approved', $client, ['email' => $user->email]);

        // A newly approved user has no password yet: email them a link to choose one.
        if (! $this->isOwnerLogin($client, $user) && $user->password === null) {
            try {
                $subUsers->sendResetLink($user);
            } catch (Throwable $e) {
                report($e);
            }
        }

        return $user;
    }

    public function destroyUser(Request $request, Client $client, int $userId)
    {
        $user = $client->users()->findOrFail($userId);
        abort_if($user->is_owner, 422, 'Cannot remove the account owner. Transfer ownership to another user first.');

        $user->delete();
        ActivityLog::record('admin.client_user_removed', $client, ['email' => $user->email]);

        return response()->noContent();
    }

    private function validated(Request $request, ?Client $client = null): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'email' => ['required', 'email', Rule::unique('clients')->ignore($client)],
            'password' => 'nullable|string|min:10',
            'phone' => 'nullable|string|max:32',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|size:2',
            'status' => 'nullable|in:active,inactive,closed',
            'notes' => 'nullable|string',
            'currency' => ['nullable', Rule::in(Currency::SUPPORTED)],
        ]);
    }
}
