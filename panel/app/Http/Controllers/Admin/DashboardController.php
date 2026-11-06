<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Service;
use App\Services\DashboardService;
use App\Support\Currency;

class DashboardController extends Controller
{
    public function __invoke(DashboardService $dashboard)
    {
        return [
            'currency' => Currency::BASE,
            'overdue_invoices' => Invoice::where('status', 'unpaid')->whereDate('due_date', '<', today())->count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'suspended_services' => Service::where('status', 'suspended')->count(),
            'pending_module_actions' => $dashboard->pendingModuleActions(),
            'billing' => $dashboard->billing(),
            'charts' => [
                'today' => $dashboard->chart('today'),
                'month' => $dashboard->chart('month'),
                'year' => $dashboard->chart('year'),
            ],
            'automation' => $dashboard->automation(),
            'health' => $dashboard->health(),
            'client_activity' => $dashboard->clientActivity(),
            'activity' => $dashboard->recentActivity(),
            'servers' => $dashboard->servers(),
            'attention' => [
                'services' => Service::with('client:id,name', 'product:id,name')
                    ->whereIn('provision_status', ['failed', 'manual_required', 'awaiting_accept'])->latest()->limit(10)->get(),
                'domains' => Domain::with('client:id,name')
                    ->whereIn('provision_status', ['failed', 'manual_required'])->latest()->limit(10)->get(),
            ],
        ];
    }

    public function activity()
    {
        return ActivityLog::latest('id')->paginate(50);
    }

    public function meta()
    {
        $names = fn (string $key) => collect(config("billing.{$key}"))
            ->map(fn ($item, $code) => ['code' => $code, 'name' => $item['name'], 'connected' => (bool) $item['class']])
            ->values();

        return [
            'currency' => Currency::BASE,
            'default_currency' => Currency::default(),
            'usd_rate' => Currency::bdtRate('USD'),
            'cycles' => array_keys(config('billing.cycles')),
            'modules' => $names('provisioning_modules'),
            'registrars' => $names('registrars'),
            'ticket_departments' => config('billing.ticket_departments'),
        ];
    }
}
