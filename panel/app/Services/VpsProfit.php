<?php

namespace App\Services;

use App\Models\Service;
use App\Support\Currency;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Monthly cost, sales and profit for each VPS (products of type vps).
 *
 * Cost is the service's own monthly cost when set, else its product's, in BDT, for every month the
 * VPS is live: from its registration to its termination. Sales are paid invoice lines for the
 * service, counted like Server Profit: with $spread, a yearly payment is shared across its months.
 */
class VpsProfit
{
    private const SALE_KINDS = ['new', 'renewal', 'upgrade', 'other', 'service'];

    public function report(CarbonImmutable $from, CarbonImmutable $to, bool $spread, ?int $productId = null): array
    {
        $from = $from->startOfMonth();
        $to = $to->startOfMonth();
        $months = [];
        for ($m = $from; $m <= $to; $m = $m->addMonth()) {
            $months[] = $m->format('Y-m');
        }

        $services = Service::with(['product:id,name,type,cost_amount,cost_currency', 'client:id,name'])
            ->whereHas('product', fn ($q) => $q->where('type', 'vps'))
            ->when($productId, fn ($q) => $q->where('product_id', $productId))
            ->where('status', '!=', 'pending')
            ->orderBy('id')
            ->get();
        $sales = $this->sales($services->modelKeys(), $from, $to, $spread);

        $zero = ['cost' => '0.00', 'sales' => '0.00', 'profit' => '0.00'];
        $totals = array_fill_keys($months, $zero);
        $rows = [];

        foreach ($services as $service) {
            [$amount, $currency, $source] = $this->monthlyCost($service);
            $cost = number_format(Currency::toBase($amount, $currency), 2, '.', '');
            [$start, $end] = $this->liveMonths($service);
            $row = [
                'id' => $service->id,
                'name' => $service->domain ?: "{$service->product->name} #{$service->id}",
                'product' => ['id' => $service->product->id, 'name' => $service->product->name],
                'client' => $service->client ? ['id' => $service->client->id, 'name' => $service->client->name] : null,
                'status' => $service->status,
                'monthly_cost' => $amount === null ? null : ['amount' => number_format((float) $amount, 2, '.', ''), 'currency' => $currency, 'source' => $source],
                'months' => [],
                'totals' => $zero,
            ];

            foreach ($months as $month) {
                $live = $month >= $start && ($end === null || $month <= $end);
                $cellCost = $live && $amount !== null ? $cost : '0.00';
                $sale = number_format($sales[$service->id][$month] ?? 0, 2, '.', '');
                $cell = ['cost' => $cellCost, 'sales' => $sale, 'profit' => bcsub($sale, $cellCost, 2)];
                $row['months'][$month] = $cell;

                foreach ($cell as $key => $value) {
                    $row['totals'][$key] = bcadd($row['totals'][$key], $value, 2);
                    $totals[$month][$key] = bcadd($totals[$month][$key], $value, 2);
                }
            }

            // A VPS with nothing in the period is left out.
            if ($row['totals']['cost'] !== '0.00' || $row['totals']['sales'] !== '0.00' || in_array($service->status, ['active', 'suspended'], true)) {
                $rows[] = $row;
            }
        }

        $grand = $zero;
        foreach ($totals as $cell) {
            foreach ($cell as $key => $value) {
                $grand[$key] = bcadd($grand[$key], $value, 2);
            }
        }

        return [
            'months' => $months,
            'vps' => $rows,
            'totals' => $totals,
            'grand' => $grand,
            'missing_cost' => collect($rows)->filter(fn ($r) => $r['monthly_cost'] === null && in_array($r['status'], ['active', 'suspended'], true))->count(),
        ];
    }

    /** @return array{0: ?string, 1: string, 2: ?string} amount, currency and where it came from */
    public function monthlyCost(Service $service): array
    {
        if ($service->cost_amount !== null) {
            return [(string) $service->cost_amount, $service->cost_currency ?: 'BDT', 'service'];
        }
        if ($service->product?->cost_amount !== null) {
            return [(string) $service->product->cost_amount, $service->product->cost_currency ?: 'BDT', 'product'];
        }

        return [null, 'BDT', null];
    }

    /** @return array{0: string, 1: ?string} first and last month the VPS ran (null = still running) */
    private function liveMonths(Service $service): array
    {
        $start = ($service->registered_at ?? $service->created_at)->format('Y-m');
        $end = match (true) {
            $service->termination_date !== null => $service->termination_date->format('Y-m'),
            in_array($service->status, ['terminated', 'cancelled'], true) => $service->updated_at->format('Y-m'),
            default => null,
        };

        return [$start, $end];
    }

    /** @return array<int, array<string, float>> service id => month => sales in BDT */
    private function sales(array $serviceIds, CarbonImmutable $from, CarbonImmutable $to, bool $spread): array
    {
        if (! $serviceIds) {
            return [];
        }

        $since = $spread ? $from->subMonths(36) : $from;
        $lines = DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->join('services', 'services.id', '=', 'invoice_items.service_id')
            ->where('invoices.status', 'paid')
            ->whereNotNull('invoices.paid_at')
            ->where('invoices.paid_at', '>=', $since->toDateTimeString())
            ->where('invoices.paid_at', '<', $to->addMonth()->toDateTimeString())
            ->whereIn('services.id', $serviceIds)
            ->whereIn('invoice_items.kind', self::SALE_KINDS)
            ->where('invoice_items.amount', '>', 0)
            ->get(['services.id as service_id', 'services.cycle', 'invoice_items.amount', 'invoice_items.kind', 'invoices.paid_at', 'invoices.currency']);

        $first = $from->format('Y-m');
        $last = $to->format('Y-m');
        $result = [];

        foreach ($lines as $line) {
            $paid = CarbonImmutable::parse($line->paid_at)->startOfMonth();
            $months = $spread && $line->kind !== 'upgrade' ? max(1, (int) config("billing.cycles.{$line->cycle}", 1)) : 1;
            $share = Currency::toBase($line->amount, $line->currency) / $months;

            for ($i = 0; $i < $months; $i++) {
                $month = $paid->addMonths($i)->format('Y-m');
                if ($month >= $first && $month <= $last) {
                    $result[$line->service_id][$month] = ($result[$line->service_id][$month] ?? 0) + $share;
                }
            }
        }

        return $result;
    }
}
