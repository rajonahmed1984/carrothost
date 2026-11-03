<?php

namespace Addons\PaidLog;

use App\Addons\PanelAddon;
use App\Events\InvoicePaid;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Event;

class Addon implements PanelAddon
{
    public function boot(array $config): void
    {
        Event::listen(InvoicePaid::class, function (InvoicePaid $event) {
            ActivityLog::record('addon.paid_log.invoice_paid', $event->invoice, ['number' => $event->invoice->number]);
        });
    }
}
