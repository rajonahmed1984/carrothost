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
            $prices = $client->resellerPrices();
        } catch (RuntimeException $e) {
            $registrar->markConnection(false, $e->getMessage());

            throw $e;
        }

        if (! $keys) {
            throw new RuntimeException('The registrar returned no domain TLDs for this account.');
        }

        $now = now();
        $priced = 0;
        $rows = [];
        foreach ($keys as $tld => $key) {
            $p = is_array($prices[$key] ?? null) ? $prices[$key] : [];
            $cost = [
                'register_cost' => $this->oneYear($p, ['addnewdomain', 'register']),
                'renew_cost' => $this->oneYear($p, ['renewdomain', 'renew']),
                'transfer_cost' => $this->oneYear($p, ['addtransferdomain', 'transferdomain', 'transfer']),
            ];
            $priced += (int) ($cost['register_cost'] !== null);
            $rows[] = ['registrar_code' => $registrar->code, 'tld' => $tld, 'product_key' => $key, 'currency' => $registrar->currency ?? 'USD', ...$cost, 'synced_at' => $now, 'created_at' => $now, 'updated_at' => $now];
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
        ActivityLog::record('registrar.tlds_synced', $registrar, ['tlds' => count($rows), 'priced' => $priced, 'removed' => $removed]);

        return ['tlds' => count($rows), 'priced' => $priced, 'removed' => $removed];
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
            $slab = $prices[$action] ?? null;
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
