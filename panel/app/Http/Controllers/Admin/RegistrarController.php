<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Registrar;
use App\Services\LogicBoxesClient;
use Illuminate\Http\Request;
use Throwable;

class RegistrarController extends Controller
{
    public function index()
    {
        $saved = Registrar::all()->keyBy('code');

        return collect(config('billing.registrars'))->map(fn ($registrar, $code) => [
            'code' => $code,
            'name' => $registrar['name'],
            'reseller_id' => $saved->get($code)?->reseller_id,
            'has_api_key' => (bool) $saved->get($code)?->api_key,
        ])->values();
    }

    public function update(Request $request, string $code)
    {
        abort_unless(config("billing.registrars.{$code}"), 404);

        $data = $request->validate([
            'reseller_id' => 'required|string|max:32',
            'api_key' => 'nullable|string|max:255',
        ]);

        // A blank key on edit means "keep the current one".
        if (empty($data['api_key'])) {
            unset($data['api_key']);
        }

        $registrar = Registrar::updateOrCreate(['code' => $code], $data);
        ActivityLog::record('registrar.updated', $registrar);

        return ['ok' => true];
    }

    public function test(string $code)
    {
        $registrar = Registrar::where('code', $code)->first();

        if (! $registrar?->api_key) {
            return ['ok' => false, 'message' => 'Save the reseller ID and API key first.'];
        }

        try {
            (new LogicBoxesClient($registrar))->balance();

            return ['ok' => true, 'message' => 'Connection succeeded.'];
        } catch (Throwable $e) {
            return ['ok' => false, 'message' => $e->getMessage()];
        }
    }
}
