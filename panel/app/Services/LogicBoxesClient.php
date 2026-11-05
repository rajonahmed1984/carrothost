<?php

namespace App\Services;

use App\Models\Registrar;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * LogicBoxes HTTP API access, used by StarGate/UK2 and ResellCube.
 * Lookups are GET; changes are POST. Register, transfer and renew spend the reseller
 * balance (invoice-option=NoInvoice charges it at once), so callers confirm first.
 */
class LogicBoxesClient
{
    public function __construct(private Registrar $registrar) {}

    public function balance(): array
    {
        return $this->get('billing/reseller-balance.json', ['reseller-id' => $this->registrar->reseller_id]);
    }

    /** $tld without the leading dot, e.g. com or com.bd. */
    public function isAvailable(string $sld, string $tld): bool
    {
        $result = $this->get('domains/available.json', ['domain-name' => $sld, 'tlds' => $tld]);
        // Keyed by the full domain name, e.g. {"example.com": {"status": "available"}}.
        $status = ($result["{$sld}.{$tld}"] ?? reset($result) ?: [])['status'] ?? null;

        if (! is_string($status)) {
            throw new RuntimeException('Registrar returned no availability status.');
        }

        return $status === 'available';
    }

    public function isPremium(string $domain): bool
    {
        $premium = $this->get('domains/premium-check.json', ['domain-name' => $domain])['premium'] ?? false;

        return $premium === true || $premium === 'true';
    }

    /**
     * One page of the reseller account's transactions, newest first.
     * Rows come keyed "1", "2"...; "recsindb" is the total.
     */
    public function transactions(int $page, int $perPage = 250, ?int $sinceEpoch = null): array
    {
        return $this->get('billing/reseller-transactions/search.json', array_filter([
            'no-of-records' => $perPage,
            'page-no' => $page,
            'transaction-date-start' => $sinceEpoch,
        ], fn ($v) => $v !== null));
    }

    /* ---------- Products ---------- */

    /** Product keys by category; "domorder" maps each domain product key to its TLDs. */
    public function categoryKeys(): array
    {
        return $this->get('products/category-keys-mapping.json', []);
    }

    /** What each product costs this reseller, keyed by product key, then action, then years. */
    public function resellerPrices(): array
    {
        return $this->get('products/reseller-price.json', ['reseller-id' => $this->registrar->reseller_id]);
    }

    /* ---------- Domains: lookups ---------- */

    /** The order id of a domain in this reseller account, or null when it is not there. */
    public function orderId(string $domain): ?string
    {
        try {
            $id = $this->request('get', 'domains/orderid.json', ['domain-name' => $domain]);
        } catch (RuntimeException $e) {
            if (preg_match("/not (be )?found|no entity|invalid domain|does ?n[o']t exist/i", $e->getMessage())) {
                return null;
            }

            throw $e;
        }

        return is_scalar($id) && (string) $id !== '' ? (string) $id : null;
    }

    /** Everything about one order: status, expiry, nameservers, lock, privacy, contacts and EPP code. */
    public function details(string $orderId): array
    {
        return $this->get('domains/details.json', ['order-id' => $orderId, 'options' => 'All']);
    }

    /* ---------- Domains: changes (free) ---------- */

    /** @param list<string> $nameservers */
    public function modifyNameservers(string $orderId, array $nameservers): array
    {
        return $this->post('domains/modify-ns.json', ['order-id' => $orderId, 'ns' => array_values($nameservers)]);
    }

    public function setTheftProtection(string $orderId, bool $on): array
    {
        return $this->post($on ? 'domains/enable-theft-protection.json' : 'domains/disable-theft-protection.json', ['order-id' => $orderId]);
    }

    public function setPrivacy(string $orderId, bool $on): array
    {
        return $this->post('domains/modify-privacy-protection.json', [
            'order-id' => $orderId,
            'protect-privacy' => $on ? 'true' : 'false',
            'reason' => $on ? 'Enabled by the account holder' : 'Disabled by the account holder',
        ]);
    }

    public function modifyContacts(string $orderId, string $contactId): array
    {
        return $this->post('domains/modify-contact.json', [
            'order-id' => $orderId,
            'reg-contact-id' => $contactId,
            'admin-contact-id' => $contactId,
            'tech-contact-id' => $contactId,
            'billing-contact-id' => $contactId,
        ]);
    }

    public function delete(string $orderId): array
    {
        return $this->post('domains/delete.json', ['order-id' => $orderId]);
    }

    /** .uk only: hands the domain to another registrar's IPS tag. */
    public function releaseUk(string $orderId, string $tag): array
    {
        return $this->post('domains/uk/release.json', ['order-id' => $orderId, 'new-tag' => strtoupper($tag)]);
    }

    /* ---------- Domains: changes that spend the balance ---------- */

    /** @param list<string> $nameservers */
    public function register(string $domain, int $years, array $nameservers, string $customerId, string $contactId, bool $privacy): array
    {
        return $this->post('domains/register.json', [
            'domain-name' => $domain,
            'years' => $years,
            'ns' => array_values($nameservers),
            'customer-id' => $customerId,
            'reg-contact-id' => $contactId,
            'admin-contact-id' => $contactId,
            'tech-contact-id' => $contactId,
            'billing-contact-id' => $contactId,
            'invoice-option' => 'NoInvoice',
            'protect-privacy' => $privacy ? 'true' : 'false',
        ]);
    }

