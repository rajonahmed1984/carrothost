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
    // Runs every cron: record whenever services are suspended, plus once a day when 0 are due so reports show it ran without flooding the audit log.
    $loggedToday = ActivityLog::where('action', 'automation.run')
        ->whereDate('created_at', today())
        ->get(['context'])
        ->contains(fn (ActivityLog $log) => ($log->context['task'] ?? null) === 'suspensions');
    if ($count > 0 || ! $loggedToday) {
        ActivityLog::record('automation.run', context: ['task' => 'suspensions', 'count' => $count]);
    }
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

Artisan::command('domains:sync', function (App\Services\AutomationService $automation) {
    try {
        $report = $automation->syncDomainsReport();
    } catch (Throwable $e) {
        ActivityLog::record('automation.failed', context: ['task' => 'domain_sync', 'error' => mb_strimwidth($e->getMessage(), 0, 300, '...')]);

        throw $e;
    }
    ActivityLog::record('automation.run', context: ['task' => 'domain_sync', 'count' => count($report['synced'])]);
    $this->info('domain_sync: '.count($report['synced']).' synced, '.count($report['failed']).' failed, '.count($report['missing']).' not found');

    // The midnight report that runs right after this one includes what it did.
    if ($report['enabled']) {
        App\Services\AdminReports::rememberDomainSync($report);
    }
})->purpose('Copy expiry and status from the registrars; the daily report lists what changed');

Artisan::command('reports:cron-activity {--date= : The day to report on (Y-m-d); default yesterday} {--force : Send even when the report is turned off}', function (App\Services\AdminReports $reports) {
    $activity = config('billing.reports.cron_activity') || $this->option('force');
    if (! $activity && ! (config('billing.reports.domain_sync') && config('billing.domain_sync_enabled'))) {
        $this->info('The daily report is turned off in Settings.');

        return;
    }
    $day = $this->option('date') ? Illuminate\Support\Carbon::parse($this->option('date')) : null;
    $this->info($reports->sendCronActivity($day, $activity) ? 'Daily report emailed.' : 'Daily report could not be sent.');
})->purpose('Email the admins what the daily jobs did and what the domain sync changed');

Artisan::command('audit:verify', function () {
    // Walks the audit trail's hash chain. A changed row fails its own hash; a removed one breaks the link.
    $prev = null;
    $checked = 0;
    $problems = [];
    ActivityLog::query()->whereNotNull('hash')->orderBy('id')->chunk(1000, function ($rows) use (&$prev, &$checked, &$problems) {
        foreach ($rows as $row) {
            if (! hash_equals($row->hash, $row->computeHash())) {
                $problems[] = "#{$row->id} {$row->action}: changed after it was written";
            } elseif ($prev !== null && $row->prev_hash !== $prev) {
                $problems[] = "#{$row->id} {$row->action}: an entry before it was removed or changed";
            }
            $prev = $row->hash;
            $checked++;
        }
    });

    if ($problems) {
        Illuminate\Support\Facades\Log::channel('audit')->critical('Audit trail failed verification', ['problems' => array_slice($problems, 0, 50)]);
        foreach (array_slice($problems, 0, 50) as $p) {
            $this->error($p);
        }

        return 1;
    }
    $this->info("Audit trail intact: {$checked} entries checked.");

    return 0;
})->purpose('Check that no audit log entry was changed or removed');

Artisan::command('security:check', function () {
    // Settings that must hold on the live site. Run after every deploy.
    $session = config('session');
    $checks = [
        'APP_ENV is production' => app()->isProduction(),
        'APP_DEBUG is off' => ! config('app.debug'),
        'APP_URL uses https' => str_starts_with((string) config('app.url'), 'https://'),
        'Session cookie is HTTPS-only' => (bool) $session['secure'],
        'Session cookie is hidden from scripts' => (bool) $session['http_only'],
        'Sessions are encrypted' => (bool) $session['encrypt'],
        'Content-Security-Policy is enforced' => config('security.csp') === 'enforce',
        'Admin idle sign-out is on' => config('security.admin_idle_minutes') > 0 && config('security.admin_idle_minutes') <= 60,
        'Log level is not debug' => ! in_array(config('logging.channels.daily.level'), ['debug'], true) && ! in_array(config('logging.channels.single.level'), ['debug'], true),
        'PHP does not announce itself (expose_php = Off)' => ! filter_var(ini_get('expose_php'), FILTER_VALIDATE_BOOLEAN),
        '.env is not readable by other users' => PHP_OS_FAMILY === 'Windows' || ! (fileperms(base_path('.env')) & 0004),
        'No database dumps left in storage' => collect(glob(storage_path('app/private/backups/*.sql')) ?: [])->isEmpty(),
    ];
    $failed = 0;
    foreach ($checks as $label => $ok) {
        $ok ? $this->line("  <info>PASS</info>  {$label}") : $this->line("  <error>FAIL</error>  {$label}");
        $failed += $ok ? 0 : 1;
    }
    $this->newLine();
    $failed ? $this->warn("{$failed} check(s) failed.") : $this->info('All checks passed.');

    return $failed ? 1 : 0;
})->purpose('Check the live security settings');

// Proves cron is calling the scheduler; Settings > Automation warns when this goes stale.
Schedule::call(fn () => Illuminate\Support\Facades\Cache::put('scheduler.heartbeat', now()->toISOString(), now()->addDay()))->everyMinute()->name('scheduler-heartbeat');

// Midnight: first the report on the day that just ended, then the domain sync and its report.
// Same minute, in this order: the scheduler runs them one after the other, so the report includes the sync.
Schedule::command('domains:sync')->dailyAt('00:00')->withoutOverlapping();
Schedule::command('reports:cron-activity')->dailyAt('00:00');
Schedule::command('audit:verify')->dailyAt('04:30');
Schedule::command('billing:renewals')->dailyAt('01:00');
Schedule::command('billing:expire-domains')->dailyAt('01:15');
Schedule::command('billing:terminate')->dailyAt('02:30');
Schedule::command('billing:invoice-reminders')->dailyAt('09:00');
Schedule::command('billing:domain-reminders')->dailyAt('09:15');
Schedule::command('billing:update-usage')->dailyAt('05:00')->withoutOverlapping();
Schedule::command('registrars:sync-tlds')->dailyAt('03:45');
Schedule::command('registrars:sync')->dailyAt('04:00');
Schedule::command('billing:suspend-overdue')->everyMinute()->withoutOverlapping();
Schedule::command('billing:enforce-suspensions')->dailyAt('02:15')->withoutOverlapping();
Schedule::command('tickets:auto-close')->dailyAt('03:00');
// Shared hosting has no long-running worker, so cron drains the queue each minute.
Schedule::command('queue:work --stop-when-empty --max-time=50')->everyMinute()->withoutOverlapping();
