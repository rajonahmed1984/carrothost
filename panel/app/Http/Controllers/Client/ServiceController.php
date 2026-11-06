<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Service;
use App\Provisioning\CpanelModule;
use App\Services\ServiceTools;
use App\Services\VpsTools;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** The signed-in customer's own services. */
class ServiceController extends Controller
{
    /** Control panel login pages the customer is sent to, by module. */
    private const PANEL_PORTS = ['cpanel' => 2083, 'webuzo' => 2003];

    /** Pages inside the control panel a one-click login can open, by module. */
    private const PANEL_APPS = ['cpanel' => CpanelModule::APPS];

    /** What the customer sees in a service's activity, and how it reads. */
    private const ACTIVITY = [
        'service.panel_login' => 'Signed in to the control panel',
        'service.password_changed' => 'Account password changed',
        'service.credentials.viewed_by_client' => 'Account password viewed',
        'service.upgrade.requested' => 'Upgrade/downgrade requested',
        'service.upgraded' => 'Plan changed',
        'service.package_changed' => 'Server package changed',
        'service.welcome_sent' => 'Welcome email sent',
    ];

    public function index(Request $request)
    {
        return $request->user('client')->services()
            ->with(['product:id,name,type,module,product_group_id', 'product.group:id,name', 'server:id,hostname'])
            ->latest()
            ->get()
            ->map(fn (Service $service) => $this->present($service));
    }

    public function show(Request $request, int $id, ServiceTools $tools)
    {
        $service = $request->user('client')->services()
            ->with(['product:id,name,type,module,description,product_group_id', 'product.group:id,name', 'server:id,hostname,ip_address,nameservers'])
            ->findOrFail($id);
        $live = in_array($service->status, ['active', 'suspended'], true);
        $hasTools = $live && ServiceTools::hasTools($service);
        $pending = $tools->pendingUpgrade($service);

        return [
            ...$this->present($service),
            'product_id' => $service->product_id,
            'description' => $service->product->description,
            'has_password' => ! empty($service->credentials['password'] ?? null),
            'is_vps' => VpsTools::supports($service),
            // One-click login, password change and live usage go through the server module.
            'has_tools' => $hasTools,
            'panel_apps' => $hasTools ? array_keys(self::PANEL_APPS[$service->product->module] ?? []) : [],
            'can_upgrade' => $service->status === 'active' && ! $pending && $this->upgradeProducts($service)->count() > 1,
            'pending_upgrade' => $pending ? [
                'invoice_id' => $pending->invoice_id,
                'new_product' => $pending->newProduct?->name,
                'new_cycle' => $pending->new_cycle,
                'amount_due' => $pending->amount_due,
            ] : null,
            'registered_at' => ($service->registered_at ?? $service->created_at)?->toDateString(),
            'server' => $live && $service->server ? ['hostname' => $service->server->hostname, 'ip' => $service->server->ip_address] : null,
            'usage' => [
                'disk_used' => $service->disk_usage,
                'disk_limit' => $service->disk_limit,
                'bw_used' => $service->bw_usage,
                'bw_limit' => $service->bw_limit,
                'metrics' => $service->usage_metrics ?? [],
                'updated_at' => $service->usage_updated_at?->toIso8601String(),
            ],
            // Where to point the domain: the hosting server's nameservers and IP.
            'nameservers' => collect($service->server?->nameservers ?? [])->pluck('host')->filter()->values(),
            'server_ip' => $service->server?->ip_address,
            'invoices' => Invoice::whereHas('items', fn ($q) => $q->where('service_id', $service->id))
                ->where('client_id', $service->client_id)
                ->latest()
                ->get(['id', 'number', 'status', 'currency', 'total', 'due_date']),
            'activity' => ActivityLog::where('subject_type', $service->getMorphClass())->where('subject_id', $service->id)
                ->whereIn('action', array_keys(self::ACTIVITY))
                ->latest('id')->limit(20)->get()
                ->map(fn (ActivityLog $log) => [
                    'id' => $log->id,
                    'title' => self::ACTIVITY[$log->action],
                    'by' => $log->user_id ? 'Our team' : 'You',
                    'at' => $log->created_at?->toIso8601String(),
                ]),
        ];
    }

    /* ---------- Control panel (cPanel, Webuzo) ---------- */

    /** A one-time login link, optionally straight into email, databases and so on. */
    public function sso(Request $request, int $id, ServiceTools $tools)
    {
        $service = $this->hosting($request, $id);
        $data = $request->validate(['app' => ['nullable', Rule::in(array_keys(self::PANEL_APPS[$service->product->module] ?? []))]]);

        return ['url' => $tools->loginUrl($service, $data['app'] ?? null)];
    }

    public function refreshUsage(Request $request, int $id, ServiceTools $tools)
    {
        $tools->refreshUsage($this->hosting($request, $id));

        return $this->show($request, $id, $tools);
    }

