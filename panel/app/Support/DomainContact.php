<?php

namespace App\Support;

use App\Models\Client;
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
            'state' => (string) ($client->city ?? ''),
            'country' => $country,
            'zipcode' => '',
            'phone_cc' => $cc,
            'phone' => $phone,
        ];
    }
}
