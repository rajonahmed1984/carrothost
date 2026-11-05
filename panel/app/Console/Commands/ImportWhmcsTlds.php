<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\Domain;
use App\Models\Tld;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Copies WHMCS domain pricing (tbldomainpricing + tblpricing) into tlds, using the 1-year price
 * in the panel currency. Existing TLDs keep their prices and settings unless --update is given.
 */
class ImportWhmcsTlds extends Command
{
    protected $signature = 'whmcs:import-tlds {database : The database holding the WHMCS tables} {--update : Also overwrite prices of TLDs already in the panel} {--dry-run : Report what would happen without writing}';

    protected $description = 'Import TLD pricing from a WHMCS database';

    public function handle(): int
    {
        config(['database.connections.whmcs' => [...config('database.connections.mysql'), 'database' => $this->argument('database')]]);
        $whmcs = DB::connection('whmcs');
        $currency = $whmcs->table('tblcurrencies')->where('code', config('billing.currency'))->value('id');

        if (! $currency) {
            $this->error('WHMCS has no '.config('billing.currency').' currency to read prices in.');

            return self::FAILURE;
        }

        // msetupfee holds the 1-year price; -1 means the action is not offered.
        $prices = $whmcs->table('tblpricing')->where('currency', $currency)
            ->whereIn('type', ['domainregister', 'domainrenew', 'domaintransfer'])
            ->get(['relid', 'type', 'msetupfee'])
            ->groupBy('relid')
            ->map(fn ($rows) => $rows->pluck('msetupfee', 'type')->map(fn ($v) => (float) $v));

        // The registrar most of the panel's domains on a TLD already use, if any.
        $registrars = Domain::whereNotNull('registrar')->get(['name', 'registrar'])
            ->groupBy(fn ($d) => '.'.explode('.', strtolower($d->name), 2)[1])
            ->map(fn ($rows) => $rows->countBy('registrar')->sortDesc()->keys()->first());

        $existing = Tld::pluck('id', 'tld');
        $nextOrder = (int) Tld::max('sort_order') + 1;
        $counts = ['new' => 0, 'updated' => 0, 'kept' => 0, 'not priced' => 0];
        $dry = (bool) $this->option('dry-run');

        $run = function () use ($whmcs, $prices, $registrars, $existing, &$nextOrder, &$counts, $dry) {
            foreach ($whmcs->table('tbldomainpricing')->orderBy('order')->orderBy('id')->get() as $row) {
                $tld = '.'.ltrim(strtolower(trim($row->extension)), '.');
                $price = $prices->get($row->id, collect());
                $register = $price->get('domainregister', -1);

                if ($register <= 0) {
                    $counts['not priced']++;

                    continue;
                }

                $values = [
                    'register_price' => $register,
                    'renew_price' => $price->get('domainrenew', -1) > 0 ? $price['domainrenew'] : $register,
                    'transfer_price' => $price->get('domaintransfer', -1) > 0 ? $price['domaintransfer'] : $register,
                    'epp_required' => (bool) $row->eppcode,
                ];

                if ($existing->has($tld)) {
                    if (! $this->option('update')) {
                        $counts['kept']++;

                        continue;
                    }
                    $dry || Tld::whereKey($existing[$tld])->update($values);
                    $counts['updated']++;

                    continue;
                }

                $dry || Tld::create([
                    ...$values,
                    'tld' => $tld,
                    'sort_order' => $nextOrder++,
                    'registrar' => $registrars->get($tld),
                    'is_active' => true,
                    'is_spotlight' => false,
                ]);
                $counts['new']++;
            }
        };

        $dry ? $run() : DB::transaction($run);

        if (! $dry && ($counts['new'] || $counts['updated'])) {
            ActivityLog::record('tld.imported', context: $counts);
        }

        $this->table(['', 'TLDs'], collect($counts)->map(fn ($n, $k) => [$k, $n])->values());
        $dry && $this->warn('Dry run: nothing was written.');

        return self::SUCCESS;
    }
}
