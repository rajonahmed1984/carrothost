<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Registrar;
use App\Models\RegistrarTld;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Fetches the TLDs a LogicBoxes registrar sells and our 1-year cost for each, into registrar_tlds.
 * Read-only at the registrar. TLDs it no longer sells are removed from the list.
 */
class RegistrarTldSync
{
    /** @return array{tlds: int, priced: int, removed: int} */
    public function sync(Registrar $registrar): array
    {
        if (! $registrar->api_key || ! $registrar->reseller_id) {
            throw new RuntimeException('Save the reseller ID and API key first.');
        }

        $client = new LogicBoxesClient($registrar);

        try {
            $keys = $this->tldKeys($client->categoryKeys());
        } catch (RuntimeException $e) {
            $registrar->markConnection(false, $e->getMessage());

            throw $e;
        }

        if (! $keys) {
            throw new RuntimeException('The registrar returned no domain TLDs for this account.');
        }

        // Our cost is the "reseller cost price"; the "reseller price" is what sub-resellers would pay,
        // so it is only a fallback for accounts whose cost list comes back empty.
        $now = now();
        $costs = [];
        $priced = 0;
        $source = null;
        $samples = [];
        foreach (['resellerCostPrices' => 'cost price', 'resellerPrices' => 'reseller price'] as $method => $label) {
            try {
                $prices = $client->{$method}();
            } catch (RuntimeException $e) {
                $samples[$label] = 'error: '.$e->getMessage();

                continue;
            }
            [$costs, $priced] = $this->costs($keys, $prices);
            $samples[$label] = mb_substr(json_encode(array_slice($prices, 0, 2, true)), 0, 600);
            if ($priced > 0) {
                $source = $label;

                break;
            }
        }

        if ($priced === 0) {
            // Nothing readable: keep a sample so the response shape can be checked in the log.
            \Illuminate\Support\Facades\Log::warning('Registrar TLD sync: no cost prices could be read', ['registrar' => $registrar->code, 'samples' => $samples, 'first_keys' => array_slice($keys, 0, 5, true)]);
        }

        $rows = [];
        foreach ($keys as $tld => $key) {
            $rows[] = ['registrar_code' => $registrar->code, 'tld' => $tld, 'product_key' => $key, 'currency' => $registrar->currency ?? 'USD', ...$costs[$tld], 'synced_at' => $now, 'created_at' => $now, 'updated_at' => $now];
        }

        $removed = 0;
        DB::transaction(function () use ($registrar, $rows, $keys, &$removed) {
            foreach (array_chunk($rows, 200) as $chunk) {
                RegistrarTld::upsert($chunk, ['registrar_code', 'tld'], ['product_key', 'currency', 'register_cost', 'renew_cost', 'transfer_cost', 'synced_at', 'updated_at']);
            }
            $removed = RegistrarTld::where('registrar_code', $registrar->code)->whereNotIn('tld', array_keys($keys))->delete();
        });

        $registrar->forceFill(['tlds_synced_at' => $now])->save();
        $registrar->markConnection(true);
        ActivityLog::record('registrar.tlds_synced', $registrar, ['tlds' => count($rows), 'priced' => $priced, 'removed' => $removed, 'source' => $source]);

        return [
            'tlds' => count($rows), 'priced' => $priced, 'removed' => $removed, 'source' => $source,
            // When nothing was readable, what the registrar sent (price lists hold no secrets), to show the admin.
            'sample' => $priced === 0 ? collect($samples)->map(fn ($s, $label) => "{$label}: ".mb_substr((string) $s, 0, 300))->implode(' | ') : null,
        ];
    }

    /**
     * Register, renew and transfer cost per TLD from one price list. Product keys are matched
     * without regard to case, and the actions are looked for a few levels down, as brands nest
     * them differently (e.g. under a plan id or "pricing").
     *
     * @return array{0: array<string, array{register_cost: ?string, renew_cost: ?string, transfer_cost: ?string}>, 1: int}
     */
    private function costs(array $keys, array $prices): array
    {
        $byKey = [];
        foreach ($prices as $key => $value) {
            if (is_array($value)) {
                $byKey[strtolower((string) $key)] = $value;
            }
        }

        $costs = [];
        $priced = 0;
        foreach ($keys as $tld => $key) {
            $p = $byKey[strtolower($key)] ?? [];
            $costs[$tld] = [
                'register_cost' => $this->oneYear($p, ['addnewdomain', 'register', 'registration']),
                'renew_cost' => $this->oneYear($p, ['renewdomain', 'renew', 'renewal']),
                'transfer_cost' => $this->oneYear($p, ['addtransferdomain', 'transferdomain', 'transfer']),
            ];
            $priced += (int) ($costs[$tld]['register_cost'] !== null);
        }

        return [$costs, $priced];
    }

    /** The first array under one of the action names, searched up to three levels down. */
    private function findAction(array $node, string $action, int $depth = 0): mixed
    {
        foreach ($node as $k => $v) {
            if (strtolower((string) $k) === $action) {
                return $v;
            }
        }
        if ($depth >= 3) {
            return null;
        }
        foreach ($node as $v) {
            if (is_array($v) && ($found = $this->findAction($v, $action, $depth + 1)) !== null) {
                return $found;
            }
        }

        return null;
    }

    /**
     * TLD => product key from the "domorder" category. LogicBoxes answers either
     * [{"domcno": ["com"]}, ...] or {"domcno": ["com"], ...}.
     *
     * @return array<string, string>
     */
    public function tldKeys(array $mapping): array
    {
        $domains = $mapping['domorder'] ?? $mapping['domains'] ?? [];
        $pairs = [];
        foreach ((array) $domains as $index => $entry) {
            $entries = is_array($entry) && ! array_is_list($entry) ? $entry : (is_string($index) ? [$index => $entry] : []);
            foreach ($entries as $key => $tlds) {
                foreach ((array) $tlds as $tld) {
                    $tld = '.'.ltrim(strtolower(trim((string) $tld)), '.');
                    if ($tld !== '.' && ! isset($pairs[$tld])) {
                        $pairs[$tld] = (string) $key;
                    }
                }
            }
        }
        ksort($pairs);

        return $pairs;
    }

    /**
     * The price per year under the first matching action, e.g. {"addnewdomain": {"1": "9.99", "2": "19.98"}}.
     * A TLD sold only for longer terms (e.g. .com.bd for 2 years) gives its shortest term divided by its years.
     */
    private function oneYear(array $prices, array $actions): ?string
    {
        foreach ($actions as $action) {
            $slab = $this->findAction($prices, $action);
            if (is_numeric($slab)) {
                return number_format((float) $slab, 2, '.', '');
            }
            if (! is_array($slab)) {
                continue;
            }

            $terms = collect($slab)->filter(fn ($v, $years) => is_numeric($years) && (int) $years > 0 && is_numeric($v))->sortKeys();
            if ($terms->isEmpty()) {
                continue;
            }
            $years = (int) $terms->keys()->first();

            return number_format((float) $terms->first() / $years, 2, '.', '');
        }

        return null;
    }
}
