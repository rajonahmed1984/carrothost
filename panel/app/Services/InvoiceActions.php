<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\PaymentAttempt;
use App\Support\Currency;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** The admin's "With Selected" actions on invoices, also used one invoice at a time. */
class InvoiceActions
{
    public const ACTIONS = ['mark_paid', 'mark_unpaid', 'mark_cancelled', 'duplicate', 'reminder', 'merge', 'mass_pay', 'delete'];

    public function __construct(
        private readonly BillingService $billing,
        private readonly CreditService $credits,
        private readonly CustomerMailer $mailer,
    ) {}

    /**
     * @param  Collection<int, Invoice>  $invoices
     * @return array{message: string, count: int, invoice_id?: int}
     */
    public function run(string $action, Collection $invoices): array
    {
        return match ($action) {
            'mark_paid' => $this->count($invoices, 'unpaid', fn (Invoice $i) => $this->markPaid($i), 'marked paid'),
            'mark_unpaid' => $this->count($invoices, fn (Invoice $i) => $i->status !== 'unpaid', fn (Invoice $i) => $this->markUnpaid($i), 'marked unpaid', 'already unpaid'),
            'mark_cancelled' => $this->count($invoices, 'unpaid', fn (Invoice $i) => $this->cancel($i), 'cancelled'),
            'duplicate' => $this->count($invoices, null, fn (Invoice $i) => $this->duplicate($i), 'duplicated'),
            'reminder' => $this->count($invoices, 'unpaid', function (Invoice $i) {
                $this->mailer->invoiceReminder($i, $this->billing->balanceDue($i));
                ActivityLog::record('invoice.email.reminder', $i);
            }, 'reminded'),
            'merge' => $this->merge($invoices),
            'mass_pay' => $this->massPay($invoices),
            'delete' => $this->deleteAll($invoices),
        };
    }

    /** Records a manual payment for whatever is still owed, so services start as with any payment. */
    public function markPaid(Invoice $invoice): void
    {
        $due = $this->billing->balanceDue($invoice);

        if (bccomp($due, '0', 2) > 0) {
            $this->billing->recordPayment($invoice, 'manual', "MARKPAID-{$invoice->id}-".now()->format('YmdHis'), $due);

            return;
        }

        $paid = DB::transaction(fn () => $this->billing->markPaidIfCovered(Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail(), 'manual'));
        if ($paid) {
            $this->billing->announcePaid($invoice->refresh());
        }
    }

    /** Reopens a paid, cancelled or refunded invoice; services already set up stay as they are. */
    public function markUnpaid(Invoice $invoice): void
    {
        $invoice->update(['status' => 'unpaid', 'paid_at' => null]);
        ActivityLog::record('invoice.marked_unpaid', $invoice);
    }

    public function cancel(Invoice $invoice): void
    {
        if ($invoice->payments()->exists()) {
            throw ValidationException::withMessages(['invoice_ids' => "Invoice #{$invoice->number} has payments. Delete its transactions first."]);
        }

        DB::transaction(function () use ($invoice) {
            $this->credits->returnFromInvoice($invoice);
            $invoice->update(['status' => 'cancelled']);
        });
        ActivityLog::record('invoice.cancelled', $invoice);
    }

    /** A paid invoice keeps its record: only an invoice nothing was paid on can go. */
    public function delete(Invoice $invoice): void
    {
        if ($invoice->payments()->exists()) {
            throw ValidationException::withMessages(['invoice' => "Invoice #{$invoice->number} has payments. Delete its transactions first."]);
        }

        DB::transaction(function () use ($invoice) {
            $this->credits->returnFromInvoice($invoice);
            // Unpaid checkouts leave PaymentAttempt rows whose FK restricts delete; payments were ruled out above.
            PaymentAttempt::where('invoice_id', $invoice->id)->delete();
            ActivityLog::record('invoice.deleted', $invoice->client, ['number' => $invoice->number, 'total' => (string) $invoice->total]);
            $invoice->delete();
        });
    }

    /** A fresh unpaid copy, due today. Lines are copied as plain charges, so paying it sets nothing up twice. */
    public function duplicate(Invoice $invoice): Invoice
    {
        if (BillingService::isPrepayment($invoice)) {
            throw ValidationException::withMessages(['invoice_ids' => 'Add Funds and Mass Pay invoices cannot be duplicated.']);
        }

        $currency = $invoice->currency ?: Currency::BASE;
        $target = $invoice->client->currencyCode();
        $items = $invoice->items()
            ->where(fn ($q) => $q->whereNull('kind')->orWhereNotIn('kind', BillingService::PREPAYMENT_KINDS))
            ->where(fn ($q) => $q->where('description', '!=', 'Credit applied')->orWhere('amount', '>=', 0))
            // The copy is raised in the client's currency; an older invoice in another one is converted.
            ->get()->map(fn ($item) => ['description' => $item->description, 'amount' => Currency::convert((string) $item->amount, $currency, $target), 'kind' => 'other'])->all();

        if ($items === [] && bccomp((string) $invoice->total, '0', 2) > 0) {
            $items = [['description' => "Invoice #{$invoice->number}", 'amount' => Currency::convert((string) $invoice->total, $currency, $target), 'kind' => 'other']];
        }

        $copy = $this->billing->createInvoice($invoice->client, $items, today());
        ActivityLog::record('invoice.duplicated', $copy, ['from' => $invoice->number]);

        return $copy;
    }

