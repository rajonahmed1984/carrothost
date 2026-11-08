<?php

namespace App\Provisioning;

use App\Models\Server;
use App\Models\Service;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/** Webuzo Admin API. Authenticates with the Access Hash (API key), not the root password. */
class WebuzoModule implements ManagesAccounts, ProvisioningModule, ReportsAccountStatus
{
    use GeneratesUsername;

    /** Shortcut key => the enduser panel page (act) the login link is pointed at. */
    public const APPS = [
        'email' => 'email',
        'files' => 'filemanager',
        'databases' => 'dbs',
        'domains' => 'domainmanage',
        'cron' => 'cronjob',
        'backups' => 'backup',
    ];

    public function __construct(private Server $server) {}

    /** @return array<string, string> shortcut key => enduser panel page */
    public function panelApps(Service $service): array
    {
        return self::APPS;
    }

    public function testConnection(): void
    {
        $this->call('plans');
    }

    public function packages(): array
    {
        $plans = $this->call('plans')['plans'] ?? [];

        return collect(is_array($plans) ? $plans : [])
            ->map(fn ($plan, $key) => ['id' => (string) ($plan['plan'] ?? $key), 'name' => (string) ($plan['plan_name'] ?? $plan['name'] ?? $key)])
            ->values()
            ->all();
    }

    public function create(Service $service): array
    {
        // The username and password set on the order when it was accepted, else new ones.
        [$username, $password] = $this->credentialsFor($service);

        $result = $this->call('add_user', [
            'create_user' => 1,
            'user' => $username,
            'domain' => $service->domain,
            'user_passwd' => $password,
            'cnf_user_passwd' => $password,
            'email' => $service->client->email,
            'plan' => $service->product->module_package,
            'billing_prefill' => 1,
        ]);

        if (empty($result['done'])) {
            throw new RuntimeException('Webuzo add_user did not confirm the account was created.');
        }

        return ['remote_id' => $username, 'username' => $username, 'password' => $password];
    }

    public function suspend(Service $service, string $reason): void
    {
        $this->call('users', ['suspend' => $service->remote_id, 'skip' => 1]);
    }

    /**
     * For unsuspend, Webuzo's skip=1 means "only the sub-users, the account itself stays suspended",
     * so the server answered done and the site stayed on the suspended page. Send no skip (an ordinary
     * account), and if the account still reads as suspended, skip=2 (the account only, never its
     * sub-users), then skip=0 (the account and its sub-users).
     */
    public function unsuspend(Service $service): void
    {
        foreach ([null, 2, 0] as $skip) {
            $this->call('users', ['unsuspend' => $service->remote_id, ...($skip === null ? [] : ['skip' => $skip])]);

            try {
                if (! $this->accountInfo($service)['suspended']) {
                    return;
                }
            } catch (\Throwable) {
                // The account list could not be read: the job's own check decides.
                return;
            }
        }
    }

    public function accountInfo(Service $service): array
    {
        $user = $this->account($service);
        $ip = $user['ip'] ?? $user['ipv4'] ?? (is_array($user['ips'] ?? null) ? reset($user['ips']) : null);

        return [
            'domain' => filled($user['domain'] ?? null) ? strtolower((string) $user['domain']) : null,
            'ip' => is_string($ip) && $ip !== '' ? $ip : null,
            'package' => filled($user['plan'] ?? null) ? (string) $user['plan'] : null,
            // Webuzo lists a suspended account with status "suspended" (older builds set a suspended flag).
            'suspended' => strcasecmp((string) ($user['status'] ?? ''), 'suspended') === 0 || ! empty($user['suspended']),
        ];
    }

    public function terminate(Service $service): void
    {
        $this->call('users', ['delete_user' => $service->remote_id, 'del_sub_acc' => 1, 'skip_reseller' => 1]);
    }

    public function usage(Service $service): array
    {
        $user = $this->account($service);
        $resource = is_array($user['resource'] ?? null) ? $user['resource'] : [];
        $mb = fn ($bytes) => is_numeric($bytes) ? (int) round($bytes / 1048576) : null;
        $limit = fn ($value) => in_array((string) $value, ['', 'unlimited', '0'], true) ? null : (string) $value;

        return [
            'metrics' => collect($resource)->map(fn ($r, $key) => [
                'key' => (string) $key,
                'label' => (string) ($r['label'] ?? $key),
                'used' => (string) ($r['used'] ?? '0'),
                'limit' => $limit($r['limit'] ?? null),
                'percent' => isset($r['percent']) && is_numeric($r['percent']) ? round((float) $r['percent'], 2) : null,
            ])->values()->all(),
            'disk_used' => $mb($resource['disk']['used_bytes'] ?? null),
            'disk_limit' => $mb($resource['disk']['limit_bytes'] ?? null),
            'bw_used' => $mb($resource['bandwidth']['used_bytes'] ?? null),
            'bw_limit' => $mb($resource['bandwidth']['limit_bytes'] ?? null),
        ];
    }

