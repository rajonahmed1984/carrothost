<?php

namespace App\Services;

use App\Models\Registrar;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Read-only LogicBoxes HTTP API access, used by StarGate/UK2 and ResellCube.
 * Registering and renewing spend the reseller balance, so they are deliberately
 * not here until they can be exercised against a reachable API.
 */
class LogicBoxesClient
{
    public function __construct(private Registrar $registrar) {}

    public function balance(): array
    {
        return $this->get('billing/reseller-balance.json', ['reseller-id' => $this->registrar->reseller_id]);
    }

    private function get(string $path, array $params): array
    {
        try {
            $response = Http::withUserAgent('CarrotHostPanel/1.0')
                ->timeout(30)
                ->get("https://httpapi.com/api/{$path}", [
                    'auth-userid' => $this->registrar->reseller_id,
                    'api-key' => $this->registrar->api_key,
                    ...$params,
                ]);
        } catch (ConnectionException) {
            // The exception text includes the URL, and the URL carries the key.
            throw new RuntimeException('Could not reach httpapi.com.');
        }

        if ($response->status() === 403 && str_contains($response->body(), 'Cloudflare')) {
            throw new RuntimeException('httpapi.com is blocking this server\'s IP address. Ask the registrar to allow it.');
        }

        $result = $response->json();

        if (! $response->successful() || ! is_array($result)) {
            $message = is_array($result) ? ($result['message'] ?? $result['error'] ?? null) : null;

            throw new RuntimeException($message ? "Registrar error: {$message}" : "Registrar API returned HTTP {$response->status()}.");
        }

        return $result;
    }
}
