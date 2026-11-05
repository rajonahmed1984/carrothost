<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Registrar;
use App\Models\RegistrarCharge;
use App\Models\RegistrarDeposit;
use App\Services\LogicBoxesClient;
use App\Services\RegistrarLedger;
use App\Services\RegistrarSync;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class RegistrarController extends Controller
{
    public function index(RegistrarLedger $ledger)
    {
        $saved = Registrar::all()->keyBy('code');

        return collect(config('billing.registrars'))->map(fn ($registrar, $code) => [
            'code' => $code,
            'name' => $registrar['name'],
            'reseller_id' => $saved->get($code)?->reseller_id,
            'has_api_key' => (bool) $saved->get($code)?->api_key,
            'currency' => $saved->get($code)?->currency ?? 'USD',
            'last_synced_at' => $saved->get($code)?->last_synced_at?->toISOString(),
            'sync_error' => $saved->get($code)?->sync_error,
            'connection_ok' => $saved->get($code)?->connection_ok,
            'connection_error' => $saved->get($code)?->connection_error,
            'connection_checked_at' => $saved->get($code)?->connection_checked_at?->toISOString(),
            'wallet' => $ledger->ledger($code)['wallet'],
        ])->values();
    }

    /** Sales, cost and profit of domains by month: GET registrars/profit?from=2026-01&to=2026-11&registrar=resellcube */
    public function profit(Request $request, RegistrarLedger $ledger)
    {
        $data = $request->validate([
            'from' => 'required|date_format:Y-m',
            'to' => 'required|date_format:Y-m|after_or_equal:from',
            'registrar' => ['nullable', Rule::in(array_keys(config('billing.registrars')))],
        ]);
        $from = CarbonImmutable::createFromFormat('Y-m-d', "{$data['from']}-01");
        $to = CarbonImmutable::createFromFormat('Y-m-d', "{$data['to']}-01");

        if ($from->diffInMonths($to) > 60) {
            throw ValidationException::withMessages(['from' => 'Choose at most five years.']);
        }

        return $ledger->report($from, $to, $data['registrar'] ?? null);
    }

    /** Deposits and charges, newest first, each charge with its BDT cost. */
    public function ledger(string $code, RegistrarLedger $ledger)
    {
        $this->known($code);
        $book = $ledger->ledger($code);

        return [
            'wallet' => $book['wallet'],
            'deposits' => RegistrarDeposit::where('registrar_code', $code)->latest('paid_on')->latest('id')->get()
                ->map(fn ($d) => [...$d->toArray(), 'rate' => round($d->rate(), 4)]),
            'charges' => RegistrarCharge::with('domain:id,name,client_id')->where('registrar_code', $code)->latest('charged_at')->latest('id')->limit(1000)->get()
                ->map(fn ($c) => [...$c->toArray(), 'cost_bdt' => $book['costs'][$c->id]['cost_bdt'] ?? 0, 'unfunded' => $book['costs'][$c->id]['unfunded'] ?? false]),
        ];
    }

    public function storeDeposit(Request $request, string $code, RegistrarLedger $ledger)
    {
        $this->known($code);
        $data = $request->validate([
            'paid_on' => 'required|date|before_or_equal:today',
            'method' => ['required', Rule::in(RegistrarDeposit::METHODS)],
            'amount_bdt' => 'required|numeric|min:0.01|max:999999999',
            'fee_bdt' => 'nullable|numeric|min:0|max:999999999',
            'credited' => 'required|numeric|min:0.01|max:999999999',
            'reference' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:255',
        ]);
        $deposit = RegistrarDeposit::create([...$data, 'registrar_code' => $code, 'fee_bdt' => $data['fee_bdt'] ?? 0]);
        ActivityLog::record('registrar.deposit_added', context: ['registrar' => $code, 'amount_bdt' => $deposit->amount_bdt, 'credited' => $deposit->credited]);

        return $this->ledger($code, $ledger);
    }

    public function destroyDeposit(string $code, RegistrarDeposit $deposit, RegistrarLedger $ledger)
    {
        abort_unless($deposit->registrar_code === $code, 404);
        $deposit->delete();
        ActivityLog::record('registrar.deposit_deleted', context: ['registrar' => $code, 'amount_bdt' => $deposit->amount_bdt]);

        return $this->ledger($code, $ledger);
    }

    /** A charge entered by hand, for when the registrar cannot be synced. */
    public function storeCharge(Request $request, string $code, RegistrarLedger $ledger)
    {
        $this->known($code);
        $data = $this->chargeFields($request, true);
        RegistrarCharge::create([...$data, 'registrar_code' => $code, 'source' => 'manual']);
        ActivityLog::record('registrar.charge_added', context: ['registrar' => $code, 'amount' => $data['amount']]);

        return $this->ledger($code, $ledger);
    }

    /** Fix the domain or action of any charge; a manual charge can also change its amount and date. */
    public function updateCharge(Request $request, string $code, RegistrarCharge $charge, RegistrarLedger $ledger)
    {
        abort_unless($charge->registrar_code === $code, 404);
        $data = $this->chargeFields($request, $charge->source === 'manual');
        $charge->update($data);

        return $this->ledger($code, $ledger);
    }

    public function destroyCharge(string $code, RegistrarCharge $charge, RegistrarLedger $ledger)
    {
        abort_unless($charge->registrar_code === $code, 404);
        if ($charge->source === 'sync') {
            throw ValidationException::withMessages(['charge' => 'A synced charge comes back on the next sync. Change its domain instead.']);
        }
        $charge->delete();

        return $this->ledger($code, $ledger);
    }

    public function sync(string $code, RegistrarSync $sync)
    {
        $this->known($code);
        $registrar = Registrar::where('code', $code)->first();

        if (! $registrar) {
            throw ValidationException::withMessages(['registrar' => 'Save the reseller ID and API key first.']);
        }

        try {
            $result = $sync->sync($registrar);
        } catch (Throwable $e) {
            throw ValidationException::withMessages(['registrar' => $e->getMessage()]);
        }

        $message = $result['fetched'] === 0
            ? 'Connected, but the registrar returned no transactions for this account'.($result['since'] ? ' since '.$result['since'] : '').'.'
            : "Synced: {$result['fetched']} transaction(s) read, {$result['added']} new charge(s) added.";

        if ($result['skipped_receipts']) {
            $message .= " {$result['skipped_receipts']} top-up(s) skipped; record those as deposits with their BDT cost.";
        }
        if ($result['unreadable']) {
            $message .= " {$result['unreadable']} row(s) could not be read (fields: {$result['sample_fields']}). They were written to the log.";
        }

        return ['message' => $message];
    }

    private function chargeFields(Request $request, bool $money): array
    {
        return $request->validate([
            'domain_id' => 'nullable|integer|exists:domains,id',
            'action' => ['required', Rule::in(RegistrarCharge::ACTIONS)],
            ...$money ? [
                'type' => 'required|in:debit,credit',
                'charged_at' => 'required|date|before_or_equal:today',
                'amount' => 'required|numeric|min:0.01|max:999999999',
                'description' => 'nullable|string|max:255',
            ] : [],
        ]);
    }

    private function known(string $code): void
    {
        abort_unless(config("billing.registrars.{$code}"), 404);
    }

    public function update(Request $request, string $code)
    {
        abort_unless(config("billing.registrars.{$code}"), 404);

        $data = $request->validate([
            'reseller_id' => 'required|string|max:32',
            'api_key' => 'nullable|string|max:255',
            'currency' => 'sometimes|in:BDT,USD',
        ]);

        // A blank key on edit means "keep the current one".
        if (empty($data['api_key'])) {
            unset($data['api_key']);
        }

        $registrar = Registrar::firstOrNew(['code' => $code])->fill($data);

        // New login details: the last test no longer says anything about this account.
        if ($registrar->isDirty(['reseller_id', 'api_key'])) {
            $registrar->forceFill(['connection_ok' => null, 'connection_error' => null, 'connection_checked_at' => null]);
        }

        $registrar->save();
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
            $registrar->markConnection(true);

            return ['ok' => true, 'message' => 'Connection succeeded.'];
        } catch (Throwable $e) {
            $registrar->markConnection(false, $e->getMessage());

            return ['ok' => false, 'message' => $e->getMessage()];
        }
    }
}
