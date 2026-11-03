<?php

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\RenewalService;
use App\Services\TicketService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('billing:renewals', function (RenewalService $renewals) {
    $count = $renewals->generateInvoices();
    ActivityLog::record('automation.run', context: ['task' => 'renewals', 'count' => $count]);
    $this->info($count.' renewal invoice(s) created.');
})->purpose('Raise invoices for services and domains coming due');

Artisan::command('billing:suspend-overdue', function (RenewalService $renewals) {
    $count = $renewals->suspendOverdue();
    ActivityLog::record('automation.run', context: ['task' => 'suspensions', 'count' => $count]);
    $this->info($count.' service(s) sent for suspension.');
})->purpose('Suspend services whose invoices are past the grace period');

Artisan::command('tickets:auto-close', function (TicketService $tickets) {
    $count = $tickets->autoClose();
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

Schedule::command('billing:renewals')->dailyAt('01:00');
Schedule::command('billing:suspend-overdue')->dailyAt('02:00');
Schedule::command('tickets:auto-close')->dailyAt('03:00');
// Shared hosting has no long-running worker, so cron drains the queue each minute.
Schedule::command('queue:work --stop-when-empty --max-time=50')->everyMinute()->withoutOverlapping();
