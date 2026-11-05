<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Service;
use App\Provisioning\ManagesVps;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

/**
 * VPS controls for one service, shared by the admin and client service pages.
 * Clients get power, reinstall, password and console on a running service; admins also get
 * snapshots and resize, and can act on suspended services.
 */
class VpsTools
{
    public const CLIENT_ACTIONS = ['start', 'stop', 'reboot', 'reinstall', 'password', 'console'];

    public const ADMIN_ACTIONS = [...self::CLIENT_ACTIONS, 'snapshot', 'restore', 'resize'];

    public static function supports(Service $service): bool
    {
        $class = config("billing.provisioning_modules.{$service->product?->module}.class");

        return $class && is_subclass_of($class, ManagesVps::class) && $service->remote_id && $service->server_id;
    }

    public function module(Service $service): ManagesVps
    {
        if (! self::supports($service)) {
            throw ValidationException::withMessages(['vps' => $service->remote_id ? 'This product has no VPS module.' : 'The VPS has not been created yet.']);
        }

        $class = config("billing.provisioning_modules.{$service->product->module}.class");

        return new $class($service->server);
    }

    /** Status, IPs, usage and, for admins, snapshots and resize choices. */
    public function overview(Service $service, bool $admin): array
    {
        $module = $this->module($service);
        $info = $this->run(fn () => $module->vpsInfo($service));

        return [
            ...$info,
            'username' => $service->credentials['username'] ?? null,
            'login_ready' => (bool) ($service->credentials['shell_ready'] ?? true),
            'setup_note' => $service->provision_error,
            'actions' => $admin ? self::ADMIN_ACTIONS : ($service->status === 'active' ? self::CLIENT_ACTIONS : []),
            'snapshots' => $admin ? $this->quiet(fn () => $module->snapshots($service)) : null,
        ];
    }

    public function images(Service $service): array
    {
        return $this->run(fn () => $this->module($service)->images($service));
    }

    public function resizeOptions(Service $service): array
    {
        return $this->run(fn () => $this->module($service)->resizeOptions($service));
    }

    /** Runs one action and returns what to tell the user. $who is 'admin' or 'client'. */
    public function act(Service $service, string $action, array $input, string $who): array
    {
        $allowed = $who === 'admin' ? self::ADMIN_ACTIONS : self::CLIENT_ACTIONS;

        if (! in_array($action, $allowed, true)) {
            throw ValidationException::withMessages(['vps' => 'That action is not available.']);
        }
        if ($who === 'client' && $service->status !== 'active') {
            throw ValidationException::withMessages(['vps' => 'This VPS is '.$service->status.'. Pay any overdue invoice or open a ticket.']);
        }

        $module = $this->module($service);
        $result = $this->run(fn () => match ($action) {
            'start', 'stop', 'reboot' => tap(['message' => ucfirst($action === 'stop' ? 'shutdown' : $action).' started. It takes a minute.'], fn () => $module->power($service, $action)),
            'reinstall' => tap(['message' => 'Reinstall started. Everything on the disk is erased; the login user is added back when the new system is up (a few minutes).'], fn () => $module->reinstall($service, (string) ($input['image'] ?? ''))),
            'password' => $this->password($service, (string) ($input['password'] ?? '')),
            'console' => ['url' => $module->consoleUrl($service)],
            'snapshot' => tap(['message' => 'Snapshot started.'], fn () => $module->createSnapshot($service, (string) ($input['name'] ?? ('Panel '.now()->format('Y-m-d H:i'))))),
            'restore' => tap(['message' => 'Restore started. The VPS returns to that snapshot in a few minutes.'], fn () => $module->restoreSnapshot($service, (string) ($input['snapshot_id'] ?? ''))),
            'resize' => tap(['message' => 'Resize started. The VPS restarts on the new profile.'], fn () => $module->resize($service, (string) ($input['profile'] ?? ''))),
        });

        ActivityLog::record("service.vps.{$action}", $service, array_filter(['by' => $who, 'image' => $input['image'] ?? null, 'snapshot' => $input['snapshot_id'] ?? null, 'profile' => $input['profile'] ?? null]));

        return $result;
    }

    private function password(Service $service, string $password): array
    {
        $this->module($service);
        $class = config("billing.provisioning_modules.{$service->product->module}.class");
        (new $class($service->server))->changePassword($service, $password);
        $service->update(['credentials' => [...($service->credentials?->toArray() ?? []), 'password' => $password, 'shell_ready' => true]]);

        return ['message' => 'Password changed for '.($service->credentials['username'] ?? 'the login user').'.'];
    }

    private function run(callable $call): mixed
    {
        try {
            return $call();
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['vps' => $e->getMessage()]);
        }
    }

    private function quiet(callable $call): ?array
    {
        try {
            return $call();
        } catch (Throwable) {
            return null;
        }
    }
}
