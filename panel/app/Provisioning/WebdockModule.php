<?php

namespace App\Provisioning;

use App\Jobs\FinishWebdockSetup;
use App\Models\Server;
use App\Models\Service;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Webdock VPS (api.webdock.io/v1). A panel "server" is the Webdock account: its API token is the
 * credential. A product's package is "{locationId}/{profileSlug}". The service's remote_id is the
 * Webdock server slug; its login is a sudo shell user made once the VPS is running.
 */
class WebdockModule implements ManagesAccounts, ManagesVps, ProvisioningModule
{
    use GeneratesUsername;

    private const API = 'https://api.webdock.io/v1';

    public function __construct(private Server $server) {}

    public function testConnection(): void
    {
        $this->request('get', '/account/accountInformation');
    }

    public function packages(): array
    {
        $options = [];
        foreach ($this->list($this->request('get', '/locations')) as $location) {
            $id = (string) ($location['id'] ?? '');
            if ($id === '') {
                continue;
            }
            foreach ($this->list($this->request('get', '/profiles', ['locationId' => $id])) as $p) {
                $options[] = ['id' => "{$id}/{$p['slug']}", 'name' => trim(($location['name'] ?? $id).' - '.$this->profileLabel($p))];
            }
        }

        return $options;
    }

    public function create(Service $service): array
    {
        [$location, $profile] = $this->package((string) $service->product->module_package);
        [$username, $password] = $this->credentialsFor($service);
        $username = substr(preg_replace('/[^a-z0-9_]/', '', strtolower($username)) ?: 'admin', 0, 16);
        // Webdock shell passwords allow letters, digits, - and _ only.
        if (! preg_match('/^[A-Za-z0-9_-]{8,}$/', $password)) {
            $password = Str::password(16, symbols: false);
        }

        $server = $this->request('post', '/servers', array_filter([
            'name' => $service->domain ?: "{$service->product->name} #{$service->id}",
            'slug' => $this->slugFor($service),
            'locationId' => $location,
            'profileSlug' => $profile,
            // The customer's choice at order, else the product's default, else the newest Ubuntu LTS.
            'imageSlug' => ($service->module_options['image'] ?? null) ?: ($service->product->vpsConfig()['default_image'] ?? null) ?: $this->defaultImage(),
            'virtualization' => 'kvm',
        ]));
        $slug = (string) ($server['slug'] ?? '');

        if ($slug === '') {
            throw new RuntimeException('Webdock did not return the new server.');
        }

        // The VPS takes a few minutes to boot; the sudo user is added once it runs.
        FinishWebdockSetup::dispatch($service->id)->delay(now()->addMinutes(2));

        return ['remote_id' => $slug, 'username' => $username, 'password' => $password, 'shell_ready' => false];
    }

    /** Suspension powers the VPS off; the disk and IP stay. */
    public function suspend(Service $service, string $reason): void
    {
        $this->power($service, 'stop');
    }

    public function unsuspend(Service $service): void
    {
        $this->power($service, 'start');
    }

    public function terminate(Service $service): void
    {
        $this->request('delete', "/servers/{$this->slug($service)}");
    }

    /* ---------- ManagesAccounts ---------- */

