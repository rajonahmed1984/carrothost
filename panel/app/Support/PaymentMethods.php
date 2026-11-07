<?php

namespace App\Support;

use App\Models\Gateway;

/**
 * The payment methods an admin can put on a service or domain: the gateways turned on under
 * Settings > Payment Gateways, by the name clients see. A record's current method stays listed
 * even after its gateway is turned off, so saving never drops it.
 */
class PaymentMethods
{
    /** @return array<string, string> code => name, always including $current */
    public static function all(?string $current = null): array
    {
        $gateways = Gateway::where('is_enabled', true)->get()->keyBy('code');
        $methods = [];
        foreach (config('billing.gateways') as $code => $definition) {
            if ($gateways->has($code)) {
                $methods[$code] = self::name($code, $gateways->get($code));
            }
        }

        if ($current && ! isset($methods[$current])) {
            $methods[$current] = self::name($current, Gateway::where('code', $current)->first()).' (turned off)';
        }

        return $methods;
    }

    /** @return list<array{code: string, name: string}> */
    public static function options(?string $current = null): array
    {
        return collect(self::all($current))->map(fn ($name, $code) => ['code' => $code, 'name' => $name])->values()->all();
    }

    /** The name shown for a method, on or off. */
    public static function label(?string $code): ?string
    {
        return $code ? self::name($code, Gateway::where('code', $code)->first()) : null;
    }

    /** True for a code a payment can be recorded under and a record can carry. */
    public static function isGateway(string $code): bool
    {
        return config("billing.gateways.{$code}") !== null;
    }

    private static function name(string $code, ?Gateway $gateway): string
    {
        return ($gateway?->config['display_name'] ?? null) ?: config("billing.gateways.{$code}.name", $code);
    }
}
