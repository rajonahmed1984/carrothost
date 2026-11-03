<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Tld;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TldController extends Controller
{
    public function index()
    {
        return Tld::orderBy('tld')->get();
    }

    public function store(Request $request)
    {
        $tld = Tld::create($this->validated($request));
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
        ]);
    }
}
