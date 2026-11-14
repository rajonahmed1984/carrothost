<?php

namespace App\Support;

use App\Models\Client;
use App\Models\Domain;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** The registrant contact a registrar wants, as both portals collect it. */
class DomainContact
{
    public static function validate(Request $request): array
    {
        $data = $request->validate([
            'contact.name' => 'required|string|max:255',
            'contact.company' => 'nullable|string|max:255',
            'contact.email' => 'required|email|max:255',
            'contact.address' => 'required|string|max:64',
            'contact.city' => 'required|string|max:64',
            'contact.state' => 'required|string|max:64',
            'contact.country' => 'required|string|size:2',
            'contact.zipcode' => 'required|string|max:16',
            'contact.phone_cc' => 'required|digits_between:1,3',
            'contact.phone' => 'required|string|max:20',
        ])['contact'];

        $data['phone'] = preg_replace('/\D/', '', $data['phone']);
        if (strlen($data['phone']) < 4) {
            throw ValidationException::withMessages(['contact.phone' => 'Enter the phone number without the country code.']);
        }

        return [...$data, 'company' => trim((string) ($data['company'] ?? '')) ?: 'N/A', 'country' => strtoupper($data['country'])];
    }

    /** Client profile fields a registrar needs, in form order. */
    public const PROFILE_FIELDS = [
        'name' => 'Full name',
        'email' => 'Email',
        'address' => 'Address',
        'city' => 'City',
        'state' => 'State / division',
        'postcode' => 'Postcode',
        'country' => 'Country',
        'phone' => 'Phone',
    ];

    /**
     * What the client's profile still lacks for a domain registration, as profile field => label.
     * Empty when the registrar has everything it needs.
     */
    public static function missing(Client $client): array
    {
        $c = self::defaults($client);
        $values = [
            'name' => $c['name'], 'email' => $c['email'], 'address' => $c['address'], 'city' => $c['city'],
            'state' => $c['state'], 'postcode' => $c['zipcode'], 'country' => $c['country'],
            // Without a country code the registrar cannot dial it either.
            'phone' => strlen($c['phone']) >= 4 && $c['phone_cc'] !== '' ? $c['phone'] : '',
        ];

        return array_filter(self::PROFILE_FIELDS, fn ($label, $field) => trim((string) $values[$field]) === '', ARRAY_FILTER_USE_BOTH);
    }

    /** Everything a domain in an order still needs before it can go to the registrar, as labels. */
    public static function gaps(Domain $domain): array
    {
        if (! in_array($domain->action, ['register', 'transfer'], true)) {
            return [];
        }

        $gaps = array_values(self::missing($domain->client));
        $nameservers = array_values(array_filter($domain->nameservers ?? [])) ?: Domain::defaultNameservers();
        if ($domain->action === 'register' && count($nameservers) < 2) {
            $gaps[] = 'Nameservers (at least two)';
        }

        return $gaps;
    }

    /** The client's profile in the registrar's shape, to check and complete. */
    public static function defaults(Client $client): array
    {
        $country = strtoupper((string) ($client->country ?: 'BD'));
        $raw = trim((string) $client->phone);
        $codes = ['BD' => '880', 'IN' => '91', 'PK' => '92', 'AE' => '971', 'SA' => '966', 'US' => '1', 'CA' => '1', 'GB' => '44', 'AU' => '61', 'MY' => '60', 'SG' => '65', 'NP' => '977'];

        if (preg_match('/^\+(\d{1,3})[.\s-]?(.*)$/', $raw, $m)) {
            [$cc, $phone] = [$m[1], $m[2]];
        } else {
            [$cc, $phone] = [$codes[$country] ?? '', $raw];
        }
        $phone = ltrim(preg_replace('/\D/', '', $phone), '0');

        return [
            'name' => (string) $client->name,
            'company' => (string) ($client->company ?? ''),
            'email' => (string) $client->email,
            'address' => (string) ($client->address ?? ''),
            'city' => (string) ($client->city ?? ''),
            'state' => (string) ($client->state ?: $client->city ?? ''),
            'country' => $country,
            'zipcode' => (string) ($client->postcode ?? ''),
            'phone_cc' => $cc,
            'phone' => $phone,
        ];
    }
}
