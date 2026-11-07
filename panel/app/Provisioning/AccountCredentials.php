<?php

namespace App\Provisioning;

use App\Models\Service;
use Illuminate\Support\Str;

/**
 * Hosting account usernames and passwords: the first 8 letters
 * of the domain, made unique with a number at the end, and a strong random password.
 */
class AccountCredentials
{
    /** cPanel and Webuzo both accept this: a letter first, then lowercase letters and digits, at most 8 here. */
    public const USERNAME_PATTERN = '/^[a-z][a-z0-9]{0,15}$/';

    private const MAX = 8;

    // cPanel refuses these as account names.
    private const RESERVED = ['root', 'admin', 'test', 'all', 'cpanel', 'whm', 'mysql', 'nobody', 'virtfs', 'system', 'webuzo', 'ftp', 'mail', 'www'];

    public static function username(string $domain, ?int $exceptServiceId = null): string
    {
        $base = preg_replace('/[^a-z0-9]/', '', strtolower(Str::before($domain, '.')));
        $base = ltrim((string) $base, '0123456789');
        $base = substr($base !== '' ? $base : 'user', 0, self::MAX);

        if (str_starts_with($base, 'test') || in_array($base, self::RESERVED, true)) {
            $base = substr('u'.$base, 0, self::MAX);
        }

        for ($n = 0; $n < 1000; $n++) {
            $candidate = $n === 0 ? $base : substr($base, 0, self::MAX - strlen((string) $n)).$n;
            if (! self::taken($candidate, $exceptServiceId)) {
                return $candidate;
            }
        }

        return substr($base, 0, 4).Str::lower(Str::random(4));
    }

    /** 14 characters with upper, lower, digit and a symbol that is safe in panels and URLs. */
    public static function password(int $length = 14): string
    {
        $sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#%^*-_+='];
        $chars = array_map(fn ($set) => $set[random_int(0, strlen($set) - 1)], $sets);
        $all = implode('', $sets);
        while (count($chars) < $length) {
            $chars[] = $all[random_int(0, strlen($all) - 1)];
        }
        // Fisher-Yates with a secure random source.
        for ($i = count($chars) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$chars[$i], $chars[$j]] = [$chars[$j], $chars[$i]];
        }

        return implode('', $chars);
    }

    /** Already used by another live or pending service in the panel. */
    public static function taken(string $username, ?int $exceptServiceId = null): bool
    {
        if (in_array($username, self::RESERVED, true)) {
            return true;
        }

        return Service::query()
            ->when($exceptServiceId, fn ($q) => $q->whereKeyNot($exceptServiceId))
            ->whereNotIn('status', ['terminated', 'cancelled', 'fraud'])
            ->where('remote_id', $username)
            ->exists();
    }
}
