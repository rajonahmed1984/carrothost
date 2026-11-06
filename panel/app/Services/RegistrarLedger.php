<?php

namespace App\Services;

use App\Models\Registrar;
use App\Models\RegistrarCharge;
use App\Models\RegistrarDeposit;
use App\Models\RegistrarTld;
use App\Support\Currency;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * The money held at each domain registrar, and what domains really cost in BDT.
 *
 * Deposits fill the account at their own rate: (BDT sent + fee) / amount credited. Each charge
 * spends the oldest deposit first (FIFO), so its BDT cost is what that money actually cost you.
 * A credit back from the registrar returns money to the account at the rate it was spent at,
 * and counts as negative cost. Unspent deposits are money held, not cost.
 */
class RegistrarLedger
{
    /** Invoice line kinds that are domain sales. */
    private const SALE_KINDS = ['new', 'renewal', 'domain', 'other'];

    /**
     * BDT cost of every charge, and the wallet left over.
     *
     * @return array{costs: array<int, array{cost_bdt: float, unfunded: bool}>, wallet: array<string, float|int|string>}
     */
    public function ledger(string $code): array
    {
        $currency = Registrar::where('code', $code)->value('currency') ?? 'USD';
        $deposits = RegistrarDeposit::where('registrar_code', $code)->orderBy('paid_on')->orderBy('id')->get();
        $charges = RegistrarCharge::where('registrar_code', $code)->orderBy('charged_at')->orderBy('id')->get();

        // Deposits go in before charges on the same day.
        $events = $deposits->map(fn ($d) => ['at' => $d->paid_on->format('Y-m-d').' 00:00:00', 'order' => 0, 'deposit' => $d])
            ->concat($charges->map(fn ($c) => ['at' => $c->charged_at->format('Y-m-d H:i:s'), 'order' => 1, 'charge' => $c]))
            ->sortBy([['at', 'asc'], ['order', 'asc']])->values();

        $lots = []; // [remaining, rate]
        // Before any deposit, spending is priced at the rate in Settings > Currencies, if there is one.
        $lastRate = Currency::bdtRate($currency);
        $costs = [];
        $unfunded = 0.0;
        $spent = 0.0;
        $returned = 0.0;

        foreach ($events as $event) {
            if (isset($event['deposit'])) {
                $rate = $event['deposit']->rate();
                $lots[] = [(float) $event['deposit']->credited, $rate];
                $lastRate = $rate;

                continue;
            }

            /** @var RegistrarCharge $charge */
            $charge = $event['charge'];
            $amount = (float) $charge->amount;

            if ($charge->type === 'credit') {
                // Money back into the account, at the rate it was last spent at.
                $rate = $lastRate ?? 0.0;
                array_unshift($lots, [$amount, $rate]);
                $costs[$charge->id] = ['cost_bdt' => -round($amount * $rate, 2), 'unfunded' => $lastRate === null];
                $returned += $amount;

                continue;
            }

            $cost = 0.0;
            $left = $amount;
            while ($left > 0.000001 && $lots) {
                $take = min($left, $lots[0][0]);
                $cost += $take * $lots[0][1];
                $lastRate = $lots[0][1];
                $lots[0][0] -= $take;
                $left -= $take;
                if ($lots[0][0] <= 0.000001) {
                    array_shift($lots);
                }
            }
            // Spent more than was deposited: priced at the last known rate until a deposit is recorded.
            if ($left > 0.000001) {
                $unfunded += $left;
                $cost += $left * ($lastRate ?? 0.0);
            }

            $costs[$charge->id] = ['cost_bdt' => round($cost, 2), 'unfunded' => $left > 0.000001];
            $spent += $amount;
        }

        $credited = (float) $deposits->sum('credited');

        return [
            'costs' => $costs,
            'wallet' => [
                'code' => $code,
                'currency' => $currency,
                'deposits' => $deposits->count(),
                'sent_bdt' => round((float) $deposits->sum('amount_bdt'), 2),
                'fees_bdt' => round((float) $deposits->sum('fee_bdt'), 2),
                'credited' => round($credited, 2),
                'spent' => round($spent, 2),
                'returned' => round($returned, 2),
                // What the registrar should show as your balance.
                'balance' => round($credited + $returned - $spent, 2),
                // What the unspent money cost you in BDT.
                'balance_bdt' => round(array_sum(array_map(fn ($lot) => $lot[0] * $lot[1], $lots)), 2),
                'unfunded' => round($unfunded, 2),
                'average_rate' => $credited > 0 ? round(((float) $deposits->sum('amount_bdt') + (float) $deposits->sum('fee_bdt')) / $credited, 4) : null,
            ],
        ];
    }

