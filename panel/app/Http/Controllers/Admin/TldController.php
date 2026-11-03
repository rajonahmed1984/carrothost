<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Registrar;
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
            'is_active' => 'boolean',
            'epp_required' => 'boolean',
        ]);
    }
}
