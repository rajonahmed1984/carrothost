<?php

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\RenewalService;
use App\Services\TicketService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('billing:renewals', function (RenewalService $renewals) {
    try {
        $count = $renewals->generateInvoices();
    } catch (Throwable $e) {
        ActivityLog::record('automation.failed', context: ['task' => 'renewals', 'error' => mb_strimwidth($e->getMessage(), 0, 300, '...')]);

        throw $e;
    }
    ActivityLog::record('automation.run', context: ['task' => 'renewals', 'count' => $count]);
    $this->info($count.' renewal invoice(s) created.');
})->purpose('Raise invoices for services and domains coming due');

Artisan::command('billing:suspend-overdue', function (RenewalService $renewals) {
    try {
        $count = $renewals->suspendOverdue();
    } catch (Throwable $e) {
        ActivityLog::record('automation.failed', context: ['task' => 'suspensions', 'error' => mb_strimwidth($e->getMessage(), 0, 300, '...')]);

        throw $e;
    }
    ActivityLog::record('automation.run', context: ['task' => 'suspensions', 'count' => $count]);
    $this->info($count.' service(s) sent for suspension.');
})->purpose('Suspend services whose invoices are past the grace period');

Artisan::command('tickets:auto-close', function (TicketService $tickets) {
    try {
        $count = $tickets->autoClose();
    } catch (Throwable $e) {
        ActivityLog::record('automation.failed', context: ['task' => 'ticket_auto_close', 'error' => mb_strimwidth($e->getMessage(), 0, 300, '...')]);

        throw $e;
    }
    ActivityLog::record('automation.run', context: ['task' => 'ticket_auto_close', 'count' => $count]);
    $this->info($count.' ticket(s) closed.');
})->purpose('Close answered tickets the customer has not replied to');

Artisan::command('panel:make-admin {email} {name}', function (string $email, string $name) {
    $password = $this->secret('Password (at least 12 characters)');

    if (strlen((string) $password) < 12) {
        $this->error('Password must be at least 12 characters.');

        return 1;
    }

    $user = User::firstOrNew(['email' => $email]);
    $user->name = $name;
    $user->password = $password;
    $user->is_admin = true;
    $user->save();

    $this->info("Admin {$email} is ready.");
})->purpose('Create or update a panel admin');

Artisan::command('registrars:sync', function (App\Services\RegistrarSync $sync) {
    foreach (App\Models\Registrar::whereNotNull('api_key')->get() as $registrar) {
        try {
            $result = $sync->sync($registrar);
            $this->info("{$registrar->code}: {$result['added']} new charge(s)");
        } catch (Throwable $e) {
            $this->warn("{$registrar->code}: {$e->getMessage()}");
        }
    }
})->purpose('Copy registrar account transactions so domain costs and profit stay current');

Artisan::command('registrars:sync-tlds', function (App\Services\RegistrarTldSync $sync) {
    foreach (App\Models\Registrar::whereNotNull('api_key')->whereNotNull('reseller_id')->get() as $registrar) {
        if (! config("billing.registrars.{$registrar->code}")) {
            continue;
        }
        try {
            $result = $sync->sync($registrar);
            $this->info("{$registrar->code}: {$result['tlds']} TLDs, {$result['priced']} priced");
        } catch (Throwable $e) {
            $this->warn("{$registrar->code}: {$e->getMessage()}");
        }
    }
})->purpose('Refresh what each TLD costs at the registrars; domain profit uses it when no charge was synced');

// The daily jobs. Each records its run for Settings > Automation.
$daily = [
    'billing:invoice-reminders' => ['invoiceReminders', 'invoice_reminders', 'Email payment reminders and overdue notices'],
    'billing:domain-reminders' => ['domainReminders', 'domain_reminders', 'Email domain expiry reminders'],
    'billing:expire-domains' => ['expireDomains', 'domain_expiry', 'Mark domains past their expiry date as expired'],
    'billing:terminate' => ['terminate', 'terminations', 'Terminate end-of-cycle and long-overdue services'],
    'billing:update-usage' => ['updateUsage', 'usage', 'Refresh disk and bandwidth usage from the servers'],
    'billing:enforce-suspensions' => ['enforceSuspensions', 'enforce_suspensions', 'Suspend on the server every account the panel shows as suspended'],
];
foreach ($daily as $name => [$method, $task, $purpose]) {
    Artisan::command($name, function (App\Services\AutomationService $automation) use ($method, $task) {
        try {
            $count = $automation->{$method}();
        } catch (Throwable $e) {
            // The Cron Job Activity report lists failures.
            ActivityLog::record('automation.failed', context: ['task' => $task, 'error' => mb_strimwidth($e->getMessage(), 0, 300, '...')]);

            throw $e;
        }
        ActivityLog::record('automation.run', context: ['task' => $task, 'count' => $count]);
        $this->info("{$task}: {$count}");
    })->purpose($purpose);
}