    public function loginUrl(Service $service, ?string $app = null): string
    {
        // Port 2003 is the enduser panel; loginAs signs in as the account with the admin key.
        $url = $this->call('sso', ['noip' => 1], 2003, ['loginAs' => $service->remote_id])['done']['url'] ?? null;

        if (! is_string($url) || $url === '') {
            throw new RuntimeException('Webuzo did not return a login link.');
        }

        $url = $this->onHostname($url);

        // The login lands on the dashboard; a shortcut also names the page to open.
        return $app && isset(self::APPS[$app]) ? $url.(str_contains($url, '?') ? '&' : '?').'act='.self::APPS[$app] : $url;
    }

    /**
     * Webuzo builds the SSO link on the server's IP, and the certificate only covers the hostname,
     * so browsers refuse it (and silently fail inside the preview frame). Point it at the saved hostname.
     */
    private function onHostname(string $url): string
    {
        $host = parse_url($url, PHP_URL_HOST);
        $hostname = preg_replace('#^\w+://|[:/].*$#', '', trim((string) $this->server->hostname));

        if (! $host || $hostname === '' || ! filter_var($host, FILTER_VALIDATE_IP) || filter_var($hostname, FILTER_VALIDATE_IP)) {
            return $url;
        }

        return preg_replace('#^(https?://)'.preg_quote($host, '#').'(?=[:/?]|$)#i', '${1}'.$hostname, $url, 1);
    }

    public function changePassword(Service $service, string $password): void
    {
        $this->call('changepassword', ['changepass' => 1, 'newpass' => $password, 'conf' => $password], 2003, ['loginAs' => $service->remote_id]);
    }

    public function changePackage(Service $service, string $package): void
    {
        // Edit User replaces the account's settings, so send its current domain and email back unchanged.
        $user = $this->account($service);
        $this->call('add_user', [
            'edit_user' => 1,
            'user' => $service->remote_id,
            'user_name' => $service->remote_id,
            'domain' => $user['domain'] ?? $service->domain,
            'email' => $user['email'] ?? $service->client->email,
            'plan' => $package,
        ]);
    }

    /** The account's row from the admin user list. */
    private function account(Service $service): array
    {
        $users = $this->call('users', ['search' => $service->remote_id, 'reslen' => 50])['users'] ?? [];
        $user = collect(is_array($users) ? $users : [])->first(fn ($u) => ($u['user'] ?? null) === $service->remote_id);

        if (! $user) {
            throw new RuntimeException("Webuzo has no account named {$service->remote_id}.");
        }

        return $user;
    }

    private function call(string $act, array $params = [], ?int $port = null, array $extraQuery = []): array
    {
        $port ??= $this->server->port ?: 2005;
        $query = http_build_query([
            'api' => 'json',
            'act' => $act,
            'apiuser' => $this->server->username,
            'apikey' => $this->server->credentials,
            ...$extraQuery,
        ]);

        try {
            $response = Http::withOptions(['verify' => $this->server->verify_tls])
                ->asForm()
                ->timeout(120)
                ->post("https://{$this->server->hostname}:{$port}/index.php?{$query}", $params);
        } catch (ConnectionException) {
            // The exception text includes the URL, and the URL carries the key.
            throw new RuntimeException("Could not reach Webuzo at {$this->server->hostname}:{$port}.");
        }

        if (! $response->successful()) {
            throw new RuntimeException("Webuzo {$act} returned HTTP {$response->status()}");
        }

        $result = $response->json();

        if (! is_array($result)) {
            throw new RuntimeException("Webuzo {$act} did not return JSON.");
        }

        if (! empty($result['error'])) {
            $message = is_array($result['error']) ? implode(' ', $result['error']) : (string) $result['error'];

            throw new RuntimeException("Webuzo {$act} failed: ".strip_tags($message));
        }

        return $result;
    }
}
