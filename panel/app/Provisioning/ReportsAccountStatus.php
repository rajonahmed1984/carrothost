<?php

namespace App\Provisioning;

use App\Models\Service;

/** A server module that can read an account as the server has it right now. */
interface ReportsAccountStatus
{
    /**
     * Throws when the account cannot be read.
     *
     * @return array{domain: string|null, ip: string|null, package: string|null, suspended: bool}
     */
    public function accountInfo(Service $service): array;
}
