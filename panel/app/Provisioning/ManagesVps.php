<?php

namespace App\Provisioning;

use App\Models\Service;

/** Power, OS and access controls for a virtual server, shown on its service page. */
interface ManagesVps
{
    /**
     * @return array{status: string, ipv4: ?string, ipv6: ?string, location: ?string, profile: ?string, image: ?string,
     *     hostname: ?string, created: ?string, metrics: array{cpu: ?float, memory_mb: ?float, disk_mb: ?float, disk_limit_mb: ?float, network_gb: ?float, network_limit_gb: ?float}}
     */
    public function vpsInfo(Service $service): array;

    /** @param 'start'|'stop'|'reboot' $action */
    public function power(Service $service, string $action): void;

    /** @return list<array{slug: string, name: string}> */
    public function images(Service $service): array;

    /** Wipes the disk and installs $image. */
    public function reinstall(Service $service, string $image): void;

    /** A short-lived link to a browser terminal, signed in as the service's sudo user. */
    public function consoleUrl(Service $service): string;

    /** @return list<array{id: string, name: string, date: ?string, type: ?string, completed: bool, deletable: bool}> */
    public function snapshots(Service $service): array;

    public function createSnapshot(Service $service, string $name): void;

    public function restoreSnapshot(Service $service, string $snapshotId): void;

    /** @return list<array{id: string, name: string}> */
    public function resizeOptions(Service $service): array;

    public function resize(Service $service, string $profile): void;
}
