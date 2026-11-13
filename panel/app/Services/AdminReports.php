<?php

namespace App\Services;

use App\Mail\AdminReport;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Ticket;
use App\Models\User;
use App\Support\Currency;
use App\Support\MailFrom;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * The daily admin email the panel sends from its cron at midnight: what the daily jobs did
 * yesterday, plus what the midnight domain sync changed.
 */
class AdminReports
{
    /** Daily task key => label, in the order they run. */
    public const TASKS = [
        'renewals' => 'Renewal invoices created',
        'domain_expiry' => 'Domains marked expired',
        'suspensions' => 'Services suspended',
        'terminations' => 'Services terminated',
        'ticket_auto_close' => 'Tickets auto-closed',
        'domain_sync' => 'Domains synced with registrars',
        'usage' => 'Service usage updated',
        'enforce_suspensions' => 'Suspensions applied on servers',
        'invoice_reminders' => 'Payment reminders sent',
        'domain_reminders' => 'Domain renewal notices sent',
    ];

    /** @return list<string> */
    public static function parseRecipients(?string $value): array
    {
        return collect(preg_split('/[\s,;]+/', (string) $value))->map(fn ($e) => trim($e))->filter()->unique()->values()->all();
    }

    /** The saved recipients, or every admin when none are saved. */
    public function recipients(): array
    {
        $saved = self::parseRecipients(config('billing.reports.recipients'));

        return $saved ?: User::where('is_admin', true)->where('is_active', true)->where('role', 'admin')->pluck('email')->filter()->unique()->values()->all();
    }

    /** Where domains:sync leaves its result for the daily report. */
    public const DOMAIN_SYNC_CACHE = 'reports.domain_sync';

    /** Keeps the sync result until the midnight report picks it up. */
    public static function rememberDomainSync(array $report): void
    {
        Cache::put(self::DOMAIN_SYNC_CACHE, [...$report, 'ran_at' => now()->toISOString()], now()->addDays(2));
    }

    /** The daily report for the given day (default: yesterday). False when it could not be sent. */
    public function sendCronActivity(?Carbon $day = null, bool $withActivity = true): bool
    {
        $from = ($day ?? today()->subDay())->copy()->startOfDay();
        $to = $from->copy()->endOfDay();

        return $this->send($this->cronActivity($from, $to, $withActivity));
    }

    public function cronActivity(Carbon $from, Carbon $to, bool $withActivity = true): AdminReport
    {
        $sync = $this->domainSyncSections($to);
        if (! $withActivity) {
            return $this->report($from, $sync['notes'], $sync['sections']);
        }

        $logs = ActivityLog::whereIn('action', ['automation.run', 'automation.failed'])
            ->whereBetween('created_at', [$from, $to])->orderBy('id')->get(['action', 'context', 'created_at']);
        $runs = $logs->where('action', 'automation.run')->groupBy(fn ($log) => $log->context['task'] ?? 'unknown');
        $failures = $logs->where('action', 'automation.failed');

        $tasks = [];
        $notes = [];
        foreach (self::TASKS as $task => $label) {
            $taskRuns = $runs->get($task);
            if (! $taskRuns) {
                $tasks[] = [$label, '—', 'Did not run'];
                $notes[] = "{$label}: this task did not run.";

                continue;
            }
            $tasks[] = [$label, (string) $taskRuns->sum(fn ($log) => (int) ($log->context['count'] ?? 0)), 'Last run '.$taskRuns->last()->created_at->format('H:i')];
        }

        $beat = Cache::get('scheduler.heartbeat');
        if (! $beat || Carbon::parse($beat)->lt(now()->subMinutes(10))) {
            array_unshift($notes, 'Cron looks stopped: the scheduler has not run '.($beat ? 'since '.Carbon::parse($beat)->format('d M Y H:i') : 'yet').'. Check the cron job on the server.');
        }

        // In BDT: USD invoices and payments count at the current rate.
        $money = fn ($amount) => Currency::BASE.' '.number_format((float) $amount, 2);
        $created = Invoice::whereBetween('created_at', [$from, $to]);
        $paid = Payment::whereBetween('created_at', [$from, $to])->where('amount', '>', 0);

        $billing = [
            ['Invoices created', (string) (clone $created)->count(), $money(Currency::sumInBase($created, 'total'))],
            ['Payments received', (string) (clone $paid)->count(), $money(Currency::sumInBase($paid, 'amount'))],
            ['New orders', (string) Order::whereBetween('created_at', [$from, $to])->count(), ''],
            ['New clients', (string) Client::whereBetween('created_at', [$from, $to])->count(), ''],
            ['New support tickets', (string) Ticket::whereBetween('created_at', [$from, $to])->count(), ''],
            ['Unpaid overdue invoices now', (string) Invoice::where('status', 'unpaid')->whereDate('due_date', '<', today())->count(), ''],
        ];

        $failed = $failures->map(fn ($log) => [
            self::TASKS[$log->context['task'] ?? ''] ?? (string) ($log->context['task'] ?? 'Unknown task'),
            $log->created_at->format('H:i'),
            (string) ($log->context['error'] ?? ''),
        ])->values()->all();

        return $this->report($from, [...$notes, ...$sync['notes']], [
            ['title' => 'Daily Tasks', 'columns' => ['Task', 'Count', 'Status'], 'rows' => $tasks],
            ['title' => 'Errors', 'columns' => ['Task', 'Time', 'Error'], 'rows' => $failed, 'empty' => 'No task failed.'],
            ['title' => 'Billing and Activity', 'columns' => ['', 'Count', 'Amount'], 'rows' => $billing],
            ...$sync['sections'],
        ]);
    }