    private function merge(Collection $invoices): array
    {
        $invoices = $this->sameClientUnpaid($invoices, 2, 'Merge');

        if ($invoices->contains(fn (Invoice $i) => $i->payments()->exists())) {
            throw ValidationException::withMessages(['invoice_ids' => 'Invoices that are partly paid cannot be merged.']);
        }

        $merged = DB::transaction(function () use ($invoices) {
            $items = $invoices->flatMap(function (Invoice $i) {
                if ($i->items->isEmpty() && bccomp((string) $i->total, '0', 2) > 0) {
                    return [['description' => "Invoice #{$i->number}", 'amount' => (string) $i->total, 'kind' => 'other']];
                }

                return $i->items->map(fn ($item) => $item->only('description', 'amount', 'kind', 'service_id', 'domain_id', 'target_invoice_id'));
            })->all();
            $merged = $this->billing->createInvoice($invoices->first()->client, $items, Carbon::parse($invoices->min('due_date')));
            Invoice::whereKey($invoices->modelKeys())->update(['status' => 'cancelled']);
            ActivityLog::record('invoice.merged', $merged, ['from' => $invoices->pluck('number')->implode(', ')]);

            return $merged;
        });

        return ['message' => "Merged into invoice #{$merged->number}.", 'count' => 1, 'invoice_id' => $merged->id];
    }

    /** One invoice that, once paid, pays each selected invoice. */
    private function massPay(Collection $invoices): array
    {
        $invoices = $this->sameClientUnpaid($invoices, 2, 'Mass Pay');

        if ($invoices->contains(fn (Invoice $i) => BillingService::isPrepayment($i))) {
            throw ValidationException::withMessages(['invoice_ids' => 'Add Funds and Mass Pay invoices cannot be bundled again.']);
        }

        $items = $invoices->map(fn (Invoice $i) => [
            'description' => "Invoice #{$i->number}",
            'amount' => $this->billing->balanceDue($i),
            'kind' => 'mass_pay',
            'target_invoice_id' => $i->id,
        ])->filter(fn ($item) => bccomp($item['amount'], '0', 2) > 0)->values()->all();

        if ($items === []) {
            throw ValidationException::withMessages(['invoice_ids' => 'The selected invoices have no balance due.']);
        }

        $bundle = $this->billing->createInvoice($invoices->first()->client, $items, today());
        ActivityLog::record('invoice.mass_pay', $bundle, ['for' => $invoices->pluck('number')->implode(', ')]);

        return ['message' => "Mass Pay invoice #{$bundle->number} created.", 'count' => 1, 'invoice_id' => $bundle->id];
    }

    private function deleteAll(Collection $invoices): array
    {
        $kept = $invoices->filter(fn (Invoice $i) => $i->payments()->exists());
        $invoices->diff($kept)->each(fn (Invoice $i) => $this->delete($i));

        $deleted = $invoices->count() - $kept->count();

        return [
            'message' => "{$deleted} invoice(s) deleted.".($kept->isEmpty() ? '' : " {$kept->count()} with payments kept: delete their transactions first."),
            'count' => $deleted,
        ];
    }

    private function sameClientUnpaid(Collection $invoices, int $min, string $label): Collection
    {
        if ($invoices->count() < $min || $invoices->pluck('client_id')->unique()->count() > 1 || $invoices->contains(fn (Invoice $i) => $i->status !== 'unpaid')) {
            throw ValidationException::withMessages(['invoice_ids' => "{$label} needs at least {$min} unpaid invoices of the same client."]);
        }

        // The new invoice is in the client's currency, so every one bundled must be too.
        $currency = $invoices->first()->client->currencyCode();
        if ($invoices->contains(fn (Invoice $i) => strtoupper((string) ($i->currency ?: Currency::BASE)) !== $currency)) {
            throw ValidationException::withMessages(['invoice_ids' => "{$label} needs invoices in the client's currency ({$currency})."]);
        }

        return $invoices->sortBy([['due_date', 'asc'], ['id', 'asc']])->values();
    }

    /**
     * Runs an action on the eligible invoices and reports how many changed or were skipped.
     *
     * @param  string|(callable(Invoice): bool)|null  $filter
     * @return array{message: string, count: int, invoice_id?: int}
     */
    private function count(Collection $invoices, string|callable|null $filter, callable $action, string $done, ?string $skipReason = null): array
    {
        $eligible = match (true) {
            is_string($filter) => $invoices->where('status', $filter),
            is_callable($filter) => $invoices->filter($filter),
            default => $invoices,
        };
        $results = $eligible->map(fn (Invoice $i) => $action($i));
        $skipped = $invoices->count() - $eligible->count();
        $reason = $skipReason ?? (is_string($filter) ? "not {$filter}" : 'not eligible');

        $result = [
            'message' => "{$eligible->count()} invoice(s) {$done}.".($skipped ? " {$skipped} skipped ({$reason})." : ''),
            'count' => $eligible->count(),
        ];

        if ($eligible->count() === 1 && ($first = $results->first()) instanceof Invoice) {
            $result['invoice_id'] = $first->id;
        }

        return $result;
    }
}
