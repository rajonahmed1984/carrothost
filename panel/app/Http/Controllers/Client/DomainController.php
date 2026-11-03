<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Domain;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

/** The signed-in customer's own domains. */
class DomainController extends Controller
{
    private const FIELDS = ['id', 'name', 'action', 'years', 'auto_renew', 'recurring_amount', 'status', 'expires_at', 'created_at'];

    public function index(Request $request)
    {
        return $request->user('client')->domains()->latest()->get(self::FIELDS);
    }

    public function show(Request $request, int $id)
    {
        $domain = $request->user('client')->domains()->findOrFail($id);

        return [
            ...Arr::only($domain->toArray(), self::FIELDS), // toArray applies the Y-m-d date casts
            'nameservers' => $domain->nameservers ?? [],
            'invoices' => Invoice::whereHas('items', fn ($q) => $q->where('domain_id', $domain->id))
                ->where('client_id', $domain->client_id)
                ->latest()
                ->get(['id', 'number', 'status', 'currency', 'total', 'due_date']),
        ];
    }

    /** Auto renew decides whether renewal invoices are raised; turning it off lets the domain lapse at expiry. */
    public function update(Request $request, int $id)
    {
        /** @var Domain $domain */
        $domain = $request->user('client')->domains()->findOrFail($id);
        $domain->update($request->validate(['auto_renew' => 'required|boolean']));
        ActivityLog::record($domain->auto_renew ? 'domain.auto_renew_on' : 'domain.auto_renew_off', $domain, ['by' => 'client']);

        return $this->show($request, $id);
    }
}
