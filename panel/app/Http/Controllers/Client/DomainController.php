<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Domain;
use App\Models\Invoice;
use App\Services\BillingService;
use App\Services\DomainRegistrar;
use App\Services\LogicBoxesClient;
use App\Support\DomainContact;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/** The signed-in customer's own domains, and the changes they can make at the registrar themselves. */
class DomainController extends Controller
{
    private const FIELDS = ['id', 'name', 'action', 'years', 'auto_renew', 'recurring_amount', 'status', 'expires_at', 'created_at'];

    /** What the customer sees in a domain's activity, and how it reads. */
    private const ACTIVITY = [
        'domain.auto_renew_on' => 'Auto renew turned on',
        'domain.auto_renew_off' => 'Auto renew turned off',
        'domain.registrar.nameservers' => 'Nameservers changed',
        'domain.registrar.locked' => 'Registrar lock turned on',
        'domain.registrar.unlocked' => 'Registrar lock turned off',
        'domain.registrar.privacy_on' => 'ID protection turned on',
        'domain.registrar.privacy_off' => 'ID protection turned off',
        'domain.registrar.contacts' => 'Contact details updated',
        'domain.registrar.renewed' => 'Renewed at the registrar',
        'domain.registrar.transfer_requested' => 'Transfer requested',
        'domain.epp.viewed' => 'EPP code viewed',
        'domain.epp.viewed_by_client' => 'EPP code viewed',
        'domain.dns.added' => 'DNS record added',
        'domain.dns.deleted' => 'DNS record deleted',
        'domain.renewal_requested' => 'Renewal invoice created',
        'domain.auth_code_updated' => 'Transfer auth code updated',
    ];

    public function index(Request $request)
    {
        return $request->user('client')->domains()->latest()->get(self::FIELDS);
    }

    public function show(Request $request, int $id)
    {
        $domain = $this->own($request, $id);
        $renewal = $this->unpaidRenewal($domain);

        return [
            ...Arr::only($domain->toArray(), self::FIELDS), // toArray applies the Y-m-d date casts
            'registered_at' => $domain->registered_at?->toDateString(),
            'next_due_date' => $domain->next_due_date?->toDateString(),
            'nameservers' => $domain->nameservers ?? [],
            'default_nameservers' => Domain::defaultNameservers(),
            'registrar_lock' => (bool) $domain->registrar_lock,
            'id_protection' => (bool) $domain->id_protection,
            'provision_status' => $domain->provision_status,
            // Lock, privacy, contacts, EPP and DNS go to the registrar, so they need the domain there.
            'manageable' => $this->manageable($domain),
            'synced_at' => $domain->registrar_synced_at?->toIso8601String(),
            'can_renew' => in_array($domain->status, ['active', 'grace', 'expired'], true) && $domain->expires_at !== null && ! $renewal,
            'renewal_invoice' => $renewal?->only('id', 'number', 'total', 'currency'),
            'awaiting_transfer' => $domain->action === 'transfer' && $domain->status === 'pending',
            'has_auth_code' => $domain->epp_code !== null,
            'invoices' => Invoice::whereHas('items', fn ($q) => $q->where('domain_id', $domain->id))
                ->where('client_id', $domain->client_id)
                ->latest()
                ->get(['id', 'number', 'status', 'currency', 'total', 'due_date']),
            'activity' => ActivityLog::where('subject_type', $domain->getMorphClass())->where('subject_id', $domain->id)
                ->whereIn('action', array_keys(self::ACTIVITY))
                ->latest('id')->limit(25)->get()
                ->map(fn (ActivityLog $log) => [
                    'id' => $log->id,
                    'title' => self::ACTIVITY[$log->action],
                    'by' => $log->user_id ? 'Our team' : 'You',
                    'at' => $log->created_at?->toIso8601String(),
                ]),
        ];
    }

    /** Auto renew decides whether renewal invoices are raised; turning it off lets the domain lapse at expiry. */
    public function update(Request $request, int $id)
    {
        $domain = $this->own($request, $id);
        $domain->update($request->validate(['auto_renew' => 'required|boolean']));
        ActivityLog::record($domain->auto_renew ? 'domain.auto_renew_on' : 'domain.auto_renew_off', $domain, ['by' => 'client']);

        return $this->show($request, $id);
    }

    /* ---------- At the registrar ---------- */

