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
 * The admin emails the panel sends from its cron: the daily Cron Job Activity report
 * and the Domain Synchronisation Cron Report.
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

    /** What the daily jobs did in the given day (default: yesterday). False when it could not be sent. */
    public function sendCronActivity(?Carbon $day = null): bool
    {
        $from = ($day ?? today()->subDay())->copy()->startOfDay();
        $to = $from->copy()->endOfDay();

        return $this->send($this->cronActivity($from, $to));
    }

    public function cronActivity(Carbon $from, Carbon $to): AdminReport
    {
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

        return new AdminReport(
            subjectLine: config('app.name').' Cron Job Activity',
            heading: 'Cron Job Activity',
            period: 'Daily automation summary for '.$from->format('l, d F Y').' ('.config('app.timezone').')',
            notes: $notes,
            sections: [
                ['title' => 'Daily Tasks', 'columns' => ['Task', 'Count', 'Status'], 'rows' => $tasks],
                ['title' => 'Errors', 'columns' => ['Task', 'Time', 'Error'], 'rows' => $failed, 'empty' => 'No task failed.'],
                ['title' => 'Billing and Activity', 'columns' => ['', 'Count', 'Amount'], 'rows' => $billing],
            ],
            url: url('/admin'),
        );
    }

    /** @param array{enabled: bool, synced: list<array>, missing: list<array>, failed: list<array>, remaining: int} $report */
    public function sendDomainSync(array $report): bool
    {
        if (! $report['enabled']) {
            return false;
        }

        return $this->send($this->domainSync($report));
    }

    public function domainSync(array $report): AdminReport
    {
        $changed = collect($report['synced'])->filter(fn ($row) => $row['changes'] !== []);
        $unchanged = count($report['synced']) - $changed->count();

        $notes = [];
        if ($report['remaining'] > 0) {
            $notes[] = "{$report['remaining']} domain(s) still need a sync. They are picked up on the next run (up to ".AutomationService::DOMAIN_SYNC_BATCH.' a day).';
        }

        return new AdminReport(
            subjectLine: config('app.name').' Domain Synchronisation Cron Report',
            heading: 'Domain Synchronisation Cron Report',
            period: 'Run at '.now()->format('d F Y H:i').' ('.config('app.timezone').'). '
                .count($report['synced']).' synced, '.$changed->count().' updated, '.$unchanged.' already in sync, '
                .count($report['failed']).' failed, '.count($report['missing']).' not found at the registrar.',
            notes: $notes,
            sections: [
                [
                    'title' => 'Updated',
                    'columns' => ['Domain', 'Registrar', 'Changes'],
                    'rows' => $changed->map(fn ($row) => [$row['domain'], $row['registrar'], implode('; ', $row['changes'])])->values()->all(),
                    'empty' => 'No domain needed an update.',
                ],
                [
                    'title' => 'Errors',
                    'columns' => ['Domain', 'Registrar', 'Error'],
                    'rows' => collect($report['failed'])->map(fn ($row) => [$row['domain'], $row['registrar'], $row['error']])->all(),
                    'empty' => 'No errors.',
                ],
                [
                    'title' => 'Not Found at the Registrar',
                    'columns' => ['Domain', 'Registrar'],
                    'rows' => collect($report['missing'])->map(fn ($row) => [$row['domain'], $row['registrar']])->all(),
                    'empty' => 'Every domain was found.',
                ],
                [
                    'title' => 'Already in Sync',
                    'columns' => ['Domain', 'Registrar'],
                    'rows' => collect($report['synced'])->filter(fn ($row) => $row['changes'] === [])->map(fn ($row) => [$row['domain'], $row['registrar']])->values()->all(),
                    'empty' => 'None.',
                ],
            ],
            url: url('/admin/domain-registrations'),
        );
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
