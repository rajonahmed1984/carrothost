<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Domain;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DomainController extends Controller
{
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
        return $domain->load('client:id,name');
    }

    public function epp(Domain $domain)
    {
        ActivityLog::record('domain.epp.viewed', $domain);

        return ['epp_code' => $domain->epp_code];
    }

    public function update(Request $request, Domain $domain)
    {
        $data = $request->validate([
            'auto_renew' => 'required|boolean',
            'nameservers' => 'array|max:5',
            'nameservers.*' => ['nullable', 'string', 'max:255', 'regex:'.Domain::NAME_PATTERN],
        ]);

        $nameservers = array_values(array_filter(array_map(fn ($ns) => strtolower(trim((string) $ns)), $data['nameservers'] ?? [])));
        $domain->update(['auto_renew' => $data['auto_renew'], 'nameservers' => $nameservers ?: null]);
        ActivityLog::record('domain.updated', $domain);

        return $domain->load('client:id,name');
    }

    /** Records work an admin did at the registrar until the registrar modules are connected. */
    public function complete(Request $request, Domain $domain)
    {
        if ($domain->provision_status !== 'manual_required') {
            throw ValidationException::withMessages(['domain' => 'This domain has no fulfilment waiting.']);
        }

        $data = $request->validate(['expires_at' => 'required|date|after:today']);

        $domain->update(['status' => 'active', 'provision_status' => 'done', 'expires_at' => $data['expires_at']]);
        ActivityLog::record('domain.completed', $domain);

        return $domain;
    }
}