    private function report(Carbon $from, array $notes, array $sections): AdminReport
    {
        return new AdminReport(
            subjectLine: 'Cron Job Activity & Domain Sync Report',
            heading: 'Cron Job Activity & Domain Sync Report',
            period: 'Daily automation summary for '.$from->format('l, d F Y').' ('.config('app.timezone').')',
            notes: $notes,
            sections: $sections,
            url: url('/admin'),
        );
    }

    /**
     * The midnight domain sync's part of the report: the run that finished after the reported day.
     *
     * @return array{notes: list<string>, sections: list<array>}
     */
    private function domainSyncSections(Carbon $dayEnd): array
    {
        if (! config('billing.reports.domain_sync') || ! config('billing.domain_sync_enabled')) {
            return ['notes' => [], 'sections' => []];
        }

        $report = Cache::get(self::DOMAIN_SYNC_CACHE);
        if (! is_array($report) || ! isset($report['ran_at']) || Carbon::parse($report['ran_at'])->lte($dayEnd)) {
            return ['notes' => ['Domain sync: the midnight sync had not run when this report was made.'], 'sections' => []];
        }

        return $this->domainSync($report);
    }

    /** @return array{notes: list<string>, sections: list<array>} */
    public function domainSync(array $report): array
    {
        $changed = collect($report['synced'])->filter(fn ($row) => $row['changes'] !== []);
        $unchanged = collect($report['synced'])->filter(fn ($row) => $row['changes'] === []);

        $notes = [];
        if ($report['remaining'] > 0) {
            $notes[] = "Domain sync: {$report['remaining']} domain(s) still need a sync. They are picked up on the next run (up to ".AutomationService::DOMAIN_SYNC_BATCH.' a day).';
        }

        $ranAt = isset($report['ran_at']) ? Carbon::parse($report['ran_at'])->timezone(config('app.timezone'))->format('d M Y H:i') : '';

        return ['notes' => $notes, 'sections' => [
            [
                'title' => 'Domain Synchronisation'.($ranAt ? " (run at {$ranAt})" : ''),
                'columns' => ['', 'Count'],
                'rows' => [
                    ['Domains synced', (string) count($report['synced'])],
                    ['Updated', (string) $changed->count()],
                    ['Already in sync', (string) $unchanged->count()],
                    ['Failed', (string) count($report['failed'])],
                    ['Not found at the registrar', (string) count($report['missing'])],
                ],
            ],
            [
                'title' => 'Domains Updated',
                'columns' => ['Domain', 'Registrar', 'Changes'],
                'rows' => $changed->map(fn ($row) => [$row['domain'], $row['registrar'], implode('; ', $row['changes'])])->values()->all(),
                'empty' => 'No domain needed an update.',
            ],
            [
                'title' => 'Domain Sync Errors',
                'columns' => ['Domain', 'Registrar', 'Error'],
                'rows' => collect($report['failed'])->map(fn ($row) => [$row['domain'], $row['registrar'], $row['error']])->all(),
                'empty' => 'No errors.',
            ],
            [
                'title' => 'Domains Not Found at the Registrar',
                'columns' => ['Domain', 'Registrar'],
                'rows' => collect($report['missing'])->map(fn ($row) => [$row['domain'], $row['registrar']])->all(),
                'empty' => 'Every domain was found.',
            ],
            [
                'title' => 'Domains Already in Sync',
                'columns' => ['Domain', 'Registrar'],
                'rows' => $unchanged->map(fn ($row) => [$row['domain'], $row['registrar']])->values()->all(),
                'empty' => 'None.',
            ],
        ]];
    }

    private function send(AdminReport $mail): bool
    {
        $to = $this->recipients();
        if ($to === []) {
            return false;
        }

        try {
            Mail::to($to)->send($mail);

            return true;
        } catch (Throwable $e) {
            Log::warning("Could not send the {$mail->heading} email: ".$e->getMessage());

            return false;
        }
    }
}
