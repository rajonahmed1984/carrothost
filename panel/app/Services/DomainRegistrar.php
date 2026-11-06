<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Domain;
use App\Models\Registrar;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * One domain's work at its LogicBoxes registrar (ResellCube or StarGate/UK2).
 * Lookups never change anything; the money-spending calls are register, transfer and renew.
 */
class DomainRegistrar
{
    public function client(Domain $domain): LogicBoxesClient
    {
        if (! $domain->registrar || ! config("billing.registrars.{$domain->registrar}")) {
            throw new RuntimeException('Choose a registrar for this domain and save first.');
        }

        $registrar = Registrar::where('code', $domain->registrar)->first();

        if (! $registrar?->api_key || ! $registrar->reseller_id) {
            throw new RuntimeException('Save the '.config("billing.registrars.{$domain->registrar}.name").' reseller ID and API key in Settings > Domain Registrars first.');
        }

        return new LogicBoxesClient($registrar);
    }

    /** The registrar order id, looked up by name once and then kept. Null when the domain is not in this account. */
    public function orderId(Domain $domain, bool $fresh = false): ?string
    {
        if ($domain->registrar_order_id && ! $fresh) {
            return $domain->registrar_order_id;
        }

        $id = $this->client($domain)->orderId($domain->name);
        $domain->forceFill(['registrar_order_id' => $id])->save();

        return $id;
    }

    public function requireOrderId(Domain $domain): string
    {
        return $this->orderId($domain) ?? throw new RuntimeException("{$domain->name} is not in this {$this->registrarName($domain)} account.");
    }

    /**
     * What the registrar holds for the domain, in the panel's terms.
     *
     * @return array{found: bool, order_id: ?string, status: ?string, statuses: list<string>, expires_at: ?string, registered_at: ?string, nameservers: list<string>, locked: bool, privacy: bool, privacy_allowed: bool, has_epp_code: bool, contact: ?array}
     */
    public function info(Domain $domain): array
    {
        $orderId = $this->orderId($domain, fresh: ! $domain->registrar_order_id);

        if (! $orderId) {
            return ['found' => false, 'order_id' => null, 'status' => null, 'statuses' => [], 'expires_at' => null, 'registered_at' => null, 'nameservers' => [], 'locked' => false, 'privacy' => false, 'privacy_allowed' => false, 'has_epp_code' => false, 'contact' => null];
        }

        return $this->normalize($this->client($domain)->details($orderId), $orderId);
    }

    /** Copies the registrar's expiry, nameservers, lock, privacy and EPP code into the panel. */
    public function syncToPanel(Domain $domain): array
    {
        $orderId = $this->requireOrderId($domain);
        $raw = $this->client($domain)->details($orderId);
        $info = $this->normalize($raw, $orderId);

        $changes = array_filter([
            'expires_at' => $info['expires_at'],
            'registered_at' => $info['registered_at'],
            'nameservers' => $info['nameservers'] ?: null,
            'registrar_lock' => $info['locked'],
            'id_protection' => $info['privacy'],
        ], fn ($v) => $v !== null);

        if (! empty($raw['domsecret'])) {
            $changes['epp_code'] = (string) $raw['domsecret'];
        }
        // The panel follows the registrar's expiry; the next invoice follows it unless it was set further out.
        if ($info['expires_at'] && (! $domain->next_due_date || $domain->next_due_date->toDateString() < $info['expires_at'])) {
            $changes['next_due_date'] = $info['expires_at'];
        }
        if ($info['status'] === 'active' && in_array($domain->status, ['pending', 'expired'], true)) {
            $changes['status'] = 'active';
        }

        $domain->forceFill([...$changes, 'registrar_synced_at' => now()])->save();
        ActivityLog::record('domain.registrar.synced', $domain, ['expires_at' => $info['expires_at']]);

        return $info;
    }

    /** The EPP code from the registrar. It is also kept in the panel, encrypted. */
    public function eppCode(Domain $domain): ?string
    {
        $raw = $this->client($domain)->details($this->requireOrderId($domain));
        $code = isset($raw['domsecret']) && $raw['domsecret'] !== '' ? (string) $raw['domsecret'] : null;

        if ($code) {
            $domain->forceFill(['epp_code' => $code])->save();
        }

        return $code;
    }

    /* ---------- Free changes ---------- */

    /** @param list<string> $nameservers */
    public function setNameservers(Domain $domain, array $nameservers): void
    {
        if (count($nameservers) < 2) {
            throw new RuntimeException('The registrar needs at least two nameservers.');
        }

        $this->client($domain)->modifyNameservers($this->requireOrderId($domain), $nameservers);
        ActivityLog::record('domain.registrar.nameservers', $domain, ['nameservers' => $nameservers]);
    }

