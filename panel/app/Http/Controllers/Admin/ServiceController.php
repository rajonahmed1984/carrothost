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
use App\Provisioning\ReportsAccountStatus;
use App\Provisioning\WebdockModule;
use App\Services\AutomationService;
use App\Services\DashboardService;
use App\Services\ServiceTools;
use App\Services\VpsTools;
use App\Support\PaymentMethods;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        return Service::with(['client:id,name,email', 'product:id,name,module,product_group_id', 'product.group:id,name', 'server:id,name'])
            // "needs_action" is the dashboard's Pending Module Actions: failed, set up by hand, or awaiting accept.
            ->when($request->query('status'), fn ($q, $status) => match ($status) {
                'needs_action' => $q->whereIn('provision_status', DashboardService::SERVICE_ACTIONS),
                // The dashboard's Pending Cancellations: set to terminate at the end of the cycle, not yet terminated.
                'pending_cancellation' => $q->where('terminate_end_of_cycle', true)->whereIn('status', ['active', 'suspended', 'pending']),
                default => $q->where('status', $status),
            })
            // From the Products list: one plan's services.
            ->when($request->query('product'), fn ($q, $product) => $q->where('product_id', (int) $product))
            // "inactive" is everything not running: pending, cancelled, terminated.
            ->when($request->query('state') === 'inactive', fn ($q) => $q->whereIn('status', ['pending', 'cancelled', 'terminated', 'fraud']))
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

    /**
     * Admin edits to the service. Status and product changes are carried to the server too, unless
     * the admin turns that off: suspending or unsuspending the account, and moving it to the
     * product's package.
     */
    public function update(Request $request, Service $service, ServiceTools $tools)
    {
        $module = Product::find($request->input('product_id', $service->product_id))?->module;
        // A Webdock slug is often pasted as the server's domain or dashboard link.
        if ($module === 'webdock' && filled($request->input('remote_id'))) {
            $request->merge(['remote_id' => WebdockModule::normalizeSlug((string) $request->input('remote_id'))]);
        }

        $data = $request->validate([
            'product_id' => 'sometimes|integer|exists:products,id',
            'server_id' => 'sometimes|nullable|integer|exists:servers,id',
            'domain' => ['sometimes', 'nullable', 'string', 'max:255', 'regex:'.Domain::NAME_PATTERN],
            'dedicated_ip' => 'sometimes|nullable|ip',
            // Links the record to the account on the server (a Webdock server slug, a cPanel username).
            'remote_id' => ['sometimes', 'nullable', 'string', 'max:64', 'regex:/^[A-Za-z0-9._-]+$/'],
            'username' => 'sometimes|nullable|string|max:64',
            'password' => 'sometimes|nullable|string|max:255',
            // A hand-made VPS's SSH port, kept with its login.
            'ssh_port' => 'sometimes|nullable|integer|between:1,65535',
            'status' => ['sometimes', Rule::in(self::STATUSES)],
            'registered_at' => 'sometimes|nullable|date',
            'quantity' => 'sometimes|integer|min:1|max:1000',
            'first_payment_amount' => 'sometimes|numeric|min:0|max:9999999',
            // Blank uses the product's price for the cycle and quantity.
            'recurring_amount' => 'sometimes|nullable|numeric|min:0|max:9999999',
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
            // This VPS's own monthly cost, when it differs from its product's.
            'cost_amount' => 'sometimes|nullable|numeric|min:0|max:9999999',
            'cost_currency' => 'sometimes|nullable|in:BDT,USD',
            'apply_to_server' => 'sometimes|boolean',
            'change_package' => 'sometimes|boolean',
        ]);

        if (array_key_exists('recurring_amount', $data) && $data['recurring_amount'] === null) {
            unset($data['recurring_amount']);
            $data['recalculate'] = true;
        }
        $oldProduct = $service->product_id;
        $oldRemote = $service->remote_id;
        $serverAction = $this->statusAction($service, $data['status'] ?? $service->status, $data['apply_to_server'] ?? true);

        $changes = collect($data)->except(['username', 'password', 'ssh_port', 'recalculate', 'apply_to_server', 'change_package'])->all();

        if (isset($changes['domain'])) {
            $changes['domain'] = strtolower($changes['domain']);
        }
        if (array_key_exists('cost_amount', $changes)) {
            $changes['cost_currency'] = $changes['cost_amount'] === null ? null : ($changes['cost_currency'] ?? 'BDT');
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
            $changes['recurring_amount'] = bcmul($price->priceIn($service->client->currencyCode()), (string) ($changes['quantity'] ?? $service->quantity), 2);
        }

        // A hand-made VPS is known by its hostname: a new hostname carries over to an ID that matched the old.
        $manualVps = (bool) Product::find($changes['product_id'] ?? $service->product_id)?->isManualVps();
        if ($manualVps && array_key_exists('domain', $changes) && $changes['domain'] && ! array_key_exists('remote_id', $data)
            && in_array($service->remote_id, [null, '', $service->domain], true)) {
            $changes['remote_id'] = strtolower($changes['domain']);
        }

        // The account ID and the login username are the same name on cPanel and Webuzo: renaming the
        // account carries over to a username that still matched it.
        $storedUser = $service->credentials['username'] ?? null;
        if (! $manualVps && array_key_exists('remote_id', $changes) && $changes['remote_id'] && $changes['remote_id'] !== $oldRemote
            && in_array($storedUser, [null, '', $oldRemote], true) && in_array($data['username'] ?? $storedUser, [null, '', $oldRemote], true)) {
            $data['username'] = $changes['remote_id'];
        }

        // Login details kept in the panel. They do not change the password on the server.
        if (array_key_exists('ssh_port', $data)) {
            $data['port'] = $data['ssh_port'];
        }
        if (array_key_exists('username', $data) || array_key_exists('password', $data) || array_key_exists('port', $data)) {
            $credentials = $service->credentials?->toArray() ?? [];
            foreach (['username', 'password', 'port'] as $field) {
                if (array_key_exists($field, $data)) {
                    $credentials[$field] = $data[$field];
                }
            }
            $changes['credentials'] = array_filter($credentials, fn ($v) => $v !== null && $v !== '') ?: null;
        }

        // A linked VPS needs its Webdock account; with only one, that is the one.
        $serverId = array_key_exists('server_id', $changes) ? $changes['server_id'] : $service->server_id;
        $remoteId = array_key_exists('remote_id', $changes) ? $changes['remote_id'] : $service->remote_id;
        if ($module === 'webdock' && $remoteId && ! $serverId) {
            $accounts = Server::where('module', 'webdock')->where('is_active', true)->pluck('id');
            if ($accounts->count() !== 1) {
                throw ValidationException::withMessages(['server_id' => 'Choose the Webdock account this VPS is in.']);
            }
            $changes['server_id'] = $accounts->first();
        }

        $service->update($changes);
        ActivityLog::record('service.updated', $service, ['fields' => array_keys($changes)]);

        $notices = [];
        if ($serverAction) {
            $notices[] = $this->sendStatus($service, $serverAction);
        }

        if (($data['change_package'] ?? false) && $service->product_id !== $oldProduct && ServiceTools::hasTools($service->load('product', 'server'))) {
            try {
                $tools->changePackage($service);
                $notices[] = "Package changed on the server to {$service->product->module_package}.";
            } catch (Throwable $e) {
                $message = $e instanceof ValidationException ? collect($e->errors())->flatten()->first() : $e->getMessage();
                $notices[] = "Saved, but the package was not changed on the server: {$message}";
            }
        }

        return [...$this->detail($service->refresh()), 'notices' => $notices];
    }

    /**
     * The module command that brings the server in line with a status change: suspend or
     * unsuspend. Termination is never automatic, as it deletes the customer's data.
     */
    private function statusAction(Service $service, string $status, bool $apply): ?string
    {
        if (! $apply || $status === $service->status || ! $service->remote_id || ! config("billing.provisioning_modules.{$service->product?->module}.class")) {
            return null;
        }

        $action = match (true) {
            $status === 'suspended' && $service->status === 'active' => 'suspend',
            $status === 'active' && $service->status === 'suspended' => 'unsuspend',
            default => null,
        };

        if ($action && in_array($service->provision_status, ['queued', 'running'], true)) {
            throw ValidationException::withMessages(['status' => 'Another server action is in progress. Try again when it finishes.']);
        }

        return $action;
    }

    /** Runs a staff suspend or unsuspend on the server now (the client gets no overdue notice) and says how it went. */
    private function sendStatus(Service $service, string $action): string
    {
        $error = $this->runNow($service, $action);

        return $error === null
            ? ucfirst($action)."ed {$service->remote_id} on the server."
            : "Saved, but the server did not {$action} {$service->remote_id}: {$error}";
    }

    /**
     * Suspend and unsuspend are one quick API call, so staff see the result at once instead of
     * waiting for the cron-driven queue. Returns the server's error, or null when it worked.
     */
    private function runNow(Service $service, string $action): ?string
    {
        $service->update(['provision_status' => 'running']);
        ActivityLog::record("service.{$action}.requested", $service);
        (new ProvisionService($service->id, $action, true, false))->handle();
        $service->refresh();

        return $service->provision_status === 'failed' ? ($service->provision_error ?: 'Unknown error.') : null;
    }

    /** The account as the server has it, beside what the panel holds, with every difference. */
    public function serverState(Service $service, AutomationService $automation)
    {
        return $this->compareWithServer($service->load('product', 'server'), $automation);
    }

    /**
     * Settles the differences the admin picked. Domain and IP are read from the server into the
     * panel; status and package belong to the panel, so the server is changed to match.
     */
    public function applyServerState(Request $request, Service $service, AutomationService $automation, ServiceTools $tools)
    {
        $use = $request->validate(['use' => 'required|array|min:1', 'use.*' => 'in:domain,dedicated_ip,status,package'])['use'];
        $state = $this->compareWithServer($service->load('product', 'server'), $automation);
        $notices = [];

        $pull = array_filter(
            array_intersect_key(['domain' => $state['server']['domain'], 'dedicated_ip' => $state['server']['ip']], array_flip($use)),
            fn ($v) => $v !== null,
        );
        if ($pull) {
            $service->update($pull);
            ActivityLog::record('service.updated', $service, ['fields' => array_keys($pull), 'from' => 'server']);
            $notices[] = 'Copied the '.implode(' and ', array_map(fn ($k) => $k === 'dedicated_ip' ? 'IP' : $k, array_keys($pull))).' from the server.';
        }

        if (in_array('status', $use, true) && $state['differences']['status']) {
            if (in_array($service->provision_status, ['queued', 'running'], true)) {
                throw ValidationException::withMessages(['use' => 'Another server action is in progress. Try again when it finishes.']);
            }
            $notices[] = $this->sendStatus($service, $service->status === 'suspended' ? 'suspend' : 'unsuspend');
        }

        if (in_array('package', $use, true) && $state['differences']['package']) {
            $tools->changePackage($service);
            $notices[] = "Package changed on the server to {$service->product->module_package}.";
        }

        return [...$this->detail($service->refresh()), 'notices' => $notices];
    }

    /**
     * @return array{server: array{domain: ?string, ip: ?string, package: ?string, suspended: bool},
     *     panel: array{domain: ?string, ip: ?string, package: ?string, status: string}, differences: array<string, bool>}
     */
    private function compareWithServer(Service $service, AutomationService $automation): array
    {
        $class = config("billing.provisioning_modules.{$service->product->module}.class");
        if (! $service->remote_id || ! $service->server || ! $class || ! is_subclass_of($class, ReportsAccountStatus::class)) {
            throw ValidationException::withMessages(['service' => 'This service has no cPanel or Webuzo account to read.']);
        }

        try {
            $server = $automation->statusModule($service)->accountInfo($service);
        } catch (Throwable $e) {
            throw ValidationException::withMessages(['service' => $e->getMessage()]);
        }

        $package = $service->product->module_package;

        return [
            'server' => $server,
            'panel' => ['domain' => $service->domain, 'ip' => $service->dedicated_ip, 'package' => $package, 'status' => $service->status],
            'differences' => [
                'domain' => $server['domain'] !== null && strcasecmp((string) $service->domain, $server['domain']) !== 0,
                // A shared account sits on the server's main IP; only a dedicated IP set here is compared.
                'dedicated_ip' => $server['ip'] !== null && $service->dedicated_ip !== null && $service->dedicated_ip !== $server['ip'],
                // Only active and suspended have a server side; the panel's status wins.
                'status' => in_array($service->status, ['active', 'suspended'], true) && ($service->status === 'suspended') !== $server['suspended'],
                'package' => $package !== null && $server['package'] !== null && strcasecmp($package, $server['package']) !== 0,
            ],
        ];
    }

    public function refreshUsage(Service $service, ServiceTools $tools)
    {
        $tools->refreshUsage($service->load('product', 'server'));

        return $this->detail($service->refresh());
    }

    public function sso(Request $request, Service $service, ServiceTools $tools)
    {
        $service->load('product', 'server');
        $data = $request->validate(['app' => ['nullable', Rule::in(ServiceTools::panelApps($service))]]);

        return ['url' => $tools->loginUrl($service, $data['app'] ?? null)];
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

        // Prices in the client's currency, as the upgrade invoice will be.
        $currency = $service->client->currencyCode();

        return [
            'currency' => $currency,
            'products' => Product::with('prices')->orderBy('name')->get(['id', 'name', 'module'])
                ->filter(fn (Product $p) => $p->prices->isNotEmpty())->values()
                ->map(fn (Product $p) => [
                    ...$p->only('id', 'name', 'module'),
                    'prices' => $p->prices->map(fn ($price) => ['cycle' => $price->cycle, 'price' => $price->priceIn($currency)])->values(),
                ]),
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

    /* ---------- VPS (Webdock) ---------- */

    public function vps(Service $service, VpsTools $vps)
    {
        return $vps->overview($service, admin: true);
    }

    /** The VPSes in the Webdock account, to link this service to one. */
    public function webdockServers(Request $request, Service $service)
    {
        $account = $this->webdockAccount($request, $service);

        try {
            $servers = (new WebdockModule($account))->accountServers();
        } catch (\RuntimeException $e) {
            throw ValidationException::withMessages(['webdock' => $e->getMessage()]);
        }

        // Which ones other services already use, so the same VPS is not linked twice by mistake.
        $linked = Service::where('server_id', $account->id)->whereNotNull('remote_id')->where('id', '!=', $service->id)
            ->with('client:id,name')->get(['id', 'client_id', 'remote_id'])
            ->keyBy('remote_id')->map(fn (Service $s) => ['service_id' => $s->id, 'client' => $s->client?->name]);

        return [
            'account' => ['id' => $account->id, 'name' => $account->name],
            'accounts' => Server::where('module', 'webdock')->orderBy('name')->get(['id', 'name']),
            'servers' => collect($servers)->map(fn ($s) => [...$s, 'linked_to' => $linked[$s['slug']] ?? null])->values(),
        ];
    }

    /** The shell users on one Webdock VPS: the customer's login is one of them. */
    public function webdockUsers(Request $request, Service $service, string $slug)
    {
        try {
            return ['users' => (new WebdockModule($this->webdockAccount($request, $service)))->shellUsers($slug)];
        } catch (\RuntimeException $e) {
            throw ValidationException::withMessages(['webdock' => $e->getMessage()]);
        }
    }

    private function webdockAccount(Request $request, Service $service): Server
    {
        $id = $request->query('server_id') ?: $service->server_id ?: $service->product?->server_id;

        return Server::where('module', 'webdock')
            ->when($id, fn ($q) => $q->whereKey($id), fn ($q) => $q->where('is_active', true))
            ->first() ?? throw ValidationException::withMessages(['webdock' => 'Add your Webdock account under System > Servers first.']);
    }

    public function vpsImages(Service $service, VpsTools $vps)
    {
        return $vps->images($service);
    }

    public function vpsProfiles(Service $service, VpsTools $vps)
    {
        return $vps->resizeOptions($service);
    }

    public function vpsAction(Request $request, Service $service, string $action, VpsTools $vps)
    {
        $request->merge(['action' => $action]);
        $input = $request->validate([
            'image' => 'required_if:action,reinstall|nullable|string|max:120',
            'password' => ['required_if:action,password', 'nullable', 'string', 'min:8', 'max:64', 'regex:/^[A-Za-z0-9._-]+$/'],
            'snapshot_id' => 'required_if:action,restore|nullable|string|max:64',
            'name' => 'nullable|string|max:60',
            'profile' => 'required_if:action,resize|nullable|string|max:120',
        ], ['password.regex' => 'Use letters, digits, dot, dash and underscore only.']);

        return $vps->act($service, $action, $input, 'admin');
    }

    private function detail(Service $service): array
    {
        $service->load(['client:id,name,email', 'product:id,name,module,type,cost_amount,cost_currency', 'server:id,name,hostname,max_accounts', 'order:id,order_number']);
        $port = self::PANEL_PORTS[$service->product->module] ?? null;

        return [
            ...$service->toArray(),
            'username' => $service->credentials['username'] ?? null,
            'has_password' => filled($service->credentials['password'] ?? null),
            'manual_vps' => $service->product->isManualVps(),
            'ssh_port' => isset($service->credentials['port']) ? (int) $service->credentials['port'] : null,
            'panel_url' => $port && $service->server ? "https://{$service->server->hostname}:{$port}" : null,
            'has_tools' => ServiceTools::hasTools($service),
            'panel_apps' => ServiceTools::panelApps($service),
            'is_vps' => VpsTools::supports($service),
            'pending_upgrade' => app(ServiceTools::class)->pendingUpgrade($service),
            'client_services' => $service->client->services()->with('product:id,name')->orderByDesc('id')->get(['id', 'product_id', 'domain', 'status'])
                ->map(fn (Service $s) => ['id' => $s->id, 'name' => $s->product->name.($s->domain ? " - {$s->domain}" : ''), 'status' => $s->status]),
            'options' => [
                // Each product's prices in the client's currency, for the Recurring Amount placeholder.
                'products' => Product::with('prices')->orderBy('name')->get(['id', 'name', 'module'])->map(fn (Product $p) => [
                    'id' => $p->id, 'name' => $p->name, 'module' => $p->module,
                    'prices' => $p->prices->mapWithKeys(fn ($price) => [$price->cycle => $price->priceIn($service->client->currencyCode())]),
                ]),
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

        // Suspended here by staff, not for an unpaid bill: the client gets no overdue notice.
        if (in_array($action, ['suspend', 'unsuspend'], true)) {
            if ($error = $this->runNow($service, $action)) {
                throw ValidationException::withMessages(['action' => ucfirst($action)." failed on the server: {$error}"]);
            }

            return $service;
        }

        $service->update(['provision_status' => 'queued']);
        ProvisionService::dispatch($service->id, $action, true, false);
        ActivityLog::record("service.{$action}.requested", $service);

        return $service;
    }

    public function credentials(Service $service)
    {
        ActivityLog::record('service.credentials.viewed', $service);

        return $service->credentials ?? [];
    }
}
