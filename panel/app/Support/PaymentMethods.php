<?php

namespace App\Support;

/** The payment methods an admin can put on a service or domain. */
class PaymentMethods
{
    /** WHMCS payment codes still on imported records, with readable names. */
    private const LEGACY = ['bkashtokenized' => 'bKash Tokenized', 'bkashrecurring' => 'bKash Recurring', 'mailin' => 'Mail In Payment'];

    /** @return array<string, string> code => name, always including $current */
    public static function all(?string $current = null): array
    {
        $methods = collect(config('billing.gateways'))->map(fn ($g) => $g['name'])->all() + self::LEGACY;

        if ($current && ! isset($methods[$current])) {
            $methods[$current] = $current;
        }

        return $methods;
    }

    /** @return list<array{code: string, name: string}> */
    public static function options(?string $current = null): array
    {
        return collect(self::all($current))->map(fn ($name, $code) => ['code' => $code, 'name' => $name])->values()->all();
    }
}