    public function setLock(Domain $domain, bool $on): void
    {
        $this->client($domain)->setTheftProtection($this->requireOrderId($domain), $on);
        ActivityLog::record($on ? 'domain.registrar.locked' : 'domain.registrar.unlocked', $domain);
    }

    public function setPrivacy(Domain $domain, bool $on): void
    {
        $this->client($domain)->setPrivacy($this->requireOrderId($domain), $on);
        ActivityLog::record($on ? 'domain.registrar.privacy_on' : 'domain.registrar.privacy_off', $domain);
    }

    /** Points all four contacts at a new contact made from $contact. */
    public function setContacts(Domain $domain, array $contact): void
    {
        $orderId = $this->requireOrderId($domain);
        $client = $this->client($domain);
        $contactId = $client->addContact($this->customerFor($client, $contact), $contact);
        $client->modifyContacts($orderId, $contactId);
        ActivityLog::record('domain.registrar.contacts', $domain, ['contact_id' => $contactId]);
    }

    /* ---------- DNS records ---------- */

    /** @return list<array{type: string, host: string, value: string, ttl: int, priority: ?int}> */
    public function dnsRecords(Domain $domain): array
    {
        $client = $this->client($domain);
        $client->activateDns($this->requireOrderId($domain));

        return collect(array_keys(LogicBoxesClient::DNS_TYPES))
            ->flatMap(fn (string $type) => $client->dnsRecords($domain->name, $type))
            ->values()->all();
    }

    public function addDnsRecord(Domain $domain, array $record): void
    {
        $client = $this->client($domain);
        $client->activateDns($this->requireOrderId($domain));
        $client->addDnsRecord($domain->name, $record['type'], $record['host'], $record['value'], $record['ttl'], $record['priority'] ?? null);
        ActivityLog::record('domain.dns.added', $domain, ['type' => $record['type'], 'host' => $record['host'], 'value' => $record['value']]);
    }

    public function deleteDnsRecord(Domain $domain, array $record): void
    {
        $this->client($domain)->deleteDnsRecord($domain->name, $record['type'], $record['host'], $record['value']);
        ActivityLog::record('domain.dns.deleted', $domain, ['type' => $record['type'], 'host' => $record['host'], 'value' => $record['value']]);
    }

    public function requestDelete(Domain $domain): void
    {
        $this->client($domain)->delete($this->requireOrderId($domain));
        $domain->update(['status' => 'cancelled']);
        ActivityLog::record('domain.registrar.deleted', $domain);
    }

    public function releaseUk(Domain $domain, string $tag): void
    {
        if (! str_ends_with($domain->name, '.uk')) {
            throw new RuntimeException('Release only applies to .uk domains.');
        }

        $this->client($domain)->releaseUk($this->requireOrderId($domain), $tag);
        $domain->update(['status' => 'transferred_out']);
        ActivityLog::record('domain.registrar.released', $domain, ['tag' => strtoupper($tag)]);
    }

    /* ---------- Changes that spend the registrar balance ---------- */

    public function register(Domain $domain, array $contact, int $years): array
    {
        $client = $this->client($domain);

        if ($this->orderId($domain, fresh: true)) {
            throw new RuntimeException("{$domain->name} is already in this {$this->registrarName($domain)} account. Use Sync instead.");
        }

        $contactId = $client->addContact($customerId = $this->customerFor($client, $contact), $contact);
        $result = $client->register($domain->name, $years, $this->nameserversFor($domain), $customerId, $contactId, $domain->id_protection);
        ActivityLog::record('domain.registrar.registered', $domain, ['years' => $years, 'result' => $result]);

        return $this->afterOrder($domain, $result, $years);
    }

    public function transfer(Domain $domain, array $contact, string $authCode): array
    {
        $client = $this->client($domain);

        if ($this->orderId($domain, fresh: true)) {
            throw new RuntimeException("{$domain->name} is already in this {$this->registrarName($domain)} account.");
        }

        $contactId = $client->addContact($customerId = $this->customerFor($client, $contact), $contact);
        $nameservers = array_values(array_filter($domain->nameservers ?? []));
        $result = $client->transfer($domain->name, $authCode, count($nameservers) >= 2 ? $nameservers : [], $customerId, $contactId, $domain->id_protection);
        $domain->forceFill(['epp_code' => $authCode])->save();
        ActivityLog::record('domain.registrar.transfer_requested', $domain, ['result' => $result]);

        // A transfer finishes days later; the domain stays pending until a sync sees it active.
        $orderId = isset($result['entityid']) ? (string) $result['entityid'] : $this->orderId($domain, fresh: true);
        $domain->forceFill(['registrar_order_id' => $orderId, 'provision_status' => 'done', 'action' => 'transfer'])->save();

        return ['message' => 'Transfer requested. It completes once the current registrar releases it, usually within 5-7 days. Sync later to pick up the new expiry.'];
    }

