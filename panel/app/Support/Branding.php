<?php

namespace App\Support;

/** The company name and images every page shows, uploaded ones first. */
class Branding
{
    public static function logoUrl(): string
    {
        return self::uploaded('billing.logo_path') ?? asset('logo.png');
    }

    public static function iconUrl(): string
    {
        return self::uploaded('billing.favicon_path') ?? asset('icon.png');
    }

    public static function public(): array
    {
        return [
            'name' => config('app.name'),
            // Admin figures are in the base currency; each client sees their own (from /me).
            'currency' => Currency::BASE,
            'default_currency' => Currency::default(),
            'currencies' => Currency::SUPPORTED,
            'logo_url' => self::logoUrl(),
            'icon_url' => self::iconUrl(),
            'custom_icon' => self::uploaded('billing.favicon_path') !== null,
        ];
    }

    private static function uploaded(string $config): ?string
    {
        $path = config($config);

        // asset() follows the request, so this works from a subfolder whatever APP_URL says.
        return $path ? asset("uploads/branding/{$path}") : null;
    }
}
