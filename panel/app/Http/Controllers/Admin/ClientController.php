<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
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
        return Client::withCount(['services', 'domains'])
            ->when($request->query('q'), fn ($query, $q) => $query->where(fn ($w) => $w
                ->where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%")
                ->orWhere('company', 'like', "%{$q}%")))
            ->latest()
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
        $serviceIds = $client->services()->pluck('id');
        $domainIds = $client->domains()->pluck('id');
        $invoiceIds = $client->invoices()->pluck('id');

        return [
            ...$client->toArray(),
            'client_for' => $client->created_at->diffForHumans(null, true),
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
            'invoices' => $client->invoices()->latest()->limit(100)->get(),
            'transactions' => (clone $payments)->with('invoice:id,number')->latest()->limit(100)->get(),
            'log' => ActivityLog::with('user:id,name')
                ->where(fn ($q) => $q
                    ->where(fn ($w) => $w->where('subject_type', $client->getMorphClass())->where('subject_id', $client->id))
                    ->orWhere(fn ($w) => $w->where('subject_type', (new Invoice)->getMorphClass())->whereIn('subject_id', $invoiceIds))
                    ->orWhere(fn ($w) => $w->where('subject_type', (new Service)->getMorphClass())->whereIn('subject_id', $serviceIds))
                    ->orWhere(fn ($w) => $w->where('subject_type', (new Domain)->getMorphClass())->whereIn('subject_id', $domainIds)))
                ->latest('id')
                ->limit(100)
                ->get(),
        ];
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
