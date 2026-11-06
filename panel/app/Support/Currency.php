<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

/**
 * The panel's currencies. Prices are kept in BDT (the base); a USD price is the BDT price
 * divided by the rate in Admin > Settings > Currencies, unless a fixed USD price is set.
 * Each client is billed in their own currency.
 */
class Currency
{
    public const BASE = 'BDT';

    public const SUPPORTED = ['BDT', 'USD'];

    /** The currency new clients start with (Settings > Currencies). */
    public static function default(): string
    {
        $code = strtoupper((string) config('billing.currency'));

        return in_array($code, self::SUPPORTED, true) ? $code : self::BASE;
    }

    /** BDT per 1 unit of the currency: 1 for BDT, null when no rate is set. */
    public static function bdtRate(string $currency): ?float
    {
        $currency = strtoupper($currency);
        if ($currency === self::BASE) {
            return 1.0;
        }
        $rate = (float) config("billing.exchange_rates.{$currency}");

        return $rate > 0 ? $rate : null;
    }

    /** The rate, or a validation error naming what to set. */
    public static function requireRate(string $currency): float
    {
        return self::bdtRate($currency) ?? throw ValidationException::withMessages([
            'currency' => "No exchange rate is set for {$currency}. An admin must set it in Settings > Currencies.",
        ]);
    }

    /** A BDT amount in another currency, rounded to cents. */
    public static function fromBase(string|float|int $bdt, string $to): string
    {
        $to = strtoupper($to);
        if ($to === self::BASE) {
            return self::fmt((float) $bdt);
        }

        return self::fmt((float) $bdt / self::requireRate($to));
    }

    /** An amount in BDT, for reports that add currencies together. Unknown rates count as zero. */
    public static function toBase(string|float|int|null $amount, ?string $from): float
    {
        $rate = self::bdtRate($from ?: self::BASE);

        return round((float) $amount * ($rate ?? 0.0), 2);
    }

    /**
     * A column summed across currencies, in BDT. $query is an Eloquent or query builder over a
     * table with a currency column (named by $currencyColumn).
     */
    public static function sumInBase($query, string $column, string $currencyColumn = 'currency'): string
    {
        $total = 0.0;
        foreach ((clone $query)->reorder()->selectRaw("{$currencyColumn} as cur, sum({$column}) as total")->groupBy($currencyColumn)->get() as $row) {
            $total += self::toBase($row->total, $row->cur);
        }

        return self::fmt($total);
    }

    public static function convert(string|float|int $amount, string $from, string $to): string
    {
        $from = strtoupper($from);
        $to = strtoupper($to);
        if ($from === $to) {
            return self::fmt((float) $amount);
        }

        return self::fromBase((float) $amount * self::requireRate($from), $to);
    }

    /**
     * A price in the given currency: the fixed price for that currency when one is set,
     * else the BDT price converted.
     */
    public static function price(string|float|int|null $bdt, string|float|int|null $fixedUsd, string $currency): string
    {
        $currency = strtoupper($currency);
        if ($currency === 'USD' && $fixedUsd !== null && $fixedUsd !== '') {
            return self::fmt((float) $fixedUsd);
        }

        return self::fromBase((float) $bdt, $currency);
    }

    public static function fmt(float $amount): string
    {
        return number_format(round($amount, 2), 2, '.', '');
    }
}
