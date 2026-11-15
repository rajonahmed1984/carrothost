<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\RegistrarCharge;
use App\Support\Currency;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;

/**
 * What one client brings in and what it costs: the "Gross Revenue" of the client page, with its expenses.
 *
 * Revenue is money actually received: payments made with a real gateway, less refunds sent back.
 * Left out, because they are not cash moving:
 *  - refunds given as credit (the money stays on the account; credit spent on an invoice is a
 *    "Credit applied" line on it, never a payment, so it is not counted twice),
 *  - the child payments a Mass Pay invoice posts to the invoices it settles (the bundle itself is counted).
 *
 * Expenses that belong to the client's own records:
 *  - gateway fees on its payments,
 *  - domain costs at the registrar (real charges, else the TLD price), as the Registrar report counts them,
 *  - VPS costs: the VPS's monthly cost for every month it has run, as the VPS Profit report counts them.
 * A shared hosting server's cost is not split across its accounts, so it is not here.
 */
class ClientProfit
{
    public function __construct(private readonly VpsProfit $vps, private readonly RegistrarLedger $registrars) {}

    /**
     * @return array{
     *     currency: string,
     *     revenue: string,
     *     expenses: array{gateway_fees: string, domains: string, vps: string, total: string},
     *     net: string,
     *     margin: ?float,
     *     notes: array{missing_vps_cost: int, estimated_domain_cost: bool}
     * }
     */
    public function for(Client $client): array
    {
        $currency = $client->currencyCode();
        $payments = Payment::whereIn('invoice_id', $client->invoices()->select('id'))
            ->where(fn ($q) => $q->where('gateway', '!=', 'credit')->orWhereNull('gateway'))
            ->where(fn ($q) => $q->where('transaction_id', 'not like', 'MASSPAY-%')->orWhereNull('transaction_id'));

        $revenue = $this->sum($payments, 'amount', $currency);
        $fees = $this->sum($payments, 'fee', $currency);
        ['cost' => $domainBdt, 'estimated' => $estimated] = $this->domainCosts()[$client->id] ?? ['cost' => 0.0, 'estimated' => 0.0];
        ['cost' => $vpsBdt, 'missing' => $missing] = $this->vpsCosts($client);

        $domains = $this->fromBase($domainBdt, $currency);
        $vps = $this->fromBase($vpsBdt, $currency);
        $total = bcadd(bcadd($fees, $domains, 2), $vps, 2);
        $net = bcsub($revenue, $total, 2);

        return [
            'currency' => $currency,
            'revenue' => $revenue,
            'expenses' => ['gateway_fees' => $fees, 'domains' => $domains, 'vps' => $vps, 'total' => $total],
            'net' => $net,
            'margin' => bccomp($revenue, '0', 2) > 0 ? round((float) $net / (float) $revenue * 100, 1) : null,
            'notes' => ['missing_vps_cost' => $missing, 'estimated_domain_cost' => $estimated > 0.0],
        ];
    }

    /** A payments column summed in the client's currency; older rows in another currency are converted. */
    private function sum($payments, string $column, string $currency): string
    {
        $total = 0.0;
        foreach ((clone $payments)->selectRaw("currency, sum({$column}) as total")->groupBy('currency')->get() as $row) {
            $from = $row->currency ?: Currency::BASE;
            $known = Currency::bdtRate($from) && Currency::bdtRate($currency);
            $total += (float) ($known ? Currency::convert((string) $row->total, $from, $currency) : $row->total);
        }

        return Currency::fmt($total);
    }

    /** BDT to the client's currency; with no rate set for it the BDT figure stands, like the other totals. */
    private function fromBase(float $bdt, string $currency): string
    {
        return Currency::bdtRate($currency) ? Currency::fromBase($bdt, $currency) : Currency::fmt($bdt);
    }

    /**
     * Registrar cost of every client's domains in BDT, from the Registrar report over all time. It walks
     * every charge and deposit, so it is worked out once for all clients and kept for a few minutes.
     *
     * @return array<int, array{cost: float, estimated: float}> client id => cost
     */
    private function domainCosts(): array
    {
        return Cache::remember('client-profit.domain-costs', 300, function () {
            $first = collect([RegistrarCharge::min('charged_at'), Invoice::whereNotNull('paid_at')->min('paid_at')])->filter()->min();
            $from = $first ? CarbonImmutable::parse($first) : CarbonImmutable::now();
            $costs = [];

            foreach ($this->registrars->report($from, CarbonImmutable::now())['domains'] as $domain) {
                if (! $domain['client_id']) {
                    continue;
                }
                $costs[$domain['client_id']]['cost'] = ($costs[$domain['client_id']]['cost'] ?? 0.0) + $domain['cost'];
                $costs[$domain['client_id']]['estimated'] = ($costs[$domain['client_id']]['estimated'] ?? 0.0) + $domain['estimated'];
            }

            return $costs;
        });
    }

    /** @return array{cost: float, missing: int} BDT cost of the client's VPSs so far, and how many live ones have no cost set */
    private function vpsCosts(Client $client): array
    {
        $current = now()->format('Y-m');
        $cost = 0.0;
        $missing = 0;

        $services = $client->services()->with('product:id,name,type,cost_amount,cost_currency')
            ->whereHas('product', fn ($q) => $q->where('type', 'vps'))
            ->where('status', '!=', 'pending')
            ->get();

        foreach ($services as $service) {
            [$amount, $currency] = $this->vps->monthlyCost($service);
            if ($amount === null) {
                $missing += in_array($service->status, ['active', 'suspended'], true) ? 1 : 0;

                continue;
            }

            [$start, $end] = $this->vps->liveMonths($service);
            $last = min($end ?? $current, $current);
            $months = $last < $start ? 0 : (int) CarbonImmutable::createFromFormat('Y-m-d', "{$start}-01")->diffInMonths(CarbonImmutable::createFromFormat('Y-m-d', "{$last}-01")) + 1;
            $cost += Currency::toBase($amount, $currency) * $months;
        }

        return ['cost' => $cost, 'missing' => $missing];
    }
}
