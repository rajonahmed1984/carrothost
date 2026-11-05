<?php

namespace App\Jobs;

use App\Models\ActivityLog;
use App\Models\Service;
use App\Provisioning\WebdockModule;
use App\Services\CustomerMailer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * Waits for a new or reinstalled Webdock VPS to run, then adds its sudo user with the saved
 * password. Checks once a minute for up to half an hour.
 */
class FinishWebdockSetup implements ShouldQueue
{
    use Queueable;

    public int $tries = 30;

    public function __construct(public int $serviceId) {}

    public function handle(): void
    {
        $service = Service::with(['server', 'product', 'client'])->find($this->serviceId);

        if (! $service?->remote_id || ! $service->server || ($service->credentials['shell_ready'] ?? false)) {
            return;
        }

        $module = new WebdockModule($service->server);

        try {
            if ($module->status($service) !== 'running') {
                $this->release(60);

                return;
            }

            $module->ensureShellUser($service);
        } catch (Throwable $e) {
            // Shell users can fail for a moment right after boot; try again until the attempts run out.
            if ($this->attempts() < $this->tries) {
                $this->release(60);

                return;
            }

            $service->update(['provision_error' => 'VPS is up, but adding the login user failed: '.$e->getMessage()]);
            ActivityLog::record('service.vps_user.failed', $service, ['error' => $e->getMessage()]);

            return;
        }

        $service->update([
            'credentials' => [...$service->credentials->toArray(), 'shell_ready' => true],
            'provision_error' => null,
        ]);
        ActivityLog::record('service.vps_user.created', $service);
    }

    public function failed(Throwable $e): void
    {
        Service::whereKey($this->serviceId)->update(['provision_error' => 'The VPS did not finish starting within 30 minutes. Check it in Webdock, then use Reset root password to add the login.']);
    }
}
