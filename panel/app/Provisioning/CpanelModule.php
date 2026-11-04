<?php

namespace App\Provisioning;

use App\Models\Server;
use App\Models\Service;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/** WHM API 1. Prefer an API token; password login is for accounts that cannot create one. */
class CpanelModule implements ManagesAccounts, ProvisioningModule
{
    use GeneratesUsername;

    public function __construct(private Server $server) {}

    public function testConnection(): void
    {
        $this->call('version');
    }

    public function packages(): array
    {
        return collect(data_get($this->call('listpkgs'), 'data.pkg', []))
            ->map(fn (array $pkg) => ['id' => (string) $pkg['name'], 'name' => (string) $pkg['name']])
            ->values()
            ->all();
    }

    public function create(Service $service): array
    {
        $username = $this->usernameFor((string) $service->domain, $service->id);
        $password = Str::password(20, symbols: false);

        $this->call('createacct', [
            'username' => $username,
            'domain' => $service->domain,
            'password' => $password,
            'plan' => $service->product->module_package,
            'contactemail' => $service->client->email,
        ]);

        return ['remote_id' => $username, 'username' => $username, 'password' => $password];
    }

    public function suspend(Service $service, string $reason): void
    {
        $this->call('suspendacct', ['user' => $service->remote_id, 'reason' => $reason]);
    }

    public function unsuspend(Service $service): void
    {
        $this->call('unsuspendacct', ['user' => $service->remote_id]);
    }

    public function terminate(Service $service): void
    {
        $this->call('removeacct', ['user' => $service->remote_id]);
    }

    public function usage(Service $service): array
    {
        $stats = data_get($this->call('uapi_cpanel', [
            'cpanel.module' => 'StatsBar',
            'cpanel.function' => 'get_stats',
            'cpanel.user' => $service->remote_id,
            'display' => 'diskusage|bandwidthusage|emailaccounts|ftpaccounts|sqldatabases|mysqldiskusage|addondomains|parkeddomains|subdomains',
        ]), 'data.uapi.data', []);
        $metrics = collect(is_array($stats) ? $stats : [])->map(fn ($s) => [
            'key' => (string) ($s['name'] ?? $s['id'] ?? ''),
            'label' => (string) ($s['item'] ?? $s['name'] ?? ''),
            'used' => trim(($s['count'] ?? '0').' '.($s['units'] ?? '')),
            'limit' => in_array((string) ($s['max'] ?? ''), ['', 'unlimited', '∞'], true) ? null : trim(($s['max'] ?? '').' '.($s['units'] ?? '')),
            'percent' => isset($s['percent']) && is_numeric($s['percent']) ? (float) $s['percent'] : null,
        ])->values()->all();

        $acct = data_get($this->call('accountsummary', ['user' => $service->remote_id]), 'data.acct.0', []);
        $mb = fn ($value) => preg_match('/^(\d+(?:\.\d+)?)M$/', (string) $value, $m) ? (int) round((float) $m[1]) : null;
        $bw = data_get($this->call('showbw', ['searchtype' => 'user', 'search' => $service->remote_id]), 'data.acct.0', []);

        return [
            'metrics' => $metrics,
            'disk_used' => $mb($acct['diskused'] ?? null),
            'disk_limit' => $mb($acct['disklimit'] ?? null),
            'bw_used' => isset($bw['totalbytes']) ? (int) round($bw['totalbytes'] / 1048576) : null,
            'bw_limit' => is_numeric($bw['limit'] ?? null) && $bw['limit'] > 0 ? (int) round($bw['limit'] / 1048576) : null,
        ];
    }

    public function loginUrl(Service $service): string
    {
        $url = data_get($this->call('create_user_session', ['user' => $service->remote_id, 'service' => 'cpaneld']), 'data.url');

        if (! is_string($url) || $url === '') {
            throw new RuntimeException('WHM did not return a login link.');
        }

        return $url;
    }

    public function changePassword(Service $service, string $password): void
    {
        $this->call('passwd', ['user' => $service->remote_id, 'password' => $password]);
    }

    public function changePackage(Service $service, string $package): void
    {
        $this->call('changepackage', ['user' => $service->remote_id, 'pkg' => $package]);
    }

    private function call(string $function, array $params = []): array
    {
        $port = $this->server->port ?: 2087;

        $request = $this->server->auth_type === 'password'
            ? Http::withBasicAuth((string) $this->server->username, (string) $this->server->credentials)
            : Http::withHeaders(['Authorization' => "whm {$this->server->username}:{$this->server->credentials}"]);

        $response = $request
            ->withOptions(['verify' => $this->server->verify_tls])
            ->timeout(120)
            ->get("https://{$this->server->hostname}:{$port}/json-api/{$function}", [
                'api.version' => 1,
                ...$params,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException("WHM {$function} returned HTTP {$response->status()}");
        }

        $result = $response->json();

        if ((int) data_get($result, 'metadata.result') !== 1) {
            throw new RuntimeException("WHM {$function} failed: ".data_get($result, 'metadata.reason', 'unknown error'));
        }

        return $result;
    }
}
