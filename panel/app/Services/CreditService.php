<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\ClientCredit;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * A client's credit balance. Every change is a ClientCredit row, and credit pays
 * unpaid invoices by itself: when it is added, and when a new invoice is raised.
 */
class CreditService
{
    public function __construct(private readonly BillingService $billing) {}

    public function add(Client $client, string $amount, string $description, ?Invoice $invoice = null, ?int $userId = null): ClientCredit
    {
        $this->assertPositive($amount);

        $credit = DB::transaction(function () use ($client, $amount, $description, $invoice, $userId) {
            $locked = Client::whereKey($client->id)->lockForUpdate()->firstOrFail();
            $locked->update(['credit_balance' => bcadd((string) $locked->credit_balance, $amount, 2)]);

            return $locked->credits()->create(['amount' => $amount, 'description' => $description, 'invoice_id' => $invoice?->id, 'user_id' => $userId]);
        });

        ActivityLog::record('client.credit_added', $client, ['amount' => $amount, 'description' => $description]);
        DB::afterCommit(fn () => $this->applyToDueInvoices($client));

        return $credit;
    }

    public function remove(Client $client, string $amount, string $description, ?int $userId = null): ClientCredit
    {
        $this->assertPositive($amount);

        $credit = DB::transaction(function () use ($client, $amount, $description, $userId) {
            $locked = Client::whereKey($client->id)->lockForUpdate()->firstOrFail();

            if (bccomp($amount, (string) $locked->credit_balance, 2) > 0) {
                throw ValidationException::withMessages(['amount' => "Only {$locked->credit_balance} credit is available to remove."]);
            }

            $locked->update(['credit_balance' => bcsub((string) $locked->credit_balance, $amount, 2)]);

            return $locked->credits()->create(['amount' => '-'.$amount, 'description' => $description, 'user_id' => $userId]);
        });

        ActivityLog::record('client.credit_removed', $client, ['amount' => $amount, 'description' => $description]);

        return $credit;
    }

    /** Pays the client's unpaid invoices from credit, the one falling due first first, until the credit runs out. */
    public function applyToDueInvoices(Client $client): void
    {
        $invoices = $client->invoices()->where('status', 'unpaid')
            ->whereDoesntHave('items', fn ($q) => $q->whereIn('kind', BillingService::PREPAYMENT_KINDS))
            ->orderBy('due_date')->orderBy('id')->get();

        foreach ($invoices as $invoice) {
            if (bccomp((string) $client->fresh()->credit_balance, '0', 2) <= 0) {
                return;
            }

            $this->applyToInvoice($invoice);
        }
    }

    /**
     * Uses as much credit as the invoice still needs. It shows on the invoice as a
     * "Credit applied" line that lowers the total, as on invoices imported from WHMCS.
     * Returns the amount used.
     */
    public function applyToInvoice(Invoice $invoice): string
    {
        [$used, $becamePaid, $locked] = DB::transaction(function () use ($invoice) {
            $client = Client::whereKey($invoice->client_id)->lockForUpdate()->firstOrFail();
            $locked = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            $used = $this->minimum((string) $client->credit_balance, $this->billing->balanceDue($locked));
            if ($locked->status !== 'unpaid' || bccomp($used, '0', 2) <= 0 || BillingService::isPrepayment($locked)) {
                return ['0.00', false, $locked];
            }

            $locked->items()->create(['description' => 'Credit applied', 'amount' => '-'.$used, 'kind' => 'other']);
            $locked->update(['total' => bcsub((string) $locked->total, $used, 2)]);
            $client->update(['credit_balance' => bcsub((string) $client->credit_balance, $used, 2)]);
            $client->credits()->create(['amount' => '-'.$used, 'description' => "Credit Applied to Invoice #{$locked->number}", 'invoice_id' => $locked->id]);
            ActivityLog::record('invoice.credit_applied', $locked, ['amount' => $used]);

            return [$used, $this->billing->markPaidIfCovered($locked, 'credit'), $locked];
        });

        if ($becamePaid) {
            $this->billing->announcePaid($locked);
        }

        return $used;
    }

    /**
     * Takes the "Credit applied" lines off an unpaid invoice and gives that credit back, for an
     * invoice about to be cancelled or deleted. Call inside the same transaction as the cancel,
     * so the returned credit cannot flow straight back into this invoice.
     */
    public function returnFromInvoice(Invoice $invoice): string
    {
        $lines = $invoice->items()->where('kind', 'other')->where('description', 'Credit applied')->where('amount', '<', 0)->get();
        $amount = $lines->reduce(fn (string $sum, $line) => bcsub($sum, (string) $line->amount, 2), '0.00');

        if ($invoice->status !== 'unpaid' || bccomp($amount, '0', 2) <= 0) {
            return '0.00';
        }

        $invoice->items()->whereKey($lines->modelKeys())->delete();
        $invoice->update(['total' => bcadd((string) $invoice->total, $amount, 2)]);
        $this->add($invoice->client, $amount, "Credit returned from Invoice #{$invoice->number}");

        return $amount;
    }

    private function minimum(string $a, string $b): string
    {
        return bccomp($a, $b, 2) <= 0 ? $a : $b;
    }

    private function assertPositive(string $amount): void
    {
        if (bccomp($amount, '0', 2) <= 0) {
            throw ValidationException::withMessages(['amount' => 'Amount must be greater than zero.']);
        }
    }
}
