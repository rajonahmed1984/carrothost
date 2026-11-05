<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProvisionService;
use App\Models\ActivityLog;
use App\Models\Domain;
use App\Models\Product;
use App\Models\Server;
use App\Models\Service;
use App\Models\Client;
use App\Services\ServiceTools;
use App\Support\PaymentMethods;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        return Service::with(['client:id,name,email', 'product:id,name,module,product_group_id', 'product.group:id,name', 'server:id,name'])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('group'), fn ($q, $group) => $q->whereHas('product', fn ($p) => $group === 'none'
                ? $p->whereNull('product_group_id')
                : $p->where('product_group_id', (int) $group)))
            ->when($request->query('q'), function ($q, $search) {
                $q->where(function ($w) use ($search) {
                    $w->where('id', 'like', "%{$search}%")
                        ->orWhere('domain', 'like', "%{$search}%")
                        ->orWhere('remote_id', 'like', "%{$search}%")
                        ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                        ->orWhereHas('product', fn ($p) => $p->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(25);
    }

    public const STATUSES = ['pending', 'active', 'suspended', 'terminated', 'cancelled', 'fraud'];

    /** Control panel login ports by module. */
    private const PANEL_PORTS = ['cpanel' => 2083, 'webuzo' => 2003];

    public function show(Service $service)
    {
        return $this->detail($service);
    }

    /** Admin edits to the billing record. Changes on the server itself still go through the module commands. */
    public function update(Request $request, Service $service)
    {
        $data = $request->validate([
            'product_id' => 'sometimes|integer|exists:products,id',
            'server_id' => 'sometimes|nullable|integer|exists:servers,id',
            'domain' => ['sometimes', 'nullable', 'string', 'max:255', 'regex:'.Domain::NAME_PATTERN],
            'dedicated_ip' => 'sometimes|nullable|ip',
            'username' => 'sometimes|nullable|string|max:64',
            'password' => 'sometimes|nullable|string|max:255',
            'status' => ['sometimes', Rule::in(self::STATUSES)],
            'registered_at' => 'sometimes|nullable|date',
            'quantity' => 'sometimes|integer|min:1|max:1000',
            'first_payment_amount' => 'sometimes|numeric|min:0|max:9999999',
            'recurring_amount' => 'sometimes|numeric|min:0|max:9999999',
            'recalculate' => 'sometimes|boolean',
            'next_due_date' => 'sometimes|nullable|date',
            'termination_date' => 'sometimes|nullable|date',
            'cycle' => ['sometimes', Rule::in(array_keys(config('billing.cycles')))],
            'payment_method' => ['sometimes', 'nullable', Rule::in(array_keys(PaymentMethods::all($service->payment_method)))],
            'subscription_id' => 'sometimes|nullable|string|max:255',
            'override_suspend_until' => 'sometimes|nullable|date',
            'terminate_end_of_cycle' => 'sometimes|boolean',
            'terminate_reason' => 'sometimes|nullable|string|max:255',
            'admin_notes' => 'sometimes|nullable|string|max:20000',
        ]);

        $changes = collect($data)->except(['username', 'password', 'recalculate'])->all();

        if (isset($changes['domain'])) {
            $changes['domain'] = strtolower($changes['domain']);
        }

        if (! ($changes['terminate_end_of_cycle'] ?? $service->terminate_end_of_cycle)) {
            $changes['terminate_reason'] = null;
        }

        if ($data['recalculate'] ?? false) {
            $product = Product::with('prices')->find($changes['product_id'] ?? $service->product_id);
            $cycle = $changes['cycle'] ?? $service->cycle;
            $price = $product->prices->firstWhere('cycle', $cycle);

            if (! $price) {
                throw ValidationException::withMessages(['recurring_amount' => "{$product->name} has no {$cycle} price, so the amount cannot be recalculated."]);
            }
            $changes['recurring_amount'] = bcmul($price->price, (string) ($changes['quantity'] ?? $service->quantity), 2);
        }

        // Login details kept in the panel. They do not change the password on the server.
        if (array_key_exists('username', $data) || array_key_exists('password', $data)) {
            $credentials = $service->credentials?->toArray() ?? [];
            foreach (['username', 'password'] as $field) {
                if (array_key_exists($field, $data)) {
                    $credentials[$field] = $data[$field];
                }
            }
            $changes['credentials'] = array_filter($credentials, fn ($v) => $v !== null && $v !== '') ?: null;
        }

        $service->update($changes);
        ActivityLog::record('service.updated', $service, ['fields' => array_keys($changes)]);

        return $this->detail($service->refresh());
    }

    public function refreshUsage(Service $service, ServiceTools $tools)
    {
        $tools->refreshUsage($service->load('product', 'server'));

        return $this->detail($service->refresh());
    }

    public function sso(Service $service, ServiceTools $tools)
    {
        return ['url' => $tools->loginUrl($service->load('product', 'server'))];
    }

    public function changePassword(Request $request, Service $service, ServiceTools $tools)
    {
        $data = $request->validate(['password' => 'required|string|min:8|max:64']);
        $tools->changePassword($service->load('product', 'server'), $data['password']);

        return $this->detail($service->refresh());
    }

    public function changePackage(Service $service, ServiceTools $tools)
    {
        $tools->changePackage($service->load('product', 'server'));

        return $this->detail($service->refresh());
    }

    /** Products the service can move to, and the cost of the chosen one. */
    public function upgradeQuote(Request $request, Service $service, ServiceTools $tools)
    {
        $data = $request->validate(['product_id' => 'nullable|integer|exists:products,id', 'cycle' => ['nullable', Rule::in(array_keys(config('billing.cycles')))]]);

        return [
            'products' => Product::with('prices:id,product_id,cycle,price')->orderBy('name')->get(['id', 'name', 'module'])
                ->filter(fn (Product $p) => $p->prices->isNotEmpty())->values(),
            'quote' => isset($data['product_id'], $data['cycle']) ? $tools->quote($service, Product::find($data['product_id']), $data['cycle']) : null,
        ];
    }

    public function upgrade(Request $request, Service $service, ServiceTools $tools)
    {
        $data = $request->validate(['product_id' => 'required|integer|exists:products,id', 'cycle' => ['required', Rule::in(array_keys(config('billing.cycles')))]]);
        $invoice = $tools->upgrade($service->load('product', 'client'), Product::findOrFail($data['product_id']), $data['cycle']);

        return [
            'message' => $invoice ? "Order created. Invoice {$invoice->number} applies the change when it is paid." : 'Nothing to pay, so the change has been applied.',
            'invoice_id' => $invoice?->id,
            'service' => $this->detail($service->refresh()),
        ];
    }

    public function transfer(Request $request, Service $service, ServiceTools $tools)
    {
        $data = $request->validate(['client_id' => 'required|integer|exists:clients,id']);
        $tools->transfer($service->load('client'), Client::findOrFail($data['client_id']));

        return $this->detail($service->refresh());
    }

    public function welcome(Service $service, ServiceTools $tools)
    {
        $tools->sendWelcome($service->load('client', 'product', 'server'));

        return ['message' => "Welcome email sent to {$service->client->email}."];
    }

    /** Removes the billing record only. An account on a server stays there. */
    public function destroy(Service $service)
    {
        if (in_array($service->provision_status, ['queued', 'running'], true)) {
            throw ValidationException::withMessages(['service' => 'Wait for the running server action to finish.']);
        }

        ActivityLog::record('service.deleted', $service->client, ['service_id' => $service->id, 'product' => $service->product?->name, 'domain' => $service->domain]);
        $service->delete();

        return response()->noContent();
    }

    private function detail(Service $service): array
    {
        $service->load(['client:id,name,email', 'product:id,name,module,type', 'server:id,name,hostname,max_accounts', 'order:id,order_number']);
        $port = self::PANEL_PORTS[$service->product->module] ?? null;

        return [
            ...$service->toArray(),
            'username' => $service->credentials['username'] ?? null,
            'has_password' => filled($service->credentials['password'] ?? null),
            'panel_url' => $port && $service->server ? "https://{$service->server->hostname}:{$port}" : null,
            'has_tools' => ServiceTools::hasTools($service),
            'pending_upgrade' => app(ServiceTools::class)->pendingUpgrade($service),
            'client_services' => $service->client->services()->with('product:id,name')->orderByDesc('id')->get(['id', 'product_id', 'domain', 'status'])
                ->map(fn (Service $s) => ['id' => $s->id, 'name' => $s->product->name.($s->domain ? " - {$s->domain}" : ''), 'status' => $s->status]),
            'options' => [
                'products' => Product::orderBy('name')->get(['id', 'name', 'module']),
                'servers' => Server::withCount('services')->orderBy('name')->get(['id', 'name', 'module', 'max_accounts']),
                'payment_methods' => PaymentMethods::options($service->payment_method),
                'cycles' => array_keys(config('billing.cycles')),
                'statuses' => self::STATUSES,
            ],
        ];
    }

    public function action(Request $request, Service $service)
    {
        $action = $request->validate(['action' => 'required|in:create,suspend,unsuspend,terminate'])['action'];

        if (in_array($service->provision_status, ['queued', 'running'], true)) {
            throw ValidationException::withMessages(['action' => 'Another action is already in progress.']);
        }

        if ($action !== 'create' && ! $service->remote_id) {
            throw ValidationException::withMessages(['action' => 'This service has no account on a server yet.']);
        }

        if ($action === 'create' && $service->status !== 'active') {
            throw ValidationException::withMessages(['action' => 'Only an active (paid) service can be provisioned.']);
        }

        $service->update(['provision_status' => 'queued']);
        ProvisionService::dispatch($service->id, $action);
        ActivityLog::record("service.{$action}.requested", $service);

        return $service;
    }

    public function credentials(Service $service)
    {
        ActivityLog::record('service.credentials.viewed', $service);

        return $service->credentials ?? [];
    }
}
