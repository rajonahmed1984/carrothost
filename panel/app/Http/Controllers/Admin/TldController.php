<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Registrar;
use App\Models\RegistrarTld;
use App\Services\RegistrarTldSync;
use RuntimeException;
use App\Models\Tld;
use App\Support\Settings;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TldController extends Controller
{
    public function index()
    {
        return Tld::orderBy('sort_order')->orderBy('tld')->get();
    }

    public function lookup()
    {
        $saved = Registrar::all()->keyBy('code');

        return [
            'provider' => config('billing.domains.lookup_provider'),
            'premium_enabled' => (bool) config('billing.domains.premium_enabled'),
            'providers' => collect(config('billing.registrars'))->map(fn ($registrar, $code) => [
                'code' => $code,
                'name' => $registrar['name'],
                'configured' => (bool) $saved->get($code)?->api_key,
            ])->values(),
        ];
    }

    /** The TLDs a registrar sells with our cost, next to the price we sell each at (if we do). */
    public function registrarList(Request $request)
    {
        $code = $request->validate(['registrar' => ['required', Rule::in(array_keys(config('billing.registrars')))]])['registrar'];
        $registrar = Registrar::where('code', $code)->first();
        $ours = Tld::all()->keyBy('tld');

        return [
            'registrar' => [
                'code' => $code,
                'name' => config("billing.registrars.{$code}.name"),
                'configured' => (bool) $registrar?->api_key,
                'currency' => $registrar?->currency ?? 'USD',
                'synced_at' => $registrar?->tlds_synced_at?->toISOString(),
            ],
            'rows' => RegistrarTld::where('registrar_code', $code)->orderBy('tld')->get()->map(fn (RegistrarTld $r) => [
                'tld' => $r->tld,
                'currency' => $r->currency,
                'register_cost' => $r->register_cost,
                'renew_cost' => $r->renew_cost,
                'transfer_cost' => $r->transfer_cost,
                'ours' => ($t = $ours->get($r->tld)) ? [
                    'id' => $t->id,
                    'registrar' => $t->registrar,
                    'register_price' => $t->register_price,
                    'renew_price' => $t->renew_price,
                    'transfer_price' => $t->transfer_price,
                    'is_active' => $t->is_active,
                ] : null,
            ]),
        ];
    }

    public function registrarSync(string $code, RegistrarTldSync $sync)
    {
        abort_unless(config("billing.registrars.{$code}"), 404);
        $registrar = Registrar::where('code', $code)->first();

        if (! $registrar) {
            throw ValidationException::withMessages(['registrar' => 'Save the reseller ID and API key first.']);
        }

        try {
            $result = $sync->sync($registrar);
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['registrar' => $e->getMessage()]);
        }

        return ['message' => "Synced {$result['tlds']} TLDs from ".config("billing.registrars.{$code}.name").", {$result['priced']} with a cost price."
            .($result['removed'] ? " {$result['removed']} no longer sold were removed from the list." : '')
            .($result['source'] === 'reseller price' ? ' Prices came from the reseller price list, as the cost price list was empty.' : '')
            .($result['sample'] ? " The price list could not be read. What the registrar sent: {$result['sample']}" : '')];
    }

    public function updateLookup(Request $request)
    {
        $data = $request->validate([
            'provider' => ['nullable', Rule::in(array_keys(config('billing.registrars')))],
            'premium_enabled' => 'required|boolean',
        ]);

        if ($data['provider'] && ! Registrar::where('code', $data['provider'])->whereNotNull('api_key')->exists()) {
            throw ValidationException::withMessages(['provider' => 'Save this registrar\'s reseller ID and API key first.']);
        }

        Settings::save(['domain_lookup_provider' => $data['provider'], 'domain_premium_enabled' => $data['premium_enabled']]);
        ActivityLog::record('domain.lookup.updated', context: $data);

        return $this->lookup();
    }

    /** Saves the table as a whole: row order, registrar and the per-TLD switches. */
    public function bulkUpdate(Request $request)
    {
        $rows = $request->validate([
            'rows' => 'required|array',
            'rows.*.id' => 'required|integer|distinct|exists:tlds,id',
            'rows.*.registrar' => ['nullable', Rule::in(array_keys(config('billing.registrars')))],
            'rows.*.epp_required' => 'required|boolean',
            'rows.*.is_spotlight' => 'required|boolean',
            'rows.*.is_active' => 'required|boolean',
        ])['rows'];

        if (count(array_filter(array_column($rows, 'is_spotlight'))) > Tld::SPOTLIGHT_LIMIT) {
            throw ValidationException::withMessages(['rows' => 'Spotlight up to '.Tld::SPOTLIGHT_LIMIT.' TLDs.']);
        }

        DB::transaction(function () use ($rows) {
            foreach (array_values($rows) as $i => $row) {
                Tld::whereKey($row['id'])->update([...Arr::except($row, 'id'), 'sort_order' => $i + 1]);
            }
        });
        ActivityLog::record('tld.bulk_saved', context: ['count' => count($rows)]);

        return $this->index();
    }

    /** Sets the one-year prices of the chosen TLDs. A blank price is left as it is. */
    public function bulkPricing(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:tlds,id',
            'register_price' => 'nullable|numeric|min:0',
            'transfer_price' => 'nullable|numeric|min:0',
            'renew_price' => 'nullable|numeric|min:0',
        ]);
        $prices = array_filter(Arr::only($data, ['register_price', 'transfer_price', 'renew_price']), fn ($v) => $v !== null && $v !== '');

        if (! $prices) {
            throw ValidationException::withMessages(['register_price' => 'Enter at least one price.']);
        }

        Tld::whereIn('id', $data['ids'])->update($prices);
        ActivityLog::record('tld.bulk_priced', context: ['count' => count($data['ids']), ...$prices]);

        return $this->index();
    }

    /**
     * Adds many TLDs at once. "fixed" gives them all the same prices; "markup" prices each from
     * the registrar's synced cost (converted to BDT) plus a percentage, rounded up. TLDs already
     * on sale are left as they are, and so are TLDs the registrar has no cost for.
     */
    public function bulkAdd(Request $request)
    {
        $data = $request->validate([
            // A registrar's whole list (ResellCube sells 500+) fits in one go.
            'tlds' => 'required|array|min:1|max:2000',
            'tlds.*' => 'required|string|max:63',
            'registrar' => ['nullable', Rule::in(array_keys(config('billing.registrars')))],
            'mode' => 'required|in:fixed,markup',
            'register_price' => 'required_if:mode,fixed|nullable|numeric|min:0',
            'renew_price' => 'required_if:mode,fixed|nullable|numeric|min:0',
            'transfer_price' => 'required_if:mode,fixed|nullable|numeric|min:0',
            'markup_percent' => 'required_if:mode,markup|nullable|numeric|min:0|max:1000',
            'round_to' => 'nullable|integer|in:0,1,5,10,50,100',
            'is_active' => 'boolean',
            'epp_required' => 'boolean',
        ]);

        if ($data['mode'] === 'markup' && empty($data['registrar'])) {
            throw ValidationException::withMessages(['registrar' => 'Choose the registrar whose cost prices to mark up.']);
        }

        // ".COM", "com", " .com.bd " all become ".com" / ".com.bd"; anything else is reported back.
        $invalid = [];
        $wanted = [];
        foreach ($data['tlds'] as $raw) {
            $tld = '.'.ltrim(strtolower(trim($raw)), '.');
            if (! preg_match('/^(\.[a-z0-9-]+)+$/', $tld)) {
                $invalid[] = trim($raw);

                continue;
            }
            $wanted[$tld] = true;
        }
        $wanted = array_keys($wanted);

        $existing = Tld::whereIn('tld', $wanted)->pluck('tld')->all();
        $costs = [];
        $rate = null;
        if ($data['mode'] === 'markup') {
            $costs = RegistrarTld::where('registrar_code', $data['registrar'])->whereIn('tld', $wanted)->get()->keyBy('tld');
            $currency = Registrar::where('code', $data['registrar'])->value('currency') ?? 'USD';
            $rate = \App\Support\Currency::bdtRate($currency);
            if ($rate === null) {
                throw ValidationException::withMessages(['markup_percent' => "{$currency} costs need the USD rate. Set it in Settings > Currencies."]);
            }
        }

        $round = (int) ($data['round_to'] ?? 10);
        $price = function (?string $cost) use ($data, $rate, $round): ?string {
            if ($cost === null) {
                return null;
            }
            $bdt = (float) $cost * $rate * (1 + (float) $data['markup_percent'] / 100);

            return number_format($round > 0 ? ceil(round($bdt, 2) / $round) * $round : round($bdt, 2), 2, '.', '');
        };

        $added = [];
        $noCost = [];
        $order = (int) Tld::max('sort_order');
        DB::transaction(function () use ($wanted, $existing, $data, $costs, $price, &$added, &$noCost, &$order) {
            foreach ($wanted as $tld) {
                if (in_array($tld, $existing, true)) {
                    continue;
                }

                if ($data['mode'] === 'markup') {
                    $cost = $costs[$tld] ?? null;
                    $register = $price($cost?->register_cost);
                    if ($register === null) {
                        $noCost[] = $tld;

                        continue;
                    }
                    // A missing renew or transfer cost falls back to the register cost.
                    $prices = ['register_price' => $register, 'renew_price' => $price($cost->renew_cost) ?? $register, 'transfer_price' => $price($cost->transfer_cost) ?? $register];
                } else {
                    $prices = Arr::only($data, ['register_price', 'renew_price', 'transfer_price']);
                }

                Tld::create([
                    'tld' => $tld,
                    'registrar' => $data['registrar'] ?? null,
                    ...$prices,
                    'is_active' => $data['is_active'] ?? true,
                    'epp_required' => $data['epp_required'] ?? true,
                    'sort_order' => ++$order,
                ]);
                $added[] = $tld;
            }
        });

        ActivityLog::record('tld.bulk_added', context: ['added' => $added, 'mode' => $data['mode'], 'registrar' => $data['registrar'] ?? null]);

        $parts = [count($added).' TLD(s) added'.($added ? ': '.implode(', ', array_slice($added, 0, 20)).(count($added) > 20 ? '...' : '') : '').'.'];
        $skipped = array_values(array_intersect($wanted, $existing));
        if ($skipped) {
            $parts[] = count($skipped).' already in your pricing, left as they are: '.implode(', ', array_slice($skipped, 0, 20)).'.';
        }
        if ($noCost) {
            $parts[] = count($noCost).' have no cost price at the registrar (sync it first, or use fixed prices): '.implode(', ', array_slice($noCost, 0, 20)).'.';
        }
        if ($invalid) {
            $parts[] = 'Not a valid TLD: '.implode(', ', array_slice($invalid, 0, 20)).'.';
        }

        return ['message' => implode(' ', $parts), 'added' => $added, 'skipped' => $skipped, 'no_cost' => $noCost, 'invalid' => $invalid];
    }

    public function store(Request $request)
    {
        $tld = Tld::create([...$this->validated($request), 'sort_order' => (int) Tld::max('sort_order') + 1]);
        ActivityLog::record('tld.saved', $tld);

        return response()->json($tld, 201);
    }

    public function update(Request $request, Tld $tld)
    {
        $tld->update($this->validated($request, $tld));
        ActivityLog::record('tld.saved', $tld);

        return $tld;
    }

    public function destroy(Tld $tld)
    {
        $tld->delete();
        ActivityLog::record('tld.deleted', context: ['tld' => $tld->tld]);

        return response()->noContent();
    }

    private function validated(Request $request, ?Tld $tld = null): array
    {
        return $request->validate([
            'tld' => ['required', 'regex:/^(\.[a-z0-9-]+)+$/', Rule::unique('tlds')->ignore($tld)],
            'registrar' => ['nullable', Rule::in(array_keys(config('billing.registrars')))],
            'register_price' => 'required|numeric|min:0',
            'renew_price' => 'required|numeric|min:0',
            'transfer_price' => 'required|numeric|min:0',
            // Optional fixed USD prices; blank = the BDT price converted at the current rate.
            'register_price_usd' => 'nullable|numeric|min:0',
            'renew_price_usd' => 'nullable|numeric|min:0',
            'transfer_price_usd' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'epp_required' => 'boolean',
        ]);
    }
}