    public function renew(Domain $domain, int $years): array
    {
        $orderId = $this->requireOrderId($domain);
        $client = $this->client($domain);
        $before = $client->details($orderId);
        $endtime = (int) ($before['endtime'] ?? 0);

        if ($endtime <= 0) {
            throw new RuntimeException('The registrar did not return the current expiry, so the renewal was not sent.');
        }

        $result = $client->renew($orderId, $years, $endtime);
        ActivityLog::record('domain.registrar.renewed', $domain, ['years' => $years, 'result' => $result]);

        $info = $this->syncToPanel($domain->refresh());
        $domain->update(['provision_status' => 'done']);

        return ['message' => 'Renewed for '.$years.' year(s). New expiry: '.($info['expires_at'] ?? 'see registrar').'.'];
    }

    /* ---------- Helpers ---------- */

    private function afterOrder(Domain $domain, array $result, int $years): array
    {
        $orderId = isset($result['entityid']) ? (string) $result['entityid'] : $this->orderId($domain, fresh: true);
        $domain->forceFill(['registrar_order_id' => $orderId, 'status' => 'active', 'provision_status' => 'done', 'years' => $years])->save();

        try {
            $info = $this->syncToPanel($domain->refresh());
        } catch (RuntimeException) {
            $info = ['expires_at' => null];
        }

        return ['message' => "Registered {$domain->name} for {$years} year(s).".($info['expires_at'] ? " Expires {$info['expires_at']}." : ' Sync in a minute to pick up the expiry.')];
    }

    /** The reseller's customer for this email, signed up on first use. */
    private function customerFor(LogicBoxesClient $client, array $contact): string
    {
        return $client->customerId($contact['email'])
            ?? $client->signupCustomer($contact, Str::password(14, symbols: false).'a1A');
    }

    /** @return list<string> */
    private function nameserversFor(Domain $domain): array
    {
        $nameservers = array_values(array_filter($domain->nameservers ?? [])) ?: Domain::defaultNameservers();

        if (count($nameservers) < 2) {
            throw new RuntimeException('Set at least two nameservers on the domain, or defaults in Settings > Domains, first.');
        }

        return $nameservers;
    }

    private function registrarName(Domain $domain): string
    {
        return (string) config("billing.registrars.{$domain->registrar}.name");
    }

    private function normalize(array $raw, string $orderId): array
    {
        $statuses = collect(is_array($raw['orderstatus'] ?? null) ? $raw['orderstatus'] : [])->map(fn ($s) => strtolower((string) $s))->values()->all();
        $nameservers = collect(range(1, 13))->map(fn ($i) => $raw["ns{$i}"] ?? null)->filter()->map(fn ($ns) => strtolower((string) $ns))->values()->all();
        $date = fn ($epoch) => is_numeric($epoch) && (int) $epoch > 0 ? CarbonImmutable::createFromTimestamp((int) $epoch)->toDateString() : null;
        $bool = fn ($v) => $v === true || $v === 'true' || $v === 1 || $v === '1';
        $contact = is_array($raw['registrantcontact'] ?? null) ? $raw['registrantcontact'] : null;

        return [
            'found' => true,
            'order_id' => $orderId,
            'status' => isset($raw['currentstatus']) ? strtolower((string) $raw['currentstatus']) : null,
            'statuses' => $statuses,
            'expires_at' => $date($raw['endtime'] ?? null),
            'registered_at' => $date($raw['creationtime'] ?? null),
            'nameservers' => $nameservers,
            'locked' => in_array('transferlock', $statuses, true),
            'privacy' => $bool($raw['isprivacyprotected'] ?? false),
            'privacy_allowed' => $bool($raw['privacyprotectedallowed'] ?? true),
            'has_epp_code' => ! empty($raw['domsecret']),
            'contact' => $contact ? [
                'name' => $contact['name'] ?? null,
                'company' => $contact['company'] ?? null,
                'email' => $contact['emailaddr'] ?? null,
                'country' => $contact['country'] ?? null,
            ] : null,
        ];
    }
}
