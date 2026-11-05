<?php

namespace App\Provisioning;

/** Lets a module use the username and password an admin set on the order, else make its own. */
trait GeneratesUsername
{
    private function usernameFor(string $domain, int $serviceId): string
    {
        return AccountCredentials::username($domain, $serviceId);
    }

    /** @return array{0: string, 1: string} username and password for a new account */
    private function credentialsFor(\App\Models\Service $service): array
    {
        $given = $service->credentials;
        $username = is_string($given['username'] ?? null) && $given['username'] !== '' ? $given['username'] : $this->usernameFor((string) $service->domain, $service->id);
        $password = is_string($given['password'] ?? null) && $given['password'] !== '' ? $given['password'] : AccountCredentials::password();

        return [$username, $password];
    }
}
