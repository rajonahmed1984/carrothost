<?php

namespace App\Provisioning;

use App\Models\Server;
use App\Models\Service;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/** Webuzo Admin API. Authenticates with the Access Hash (API key), not the root password. */
class WebuzoModule implements ProvisioningModule
{
    use GeneratesUsername;

    public function __construct(private Server $server) {}

    public function testConnection(): void
    {
        $this->call('plans');
    }

    public function create(Service $service): array
    {
        $username = $this->usernameFor((string) $service->domain, $service->id);
        $password = Str::password(20, symbols: false);

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

    public function unsuspend(Service $service): void
    {
        $this->call('users', ['unsuspend' => $service->remote_id, 'skip' => 1]);
    }

    public function terminate(Service $service): void
    {
        $this->call('users', ['delete_user' => $service->remote_id, 'del_sub_acc' => 1, 'skip_reseller' => 1]);
    }

    private function call(string $act, array $params = []): array
    {
        $port = $this->server->port ?: 2005;
        $query = http_build_query([
            'api' => 'json',
            'act' => $act,
            'apiuser' => $this->server->username,
            'apikey' => $this->server->credentials,
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
