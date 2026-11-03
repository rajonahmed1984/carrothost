<?php

namespace App\Provisioning;

use App\Models\Server;
use App\Models\Service;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/** WHM API 1. Prefer an API token; password login is for accounts that cannot create one. */
class CpanelModule implements ProvisioningModule
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