    /** Sales, registrar cost and profit per month, by registrar and by TLD, with the checks that need attention. */
    public function report(CarbonImmutable $from, CarbonImmutable $to, ?string $only = null): array
    {
        $from = $from->startOfMonth();
        $to = $to->startOfMonth();
        $end = $to->addMonth();
        $months = [];
        for ($m = $from; $m <= $to; $m = $m->addMonth()) {
            $months[] = $m->format('Y-m');
        }

        $codes = collect(array_keys(config('billing.registrars')))->when($only, fn ($c) => $c->filter(fn ($code) => $code === $only))->values();
        // estimated: the part of cost priced from TLD prices because no registrar charge was found.
        $blank = fn () => ['sales' => 0.0, 'cost' => 0.0, 'profit' => 0.0, 'estimated' => 0.0];
        $registrars = [];
        $totals = array_fill_keys($months, $blank());
        $tlds = [];
        $ledgers = [];

        $sales = $this->sales($codes->all(), $from, $end);
        $perDomain = [];
        $unpriced = [];
        $domainRow = fn ($id, $name, $code, $clientId) => ['domain_id' => $id, 'domain' => $name, 'registrar' => $code, 'client_id' => $clientId, 'sales' => 0.0, 'cost' => 0.0, 'estimated' => 0.0, 'last_paid' => ''];
        foreach ($codes as $code) {
            $ledgers[$code] = $this->ledger($code);
            $row = ['code' => $code, 'name' => config("billing.registrars.{$code}.name"), 'months' => array_fill_keys($months, $blank()), 'totals' => $blank()];
            $registrar = Registrar::where('code', $code)->first();
            $rate = $registrar ? $registrar->bdtRate($ledgers[$code]['wallet']['average_rate']) : null;
            $prices = $this->tldPrices($code);
            // An actual charge near the sale replaces the estimate, so nothing is counted twice.
            $actual = RegistrarCharge::where('registrar_code', $code)->where('type', 'debit')->whereNotNull('domain_id')
                ->where('charged_at', '>=', $from->subDays(60))->where('charged_at', '<', $end->addDays(60))
                ->get(['domain_id', 'charged_at'])->groupBy('domain_id');

            foreach ($sales->where('registrar', $code) as $sale) {
                $month = substr($sale->paid_at, 0, 7);
                $tld = $this->tld($sale->name);
                $row['months'][$month]['sales'] += (float) $sale->amount;
                $tlds[$tld]['sales'] = ($tlds[$tld]['sales'] ?? 0) + (float) $sale->amount;

                $paid = strtotime($sale->paid_at);
                $charged = ($actual->get($sale->domain_id) ?? collect())->contains(fn ($c) => abs($c->charged_at->timestamp - $paid) <= 60 * 86400);
                $action = $this->costAction($sale);
                $estimate = null;
                if (! $charged && $action) {
                    $price = $this->priceFor($prices, $sale->name, $action);
                    if ($price === null || $rate === null) {
                        $priceTld = $this->priceTld($prices, $sale->name) ?? $tld;
                        $unpriced["{$code}{$priceTld}{$action}"] = ['registrar' => $code, 'tld' => $priceTld, 'action' => $action, 'reason' => $price === null ? 'no_price' : 'no_rate'];
                    } else {
                        $estimate = round($price * max(1, (int) ($sale->years ?? 1)) * $rate, 2);
                        $row['months'][$month]['cost'] += $estimate;
                        $row['months'][$month]['estimated'] += $estimate;
                        $tlds[$tld]['cost'] = ($tlds[$tld]['cost'] ?? 0) + $estimate;
                    }
                }

                $perDomain[$sale->domain_id] ??= $domainRow($sale->domain_id, $sale->name, $code, $sale->client_id);
                $perDomain[$sale->domain_id]['sales'] += (float) $sale->amount;
                $perDomain[$sale->domain_id]['cost'] += $estimate ?? 0.0;
                $perDomain[$sale->domain_id]['estimated'] += $estimate ?? 0.0;
                $perDomain[$sale->domain_id]['last_paid'] = max($perDomain[$sale->domain_id]['last_paid'], substr($sale->paid_at, 0, 10));
            }

            $charges = RegistrarCharge::with('domain:id,name,client_id')->where('registrar_code', $code)
                ->where('charged_at', '>=', $from)->where('charged_at', '<', $end)->get();
            foreach ($charges as $charge) {
                $cost = $ledgers[$code]['costs'][$charge->id]['cost_bdt'] ?? 0.0;
                $row['months'][$charge->charged_at->format('Y-m')]['cost'] += $cost;
                $tld = $charge->domain ? $this->tld($charge->domain->name) : 'Unmatched';
                $tlds[$tld]['cost'] = ($tlds[$tld]['cost'] ?? 0) + $cost;
                if ($charge->domain) {
                    $perDomain[$charge->domain_id] ??= $domainRow($charge->domain_id, $charge->domain->name, $code, $charge->domain->client_id);
                    $perDomain[$charge->domain_id]['cost'] += $cost;
                }
            }

            foreach ($months as $month) {
                $cell = &$row['months'][$month];
                $cell['profit'] = $cell['sales'] - $cell['cost'];
                foreach (['sales', 'cost', 'profit', 'estimated'] as $key) {
                    $row['totals'][$key] += $cell[$key];
                    $totals[$month][$key] += $cell[$key];
                }
                unset($cell);
            }

            $registrars[] = $row;
        }

        $grand = $blank();
        foreach ($totals as $cell) {
            foreach (['sales', 'cost', 'profit', 'estimated'] as $key) {
                $grand[$key] += $cell[$key];
            }
        }

        $domains = collect($perDomain)->map(fn ($d) => [...$d, 'profit' => $d['sales'] - $d['cost'], 'cost_source' => match (true) {
            $d['estimated'] <= 0 => $d['cost'] > 0 ? 'actual' : 'none',
            $d['estimated'] < $d['cost'] - 0.001 => 'mixed',
            default => 'estimated',
        }])->sortByDesc('sales')->values()->all();

        $byTld = collect($tlds)->map(fn ($t, $name) => ['tld' => $name, 'sales' => round($t['sales'] ?? 0, 2), 'cost' => round($t['cost'] ?? 0, 2), 'profit' => round(($t['sales'] ?? 0) - ($t['cost'] ?? 0), 2)])
            ->sortByDesc('sales')->values();

        $deposits = RegistrarDeposit::whereIn('registrar_code', $codes)->where('paid_on', '>=', $from)->where('paid_on', '<', $end)->get();

        return [
            'months' => $months,
            'registrars' => $this->round($registrars),
            'totals' => $this->round($totals),
            'grand' => $this->round($grand),
            'tlds' => $byTld,
            'deposited' => ['sent_bdt' => round((float) $deposits->sum('amount_bdt'), 2), 'fees_bdt' => round((float) $deposits->sum('fee_bdt'), 2)],
            'wallets' => collect($ledgers)->map(fn ($l) => $l['wallet'])->values(),
            'checks' => $this->checks($codes->all(), $ledgers),
            // Every domain sold or charged in the range, with its cost.
            'domains' => $this->round($domains),
            // TLDs whose sales could not be costed: no synced price, or no BDT rate for the currency.
            'unpriced' => array_values($unpriced),
        ];
    }

