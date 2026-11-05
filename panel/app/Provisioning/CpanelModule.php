<?php

namespace App\Provisioning;

use App\Models\Server;
use App\Models\Service;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
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
        $this->call('version', timeout: 20);
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

    private function call(string $function, array $params = [], int $timeout = 120): array
    {
        $port = $this->server->port ?: 2087;
        // Pasted values often carry a scheme, a path or stray whitespace, and any of those breaks the login.
        $host = preg_replace('#^\w+://|[:/].*$#', '', trim((string) $this->server->hostname));
        $username = trim((string) $this->server->username);
        $secret = trim((string) $this->server->credentials);

        if ($username === '' || $secret === '') {
            throw new RuntimeException('Save the WHM username and '.($this->server->auth_type === 'password' ? 'password' : 'API token').' first.');
        }

        $request = $this->server->auth_type === 'password'
            ? Http::withBasicAuth($username, $secret)
            : Http::withHeaders(['Authorization' => "whm {$username}:{$secret}"]);

        try {
            $response = $request
                ->acceptJson()
                ->withOptions(['verify' => $this->server->verify_tls])
                ->connectTimeout(15)
                ->timeout($timeout)
                ->get("https://{$host}:{$port}/json-api/{$function}", [
                    'api.version' => 1,
                    ...$params,
                ]);
        } catch (ConnectionException $e) {
            throw new RuntimeException("Could not reach {$host}:{$port}. ".$e->getMessage());
        }

        if (! $response->successful()) {
            throw new RuntimeException($this->httpError($function, $response));
        }

        $result = $response->json();

        if (! is_array($result)) {
            throw new RuntimeException("WHM {$function} did not return JSON. Check the hostname and port (WHM is usually 2087).");
        }

        if ((int) data_get($result, 'metadata.result') !== 1) {
            throw new RuntimeException("WHM {$function} failed: ".data_get($result, 'metadata.reason', 'unknown error'));
        }

        return $result;
    }

    /** Turns a refused request into something the admin can act on, using WHM's own reason when it gives one. */
    private function httpError(string $function, Response $response): string
    {
        $status = $response->status();
        $json = $response->json();
        $reason = is_array($json)
            ? (data_get($json, 'metadata.reason') ?? data_get($json, 'cpanelresult.error') ?? data_get($json, 'error') ?? data_get($json, 'message'))
            : null;

        if (! $reason) {
            $text = trim(preg_replace('/\s+/', ' ', strip_tags(preg_replace('#<(script|style|head)\b.*?</\1>#is', '', $response->body()))));
            $reason = $text !== '' ? Str::limit($text, 200) : null;
        }

        $message = "WHM {$function} returned HTTP {$status}".($reason ? ": {$reason}" : '.');

        if (in_array($status, [401, 403], true)) {
            $message .= $this->server->auth_type === 'password'
                ? ' WHM refused the login. Check the username and password, that the account has no two-factor login, and that this panel\'s IP is not blocked by cPHulk or the host firewall. An API token is more reliable than a password.'
                : ' WHM refused the API token. Check that the username is the WHM/reseller login that created the token, the token was copied in full and has not expired, and that the token\'s IP whitelist (if set) includes this panel\'s server IP.';
        }

        return $message;
    }
}
