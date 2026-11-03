<?php

namespace App\Provisioning;

use Illuminate\Support\Str;

trait GeneratesUsername
{
    /** Starts with a letter, lowercase alphanumeric, at most 16 characters, unique per service. */
    private function usernameFor(string $domain, int $serviceId): string
    {
        $base = preg_replace('/[^a-z0-9]/', '', strtolower(Str::before($domain, '.')));
        $base = ltrim((string) $base, '0123456789') ?: 'ch';

        return substr($base, 0, 8).$serviceId;
    }
}