    public function usage(Service $service): array
    {
        $m = $this->vpsInfo($service)['metrics'];
        $pct = fn ($used, $limit) => $used !== null && $limit ? round($used / $limit * 100, 1) : null;

        return [
            'metrics' => array_values(array_filter([
                $m['cpu'] !== null ? ['key' => 'cpu', 'label' => 'CPU', 'used' => "{$m['cpu']}%", 'limit' => null, 'percent' => $m['cpu']] : null,
                $m['memory_mb'] !== null ? ['key' => 'memory', 'label' => 'Memory in use', 'used' => round($m['memory_mb']).' MB', 'limit' => null, 'percent' => null] : null,
                $m['network_gb'] !== null ? ['key' => 'network', 'label' => 'Traffic this month', 'used' => "{$m['network_gb']} GB", 'limit' => $m['network_limit_gb'] ? "{$m['network_limit_gb']} GB" : null, 'percent' => $pct($m['network_gb'], $m['network_limit_gb'])] : null,
            ])),
            'disk_used' => $m['disk_mb'] !== null ? (int) round($m['disk_mb']) : null,
            'disk_limit' => $m['disk_limit_mb'] !== null ? (int) round($m['disk_limit_mb']) : null,
            'bw_used' => $m['network_gb'] !== null ? (int) round($m['network_gb'] * 1024) : null,
            'bw_limit' => $m['network_limit_gb'] ? (int) round($m['network_limit_gb'] * 1024) : null,
        ];
    }

    public function loginUrl(Service $service, ?string $app = null): string
    {
        return $this->consoleUrl($service);
    }

    /** Resets the sudo user's password, creating the user if Webdock does not have it yet. */
    public function changePassword(Service $service, string $password): void
    {
        if (! preg_match('/^[A-Za-z0-9._-]{8,64}$/', $password)) {
            throw new RuntimeException('Webdock passwords may use letters, digits, dot, dash and underscore only, 8 to 64 characters.');
        }

        $username = $this->username($service);
        $user = $this->shellUser($service, $username);

        if ($user) {
            $this->request('post', "/servers/{$this->slug($service)}/shellUsers/{$user['id']}/resetPassword", ['newPassword' => $password]);
        } else {
            $this->createShellUser($service, $username, $password);
        }
    }

    public function changePackage(Service $service, string $package): void
    {
        [, $profile] = $this->package($package);
        $this->resize($service, $profile);
    }

    /* ---------- ManagesVps ---------- */

    public function vpsInfo(Service $service): array
    {
        $slug = $this->slug($service);
        $s = $this->request('get', "/servers/{$slug}");

        try {
            $now = $this->request('get', "/servers/{$slug}/metrics/now");
        } catch (RuntimeException) {
            $now = []; // Metrics are missing while the VPS is stopped or still provisioning.
        }
        $sample = fn ($node) => is_array($node) ? ($node['value'] ?? $node['amount'] ?? $node['usage'] ?? null) : $node;
        $num = fn ($v) => is_numeric($v) ? (float) $v : null;

        return [
            'status' => strtolower((string) ($s['status'] ?? 'unknown')),
            'ipv4' => $s['ipv4'] ?? null,
            'ipv6' => $s['ipv6'] ?? null,
            'location' => $s['location'] ?? null,
            'profile' => $s['profile'] ?? null,
            'image' => $s['image'] ?? null,
            'hostname' => $s['aliases'][0] ?? null,
            'created' => $s['date'] ?? null,
            'metrics' => [
                'cpu' => $num($sample(data_get($now, 'cpu.latestUsagePercentSampling'))),
                'memory_mb' => $num($sample(data_get($now, 'memory.latestUsageSampling'))),
                'disk_mb' => $num($sample(data_get($now, 'disk.lastSamplings'))),
                'disk_limit_mb' => $num(data_get($now, 'disk.allowed')),
                'network_gb' => $num(data_get($now, 'network.total')),
                'network_limit_gb' => $num(data_get($now, 'network.allowed')),
            ],
        ];
    }

    public function power(Service $service, string $action): void
    {
        if (! in_array($action, ['start', 'stop', 'reboot'], true)) {
            throw new RuntimeException('Unknown power action.');
        }

        $this->request('post', "/servers/{$this->slug($service)}/actions/{$action}");
    }

    public function images(Service $service): array
    {
        return collect($this->list($this->request('get', '/images')))
            ->map(fn ($i) => ['slug' => (string) $i['slug'], 'name' => (string) ($i['name'] ?? $i['slug'])])
            ->values()->all();
    }

