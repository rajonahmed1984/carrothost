<?php

namespace App\Jobs;

use App\Models\ActivityLog;
use App\Models\Server;
use App\Models\Service;
use App\Provisioning\ProvisioningModule;
use App\Provisioning\ReportsAccountStatus;
use App\Services\CustomerMailer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Sleep;
use RuntimeException;
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

        // Only a new account may go to any server. An existing account lives on its own server:
        // sending suspend or terminate elsewhere could hit another customer with the same username.
        $server = $this->action === 'create'
            ? $service->server ?? $this->pinnedServer($service) ?? $this->pickServer($moduleCode)
            : $service->server;

        if (! $server && $this->action !== 'create') {
            $service->update(['provision_status' => 'failed', 'provision_error' => "This service is not linked to a server, so {$service->remote_id} was not {$this->action}ed. Set its server first."]);
            ActivityLog::record("service.{$this->action}.failed", $service, ['error' => 'No server linked.']);

            return;
        }

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
                'cancel' => $this->cancel($module, $service),
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
            // A billing unsuspend (the overdue invoice was paid) tells the client it is back on.
            if ($this->action === 'unsuspend' && $this->billing) {
                app(CustomerMailer::class)->serviceUnsuspended($service->refresh());
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
        $this->confirmSuspended($module, $service, true);

        return ['status' => 'suspended', 'auto_suspended' => $this->billing];
    }

    /** An accepted cancellation: the panel already shows it cancelled; the account is suspended, not removed. */
    private function cancel(ProvisioningModule $module, Service $service): array
    {
        $module->suspend($service, 'Cancelled at client request');
        $this->confirmSuspended($module, $service, true);

        return ['auto_suspended' => false];
    }

    private function unsuspend(ProvisioningModule $module, Service $service): array
    {
        $module->unsuspend($service);
        $this->confirmSuspended($module, $service, false);

        return ['status' => 'active', 'auto_suspended' => false];
    }

    /**
     * Some servers report success while the account stays as it was (Webuzo has said "unsuspended"
     * and left the site on the suspended page), so read the account back before calling it done.
     * Retries a few times for servers that apply the change as a background task. An account that
     * cannot be read is left alone: only a server that answers with the wrong state fails the job.
     */
    private function confirmSuspended(ProvisioningModule $module, Service $service, bool $suspended): void
    {
        if (! $module instanceof ReportsAccountStatus) {
            return;
        }

        foreach ([0, 2, 4] as $wait) {
            if ($wait) {
                Sleep::for($wait)->seconds();
            }
            try {
                if ($module->accountInfo($service)['suspended'] === $suspended) {
                    return;
                }
            } catch (Throwable) {
                return;
            }
        }

        $done = $suspended ? 'suspended' : 'unsuspended';
        $state = $suspended ? 'active' : 'suspended';

        throw new RuntimeException("The server said {$service->remote_id} was {$done}, but it still shows the account as {$state}. Check the account in the server's control panel.");
    }

    private function terminate(ProvisioningModule $module, Service $service): array
    {
        try {
            $module->terminate($service);
        } catch (Throwable $e) {
            // Already removed on the server (by hand, say): nothing is left to delete.
            if (! $this->accountGone($module, $service)) {
                throw $e;
            }
        }

        return ['status' => 'terminated', 'termination_date' => $service->termination_date ?? today()];
    }

    /** True only when the server answers and says it has no such account; any other error is not proof. */
    private function accountGone(ProvisioningModule $module, Service $service): bool
    {
        if (! $module instanceof ReportsAccountStatus) {
            return false;
        }

        try {
            $module->accountInfo($service);

            return false;
        } catch (Throwable $e) {
            return str_contains($e->getMessage(), "has no account named {$service->remote_id}");
        }
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