    /** What the registrar holds right now. A registrar that cannot be reached is reported, not raised. */
    public function registrar(Request $request, int $id, DomainRegistrar $registrar)
    {
        $domain = $this->own($request, $id);
        $defaults = DomainContact::defaults($domain->client);

        if (! $this->manageable($domain)) {
            return ['available' => false, 'message' => 'Live registrar details appear once the domain is active.', 'contact_defaults' => $defaults];
        }

        try {
            $info = $registrar->info($domain);
        } catch (RuntimeException $e) {
            return ['available' => false, 'message' => 'The registrar could not be reached right now. Try again in a few minutes.', 'contact_defaults' => $defaults];
        }

        return [
            'available' => $info['found'],
            'message' => $info['found'] ? null : 'This domain was not found at the registrar. Contact support.',
            ...Arr::only($info, ['status', 'statuses', 'expires_at', 'nameservers', 'locked', 'privacy', 'privacy_allowed', 'contact']),
            'contact_defaults' => $defaults,
        ];
    }

    public function nameservers(Request $request, int $id, DomainRegistrar $registrar)
    {
        $domain = $this->own($request, $id);
        $data = $request->validate([
            'reset' => 'sometimes|boolean',
            'nameservers' => 'required_unless:reset,true,1|array|max:5',
            'nameservers.*' => ['nullable', 'string', 'max:255', 'regex:'.Domain::NAME_PATTERN],
        ], ['nameservers.*.regex' => 'Enter a hostname like ns1.example.com.']);

        $list = ($data['reset'] ?? false)
            ? Domain::defaultNameservers()
            : array_values(array_unique(array_filter(array_map(fn ($ns) => strtolower(trim((string) $ns)), $data['nameservers'] ?? []))));

        if (count($list) < 2) {
            throw ValidationException::withMessages(['nameservers' => 'Enter at least two nameservers.']);
        }

        // A domain not yet at the registrar keeps them for its registration or transfer.
        if ($this->manageable($domain)) {
            $this->atRegistrar(fn () => $registrar->setNameservers($domain, $list), 'nameservers');
        } elseif (! in_array($domain->status, ['pending'], true)) {
            throw ValidationException::withMessages(['nameservers' => 'Nameservers can only be changed on an active domain.']);
        }

        $domain->forceFill(['nameservers' => $list])->save();

        return $this->show($request, $id);
    }

    public function lock(Request $request, int $id, DomainRegistrar $registrar)
    {
        $domain = $this->managed($request, $id);
        $on = (bool) $request->validate(['on' => 'required|boolean'])['on'];
        $this->atRegistrar(fn () => $registrar->setLock($domain, $on));
        $domain->forceFill(['registrar_lock' => $on])->save();

        return $this->show($request, $id);
    }

    public function privacy(Request $request, int $id, DomainRegistrar $registrar)
    {
        $domain = $this->managed($request, $id);
        $on = (bool) $request->validate(['on' => 'required|boolean'])['on'];
        $this->atRegistrar(fn () => $registrar->setPrivacy($domain, $on));
        $domain->forceFill(['id_protection' => $on])->save();

        return $this->show($request, $id);
    }

    /** The EPP (auth) code, to move the domain to another registrar. */
    public function epp(Request $request, int $id, DomainRegistrar $registrar)
    {
        $domain = $this->managed($request, $id);
        $code = $this->atRegistrar(fn () => $registrar->eppCode($domain)) ?? $domain->epp_code;
        ActivityLog::record('domain.epp.viewed_by_client', $domain);

        if (! $code) {
            throw ValidationException::withMessages(['registrar' => 'The registrar has no EPP code for this domain. Some extensions (like .bd) send it by email instead; contact support.']);
        }

        return ['epp_code' => $code];
    }

    public function contacts(Request $request, int $id, DomainRegistrar $registrar)
    {
        $domain = $this->managed($request, $id);
        $contact = DomainContact::validate($request);
        $this->atRegistrar(fn () => $registrar->setContacts($domain, $contact));

        return ['message' => 'Contact details updated. Some extensions email the registrant to approve an owner change.'];
    }

    /* ---------- DNS records ---------- */

    public function dns(Request $request, int $id, DomainRegistrar $registrar)
    {
        $domain = $this->managed($request, $id);

        return ['records' => $this->atRegistrar(fn () => $registrar->dnsRecords($domain))];
    }

    public function dnsStore(Request $request, int $id, DomainRegistrar $registrar)
    {
        $domain = $this->managed($request, $id);
        $record = $this->record($request, adding: true);
        $this->atRegistrar(fn () => $registrar->addDnsRecord($domain, $record));

        return ['records' => $this->atRegistrar(fn () => $registrar->dnsRecords($domain))];
    }

    public function dnsDestroy(Request $request, int $id, DomainRegistrar $registrar)
    {
        $domain = $this->managed($request, $id);
        $record = $this->record($request, adding: false);
        $this->atRegistrar(fn () => $registrar->deleteDnsRecord($domain, $record));

        return ['records' => $this->atRegistrar(fn () => $registrar->dnsRecords($domain))];
    }

