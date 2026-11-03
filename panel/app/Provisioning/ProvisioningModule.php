<?php

namespace App\Provisioning;

use App\Models\Server;
use App\Models\Service;

interface ProvisioningModule
{
    public function __construct(Server $server);

    public function testConnection(): void;

    /**
     * Packages (plans) set up on the server, for the product's plan picker.
     *
     * @return list<array{id: string, name: string}>
     */
    public function packages(): array;

    /**
     * Create the account and return its login details, including remote_id.
     *
     * @return array{remote_id: string, username: string, password: string}
     */
    public function create(Service $service): array;

    public function suspend(Service $service, string $reason): void;

    public function unsuspend(Service $service): void;

    public function terminate(Service $service): void;
}
