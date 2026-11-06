<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Domain;
use App\Models\Registrar;
use App\Services\BillingService;
use App\Services\DomainRegistrar;
use App\Support\PaymentMethods;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use App\Support\DomainContact;

class DomainController extends Controller
{
    public const STATUSES = ['pending', 'active', 'expired', 'grace', 'redemption', 'cancelled', 'transferred_out', 'fraud'];

    public function index(Request $request)
    {
        return Domain::with('client:id,name,email')
            // "needs_action" is the dashboard's Pending Module Actions: failed or waiting for an admin.
            ->when($request->query('status'), fn ($q, $status) => $status === 'needs_action'
                ? $q->whereIn('provision_status', \App\Services\DashboardService::DOMAIN_ACTIONS)
                : $q->where('status', $status))
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

    /** ?source=registrar fetches the current code from the registrar (and keeps it); otherwise the stored one. */
    public function epp(Request $request, Domain $domain, DomainRegistrar $registrar)
    {
        if ($request->query('source') === 'registrar') {
            $code = $this->atRegistrar(fn () => $registrar->eppCode($domain));
            ActivityLog::record('domain.epp.viewed', $domain, ['source' => 'registrar']);

            return ['epp_code' => $code, 'source' => 'registrar'];
        }

        ActivityLog::record('domain.epp.viewed', $domain);

        return ['epp_code' => $domain->epp_code, 'source' => 'panel'];
    }

    /** What the registrar holds for the domain. Read-only. */
    public function registrarInfo(Domain $domain, DomainRegistrar $registrar)
    {
        return [
            ...$this->atRegistrar(fn () => $registrar->info($domain)),
            'contact_defaults' => DomainContact::defaults($domain->client),
        ];
    }

    /** Copies expiry, nameservers, lock, privacy and the EPP code from the registrar into the panel. */
    public function registrarSync(Domain $domain, DomainRegistrar $registrar)
    {
        $info = $this->atRegistrar(fn () => $registrar->syncToPanel($domain));

        return ['message' => 'Synced from the registrar.'.($info['expires_at'] ? " Expires {$info['expires_at']}." : ''), 'domain' => $this->detail($domain->refresh())];
    }

    /** register, transfer, renew, contacts, delete, release, privacy, lock. */
    public function registrarCommand(Request $request, Domain $domain, string $command, DomainRegistrar $registrar)
    {
        $message = match ($command) {
            'register' => $this->atRegistrar(fn () => $registrar->register($domain, DomainContact::validate($request), $request->validate(['years' => 'required|integer|min:1|max:10'])['years']))['message'],
            'transfer' => $this->atRegistrar(fn () => $registrar->transfer($domain, DomainContact::validate($request), $request->validate(['auth_code' => 'required|string|max:255'])['auth_code']))['message'],
            'renew' => $this->atRegistrar(fn () => $registrar->renew($domain, $request->validate(['years' => 'required|integer|min:1|max:10'])['years']))['message'],
            'contacts' => $this->atRegistrar(fn () => $registrar->setContacts($domain, DomainContact::validate($request))) ?? 'Contact details updated at the registrar. Some TLDs email the registrant to approve an owner change.',
            'delete' => $this->atRegistrar(fn () => $registrar->requestDelete($domain)) ?? 'Delete requested at the registrar.',
            'release' => $this->atRegistrar(fn () => $registrar->releaseUk($domain, $request->validate(['tag' => 'required|string|max:32|alpha_dash'])['tag'])) ?? 'Released to the new tag.',
            'privacy' => $this->toggle($request, $domain, 'id_protection', fn (bool $on) => $registrar->setPrivacy($domain, $on), 'ID protection'),
            'lock' => $this->toggle($request, $domain, 'registrar_lock', fn (bool $on) => $registrar->setLock($domain, $on), 'Registrar lock'),
            default => abort(404),
        };

        return ['message' => $message, 'domain' => $this->detail($domain->refresh())];
    }

    public function update(Request $request, Domain $domain, BillingService $billing, DomainRegistrar $registrar)
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
            $changes['recurring_amount'] = bcmul($tld->priceIn('renew', $domain->client->currencyCode()), (string) ($changes['years'] ?? $domain->years), 2);
        }

        $this->pushToRegistrar($domain, $changes, $registrar);

        // A different name or registrar means a different registrar order.
        if ((isset($changes['name']) && $changes['name'] !== $domain->name) || (array_key_exists('registrar', $changes) && $changes['registrar'] !== $domain->registrar)) {
            $changes += ['registrar_order_id' => null, 'registrar_synced_at' => null];
        }

        $domain->forceFill($changes)->save();
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

    /**
     * For a domain linked to its registrar order, nameserver, lock and privacy changes are made there
     * first; if the registrar refuses, nothing is saved. Unlinked domains change in the panel only.
     */
    private function pushToRegistrar(Domain $domain, array $changes, DomainRegistrar $registrar): void
    {
        if (! $domain->registrar_order_id || (array_key_exists('registrar', $changes) && $changes['registrar'] !== $domain->registrar)) {
            return;
        }

        $nameservers = $changes['nameservers'] ?? [];
        if ($nameservers && $nameservers !== array_values(array_filter($domain->nameservers ?? []))) {
            $this->atRegistrar(fn () => $registrar->setNameservers($domain, $nameservers), 'nameservers');
        }
        if (isset($changes['registrar_lock']) && (bool) $changes['registrar_lock'] !== $domain->registrar_lock) {
            $this->atRegistrar(fn () => $registrar->setLock($domain, (bool) $changes['registrar_lock']), 'registrar_lock');
        }
        if (isset($changes['id_protection']) && (bool) $changes['id_protection'] !== $domain->id_protection) {
            $this->atRegistrar(fn () => $registrar->setPrivacy($domain, (bool) $changes['id_protection']), 'id_protection');
        }
    }

    private function toggle(Request $request, Domain $domain, string $field, callable $send, string $name): string
    {
        $on = (bool) $request->validate(['on' => 'required|boolean'])['on'];
        $this->atRegistrar(fn () => $send($on));
        $domain->forceFill([$field => $on])->save();

        return "{$name} turned ".($on ? 'on' : 'off').' at the registrar.';
    }

    /** Runs a registrar call and turns its failure into a form error. */
    private function atRegistrar(callable $call, string $field = 'registrar'): mixed
    {
        try {
            return $call();
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages([$field => $e->getMessage()]);
        }
    }

    private function detail(Domain $domain): array
    {
        $domain->load(['client:id,name,email', 'order:id,order_number']);

        return [
            ...$domain->toArray(),
            'has_epp_code' => $domain->epp_code !== null,
            'linked' => $domain->registrar_order_id !== null,
            'registrar_synced_at' => $domain->registrar_synced_at?->toISOString(),
            'client_domains' => $domain->client->domains()->orderBy('name')->get(['id', 'name', 'status']),
            'reminders' => $domain->reminders()->orderByDesc('sent_on')->orderByDesc('id')->get(),
            'options' => [
                'registrars' => collect(config('billing.registrars'))->map(fn ($r, $code) => ['code' => $code, 'name' => $r['name'], 'connected' => $r['class'] !== null && Registrar::where('code', $code)->whereNotNull('api_key')->exists()])->values(),
                'payment_methods' => PaymentMethods::options($domain->payment_method),
                'statuses' => self::STATUSES,
                'default_nameservers' => Domain::defaultNameservers(),
            ],
        ];
    }
}