    /* ---------- Renew and transfer ---------- */

    /** Raises the renewal invoice now; paying it renews the domain. An unpaid one is reused. */
    public function renew(Request $request, int $id, BillingService $billing)
    {
        $domain = $this->own($request, $id);

        if (! in_array($domain->status, ['active', 'grace', 'expired'], true) || ! $domain->expires_at) {
            throw ValidationException::withMessages(['domain' => 'This domain cannot be renewed here. Contact support.']);
        }

        $invoice = $this->unpaidRenewal($domain) ?? $billing->createInvoice($domain->client, [[
            'description' => "Domain renewal: {$domain->name} ({$domain->years} yr)",
            'amount' => $domain->recurring_amount,
            'kind' => 'renewal',
            'domain_id' => $domain->id,
        ]], today());

        // The daily renewal run then skips this term instead of raising a second invoice.
        $domain->forceFill(['renewal_invoiced_for' => $domain->expires_at])->save();
        ActivityLog::record('domain.renewal_requested', $domain, ['invoice_id' => $invoice->id]);

        return ['invoice_id' => $invoice->id, 'message' => "Invoice {$invoice->number} is ready. The domain is renewed for {$domain->years} year(s) once it is paid."];
    }

    /** For a transfer still waiting: the auth code from the current registrar. */
    public function authCode(Request $request, int $id)
    {
        $domain = $this->own($request, $id);

        if ($domain->action !== 'transfer' || $domain->status !== 'pending') {
            throw ValidationException::withMessages(['auth_code' => 'Only a pending transfer takes an auth code.']);
        }

        $domain->forceFill(['epp_code' => $request->validate(['auth_code' => 'required|string|min:4|max:255'])['auth_code']])->save();
        ActivityLog::record('domain.auth_code_updated', $domain);

        return $this->show($request, $id);
    }

    /* ---------- Helpers ---------- */

    private function own(Request $request, int $id): Domain
    {
        return $request->user('client')->domains()->with('client')->findOrFail($id);
    }

    /** An active domain this panel can change at its registrar. */
    private function managed(Request $request, int $id): Domain
    {
        $domain = $this->own($request, $id);

        if (! $this->manageable($domain)) {
            throw ValidationException::withMessages(['registrar' => 'This can only be changed once the domain is active at the registrar.']);
        }

        return $domain;
    }

    private function manageable(Domain $domain): bool
    {
        return in_array($domain->status, ['active', 'grace'], true) && $domain->registrar && config("billing.registrars.{$domain->registrar}");
    }

    private function unpaidRenewal(Domain $domain): ?Invoice
    {
        return Invoice::where('client_id', $domain->client_id)->where('status', 'unpaid')
            ->whereHas('items', fn ($q) => $q->where('domain_id', $domain->id)->where('kind', 'renewal'))
            ->latest('id')->first();
    }

    private function record(Request $request, bool $adding): array
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(array_keys(LogicBoxesClient::DNS_TYPES))],
            'host' => ['nullable', 'string', 'max:253', 'regex:/^(@|\*|(\*\.)?[a-z0-9_]([a-z0-9_-]*[a-z0-9_])?(\.[a-z0-9_]([a-z0-9_-]*[a-z0-9_])?)*)$/i'],
            'value' => 'required|string|max:1000',
            'ttl' => $adding ? 'nullable|integer|between:300,86400' : 'nullable',
            'priority' => $adding ? 'nullable|integer|between:0,65535' : 'nullable',
        ], ['host.regex' => 'Use a name like www, mail or @ for the domain itself.']);

        $host = strtolower(trim((string) ($data['host'] ?? '')));
        $value = trim($data['value']);
        $valid = match ($data['type']) {
            'A' => filter_var($value, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false,
            'AAAA' => filter_var($value, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false,
            'CNAME', 'MX' => (bool) preg_match(Domain::NAME_PATTERN, rtrim($value, '.')),
            default => true,
        };
        if (! $valid) {
            throw ValidationException::withMessages(['value' => match ($data['type']) {
                'A' => 'Enter an IPv4 address, like 203.0.113.10.',
                'AAAA' => 'Enter an IPv6 address.',
                default => 'Enter a hostname, like mail.example.com.',
            }]);
        }

        return [
            'type' => $data['type'],
            'host' => $host === '@' ? '' : $host,
            'value' => in_array($data['type'], ['CNAME', 'MX'], true) ? strtolower(rtrim($value, '.')) : $value,
            'ttl' => (int) ($data['ttl'] ?? 14400),
            'priority' => isset($data['priority']) ? (int) $data['priority'] : null,
        ];
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
}
