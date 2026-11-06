<?php

namespace App\Jobs;

use App\Models\Invoice;
use App\Services\SmsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

/** Texts the client about an invoice, off the request so a slow gateway never holds up a payment. */
class SendInvoiceSms implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    // A retry after a timeout could deliver the same SMS twice; failures land in the SMS log.
    public int $tries = 1;

    public function __construct(public int $invoiceId, public string $event)
    {
        // Invoices are totalled and paid inside transactions; wait for the final state.
        $this->afterCommit();
    }

    /** Queues the SMS only when SMS and this event are switched on; the job checks again when it runs. */
    public static function notify(int $invoiceId, string $event): void
    {
        if (config('sms.enabled') && config('sms.invoice.'.substr($event, strlen('invoice_')))) {
            self::dispatch($invoiceId, $event);
        }
    }

    public function handle(SmsService $sms): void
    {
        if ($invoice = Invoice::find($this->invoiceId)) {
            $sms->sendForInvoice($invoice, $this->event);
        }
    }
}
