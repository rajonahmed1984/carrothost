<?php

namespace App\Services;

use App\Jobs\ProvisionService;
use App\Models\Domain;
use App\Models\DomainReminder;
use App\Models\Invoice;
use App\Models\Registrar;
use App\Models\Service;
use Illuminate\Support\Carbon;
use Throwable;

/**
 * The daily jobs WHMCS runs from its cron besides renewals and suspension: payment reminders,
 * overdue notices, domain expiry reminders, expiring domains, termination, usage and domain sync.
 * Each is safe to run more than once a day; nothing is sent or done twice.
 */
class AutomationService
{
    public function __construct(
        private readonly BillingService $billing,
        private readonly CustomerMailer $mailer,
        private readonly ServiceTools $tools,
        private readonly DomainRegistrar $registrar,
    ) {}

    /**
     * One reminder before the due date, then up to three overdue notices. A missed day catches up
     * with the latest notice only, so a client never gets several at once.
     */
    public function invoiceReminders(): int
    {
        $before = (int) config('billing.reminders.before_due_days');
        $overdue = array_values(array_filter(array_map('intval', (array) config('billing.reminders.overdue_days')), fn ($d) => $d > 0));
        sort($overdue);
        $today = today();
        $sent = 0;

        $invoices = Invoice::with('client', 'items')
            ->where('status', 'unpaid')
            ->where('reminder_stage', '<', 1 + count($overdue))
            ->whereDate('due_date', '<=', $today->copy()->addDays(max($before, 0))->toDateString())
            ->get();

        foreach ($invoices as $invoice) {
            if (BillingService::isPrepayment($invoice) || (float) $this->billing->balanceDue($invoice) <= 0) {
                continue;
            }

            $late = (int) $invoice->due_date->diffInDays($today, false); // negative before the due date
            $target = 0;
            if ($before > 0 && $late >= -$before && $late < 0 && $invoice->created_at->lt(now()->subDay())) {
                $target = 1; // a fresh invoice already had its "invoice created" email
            }
            foreach ($overdue as $i => $days) {
                if ($late >= $days) {
                    $target = 2 + $i;
                }
            }

            if ($target <= $invoice->reminder_stage) {
                continue;
            }

            $this->mailer->invoiceReminder($invoice, $this->billing->balanceDue($invoice));
            $invoice->forceFill(['reminder_stage' => $target, 'reminded_at' => now()])->save();
            $sent++;
        }

        return $sent;
    }

    /** Expiry reminders on the configured days before (and after) expiry, recorded in Domain Reminder History. */
    public function domainReminders(): int
    {
        $days = collect(explode(',', (string) config('billing.reminders.domain_days')))
            ->filter(fn ($d) => trim($d) !== "" && is_numeric(trim($d)))->map(fn ($d) => (int) trim($d))->unique()->sortDesc()->values();

        if ($days->isEmpty()) {
            return 0;
        }

        $today = today();
        $sent = 0;
        $domains = Domain::with('client')
            ->whereIn('status', ['active', 'expired', 'grace'])
            ->whereNotNull('expires_at')
            ->whereDate('expires_at', '<=', $today->copy()->addDays($days->max())->toDateString())
            ->whereDate('expires_at', '>=', $today->copy()->subDays(max(0, -$days->min()) + 1)->toDateString())
            ->get();

        foreach ($domains as $domain) {
            $left = (int) $today->diffInDays($domain->expires_at, false);
            // The latest threshold reached, e.g. 7 when 5 days are left with 30,14,7,1.
            $step = $days->filter(fn ($d) => $left <= $d)->min();
            if ($step === null) {
                continue;
            }

            $already = DomainReminder::where('domain_id', $domain->id)
                ->where('days_before_expiry', $step)
                ->whereDate('sent_on', '>', $domain->expires_at->copy()->subDays(max($days->max(), 0) + 30)->toDateString())
                ->exists();
            if ($already) {
                continue;
            }

            $this->mailer->domainExpiry($domain, $left);
            DomainReminder::create([
                'domain_id' => $domain->id,
                'type' => $days->search($step) + 1,
                'recipients' => $domain->client->email,
                'days_before_expiry' => $step,
                'sent_on' => $today->toDateString(),
            ]);
            $sent++;
        }

        return $sent;
    }

    /** Active domains past their expiry date become Expired, unless the registrar says otherwise on its next sync. */
    public function expireDomains(): int
    {
        return Domain::where('status', 'active')->whereNotNull('expires_at')->whereDate('expires_at', '<', today()->toDateString())->update(['status' => 'expired']);
    }