    /** @param list<string> $nameservers */
    public function transfer(string $domain, string $authCode, array $nameservers, string $customerId, string $contactId, bool $privacy): array
    {
        return $this->post('domains/transfer.json', array_filter([
            'domain-name' => $domain,
            'auth-code' => $authCode,
            'ns' => $nameservers ? array_values($nameservers) : null,
            'customer-id' => $customerId,
            'reg-contact-id' => $contactId,
            'admin-contact-id' => $contactId,
            'tech-contact-id' => $contactId,
            'billing-contact-id' => $contactId,
            'invoice-option' => 'NoInvoice',
            'protect-privacy' => $privacy ? 'true' : 'false',
        ], fn ($v) => $v !== null));
    }

    /** $expiresEpoch is the current expiry from details(), which LogicBoxes checks to stop a double renewal. */
    public function renew(string $orderId, int $years, int $expiresEpoch): array
    {
        return $this->post('domains/renew.json', [
            'order-id' => $orderId,
            'years' => $years,
            'exp-date' => $expiresEpoch,
            'invoice-option' => 'NoInvoice',
        ]);
    }

    /* ---------- Customers and contacts ---------- */

    /** The customer id for this email, or null when the reseller has no such customer. */
    public function customerId(string $email): ?string
    {
        try {
            $customer = $this->get('customers/details.json', ['username' => $email]);
        } catch (RuntimeException $e) {
            if (preg_match('/not (be )?found|invalid|does not exist|no customer/i', $e->getMessage())) {
                return null;
            }

            throw $e;
        }

        $id = $customer['customerid'] ?? null;

        return $id !== null ? (string) $id : null;
    }

    /** @param array{name: string, company: string, email: string, address: string, city: string, state: string, country: string, zipcode: string, phone_cc: string, phone: string} $c */
    public function signupCustomer(array $c, string $password): string
    {
        $id = $this->request('post', 'customers/signup.json', [
            'username' => $c['email'],
            'passwd' => $password,
            'name' => $c['name'],
            'company' => $c['company'],
            'address-line-1' => $c['address'],
            'city' => $c['city'],
            'state' => $c['state'],
            'country' => $c['country'],
            'zipcode' => $c['zipcode'],
            'phone-cc' => $c['phone_cc'],
            'phone' => $c['phone'],
            'lang-pref' => 'en',
        ]);

        if (! is_scalar($id) || (string) $id === '') {
            throw new RuntimeException('The registrar did not return a customer id.');
        }

        return (string) $id;
    }

    /** @param array{name: string, company: string, email: string, address: string, city: string, state: string, country: string, zipcode: string, phone_cc: string, phone: string} $c */
    public function addContact(string $customerId, array $c): string
    {
        $id = $this->request('post', 'contacts/add.json', [
            'customer-id' => $customerId,
            'type' => 'Contact',
            'name' => $c['name'],
            'company' => $c['company'],
            'email' => $c['email'],
            'address-line-1' => $c['address'],
            'city' => $c['city'],
            'state' => $c['state'],
            'country' => $c['country'],
            'zipcode' => $c['zipcode'],
            'phone-cc' => $c['phone_cc'],
            'phone' => $c['phone'],
        ]);

        if (! is_scalar($id) || (string) $id === '') {
            throw new RuntimeException('The registrar did not return a contact id.');
        }

        return (string) $id;
    }

    /* ---------- Transport ---------- */

    private function get(string $path, array $params): array
    {
        $result = $this->request('get', $path, $params);

        if (! is_array($result)) {
            throw new RuntimeException('Registrar returned an unexpected answer.');
        }

        return $result;
    }

    private function post(string $path, array $params): array
    {
        $result = $this->request('post', $path, $params);

        return is_array($result) ? $result : ['result' => $result];
    }

    /**
     * LogicBoxes repeats a key for list values (ns=a&ns=b), which PHP's own encoding does not,
     * and answers with JSON that may be a bare number or string.
     */
    private function request(string $method, string $path, array $params): mixed
    {
        $query = $this->encode([
            'auth-userid' => $this->registrar->reseller_id,
            'api-key' => $this->registrar->api_key,
            ...$params,
        ]);

        try {
            $http = Http::withUserAgent('CarrotHostPanel/1.0')->timeout($method === 'post' ? 90 : 30);
            /** @var Response $response */
            $response = $method === 'post'
                ? $http->withBody($query, 'application/x-www-form-urlencoded')->post("https://httpapi.com/api/{$path}")
                : $http->get("https://httpapi.com/api/{$path}?{$query}");
        } catch (ConnectionException) {
            // The exception text includes the URL, and the URL carries the key.
            throw new RuntimeException('Could not reach httpapi.com.');
        }

        if ($response->status() === 403 && str_contains($response->body(), 'Cloudflare')) {
            throw new RuntimeException('httpapi.com is blocking this server\'s IP address. Ask the registrar to allow it.');
        }

        $result = $response->json();
        $failed = is_array($result) && (
            strtolower((string) ($result['status'] ?? '')) === 'error'
            || strtolower((string) ($result['actionstatus'] ?? '')) === 'failed'
        );

        if (! $response->successful() || $failed || ($result === null && trim($response->body()) !== 'null')) {
            $message = is_array($result) ? ($result['message'] ?? $result['actionstatusdesc'] ?? $result['error'] ?? null) : null;

            throw new RuntimeException($message ? "Registrar error: {$message}" : "Registrar API returned HTTP {$response->status()}.");
        }

        return $result;
    }

    private function encode(array $params): string
    {
        $parts = [];
        foreach ($params as $key => $value) {
            foreach (is_array($value) ? $value : [$value] as $item) {
                $parts[] = rawurlencode((string) $key).'='.rawurlencode(is_bool($item) ? ($item ? 'true' : 'false') : (string) $item);
            }
        }

        return implode('&', $parts);
    }
}
