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

Artisan::command('portal:import-orders', function () {
    $orders = \Illuminate\Support\Facades\DB::select("
        SELECT 
            o.id as portal_order_id,
            o.ordernum,
            o.userid as portal_user_id,
            c.id as panel_client_id,
            o.date as order_date,
            o.status as portal_status,
            o.amount as order_amount,
            o.invoiceid as portal_invoice_id,
            o.notes
        FROM carrothost_portal.tblorders o
        JOIN carrothost_portal.tblclients pc ON pc.id = o.userid
        JOIN carrothost_panel.clients c ON c.email = pc.email
        ORDER BY o.id ASC
    ");

    $this->info('Found '.count($orders).' orders for current clients in carrothost_portal.');

    foreach ($orders as $o) {
        $status = strtolower($o->portal_status);
        if (!in_array($status, ['active', 'cancelled', 'pending'])) {
            $status = 'pending';
        }
        \Illuminate\Support\Facades\DB::table('orders')->updateOrInsert(
            ['id' => $o->portal_order_id],
            [
                'client_id' => $o->panel_client_id,
                'status' => $status,
                'amount' => $o->order_amount ?? 0,
                'notes' => $o->notes ?: null,
                'created_at' => $o->order_date,
                'updated_at' => $o->order_date,
            ]
        );
    }

    \Illuminate\Support\Facades\DB::affectingStatement("
        UPDATE carrothost_panel.services ps
        JOIN carrothost_panel.clients pc ON pc.id = ps.client_id
        JOIN carrothost_portal.tblclients wc ON wc.email = pc.email
        JOIN carrothost_portal.tblhosting wh ON wh.userid = wc.id AND wh.domain = ps.domain
        SET ps.order_id = wh.orderid
        WHERE wh.orderid IN (SELECT id FROM carrothost_panel.orders)
    ");

    \Illuminate\Support\Facades\DB::affectingStatement("
        UPDATE carrothost_panel.domains pd
        JOIN carrothost_panel.clients pc ON pc.id = pd.client_id
        JOIN carrothost_portal.tblclients wc ON wc.email = pc.email
        JOIN carrothost_portal.tbldomains wd ON wd.userid = wc.id AND wd.domain = pd.name
        SET pd.order_id = wd.orderid
        WHERE wd.orderid IN (SELECT id FROM carrothost_panel.orders)
    ");

    \Illuminate\Support\Facades\DB::affectingStatement("
        UPDATE carrothost_panel.invoices pi
        JOIN carrothost_panel.clients pc ON pc.id = pi.client_id
        JOIN carrothost_portal.tblclients wc ON wc.email = pc.email
        JOIN carrothost_portal.tblorders wo ON wo.userid = wc.id AND (wo.invoiceid = pi.number OR wo.invoiceid = pi.id)
        SET pi.order_id = wo.id
        WHERE wo.invoiceid > 0 AND wo.id IN (SELECT id FROM carrothost_panel.orders)
    ");

    $this->info('Orders imported and linked successfully.');
})->purpose('Import orders from carrothost_portal for current clients');

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

Schedule::command('billing:renewals')->dailyAt('01:00');
Schedule::command('registrars:sync')->dailyAt('04:00');
Schedule::command('billing:suspend-overdue')->dailyAt('02:00');
Schedule::command('tickets:auto-close')->dailyAt('03:00');
// Shared hosting has no long-running worker, so cron drains the queue each minute.
Schedule::command('queue:work --stop-when-empty --max-time=50')->everyMinute()->withoutOverlapping();
