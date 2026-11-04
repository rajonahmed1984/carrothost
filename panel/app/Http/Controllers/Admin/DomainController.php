<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Domain;
use App\Services\BillingService;
use App\Support\PaymentMethods;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DomainController extends Controller
{
    public const STATUSES = ['pending', 'active', 'expired', 'grace', 'redemption', 'cancelled', 'transferred_out', 'fraud'];

    public function index(Request $request)
    {
        return Domain::with('client:id,name,email')
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('q'), function ($q, $search) {
                $q->where(function ($w) use ($search) {
                    $w->where('id', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('registrar', 'like', "%{$search}%")
                        ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(25);
    }

    public function show(Domain $domain)
    {
        return $this->detail($domain);
    }

    public function epp(Domain $domain)
    {
        ActivityLog::record('domain.epp.viewed', $domain);

        return ['epp_code' => $domain->epp_code];
    }

    public function update(Request $request, Domain $domain, BillingService $billing)
    {
        $data = $request->validate([
            'auto_renew' => 'required|boolean',
            'nameservers' => 'array|max:5',
            'nameservers.*' => ['nullable', 'string', 'max:255', 'regex:'.Domain::NAME_PATTERN],
            'reset_nameservers' => 'sometimes|boolean',
            'name' => ['sometimes', 'string', 'max:255', 'regex:'.Domain::NAME_PATTERN],
            'registrar' => ['sometimes', 'nullable', Rule::in(array_keys(config('billing.registrars')))],
            'years' => 'sometimes|integer|min:1|max:10',
            'first_payment_amount' => 'sometimes|numeric|min:0|max:9999999',
            'recurring_amount' => 'sometimes|numeric|min:0|max:9999999',
            'recalculate' => 'sometimes|boolean',
            'subscription_id' => 'sometimes|nullable|string|max:255',
            'registered_at' => 'sometimes|nullable|date',
            'expires_at' => 'sometimes|nullable|date',
            'next_due_date' => 'sometimes|nullable|date',
            'payment_method' => ['sometimes', 'nullable', 'string', Rule::in(array_keys(PaymentMethods::all($domain->payment_method)))],
            'status' => ['sometimes', Rule::in(self::STATUSES)],
            'registrar_lock' => 'sometimes|boolean',
            'dns_management' => 'sometimes|boolean',
            'email_forwarding' => 'sometimes|boolean',
            'id_protection' => 'sometimes|boolean',
        ]);

        $nameservers = ($data['reset_nameservers'] ?? false)
            ? Domain::defaultNameservers()
            : array_values(array_filter(array_map(fn ($ns) => strtolower(trim((string) $ns)), $data['nameservers'] ?? [])));
        $changes = [...collect($data)->except(['nameservers', 'reset_nameservers', 'recalculate'])->all(), 'nameservers' => $nameservers ?: null];

        if (isset($changes['name'])) {
            $changes['name'] = strtolower($changes['name']);
        }

        if ($data['recalculate'] ?? false) {
            $name = $changes['name'] ?? $domain->name;

            try {
                $tld = $billing->tldFor($name);
            } catch (\Throwable) {
                throw ValidationException::withMessages(['recurring_amount' => "No TLD price is set up for {$name}, so the amount cannot be recalculated."]);
            }
            $changes['recurring_amount'] = bcmul($tld->renew_price, (string) ($changes['years'] ?? $domain->years), 2);
        }

        $domain->update($changes);
        ActivityLog::record('domain.updated', $domain);

        return $this->detail($domain->refresh());
    }

    /** Records work an admin did at the registrar until the registrar modules are connected. */
    public function complete(Request $request, Domain $domain)
    {
        if ($domain->provision_status !== 'manual_required') {
            throw ValidationException::withMessages(['domain' => 'This domain has no fulfilment waiting.']);
        }

        $data = $request->validate(['expires_at' => 'required|date|after:today']);

        $domain->update(['status' => 'active', 'provision_status' => 'done', 'expires_at' => $data['expires_at'], 'next_due_date' => $data['expires_at']]);
        ActivityLog::record('domain.completed', $domain);

        return $domain;
    }

    private function detail(Domain $domain): array
    {
        $domain->load(['client:id,name,email', 'order:id,order_number']);

        return [
            ...$domain->toArray(),
            'has_epp_code' => $domain->epp_code !== null,
            'client_domains' => $domain->client->domains()->orderBy('name')->get(['id', 'name', 'status']),
            'reminders' => $domain->reminders()->orderByDesc('sent_on')->orderByDesc('id')->get(),
            'options' => [
                'registrars' => collect(config('billing.registrars'))->map(fn ($r, $code) => ['code' => $code, 'name' => $r['name'], 'connected' => $r['class'] !== null])->values(),
                'payment_methods' => PaymentMethods::options($domain->payment_method),
                'statuses' => self::STATUSES,
                'default_nameservers' => Domain::defaultNameservers(),
            ],
        ];
    }
}