    /** Which registrar price a paid line costs: renew for a renewal, else what the domain was ordered as. */
    private function costAction(object $sale): ?string
    {
        if ($sale->kind === 'renewal') {
            return 'renew';
        }

        return match ($sale->action) {
            'register' => 'register',
            'transfer' => 'transfer',
            'renew', 'renewal' => 'renew',
            default => null, // a customer's own domain costs nothing at the registrar
        };
    }

    /** @return array<string, array{register: ?float, renew: ?float, transfer: ?float}> keyed by TLD with the leading dot */
    private function tldPrices(string $code): array
    {
        return RegistrarTld::where('registrar_code', $code)->get(['tld', 'register_cost', 'renew_cost', 'transfer_cost'])
            ->mapWithKeys(fn ($t) => [strtolower($t->tld) => [
                'register' => $t->register_cost !== null ? (float) $t->register_cost : null,
                'renew' => $t->renew_cost !== null ? (float) $t->renew_cost : null,
                'transfer' => $t->transfer_cost !== null ? (float) $t->transfer_cost : null,
            ]])->all();
    }

    /** The longest priced TLD the name ends with, e.g. .com.bd before .bd. */
    private function priceTld(array $prices, string $name): ?string
    {
        $parts = explode('.', strtolower($name));
        for ($i = 1; $i < count($parts); $i++) {
            $tld = '.'.implode('.', array_slice($parts, $i));
            if (isset($prices[$tld])) {
                return $tld;
            }
        }

        return null;
    }

    /** One year's cost in the registrar's currency. A missing renew or transfer price falls back to register. */
    private function priceFor(array $prices, string $name, string $action): ?float
    {
        $tld = $this->priceTld($prices, $name);

        return $tld === null ? null : ($prices[$tld][$action] ?? $prices[$tld]['register'] ?? null);
    }

