<?php

namespace App\Support\Auth;

use Illuminate\Contracts\Auth\Authenticatable;

/** The two doors into the panel. Admins are users on the web guard; customers are clients on the client guard. */
class Portal
{
    public const CLIENT = 'client';

    public const ADMIN = 'admin';

    private const MAP = [
        self::CLIENT => [
            'guard' => 'client',
            'broker' => 'clients',
            'label' => 'CarrotHost',
            'recaptcha_action' => 'LOGIN',
            'min_password' => 10,
            'scope' => ['status' => 'active'],
        ],
        self::ADMIN => [
            'guard' => 'web',
            'broker' => 'users',
            'label' => 'CarrotHost Admin',
            'recaptcha_action' => 'ADMIN_LOGIN',
            'min_password' => 12,
            'scope' => ['is_admin' => true],
        ],
    ];

    public static function guard(string $portal): string
    {
        return self::MAP[$portal]['guard'];
    }

    public static function broker(string $portal): string
    {
        return self::MAP[$portal]['broker'];
    }

    public static function label(string $portal): string
    {
        return self::MAP[$portal]['label'];
    }

    public static function recaptchaAction(string $portal): string
    {
        return self::MAP[$portal]['recaptcha_action'];
    }

    public static function minPassword(string $portal): int
    {
        return self::MAP[$portal]['min_password'];
    }

    /** What an account must also match to use this portal. */
    public static function scope(string $portal): array
    {
        return self::MAP[$portal]['scope'];
    }

    public static function allows(string $portal, Authenticatable $user): bool
    {
        foreach (self::scope($portal) as $column => $value) {
            if ($user->{$column} !== $value) {
                return false;
            }
        }

        return true;
    }

    public static function guards(): array
    {
        return array_column(self::MAP, 'guard');
    }
}