    /**
     * Ends services marked "terminate at end of cycle" on their due date, and, when turned on,
     * services left suspended for unpaid bills longer than the set days.
     */
    public function terminate(): int
    {
        $count = 0;
        $endOfCycle = Service::with('product')->whereIn('status', ['active', 'suspended'])
            ->where('terminate_end_of_cycle', true)
            ->whereDate('next_due_date', '<=', today()->toDateString())
            ->whereNotIn('provision_status', ['queued', 'running'])
            ->get();

        $overdue = collect();
        if (config('billing.termination_enabled')) {
            $overdue = Service::with('product')->where('status', 'suspended')->where('auto_suspended', true)
                ->whereDate('next_due_date', '<', today()->subDays((int) config('billing.terminate_after_days'))->toDateString())
                ->whereNotIn('provision_status', ['queued', 'running'])
                ->where(fn ($q) => $q->whereNull('override_suspend_until')->orWhereDate('override_suspend_until', '<', today()))
                ->get();
        }

        foreach ($endOfCycle->merge($overdue)->unique('id') as $service) {
            if ($service->remote_id) {
                $service->update(['provision_status' => 'queued', 'termination_date' => today()]);
                ProvisionService::dispatch($service->id, 'terminate');
            } else {
                $service->update(['status' => 'terminated', 'termination_date' => today(), 'provision_status' => 'manual_required']);
            }
            $count++;
        }

        return $count;
    }

    /** Refreshes disk, bandwidth and other usage for every active account a module can read. */
    public function updateUsage(): int
    {
        if (! config('billing.usage_update_enabled')) {
            return 0;
        }

        $count = 0;
        foreach (Service::with(['product', 'server'])->where('status', 'active')->whereNotNull('remote_id')->whereNotNull('server_id')->get() as $service) {
            if (! ServiceTools::hasTools($service)) {
                continue;
            }
            try {
                $this->tools->refreshUsage($service);
                $count++;
            } catch (Throwable) {
                // One unreachable account must not stop the rest.
            }
        }

        return $count;
    }

    /** Copies expiry, nameservers, lock and status from the registrar for domains it holds. */
    public function syncDomains(): int
    {
        return count($this->syncDomainsReport()['synced']);
    }

    /**
     * The sync with what it did to each domain, for the Domain Synchronisation Cron Report.
     *
     * @return array{enabled: bool, synced: list<array{domain: string, registrar: string, changes: list<string>}>, missing: list<array{domain: string, registrar: string}>, failed: list<array{domain: string, registrar: string, error: string}>, remaining: int}
     */
    public function syncDomainsReport(): array
    {
        $report = ['enabled' => (bool) config('billing.domain_sync_enabled'), 'synced' => [], 'missing' => [], 'failed' => [], 'remaining' => 0];
        if (! $report['enabled']) {
            return $report;
        }

        $connected = Registrar::whereNotNull('api_key')->whereNotNull('reseller_id')->pluck('code')
            ->filter(fn ($code) => config("billing.registrars.{$code}.class"));

        $due = Domain::whereIn('registrar', $connected)->whereIn('status', ['active', 'expired', 'grace', 'pending'])
            ->where(fn ($q) => $q->whereNull('registrar_synced_at')->orWhere('registrar_synced_at', '<', now()->subHours(20)));
        $domains = (clone $due)->orderBy('registrar_synced_at')->limit(self::DOMAIN_SYNC_BATCH)->get();

        foreach ($domains as $domain) {
            $row = ['domain' => $domain->name, 'registrar' => (string) $domain->registrar];
            try {
                if (! $this->registrar->orderId($domain)) {
                    $domain->forceFill(['registrar_synced_at' => now()])->save(); // not in that account; look again tomorrow
                    $report['missing'][] = $row;

                    continue;
                }

                $before = $this->syncSnapshot($domain);
                $this->registrar->syncToPanel($domain);
                $after = $this->syncSnapshot($domain);

                $changes = [];
                foreach (['expires_at' => 'Expiry date', 'next_due_date' => 'Next due date', 'status' => 'Status'] as $field => $label) {
                    if ($before[$field] !== $after[$field]) {
                        $changes[] = "{$label} ".($before[$field] ?? 'none')." → {$after[$field]}";
                    }
                }
                $report['synced'][] = [...$row, 'changes' => $changes];
            } catch (Throwable $e) {
                // Leave it for the next run.
                $report['failed'][] = [...$row, 'error' => mb_strimwidth($e->getMessage(), 0, 200, '...')];
            }
        }

        $report['remaining'] = (clone $due)->count();

        return $report;
    }

    public const DOMAIN_SYNC_BATCH = 300;

    /** @return array{expires_at: ?string, next_due_date: ?string, status: ?string} */
    private function syncSnapshot(Domain $domain): array
    {
        return [
            'expires_at' => $domain->expires_at?->toDateString(),
            'next_due_date' => $domain->next_due_date?->toDateString(),
            'status' => $domain->status,
        ];
    }

    /** Last run of each daily task, for the Automation settings page. */
    public static function lastRuns(): array
    {
        return \App\Models\ActivityLog::where('action', 'automation.run')
            ->where('created_at', '>', now()->subDays(14))
            ->latest('id')->limit(400)->get(['context', 'created_at'])
            ->groupBy(fn ($log) => $log->context['task'] ?? 'unknown')
            ->map(fn ($logs) => ['at' => Carbon::parse($logs->first()->created_at)->toISOString(), 'count' => $logs->first()->context['count'] ?? null])
            ->all();
    }
}
