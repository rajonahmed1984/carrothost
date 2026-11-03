<?php

namespace App\Services;

use App\Models\Registrar;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Availability checks through the registrar picked as Lookup Provider in Admin > Domain Pricing.
 * Lookups are read-only on the registrar's side, so they cost nothing.
 */
class DomainLookup
{
    public function __construct(private BillingService $billing) {}

    public function provider(): ?Registrar
    {
        $code = config('billing.domains.lookup_provider');
        $registrar = $code ? Registrar::where('code', $code)->first() : null;

        return $registrar?->api_key ? $registrar : null;
    }

    /**
     * Unknown means no provider is set, or the registrar could not answer.
     *
     * @return array{domain: string, status: 'available'|'taken'|'premium'|'unknown'}
     */
    public function check(string $domain): array
    {
        $domain = strtolower($domain);
        $tld = $this->billing->tldFor($domain)->tld;
        $sld = substr($domain, 0, -strlen($tld));

        if (str_contains($sld, '.')) {
            throw ValidationException::withMessages(['name' => "Enter the name without a subdomain, like example{$tld}."]);
        }

        $provider = $this->provider();

        if (! $provider) {
            return ['domain' => $domain, 'status' => 'unknown'];
        }

        $status = Cache::remember("domain-lookup:{$provider->code}:{$domain}", now()->addMinutes(5), function () use ($provider, $domain, $sld, $tld) {
            try {
                $client = new LogicBoxesClient($provider);

                if (! $client->isAvailable($sld, ltrim($tld, '.'))) {
                    return 'taken';
                }

                return $client->isPremium($domain) ? 'premium' : 'available';
            } catch (Throwable $e) {
                Log::warning("Domain lookup for {$domain} failed: {$e->getMessage()}");

                return 'unknown';
            }
        });

        return ['domain' => $domain, 'status' => $status];
    }

    /** Stops orders the registrar has already said cannot go through. An unreachable registrar does not block. */
    public function ensureOrderable(string $domain, string $action, string $field): void
    {
        $status = $this->check($domain)['status'];

        $message = match (true) {
            $action === 'register' && $status === 'taken' => "{$domain} is already registered. Transfer it instead if it is yours.",
            $action === 'register' && $status === 'premium' => config('billing.domains.premium_enabled')
                ? "{$domain} is a premium domain. Open a ticket and we will quote its price."
                : "{$domain} is not available.",
            $action === 'transfer' && $status === 'available' => "{$domain} is not registered yet. Register it instead.",
            default => null,
        };

        if ($message) {
            throw ValidationException::withMessages([$field => $message]);
        }
    }
}
