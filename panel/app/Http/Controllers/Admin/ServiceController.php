<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProvisionService;
use App\Models\ActivityLog;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        return Service::with(['client:id,name,email', 'product:id,name,module', 'server:id,name'])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('q'), function ($q, $search) {
                $q->where(function ($w) use ($search) {
                    $w->where('id', 'like', "%{$search}%")
                        ->orWhere('domain', 'like', "%{$search}%")
                        ->orWhere('remote_id', 'like', "%{$search}%")
                        ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                        ->orWhereHas('product', fn ($p) => $p->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(25);
    }

    public function show(Service $service)
    {
        return $service->load(['client:id,name', 'product:id,name,module', 'server:id,name']);
    }

    public function action(Request $request, Service $service)
    {
        $action = $request->validate(['action' => 'required|in:create,suspend,unsuspend,terminate'])['action'];

        if (in_array($service->provision_status, ['queued', 'running'], true)) {
            throw ValidationException::withMessages(['action' => 'Another action is already in progress.']);
        }

        if ($action !== 'create' && ! $service->remote_id) {
            throw ValidationException::withMessages(['action' => 'This service has no account on a server yet.']);
        }

        if ($action === 'create' && $service->status !== 'active') {
            throw ValidationException::withMessages(['action' => 'Only an active (paid) service can be provisioned.']);
        }

        $service->update(['provision_status' => 'queued']);
        ProvisionService::dispatch($service->id, $action);
        ActivityLog::record("service.{$action}.requested", $service);

        return $service;
    }

    public function credentials(Service $service)
    {
        ActivityLog::record('service.credentials.viewed', $service);

        return $service->credentials ?? [];
    }
}
