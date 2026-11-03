<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Domain;
use App\Models\Gateway;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Server;
use App\Models\Service;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function billing(): array
    {
        return [
            'today' => Payment::where('created_at', '>=', today())->sum('amount'),
            'month' => Payment::where('created_at', '>=', now()->startOfMonth())->sum('amount'),
            'year' => Payment::where('created_at', '>=', now()->startOfYear())->sum('amount'),
            'all_time' => Payment::sum('amount'),
        ];
    }

    /** One row per hour, day or month. Grouped in PHP so buckets follow the app timezone. */
    public function chart(string $range): array
    {
        $now = CarbonImmutable::now();

        [$start, $count, $step, $key, $label] = match ($range) {
            'today' => [$now->startOfDay(), 24, 'addHours', 'Y-m-d H', 'ga'],
            'year' => [$now->startOfMonth()->subMonths(11), 12, 'addMonthsNoOverflow', 'Y-m', 'M Y'],
            default => [$now->startOfDay()->subDays(29), 30, 'addDays', 'Y-m-d', 'j M'],
        };

        $rows = [];
        for ($i = 0; $i < $count; $i++) {
            $point = $start->{$step}($i);
            $rows[$point->format($key)] = ['label' => $point->format($label), 'new_orders' => 0, 'activated_orders' => 0, 'income' => 0.0];
        }

        foreach (Order::where('created_at', '>=', $start)->pluck('created_at') as $at) {
            $rows[$at->format($key)]['new_orders']++;
        }

        foreach (Invoice::whereNotNull('order_id')->where('paid_at', '>=', $start)->pluck('paid_at') as $at) {
            $rows[$at->format($key)]['activated_orders']++;
        }

        foreach (Payment::where('created_at', '>=', $start)->get(['created_at', 'amount']) as $payment) {
            $rows[$payment->created_at->format($key)]['income'] += (float) $payment->amount;
        }

        return array_values(array_filter($rows, fn ($row) => isset($row['label'])));
    }

    public function automation(): array
    {
        $today = today();
        $lastRun = ActivityLog::where('action', 'automation.run')->latest('id')->first();

        return [
            'renewal_invoices' => InvoiceItem::where('kind', 'renewal')
                ->whereHas('invoice', fn ($q) => $q->where('created_at', '>=', $today))
                ->count(),
            'suspensions' => ActivityLog::where('action', 'service.suspend')->where('created_at', '>=', $today)->count(),
            'provisioned' => ActivityLog::where('action', 'service.create')->where('created_at', '>=', $today)->count(),
            'domains_expiring' => Domain::where('status', 'active')->whereDate('expires_at', '<=', $today->copy()->addDays(30))->count(),
            'last_run' => $lastRun?->created_at?->toIso8601String(),
            'last_run_human' => $lastRun?->created_at?->diffForHumans(),
        ];
    }

    public function health(): array
    {
        $lastRun = ActivityLog::where('action', 'automation.run')->latest('id')->value('created_at');
        $failedProvisioning = Service::where('provision_status', 'failed')->count();
        $failedJobs = DB::table('failed_jobs')->count();
        $debug = (bool) config('app.debug');
        $https = str_starts_with((string) config('app.url'), 'https://');

        $checks = [
            ['label' => 'Automation (cron)', ...$this->state(
                $lastRun && now()->diffInHours($lastRun, true) <= 26,
                'critical',
                'Ran in the last 26 hours',
                $lastRun ? 'Has not run in over 26 hours' : 'Has never run. Set up the cron job',
            )],
            ['label' => 'Provisioning', ...$this->state($failedProvisioning === 0, 'critical', 'No failed services', "{$failedProvisioning} service(s) failed")],
            ['label' => 'Queue', ...$this->state($failedJobs === 0, 'warning', 'No failed jobs', "{$failedJobs} failed job(s)")],
            ['label' => 'Active server', ...$this->state(Server::where('is_active', true)->exists(), 'warning', 'At least one is active', 'No server is active')],
            ['label' => 'Payment gateway', ...$this->state(Gateway::where('is_enabled', true)->exists(), 'warning', 'At least one is enabled', 'No gateway is enabled')],
            ['label' => 'Debug mode', ...$this->state(! $debug, 'warning', 'Off', 'On. Turn off in production')],
            ['label' => 'HTTPS', ...$this->state($https, 'warning', 'APP_URL uses HTTPS', 'APP_URL does not use HTTPS')],
        ];

        $levels = array_count_values(array_column($checks, 'level'));
        $critical = $levels['critical'] ?? 0;
        $warnings = $levels['warning'] ?? 0;

        return [
            'rating' => $critical > 0 ? 'Needs Attention' : ($warnings > 0 ? 'Fair' : 'Good'),
            'passed' => $levels['ok'] ?? 0,
            'total' => count($checks),
            'warnings' => $warnings,
            'critical' => $critical,
            'checks' => $checks,
        ];
    }

    public function clientActivity(): array
    {
        return [
            'active' => Client::where('status', 'active')->count(),
            'last_hour' => Client::where('last_login_at', '>=', now()->subHour())->count(),
            'recent' => Client::whereNotNull('last_login_at')
                ->latest('last_login_at')
                ->limit(10)
                ->get(['id', 'name', 'company', 'last_login_at', 'last_login_ip'])
                ->map(fn (Client $client) => [
                    'id' => $client->id,
                    'name' => $client->company ? "{$client->name} ({$client->company})" : $client->name,
                    'ip' => $client->last_login_ip,
                    'when' => $client->last_login_at->diffForHumans(),
                ]),
        ];
    }

    public function recentActivity(): array
    {
        return ActivityLog::with('user:id,name')
            ->latest('id')
            ->limit(15)
            ->get()
            ->map(fn (ActivityLog $log) => [
                'id' => $log->id,
                'who' => $log->user?->name ?? 'System',
                'action' => $log->action,
                'when' => $log->created_at->diffForHumans(),
            ])
            ->all();
    }

    public function servers(): array
    {
        return Server::withCount(['services' => fn ($q) => $q->whereIn('status', ['active', 'suspended'])])
            ->orderBy('name')
            ->get(['id', 'name', 'module', 'hostname', 'is_active', 'max_accounts'])
            ->all();
    }

    public function pendingModuleActions(): int
    {
        return Service::whereIn('provision_status', ['failed', 'manual_required', 'awaiting_accept'])->count()
            + Domain::whereIn('provision_status', ['failed', 'manual_required'])->count();
    }

    private function state(bool $ok, string $failLevel, string $okMessage, string $failMessage): array
    {
        return ['level' => $ok ? 'ok' : $failLevel, 'message' => $ok ? $okMessage : $failMessage];
    }
}