    public function changePassword(Request $request, int $id, ServiceTools $tools)
    {
        $service = $this->hosting($request, $id);
        $data = $request->validate([
            'password' => ['required', 'string', 'min:10', 'max:64', 'confirmed', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/\d/'],
        ], ['password.regex' => 'Use upper and lower case letters and at least one digit.']);

        $tools->changePassword($service, $data['password']);

        return $this->show($request, $id, $tools);
    }

    /* ---------- Upgrade / downgrade ---------- */

    /** Plans in the same category and on the same control panel, with the cost of the chosen one. */
    public function upgradeOptions(Request $request, int $id, ServiceTools $tools)
    {
        $service = $this->upgradable($request, $id);
        $data = $request->validate(['product_id' => 'nullable|integer', 'cycle' => ['nullable', Rule::in(array_keys(config('billing.cycles')))]]);
        $currency = $service->client->currencyCode();
        $products = $this->upgradeProducts($service);
        $chosen = isset($data['product_id']) ? $products->firstWhere('id', $data['product_id']) : null;

        return [
            'currency' => $currency,
            'products' => $products->map(fn (Product $p) => [
                ...$p->only('id', 'name', 'module'),
                'prices' => $p->prices->map(fn ($price) => ['cycle' => $price->cycle, 'price' => $price->priceIn($currency)])->values(),
            ])->values(),
            'quote' => $chosen && isset($data['cycle']) ? $tools->quote($service, $chosen, $data['cycle']) : null,
        ];
    }

    public function upgrade(Request $request, int $id, ServiceTools $tools)
    {
        $service = $this->upgradable($request, $id);
        $data = $request->validate(['product_id' => 'required|integer', 'cycle' => ['required', Rule::in(array_keys(config('billing.cycles')))]]);
        $product = $this->upgradeProducts($service)->firstWhere('id', $data['product_id'])
            ?? throw ValidationException::withMessages(['product_id' => 'Choose one of the plans listed.']);

        $invoice = $tools->upgrade($service, $product, $data['cycle']);

        return [
            'message' => $invoice ? "Invoice {$invoice->number} has been created. Your plan changes as soon as it is paid." : 'Nothing to pay, so your plan has been changed.',
            'invoice_id' => $invoice?->id,
        ];
    }

    private function upgradable(Request $request, int $id): Service
    {
        $service = $request->user('client')->services()->with(['product.group', 'client', 'server'])->findOrFail($id);

        if ($service->status !== 'active') {
            throw ValidationException::withMessages(['service' => 'Only an active service can be upgraded or downgraded.']);
        }

        return $service;
    }

    /** The current plan plus the active plans in its category, of its type and on its control panel. */
    private function upgradeProducts(Service $service)
    {
        $product = $service->product;

        return Product::with('prices')
            ->where(fn ($q) => $q->whereKey($product->id)->orWhere(fn ($q) => $q
                ->where('is_active', true)
                ->where('product_group_id', $product->product_group_id)
                ->where('type', $product->type)
                ->when($product->module, fn ($q) => $q->where('module', $product->module), fn ($q) => $q->whereNull('module'))))
            ->orderBy('name')
            ->get(['id', 'name', 'module'])
            ->filter(fn (Product $p) => $p->prices->isNotEmpty())
            ->values();
    }

    /** An active or suspended hosting account the module can reach. */
    private function hosting(Request $request, int $id): Service
    {
        $service = $request->user('client')->services()->with(['product', 'server'])->findOrFail($id);

        if (! in_array($service->status, ['active', 'suspended'], true) || ! ServiceTools::hasTools($service)) {
            throw ValidationException::withMessages(['service' => 'This service has no control panel account to manage yet.']);
        }

        return $service;
    }

    /* ---------- VPS (Webdock) ---------- */

    public function vps(Request $request, int $id, VpsTools $vps)
    {
        return $vps->overview($this->own($request, $id), admin: false);
    }

    public function vpsImages(Request $request, int $id, VpsTools $vps)
    {
        return $vps->images($this->own($request, $id));
    }

    public function vpsAction(Request $request, int $id, string $action, VpsTools $vps)
    {
        $request->merge(['action' => $action]);
        $input = $request->validate([
            'image' => 'required_if:action,reinstall|nullable|string|max:120',
            'password' => ['required_if:action,password', 'nullable', 'string', 'min:8', 'max:64', 'regex:/^[A-Za-z0-9._-]+$/'],
            'snapshot_id' => 'required_if:action,restore|nullable|string|max:64',
            'name' => 'nullable|string|max:60',
            'profile' => 'required_if:action,resize|nullable|string|max:120',
        ], ['password.regex' => 'Use letters, digits, dot, dash and underscore only.']);

        return $vps->act($this->own($request, $id), $action, $input, 'client');
    }

    private function own(Request $request, int $id): Service
    {
        return $request->user('client')->services()->with(['product', 'server'])->findOrFail($id);
    }

    public function password(Request $request, int $id)
    {
        $service = $request->user('client')->services()->findOrFail($id);
        ActivityLog::record('service.credentials.viewed_by_client', $service);

        return ['password' => $service->credentials['password'] ?? null];
    }

    private function present(Service $service): array
    {
        $module = $service->product->module;
        $port = self::PANEL_PORTS[$module] ?? null;
        $live = in_array($service->status, ['active', 'suspended'], true);

        return [
            ...$service->only('id', 'domain', 'cycle', 'recurring_amount', 'status', 'created_at'),
            'next_due_date' => $service->next_due_date?->toDateString(),
            'product' => [
                'name' => $service->product->name,
                'type' => $service->product->type,
                'module' => $module,
                'group' => $service->product->group?->name,
            ],
            'username' => $live ? ($service->credentials['username'] ?? null) : null,
            // The login page only; signing in still takes the account password.
            'panel_url' => $live && $port && $service->server ? "https://{$service->server->hostname}:{$port}" : null,
        ];
    }
}
