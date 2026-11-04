<?php

namespace App\Provisioning;

use App\Models\Service;

/** Day-to-day account tools a server module offers beyond create/suspend/terminate. */
interface ManagesAccounts
{
    /**
     * Current usage as the server reports it. Sizes in MB; a null limit means unlimited.
     *
     * @return array{
     *     metrics: list<array{key: string, label: string, used: string, limit: string|null, percent: float|null}>,
     *     disk_used: int|null, disk_limit: int|null, bw_used: int|null, bw_limit: int|null
     * }
     */
    public function usage(Service $service): array;

    /** A one-time link that signs straight into the account's control panel. */
    public function loginUrl(Service $service): string;

    public function changePassword(Service $service, string $password): void;

    public function changePackage(Service $service, string $package): void;
}
