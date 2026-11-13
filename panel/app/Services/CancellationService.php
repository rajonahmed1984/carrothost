<?php

namespace App\Services;

use App\Jobs\ProvisionService;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\Service;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * A client's cancellation request. Asking changes nothing: it waits under Pending Cancellation
 * until an admin accepts or rejects it. Accepting cancels the service's unpaid renewal invoices,
 * then cancels the service in the panel and suspends the account on its server: right away for
 * "immediate", on the due date (the daily run) for "end of billing period".
 */
class CancellationService
{
    public const TYPES = ['immediate' => 'Immediate', 'end_of_period' => 'End of Billing Period'];

    public const LIVE = ['active', 'suspended', 'pending'];

    public function __construct(
        private readonly InvoiceActions $invoices,
        private readonly CreditService $credits,
    ) {}

    /** Services with a request waiting, or accepted and waiting for the due date. */
    public static function pending(Builder $query): Builder
    {
        return $query->whereIn('status', self::LIVE)
            ->where(fn ($q) => $q->where('terminate_end_of_cycle', true)->orWhereNotNull('cancellation_requested_at'));
    }

    public function request(Service $service, string $type, string $reason): void
    {
        if (! in_array($service->status, self::LIVE, true)) {
            throw ValidationException::withMessages(['service' => 'This service cannot be cancelled.']);
        }
        if ($service->cancellation_requested_at) {
            throw ValidationException::withMessages(['service' => 'A cancellation request for this service is already in.']);
        }

        $service->update([
            'cancellation_type' => $type,
            'cancellation_reason' => mb_substr($reason, 0, 2000),
            'cancellation_requested_at' => now(),
            'cancellation_accepted_at' => null,
        ]);

        ActivityLog::record('service.cancellation_requested', $service, ['type' => $type, 'reason' => $reason]);
        app(AdminNotifier::class)->cancellationRequest($service, $type, $reason);
    }

    /** @return list<string> the invoices cancelled or changed */
    public function accept(Service $service): array
    {
        if (! $service->cancellation_requested_at || $service->cancellation_accepted_at) {
            throw ValidationException::withMessages(['service' => 'There is no cancellation request waiting on this service.']);
        }

        $touched = DB::transaction(function () use ($service) {
            $service->update(['cancellation_accepted_at' => now()]);

            return $this->cancelUnpaidInvoices($service);
        });
        ActivityLog::record('service.cancellation_accepted', $service, ['invoices_cancelled' => $touched]);

        $now = $service->cancellation_type === 'immediate' || ! $service->next_due_date || $service->next_due_date->lte(today());
        if ($now) {
            $this->cancelNow($service);
        }

        return $touched;
    }

    public function reject(Service $service): void
    {
        if (! $service->cancellation_requested_at || $service->cancellation_accepted_at) {
            throw ValidationException::withMessages(['service' => 'There is no cancellation request waiting on this service.']);
        }

        $service->update(['cancellation_type' => null, 'cancellation_reason' => null, 'cancellation_requested_at' => null]);
        ActivityLog::record('service.cancellation_rejected', $service);
    }

    /** Accepted end-of-period requests whose due date has come. For the daily run. */
    public function processDue(): int
    {
        $due = Service::with('product')->whereIn('status', self::LIVE)
            ->whereNotNull('cancellation_accepted_at')
            ->whereDate('next_due_date', '<=', today()->toDateString())
            ->whereNotIn('provision_status', ['queued', 'running'])
            ->get();

        $due->each(fn (Service $service) => $this->cancelNow($service));

        return $due->count();
    }

    /**
     * Cancelled in the panel at once; the account on the server is suspended, not removed, so
     * nothing is lost if the client comes back. A service with no server account just changes status.
     */
    private function cancelNow(Service $service): void
    {
        $onServer = $service->remote_id && in_array($service->status, ['active', 'suspended'], true)
            && config('billing.provisioning_modules.'.$service->product?->module.'.class');

        $service->update([
            'status' => 'cancelled',
            'auto_suspended' => false,
            ...$onServer ? ['provision_status' => 'queued', 'provision_error' => null] : [],
        ]);
        ActivityLog::record('service.cancelled', $service, ['type' => $service->cancellation_type]);

        if ($onServer) {
            ProvisionService::dispatch($service->id, 'cancel')->afterCommit();
        }
    }

    /**
     * Unpaid renewal invoices for the service. One with a payment on it is left for the admin.
     *
     * @return list<string>
     */
    private function cancelUnpaidInvoices(Service $service): array
    {
        $touched = [];
        $invoices = Invoice::with('items')->where('client_id', $service->client_id)->where('status', 'unpaid')
            ->whereHas('items', fn ($q) => $q->where('service_id', $service->id)->where('kind', 'renewal'))
            ->get();

        foreach ($invoices as $invoice) {
            if ($invoice->payments()->exists()) {
                continue;
            }

            $others = $invoice->items->filter(fn ($item) => $item->service_id !== $service->id
                && ! ($item->kind === 'other' && $item->description === 'Credit applied'));

            if ($others->isEmpty()) {
                $this->invoices->cancel($invoice);
            } else {
                // A merged invoice: drop this service's line and keep billing the rest.
                $this->credits->returnFromInvoice($invoice, applyToInvoices: false);
                $invoice->items()->where('service_id', $service->id)->delete();
                $invoice->update(['total' => number_format((float) $invoice->items()->sum('amount'), 2, '.', '')]);
                DB::afterCommit(fn () => $this->credits->applyToDueInvoices($invoice->client));
                ActivityLog::record('invoice.item_removed', $invoice, ['reason' => "Cancellation of service #{$service->id}"]);
            }
            $touched[] = (string) $invoice->number;
        }

        return $touched;
    }
}