Artisan::command('services:server-status', function (App\Services\AutomationService $automation) {
    $rows = $automation->serverStatus();
    $this->table(['ID', 'Domain', 'Username', 'Server', 'Panel', 'On server'], array_map(fn ($r) => [
        $r['service']->id, $r['service']->domain, $r['service']->remote_id, $r['service']->server?->name, 'suspended',
        match ($r['server_suspended']) { true => 'suspended', false => 'ACTIVE (will be suspended)', null => 'error: '.mb_strimwidth((string) $r['error'], 0, 80, '...') },
    ], $rows));
    $this->info(count(array_filter($rows, fn ($r) => $r['server_suspended'] === false)).' account(s) still running on the server. Run billing:enforce-suspensions to suspend them.');
})->purpose('Show what the server says about each account the panel shows as suspended (changes nothing)');

Artisan::command('domains:sync {--no-report : Do not email the Domain Synchronisation Cron Report}', function (App\Services\AutomationService $automation, App\Services\AdminReports $reports) {
    try {
        $report = $automation->syncDomainsReport();
    } catch (Throwable $e) {
        ActivityLog::record('automation.failed', context: ['task' => 'domain_sync', 'error' => mb_strimwidth($e->getMessage(), 0, 300, '...')]);

        throw $e;
    }
    ActivityLog::record('automation.run', context: ['task' => 'domain_sync', 'count' => count($report['synced'])]);
    $this->info('domain_sync: '.count($report['synced']).' synced, '.count($report['failed']).' failed, '.count($report['missing']).' not found');

    if ($report['enabled'] && config('billing.reports.domain_sync') && ! $this->option('no-report')) {
        $this->info($reports->sendDomainSync($report) ? 'Domain sync report emailed.' : 'Domain sync report could not be sent.');
    }
})->purpose('Copy expiry and status from the registrars and email the sync report');

Artisan::command('reports:cron-activity {--date= : The day to report on (Y-m-d); default yesterday} {--force : Send even when the report is turned off}', function (App\Services\AdminReports $reports) {
    if (! config('billing.reports.cron_activity') && ! $this->option('force')) {
        $this->info('The Cron Job Activity report is turned off in Settings.');

        return;
    }
    $day = $this->option('date') ? Illuminate\Support\Carbon::parse($this->option('date')) : null;
    $this->info($reports->sendCronActivity($day) ? 'Cron Job Activity report emailed.' : 'Cron Job Activity report could not be sent.');
})->purpose('Email the admins what the daily jobs did');

// Proves cron is calling the scheduler; Settings > Automation warns when this goes stale.
Schedule::call(fn () => Illuminate\Support\Facades\Cache::put('scheduler.heartbeat', now()->toISOString(), now()->addDay()))->everyMinute()->name('scheduler-heartbeat');

// Midnight: first the report on the day that just ended, then the domain sync and its report.
Schedule::command('reports:cron-activity')->dailyAt('00:00');
Schedule::command('domains:sync')->dailyAt('00:00')->withoutOverlapping();
Schedule::command('billing:renewals')->dailyAt('01:00');
Schedule::command('billing:expire-domains')->dailyAt('01:15');
Schedule::command('billing:terminate')->dailyAt('02:30');
Schedule::command('billing:invoice-reminders')->dailyAt('09:00');
Schedule::command('billing:domain-reminders')->dailyAt('09:15');
Schedule::command('billing:update-usage')->dailyAt('05:00')->withoutOverlapping();
Schedule::command('registrars:sync-tlds')->dailyAt('03:45');
Schedule::command('registrars:sync')->dailyAt('04:00');
Schedule::command('billing:suspend-overdue')->dailyAt('02:00');
Schedule::command('billing:enforce-suspensions')->dailyAt('02:15')->withoutOverlapping();
Schedule::command('tickets:auto-close')->dailyAt('03:00');
// Shared hosting has no long-running worker, so cron drains the queue each minute.
Schedule::command('queue:work --stop-when-empty --max-time=50')->everyMinute()->withoutOverlapping();
