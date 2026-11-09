<?php

namespace App\Services;

use Illuminate\Support\Str;
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
use App\Support\Currency;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function billing(): array
    {
        return [
            'today' => self::incomeInBase(Payment::where('created_at', '>=', today())),
            'month' => self::incomeInBase(Payment::where('created_at', '>=', now()->startOfMonth())),
            'year' => self::incomeInBase(Payment::where('created_at', '>=', now()->startOfYear())),
            'all_time' => self::incomeInBase(Payment::query()),
        ];
    }

    /** Payments added up in BDT: each currency's total at its current rate. */
    public static function incomeInBase($payments): string
    {
        return Currency::sumInBase($payments, 'amount');
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

        foreach (Payment::where('created_at', '>=', $start)->get(['created_at', 'amount', 'currency']) as $payment) {
            $rows[$payment->created_at->format($key)]['income'] += Currency::toBase($payment->amount, $payment->currency);
        }

        return array_values(array_filter($rows, fn ($row) => isset($row['label'])));
    }

    /** Daily cron tasks shown on the Automation Overview, in display order. */
    public const AUTOMATION_TASKS = ['renewals', 'suspensions', 'invoice_reminders', 'ticket_auto_close', 'domain_reminders', 'terminations'];

    /**
     * What each daily cron task did today, and per day over the last 7 days (oldest first) for the
     * sparklines. Read from the automation.run log every task writes with its count.
     */
    public function automation(): array
    {
        $days = 7;
        $start = today()->subDays($days - 1);
        $index = [];
        for ($i = 0; $i < $days; $i++) {
            $index[$start->copy()->addDays($i)->format('Y-m-d')] = $i;
        }

        $series = array_fill_keys(self::AUTOMATION_TASKS, array_fill(0, $days, 0));
        $logs = ActivityLog::where('action', 'automation.run')->where('created_at', '>=', $start)->get(['context', 'created_at']);
        foreach ($logs as $log) {
            $task = $log->context['task'] ?? null;
            $day = $index[$log->created_at->format('Y-m-d')] ?? null;
            if (isset($series[$task]) && $day !== null) {
                $series[$task][$day] += (int) ($log->context['count'] ?? 0);
            }
        }

        $lastRun = ActivityLog::where('action', 'automation.run')->latest('id')->value('created_at');

        return [
            'tasks' => collect($series)->map(fn ($counts) => ['today' => end($counts), 'series' => $counts])->all(),
            'last_run' => $lastRun?->toIso8601String(),
            'last_run_human' => $lastRun?->diffForHumans(),
            // Same window as the Automation (cron) health check.
            'stale' => ! $lastRun || now()->diffInHours($lastRun, true) > 26,
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
            [
                'label' => 'Provisioning',
                ...$this->state($failedProvisioning === 0, 'critical', 'No failed services', "{$failedProvisioning} service(s) failed"),
                // Which ones and why, so the admin can open each and Retry Create.
                'link' => $failedProvisioning ? '/admin/products-services?status=needs_action' : null,
                'items' => $failedProvisioning ? Service::where('provision_status', 'failed')->with(['client:id,name', 'product:id,name', 'server:id,name'])
                    ->latest('updated_at')->limit(5)->get()
                    ->map(fn (Service $s) => [
                        'title' => trim(($s->client?->name ?? 'Client').' · '.($s->product?->name ?? 'Service').($s->domain ? " · {$s->domain}" : '')),
                        'detail' => trim(($s->server ? "{$s->server->name}: " : '').Str::limit((string) ($s->provision_error ?: 'No error message was saved.'), 220)),
                        'link' => "/admin/products-services/{$s->id}",
                    ])->all() : [],
            ],
            [
                'label' => 'Queue',
                ...$this->state($failedJobs === 0, 'warning', 'No failed jobs', "{$failedJobs} failed job(s)"),
                'items' => $failedJobs ? DB::table('failed_jobs')->latest('id')->limit(5)->get(['payload', 'exception', 'failed_at'])
                    ->map(fn ($job) => [
                        'title' => (string) (json_decode($job->payload, true)['displayName'] ?? 'Job').' · '.$job->failed_at,
                        'detail' => Str::limit(strtok((string) $job->exception, "\n"), 220),
                        'link' => null,
                    ])->all() : [],
            ],
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

    /** Provision states that wait on an admin, counted as Pending Module Actions. */
    public const SERVICE_ACTIONS = ['failed', 'manual_required', 'awaiting_accept'];

    public const DOMAIN_ACTIONS = ['failed', 'manual_required'];

    public function pendingModuleActions(): int
    {
        return array_sum($this->pendingModuleActionsSplit());
    }

    /** @return array{services: int, domains: int} */
    public function pendingModuleActionsSplit(): array
    {
        return [
            'services' => Service::whereIn('provision_status', self::SERVICE_ACTIONS)->count(),
            'domains' => Domain::whereIn('provision_status', self::DOMAIN_ACTIONS)->count(),
        ];
    }

    private function state(bool $ok, string $failLevel, string $okMessage, string $failMessage): array
    {
        return ['level' => $ok ? 'ok' : $failLevel, 'message' => $ok ? $okMessage : $failMessage];
    }
}