    /** Paid invoice lines for domains at these registrars, paid in the range. */
    private function sales(array $codes, CarbonImmutable $from, CarbonImmutable $end): Collection
    {
        return DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->join('domains', 'domains.id', '=', 'invoice_items.domain_id')
            ->where('invoices.status', 'paid')
            ->where('invoices.paid_at', '>=', $from->toDateTimeString())
            ->where('invoices.paid_at', '<', $end->toDateTimeString())
            ->whereIn('domains.registrar', $codes)
            ->whereIn('invoice_items.kind', self::SALE_KINDS)
            ->where('invoice_items.amount', '>', 0)
            ->get(['invoices.currency', 'domains.id as domain_id', 'domains.name', 'domains.registrar', 'domains.action', 'domains.years', 'invoice_items.kind', 'invoice_items.amount', 'invoices.paid_at', 'invoices.id as invoice_id', 'invoices.number', 'invoices.client_id'])
            // Profit is in BDT, so a USD sale counts at the current rate.
            ->each(function ($sale) {
                $sale->amount = Currency::toBase($sale->amount, $sale->currency);
            });
    }

    /**
     * Things to look at: paid but not done at the registrar, done but not paid, charges no domain
     * could be found for, and domains sold for less than they cost. Only registrars with charges
     * recorded are checked, so a registrar not yet synced does not flag every domain.
     */
    private function checks(array $codes, array $ledgers): array
    {
        $tracked = RegistrarCharge::whereIn('registrar_code', $codes)->distinct()->pluck('registrar_code')->all();
        $since = CarbonImmutable::now()->subDays(365);
        $sales = $this->sales($tracked, $since, CarbonImmutable::now()->addDay());
        $charges = RegistrarCharge::with('domain:id,name,client_id')->whereIn('registrar_code', $tracked)->where('charged_at', '>=', $since->subDays(60))->get();
        $window = 60 * 86400;

        $paidNotDone = [];
        foreach ($sales as $sale) {
            $paid = strtotime($sale->paid_at);
            if ($paid > time() - 2 * 86400) {
                continue; // give the admin a couple of days to renew it
            }
            $done = $charges->first(fn ($c) => $c->type === 'debit' && $c->domain_id === $sale->domain_id && abs($c->charged_at->timestamp - $paid) <= $window);
            if (! $done) {
                $paidNotDone[] = ['domain_id' => $sale->domain_id, 'domain' => $sale->name, 'registrar' => $sale->registrar, 'paid_at' => substr($sale->paid_at, 0, 10), 'amount' => (float) $sale->amount, 'invoice_id' => $sale->invoice_id, 'invoice' => $sale->number, 'client_id' => $sale->client_id];
            }
        }

        $doneNotPaid = [];
        $belowCost = [];
        foreach ($charges->where('type', 'debit') as $charge) {
            $cost = $ledgers[$charge->registrar_code]['costs'][$charge->id]['cost_bdt'] ?? 0.0;
            if (! $charge->domain_id) {
                continue;
            }
            $sale = $sales->first(fn ($s) => $s->domain_id === $charge->domain_id && abs(strtotime($s->paid_at) - $charge->charged_at->timestamp) <= $window);
            $row = ['charge_id' => $charge->id, 'domain_id' => $charge->domain_id, 'domain' => $charge->domain?->name, 'registrar' => $charge->registrar_code, 'charged_at' => $charge->charged_at->toDateString(), 'action' => $charge->action, 'cost_bdt' => $cost, 'client_id' => $charge->domain?->client_id];
            if (! $sale) {
                if ($charge->charged_at->gte($since)) {
                    $doneNotPaid[] = $row;
                }
            } elseif ((float) $sale->amount < $cost) {
                $belowCost[] = [...$row, 'sale' => (float) $sale->amount, 'loss' => round($cost - (float) $sale->amount, 2)];
            }
        }

        $unmatched = RegistrarCharge::whereIn('registrar_code', $codes)->where('type', 'debit')->whereNull('domain_id')->latest('charged_at')->limit(100)->get()
            ->map(fn ($c) => [...$c->only('id', 'registrar_code', 'description', 'amount'), 'charged_at' => $c->charged_at->toDateString(), 'cost_bdt' => $ledgers[$c->registrar_code]['costs'][$c->id]['cost_bdt'] ?? 0.0]);

        return [
            'tracked' => $tracked,
            'paid_not_done' => $paidNotDone,
            'done_not_paid' => $doneNotPaid,
            'below_cost' => $belowCost,
            'unmatched' => $unmatched,
        ];
    }

    private function tld(string $domain): string
    {
        $parts = explode('.', strtolower($domain), 2);

        return isset($parts[1]) ? '.'.$parts[1] : $domain;
    }

    private function round(array $data): array
    {
        array_walk_recursive($data, function (&$v) {
            if (is_float($v)) {
                $v = round($v, 2);
            }
        });

        return $data;
    }
}
