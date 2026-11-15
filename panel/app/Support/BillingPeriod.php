<?php

namespace App\Support;

use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

/**
 * The stretch of service one invoice line pays for. A line billed on 16/07/2026 for one year covers
 * 16/07/2026 to 15/07/2027: the day before the next one starts.
 */
class BillingPeriod
{
    /** @return array{0: CarbonInterface, 1: CarbonInterface}|null null for a cycle with no length (one-time, free) */
    public static function forCycle(?string $cycle, CarbonInterface $start): ?array
    {
        $months = (int) config("billing.cycles.{$cycle}");

        return $months > 0 ? self::span($start, $months) : null;
    }

    /** @return array{0: CarbonInterface, 1: CarbonInterface} */
    public static function forYears(int $years, CarbonInterface $start): array
    {
        return self::span($start, max($years, 1) * 12);
    }

    /** The period that ended on the day before $end, e.g. a renewal already applied by hand. */
    public static function endingBefore(CarbonInterface $end, int $months): array
    {
        $start = Carbon::parse($end)->startOfDay()->subMonthsNoOverflow($months);

        return [$start, Carbon::parse($end)->startOfDay()->subDay()];
    }

    public static function label(CarbonInterface $start, CarbonInterface $end): string
    {
        return $start->format('d/m/Y').' - '.$end->format('d/m/Y');
    }

    /**
     * An invoice line with its period: the dates are stored on it and the range is added to the
     * description, which is what the invoice page, the email, print and SMS all show.
     *
     * @param  array<string, mixed>  $item
     * @param  array{0: CarbonInterface, 1: CarbonInterface}|null  $period
     * @return array<string, mixed>
     */
    public static function line(array $item, ?array $period): array
    {
        if (! $period) {
            return $item;
        }

        [$start, $end] = $period;
        $label = self::label($start, $end);

        return [
            ...$item,
            'description' => str_contains((string) $item['description'], $label) ? $item['description'] : rtrim((string) $item['description'])." ({$label})",
            'period_start' => $start->toDateString(),
            'period_end' => $end->toDateString(),
        ];
    }

    /** @return array{0: CarbonInterface, 1: CarbonInterface} */
    private static function span(CarbonInterface $start, int $months): array
    {
        $start = Carbon::parse($start)->startOfDay();

        return [$start, $start->copy()->addMonthsNoOverflow($months)->subDay()];
    }
}
