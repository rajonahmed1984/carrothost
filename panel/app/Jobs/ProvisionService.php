<?php

namespace App\Jobs;

use App\Models\ActivityLog;
use App\Models\Server;
use App\Models\Service;
use App\Provisioning\ProvisioningModule;
use App\Services\CustomerMailer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class ProvisionService implements ShouldQueue
{
    use Queueable;

    // One attempt: a retried createacct could leave a second account behind.
    // A failure is shown to the admin, who retries after checking the server.
    public int $tries = 1;

    public int $timeout = 420;

    /**
     * $welcome: email the login details after a create.
     * $billing: a suspension for an unpaid bill (tells the client); false when an admin suspends by hand.
     */
    public function __construct(public int $serviceId, public string $action, public bool $welcome = true, public bool $billing = true) {}

    public function handle(): void
    {
        $service = Service::with(['product', 'client', 'server'])->findOrFail($this->serviceId);

        if ($this->action === 'create' && $service->remote_id) {
            return;
        }

        $moduleCode = $service->product->module;
        $class = config("billing.provisioning_modules.{$moduleCode}.class");

        if (! $class) {
            $service->update(['provision_status' => 'manual_required', 'provision_error' => "{$moduleCode} module is not connected yet."]);

            return;
        }

        $server = $service->server ?? $this->pinnedServer($service) ?? $this->pickServer($moduleCode);

        if (! $server) {
            $service->update(['provision_status' => 'failed', 'provision_error' => "No active {$moduleCode} server has capacity."]);

            return;
        }

        $service->update(['provision_status' => 'running', 'provision_error' => null, 'server_id' => $server->id]);

        try {
            /** @var ProvisioningModule $module */
            $module = new $class($server);
            $changes = match ($this->action) {
                'create' => $this->create($module, $service),
                'suspend' => $this->suspend($module, $service),
                'unsuspend' => $this->unsuspend($module, $service),
                'terminate' => $this->terminate($module, $service),
            };

            $service->update([...$changes, 'provision_status' => 'done']);
            ActivityLog::record("service.{$this->action}", $service);

            if ($this->action === 'create' && $this->welcome) {
                app(CustomerMailer::class)->serviceWelcome($service);
            }
            // Billing suspensions tell the client why and how to get it back.
            if ($this->action === 'suspend' && ($changes['auto_suspended'] ?? false)) {
                app(CustomerMailer::class)->serviceSuspended($service->refresh());
            }
        } catch (Throwable $e) {
            $service->update(['provision_status' => 'failed', 'provision_error' => $e->getMessage()]);
            ActivityLog::record("service.{$this->action}.failed", $service, ['error' => $e->getMessage()]);
        }
    }

    private function create(ProvisioningModule $module, Service $service): array
    {
        $account = $module->create($service);

        return ['remote_id' => $account['remote_id'], 'credentials' => $account];
    }

    private function suspend(ProvisioningModule $module, Service $service): array
    {
        $module->suspend($service, $this->billing ? 'Overdue invoice' : 'Suspended by staff');

        return ['status' => 'suspended', 'auto_suspended' => $this->billing];
    }

    private function unsuspend(ProvisioningModule $module, Service $service): array
    {
        $module->unsuspend($service);

        return ['status' => 'active', 'auto_suspended' => false];
    }

    private function terminate(ProvisioningModule $module, Service $service): array
    {
        $module->terminate($service);

        return ['status' => 'terminated'];
    }

    /** The server the product is tied to, while it is active and still runs that module. */
    private function pinnedServer(Service $service): ?Server
    {
        $server = $service->product->server;

        return $server?->is_active && $server->module === $service->product->module ? $server : null;
    }

    private function pickServer(string $moduleCode): ?Server
    {
        return Server::where('module', $moduleCode)
            ->where('is_active', true)
            ->withCount(['services' => fn ($q) => $q->whereIn('status', ['active', 'suspended'])])
            ->orderBy('services_count')
            ->get()
            ->first(fn (Server $s) => $s->max_accounts === 0 || $s->services_count < $s->max_accounts);
    }
}