    public function reinstall(Service $service, string $image): void
    {
        $this->request('post', "/servers/{$this->slug($service)}/actions/reinstall", ['imageSlug' => $image]);

        // The sudo user goes with the old disk; add it back once the new system runs.
        $service->forceFill(['credentials' => [...($service->credentials?->toArray() ?? []), 'shell_ready' => false]])->save();
        FinishWebdockSetup::dispatch($service->id)->delay(now()->addMinutes(2));
    }

    public function consoleUrl(Service $service): string
    {
        $result = $this->request('post', "/servers/{$this->slug($service)}/shellUsers/WebsshToken", ['username' => $this->username($service)]);
        $url = $result['webSshUrl'] ?? null;

        if (! is_string($url) || $url === '') {
            throw new RuntimeException('Webdock did not return a console link.');
        }

        return $url;
    }

    public function snapshots(Service $service): array
    {
        return collect($this->list($this->request('get', "/servers/{$this->slug($service)}/snapshots")))
            ->map(fn ($s) => [
                'id' => (string) $s['id'],
                'name' => (string) ($s['name'] ?? ''),
                'date' => $s['date'] ?? null,
                'type' => $s['type'] ?? null,
                'completed' => filter_var($s['completed'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'deletable' => filter_var($s['deletable'] ?? false, FILTER_VALIDATE_BOOLEAN),
            ])->values()->all();
    }

    public function createSnapshot(Service $service, string $name): void
    {
        $this->request('post', "/servers/{$this->slug($service)}/snapshots", ['name' => $name]);
    }

    public function restoreSnapshot(Service $service, string $snapshotId): void
    {
        $this->request('post', "/servers/{$this->slug($service)}/snapshots/restore", ['snapshotId' => is_numeric($snapshotId) ? (int) $snapshotId : $snapshotId]);
    }

    public function resizeOptions(Service $service): array
    {
        $location = (string) ($this->request('get', "/servers/{$this->slug($service)}")['location'] ?? '');

        return collect($this->list($this->request('get', '/profiles', array_filter(['locationId' => $location]))))
            ->map(fn ($p) => ['id' => (string) $p['slug'], 'name' => $this->profileLabel($p)])
            ->values()->all();
    }

    public function resize(Service $service, string $profile): void
    {
        $this->request('post', "/servers/{$this->slug($service)}/actions/resize", ['profileSlug' => $profile]);
    }

    /* ---------- Setup after boot ---------- */

    /** Webdock's own status for the VPS, e.g. provisioning, running, stopped. */
    public function status(Service $service): string
    {
        return strtolower((string) ($this->request('get', "/servers/{$this->slug($service)}")['status'] ?? 'unknown'));
    }

    /** Adds the service's sudo user once, with the password chosen at setup. */
    public function ensureShellUser(Service $service): void
    {
        $username = $this->username($service);
        $password = (string) ($service->credentials['password'] ?? '');

        if ($this->shellUser($service, $username)) {
            if ($password !== '') {
                $this->request('post', "/servers/{$this->slug($service)}/shellUsers/{$this->shellUser($service, $username)['id']}/resetPassword", ['newPassword' => $password]);
            }

            return;
        }

        $this->createShellUser($service, $username, $password !== '' ? $password : Str::password(16, symbols: false));
    }

    /* ---------- Helpers ---------- */

    private function createShellUser(Service $service, string $username, string $password): void
    {
        $this->request('post', "/servers/{$this->slug($service)}/shellUsers", [
            'username' => $username,
            'password' => $password,
            'group' => 'sudo',
            'shell' => '/bin/bash',
        ]);
    }

    private function shellUser(Service $service, string $username): ?array
    {
        return collect($this->list($this->request('get', "/servers/{$this->slug($service)}/shellUsers")))
            ->first(fn ($u) => ($u['username'] ?? null) === $username);
    }

    private function slug(Service $service): string
    {
        return $service->remote_id ?: throw new RuntimeException('This service has no Webdock server yet.');
    }

    private function username(Service $service): string
    {
        return (string) ($service->credentials['username'] ?? '') ?: throw new RuntimeException('This VPS has no login user saved.');
    }

    /** Up to 12 lowercase letters and digits, from the domain, unique enough with the service id. */
    private function slugFor(Service $service): string
    {
        $base = preg_replace('/[^a-z0-9]/', '', strtolower(Str::before((string) $service->domain, '.'))) ?: 'vps';

        return substr($base, 0, 12 - strlen((string) $service->id)).$service->id;
    }

    /** @return array{0: string, 1: string} location id and profile slug */
    private function package(string $package): array
    {
        [$location, $profile] = array_pad(explode('/', $package, 2), 2, '');

        if ($location === '' || $profile === '') {
            throw new RuntimeException('The product\'s Webdock plan is not set. Pick a location and profile in the product\'s module settings.');
        }

        return [$location, $profile];
    }

    /** The newest plain Ubuntu LTS image (no web stack), unless one is set in config. */
    private function defaultImage(): string
    {
        if ($image = config('billing.webdock.default_image')) {
            return $image;
        }

        $images = collect($this->list($this->request('get', '/images')));
        $plain = $images->filter(fn ($i) => empty($i['webServer']) && str_contains(strtolower(($i['slug'] ?? '').' '.($i['name'] ?? '')), 'ubuntu'));
        $pick = ($plain->isNotEmpty() ? $plain : $images)->sortByDesc(fn ($i) => $i['slug'] ?? '')->first();

        return (string) ($pick['slug'] ?? throw new RuntimeException('Webdock returned no OS images.'));
    }

    private function profileLabel(array $p): string
    {
        $gb = fn ($mib) => is_numeric($mib) ? round($mib / 1024).' GB' : '?';
        $cpu = is_array($p['cpu'] ?? null) ? (($p['cpu']['cores'] ?? '?').' vCPU') : (is_numeric($p['cpu'] ?? null) ? "{$p['cpu']} vCPU" : null);
        $price = is_array($p['price'] ?? null) ? trim((($p['price']['amount'] ?? '') !== '' ? number_format($p['price']['amount'] / 100, 2) : '').' '.($p['price']['currency'] ?? '')) : null;

        return trim(($p['name'] ?? $p['slug']).' ('.implode(', ', array_filter([$cpu, $gb($p['ram'] ?? null).' RAM', $gb($p['disk'] ?? null).' disk'])).')'.($price ? " {$price}/mo" : ''));
    }

    /** Webdock lists come as arrays; a single match may come as one object. */
    private function list(mixed $result): array
    {
        if (! is_array($result)) {
            return [];
        }

        return array_is_list($result) ? $result : [$result];
    }

    private function request(string $method, string $path, array $data = []): mixed
    {
        $token = trim((string) $this->server->credentials);

        if ($token === '') {
            throw new RuntimeException('Save the Webdock API token first.');
        }

        try {
            $http = Http::withToken($token)->acceptJson()->connectTimeout(15)->timeout(60);
            /** @var Response $response */
            $response = match ($method) {
                'get' => $http->get(self::API.$path, $data),
                'delete' => $http->delete(self::API.$path),
                default => $http->asJson()->post(self::API.$path, $data ?: (object) []),
            };
        } catch (ConnectionException) {
            throw new RuntimeException('Could not reach api.webdock.io.');
        }

        if (! $response->successful()) {
            $json = $response->json();
            $reason = is_array($json) ? ($json['message'] ?? $json['error'] ?? null) : null;
            $hint = in_array($response->status(), [401, 403], true) ? ' Check the API token and that it has the needed permissions (servers read, write and execute, provisioning).' : '';

            throw new RuntimeException("Webdock returned HTTP {$response->status()}".($reason ? ": {$reason}" : '.').$hint);
        }

        return $response->json();
    }
}
