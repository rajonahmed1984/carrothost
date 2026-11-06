<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Domain;
use App\Models\Registrar;
use App\Models\RegistrarCharge;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Copies the registrar's account transactions into registrar_charges and links each to the
 * domain named in its description. Receipts (money added to the account) are not copied:
 * record deposits by hand, with what they cost in BDT and the fee.
 */
class RegistrarSync
{
    private const MAX_PAGES = 40;

    /** @return array{fetched: int, added: int, skipped_receipts: int, unreadable: int, sample_fields: string, since: ?string} */
    public function sync(Registrar $registrar): array
    {
        if (! $registrar->api_key || ! $registrar->reseller_id) {
            throw new RuntimeException('Save the reseller ID and API key first.');
        }

        $client = new LogicBoxesClient($registrar);
        // Overlap a week so late-posted transactions are not missed; known ids are skipped.
        // Until a sync has stored anything, read the whole history: an earlier run that found
        // nothing must not hide everything older than a week from every later run.
        $hasSynced = RegistrarCharge::where('registrar_code', $registrar->code)->where('source', 'sync')->exists();
        $sinceAt = $hasSynced ? $registrar->last_synced_at?->subDays(7) : null;
        $since = $sinceAt?->timestamp;
        $fetched = 0;
        $added = 0;
        $receipts = 0;
        $unreadable = 0;
        $sampleFields = '';

        try {
            for ($page = 1; $page <= self::MAX_PAGES; $page++) {
                $result = $client->transactions($page, 250, $since);
                $rows = collect($result)->filter(fn ($row, $key) => is_array($row) && is_numeric($key));

                $fetched += $rows->count();

                foreach ($rows as $row) {
                    $parsed = $this->parse($row);
                    if (! $parsed) {
                        if ($unreadable++ === 0) {
                            $sampleFields = implode(', ', array_slice(array_keys($row), 0, 12));
                            Log::warning('Registrar sync: unreadable transaction row', ['registrar' => $registrar->code, 'row' => $row]);
                        }

                        continue;
                    }
                    if ($parsed['type'] === 'receipt') {
                        $receipts++;

                        continue;
                    }

                    $charge = RegistrarCharge::firstOrCreate(
                        ['registrar_code' => $registrar->code, 'external_id' => $parsed['id']],
                        [...$this->match($parsed['description']), 'type' => $parsed['type'], 'charged_at' => $parsed['at'], 'description' => mb_substr($parsed['description'], 0, 255), 'amount' => $parsed['amount'], 'source' => 'sync'],
                    );
                    $added += (int) $charge->wasRecentlyCreated;
                }

                $total = (int) ($result['recsindb'] ?? 0);
                if ($rows->count() < 250 || $page * 250 >= $total) {
                    break;
                }
            }
        } catch (Throwable $e) {
            $registrar->update(['sync_error' => $e->getMessage()]);
            $registrar->markConnection(false, $e->getMessage());

            throw $e instanceof RuntimeException ? $e : new RuntimeException($e->getMessage());
        }

        try {
            $registrar->refreshApiBalance($client->balance());
        } catch (Throwable) {
            // The balance is a nice-to-have; the transactions above are what the sync is for.
        }

        $registrar->update(['last_synced_at' => now(), 'sync_error' => null]);
        $registrar->markConnection(true);
        ActivityLog::record('registrar.synced', $registrar, ['fetched' => $fetched, 'added' => $added, 'unreadable' => $unreadable]);

        return [
            'fetched' => $fetched,
            'added' => $added,
            'skipped_receipts' => $receipts,
            'unreadable' => $unreadable,
            'sample_fields' => $sampleFields,
            'since' => $sinceAt?->toDateString(),
        ];
    }

    /**
     * One transaction row. Field names differ between LogicBoxes brands and versions,
     * with or without a "reseller_transaction." prefix, so several are accepted.
     *
     * @return array{id: string, type: string, at: CarbonImmutable, description: string, amount: string}|null
     */
    public function parse(array $row): ?array
    {
        $flat = [];
        foreach ($row as $key => $value) {
            $flat[strtolower(preg_replace('/^.*\./', '', (string) $key))] = $value;
        }
        $pick = function (array $names) use ($flat) {
            foreach ($names as $name) {
                if (isset($flat[$name]) && $flat[$name] !== '') {
                    return $flat[$name];
                }
            }

            return null;
        };

        $id = $pick(['transactionid', 'transaction-id', 'transid', 'transactionkey', 'transkey', 'id']);
        $amount = $pick(['sellingamount', 'sellingcurrencyamount', 'amount', 'transactionamount', 'resellerselling', 'accountingamount', 'accountingcurrencyamount']);
        $date = $pick(['transactiondate', 'transaction-date', 'transactiondt', 'creationdt', 'creationdate', 'date']);
        if ($id === null || ! is_numeric($amount) || $date === null) {
            return null;
        }

        // The type decides; charges may come signed negative. Only an untyped row goes by its sign.
        $raw = strtolower((string) $pick(['transactiontype', 'transaction-type', 'type']));
        $type = match (true) {
            str_contains($raw, 'receipt') => 'receipt',
            str_contains($raw, 'credit') => 'credit',
            str_contains($raw, 'invoice'), str_contains($raw, 'debit') => 'debit',
            default => (float) $amount < 0 ? 'debit' : 'credit',
        };

        return [
            'id' => (string) $id,
            'type' => $type,
            'at' => is_numeric($date) ? CarbonImmutable::createFromTimestamp((int) $date) : CarbonImmutable::parse((string) $date),
            'description' => trim((string) $pick(['description', 'transactiondescription', 'desc'])),
            'amount' => number_format(abs((float) $amount), 2, '.', ''),
        ];
    }

    /** The domain and action a description names, e.g. "Renewal of example.com for 1 year". */
    public function match(string $description): array
    {
        $text = strtolower($description);
        $action = match (true) {
            str_contains($text, 'renew') => 'renew',
            str_contains($text, 'transfer') => 'transfer',
            str_contains($text, 'regist') => 'register',
            default => 'other',
        };

        preg_match_all('/\b((?:[a-z0-9-]+\.)+[a-z]{2,})\b/', $text, $found);
        $names = array_values(array_unique($found[1] ?? []));
        $domain = $names ? Domain::whereIn('name', $names)->orderByDesc('id')->first(['id']) : null;

        return ['domain_id' => $domain?->id, 'action' => $action];
    }
}
