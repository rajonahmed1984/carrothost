<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\Tld;
use App\Services\BillingService;
use App\Services\DomainLookup;
use App\Support\Currency;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Read-only domain data for the marketing site: the TLD price list and an availability check.
 * Nothing here needs a login and nothing can place an order; ordering happens in the client portal.
 */
class PublicDomainController extends Controller
{
    public function tlds(Request $request)
    {
        $options = config('billing.domains');
        $currency = in_array($request->query('currency'), Currency::SUPPORTED, true) ? $request->query('currency') : Currency::default();

        $tlds = ($options['allow_register'] || $options['allow_transfer'])
            ? Tld::where('is_active', true)->orderBy('sort_order')->orderBy('tld')->get()
                ->map(fn (Tld $t) => [
                    'tld' => $t->tld,
                    'is_spotlight' => (bool) $t->is_spotlight,
                    'register_price' => $t->priceIn('register', $currency),
                    'renew_price' => $t->priceIn('renew', $currency),
                    'transfer_price' => $t->priceIn('transfer', $currency),
                ])->values()
            : [];

        return response()->json(['currency' => $currency, 'tlds' => $tlds], 200, ['Cache-Control' => 'public, max-age=300']);
    }

    public function lookup(Request $request, DomainLookup $lookup, BillingService $billing)
    {
        $data = $request->validate(['name' => ['required', 'regex:'.Domain::NAME_PATTERN]]);
        $name = strtolower($data['name']);

        // An extension we do not sell is a normal answer for a search box, not an error.
        try {
            $billing->tldFor($name);
        } catch (ValidationException) {
            return ['domain' => $name, 'status' => 'unsupported'];
        }

        return $lookup->check($name);
    }
}
