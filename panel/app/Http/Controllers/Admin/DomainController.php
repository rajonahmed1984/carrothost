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
        return Domain::with('client:id,name')
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->latest()
            ->paginate(25);
    }

    public function show(Domain $domain)
    {
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
