<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\ClientUser;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Service;
use App\Services\BillingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        return Client::withCount(['services', 'domains', 'services as active_services_count' => fn ($q) => $q->where('status', 'active'),
            'domains as active_domains_count' => fn ($q) => $q->where('status', 'active'),
        ])
            ->when($request->query('q'), fn ($query, $q) => $query->where(fn ($w) => $w
                ->where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%")
                ->orWhere('company', 'like', "%{$q}%")
                ->orWhere('phone', 'like', "%{$q}%")))
            ->when($request->boolean('hide_inactive'), fn ($query) => $query->where('status', 'active'))
            ->latest('id')
            ->paginate(min($request->integer('per_page', 25), 500));
    }

    public function show(Client $client)
    {
        $invoiceTotals = $client->invoices()
            ->selectRaw('status, count(*) as count, sum(total) as total')
            ->groupBy('status')
            ->get()
            ->keyBy('status');
        $payments = Payment::whereIn('invoice_id', $client->invoices()->select('id'));

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
            'gross_revenue' => (string) (clone $payments)->sum('amount'),
            'service_counts' => $client->services()
                ->join('products', 'products.id', '=', 'services.product_id')
                ->selectRaw('products.type as type, count(*) as total, sum(case when services.status = ? then 1 else 0 end) as active', ['active'])
                ->groupBy('products.type')
                ->get(),
            'services' => $client->services()->with('product:id,name,type', 'server:id,name')->latest()->get(),
            'domains' => $client->domains()->latest()->get(),
            'invoices' => $client->invoices()->latest()->limit(500)->get(),
            'transactions' => (clone $payments)->with('invoice:id,number')->latest()->limit(500)->get(),
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
                'created_at' => $u->created_at?->toISOString(),
            ]),
            'contacts' => $client->contacts()->latest()->get(),
            'tickets' => $client->tickets()->latest()->limit(100)->get(),
            'emails' => $client->emailLogs()->latest()->limit(100)->get(),
        ];
    }

    /** Everything logged about the client and its invoices, services and domains, including imported WHMCS history. */
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

    public function approveUser(Request $request, Client $client, int $userId)
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
        ]);
    }
}
