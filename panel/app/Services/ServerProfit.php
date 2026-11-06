<?php

namespace App\Services;

use App\Models\Server;
use App\Models\ServerCost;
use App\Support\Currency;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Monthly cost, sales and profit per server.
 *
 * Sales are the lines of paid invoices for services on the server, counted in the month the
 * invoice was paid. With $spread, a payment for a longer cycle (a year, say) is shared evenly
 * across the months it pays for, so profit does not spike in the month a yearly bill is paid.
 * Services are counted on the server they are on now.
 */
class ServerProfit
{
    /** Item kinds that are sales of a service. */
    private const SALE_KINDS = ['new', 'renewal', 'upgrade', 'other', 'service'];

    /**
     * @return array{
     *     months: list<string>,
     *     servers: list<array{id: int, name: string, is_active: bool, months: array<string, array{cost: string, sales: string, profit: string}>, totals: array{cost: string, sales: string, profit: string}}>,
     *     totals: array<string, array{cost: string, sales: string, profit: string}>,
     *     grand: array{cost: string, sales: string, profit: string}
     * }
     */
    public function report(CarbonImmutable $from, CarbonImmutable $to, bool $spread, ?int $serverId = null): array
    {
        $from = $from->startOfMonth();
        $to = $to->startOfMonth();
        $months = [];
        for ($m = $from; $m <= $to; $m = $m->addMonth()) {
            $months[] = $m->format('Y-m');
        }

        $servers = Server::query()->when($serverId, fn ($q) => $q->whereKey($serverId))->orderBy('name')->get(['id', 'name', 'is_active']);
        $costs = ServerCost::whereIn('server_id', $servers->modelKeys())->orderBy('starts_on')->get()->groupBy('server_id');
        $sales = $this->sales($servers->modelKeys(), $from, $to, $spread);

        $rows = [];
        $totals = array_fill_keys($months, ['cost' => '0.00', 'sales' => '0.00', 'profit' => '0.00']);

        foreach ($servers as $server) {
            $row = ['id' => $server->id, 'name' => $server->name, 'is_active' => (bool) $server->is_active, 'months' => [], 'totals' => ['cost' => '0.00', 'sales' => '0.00', 'profit' => '0.00']];

            foreach ($months as $month) {
                $cost = $this->costFor($costs->get($server->id, collect()), $month);
                $sale = number_format($sales[$server->id][$month] ?? 0, 2, '.', '');
                $cell = ['cost' => $cost, 'sales' => $sale, 'profit' => bcsub($sale, $cost, 2)];
                $row['months'][$month] = $cell;

                foreach ($cell as $key => $value) {
                    $row['totals'][$key] = bcadd($row['totals'][$key], $value, 2);
                    $totals[$month][$key] = bcadd($totals[$month][$key], $value, 2);
                }
            }

            $rows[] = $row;
        }

        $grand = ['cost' => '0.00', 'sales' => '0.00', 'profit' => '0.00'];
        foreach ($totals as $cell) {
            foreach ($cell as $key => $value) {
                $grand[$key] = bcadd($grand[$key], $value, 2);
            }
        }

        return ['months' => $months, 'servers' => $rows, 'totals' => $totals, 'grand' => $grand];
    }

    /** The cost in force in a month: the latest entry starting on or before it. */
    public function costFor($entries, string $month): string
    {
        $current = $entries->filter(fn (ServerCost $c) => $c->starts_on->format('Y-m') <= $month)->last();

        return $current ? number_format((float) $current->amount, 2, '.', '') : '0.00';
    }

    /** @return array<int, array<string, float>> server id => month => sales */
    private function sales(array $serverIds, CarbonImmutable $from, CarbonImmutable $to, bool $spread): array
    {
        if (! $serverIds) {
            return [];
        }

        // A spread payment can reach back up to three years (triennial).
        $since = $spread ? $from->subMonths(36) : $from;
        $lines = DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->join('services', 'services.id', '=', 'invoice_items.service_id')
            ->where('invoices.status', 'paid')
            ->whereNotNull('invoices.paid_at')
            ->where('invoices.paid_at', '>=', $since->toDateTimeString())
            ->where('invoices.paid_at', '<', $to->addMonth()->toDateTimeString())
            ->whereIn('services.server_id', $serverIds)
            ->whereIn('invoice_items.kind', self::SALE_KINDS)
            ->where('invoice_items.amount', '>', 0)
            ->get(['services.server_id', 'services.cycle', 'invoice_items.amount', 'invoice_items.kind', 'invoices.paid_at', 'invoices.currency']);

        $first = $from->format('Y-m');
        $last = $to->format('Y-m');
        $result = [];

        foreach ($lines as $line) {
            $paid = CarbonImmutable::parse($line->paid_at)->startOfMonth();
            $months = $spread && $line->kind !== 'upgrade' ? max(1, (int) config("billing.cycles.{$line->cycle}", 1)) : 1;
            // In BDT, like server costs: a USD sale counts at the current rate.
            $share = Currency::toBase($line->amount, $line->currency) / $months;

            for ($i = 0; $i < $months; $i++) {
                $month = $paid->addMonths($i)->format('Y-m');
                if ($month >= $first && $month <= $last) {
                    $result[$line->server_id][$month] = ($result[$line->server_id][$month] ?? 0) + $share;
                }
            }
        }

        return $result;
    }
}
