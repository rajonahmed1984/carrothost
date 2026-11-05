<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\Service;
use Illuminate\Http\Request;

/** The signed-in customer's own services. */
class ServiceController extends Controller
{
    /** Control panel login pages the customer is sent to, by module. */
    private const PANEL_PORTS = ['cpanel' => 2083, 'webuzo' => 2003];

    public function index(Request $request)
    {
        return $request->user('client')->services()
            ->with(['product:id,name,type,module,product_group_id', 'product.group:id,name', 'server:id,hostname'])
            ->latest()
            ->get()
            ->map(fn (Service $service) => $this->present($service));
    }

    public function show(Request $request, int $id)
    {
        $service = $request->user('client')->services()
            ->with(['product:id,name,type,module,description,product_group_id', 'product.group:id,name', 'server:id,hostname,ip_address,nameservers'])
            ->findOrFail($id);

        return [
            ...$this->present($service),
            'description' => $service->product->description,
            'has_password' => ! empty($service->credentials['password'] ?? null),
            // Where to point the domain: the hosting server's nameservers and IP.
            'nameservers' => collect($service->server?->nameservers ?? [])->pluck('host')->filter()->values(),
            'server_ip' => $service->server?->ip_address,
            'invoices' => Invoice::whereHas('items', fn ($q) => $q->where('service_id', $service->id))
                ->where('client_id', $service->client_id)
                ->latest()
                ->get(['id', 'number', 'status', 'currency', 'total', 'due_date']),
        ];
    }

    public function password(Request $request, int $id)
    {
        $service = $request->user('client')->services()->findOrFail($id);
        ActivityLog::record('service.credentials.viewed_by_client', $service);

        return ['password' => $service->credentials['password'] ?? null];
    }

    private function present(Service $service): array
    {
        $module = $service->product->module;
        $port = self::PANEL_PORTS[$module] ?? null;
        $live = in_array($service->status, ['active', 'suspended'], true);

        return [
            ...$service->only('id', 'domain', 'cycle', 'recurring_amount', 'status', 'created_at'),
            'next_due_date' => $service->next_due_date?->toDateString(),
            'product' => [
                'name' => $service->product->name,
                'type' => $service->product->type,
                'module' => $module,
                'group' => $service->product->group?->name,
            ],
            'username' => $live ? ($service->credentials['username'] ?? null) : null,
            // The login page only; signing in still takes the account password.
            'panel_url' => $live && $port && $service->server ? "https://{$service->server->hostname}:{$port}" : null,
        ];
    }
}
