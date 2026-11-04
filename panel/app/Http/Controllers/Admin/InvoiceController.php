<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Services\BillingService;
use App\Services\InvoiceActions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        return Invoice::with('client:id,name')
            ->when($request->query('q'), fn ($query, $q) => $query->where(fn ($w) => $w
                ->where('number', 'like', "%{$q}%")
                ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%"))))
            ->when($request->query('status'), function ($q, $status) {
                if ($status === 'overdue') {
                    return $q->where('status', 'unpaid')->whereDate('due_date', '<', today());
                }
                return $q->where('status', $status);
            })
            ->latest('id')
            ->paginate(25);
    }

    public function show(Invoice $invoice)
    {
        return $invoice->load(['client:id,name,email', 'items', 'payments']);
    }

    public function pay(Request $request, Invoice $invoice, BillingService $billing)
    {
        $data = $request->validate([
            'transaction_id' => 'required|string|max:191',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $billing->recordPayment($invoice, 'manual', $data['transaction_id'], number_format((float) $data['amount'], 2, '.', ''));

        return $invoice->refresh()->load(['client:id,name,email', 'items', 'payments']);
    }

    public function cancel(Invoice $invoice, InvoiceActions $actions)
    {
        if ($invoice->status !== 'unpaid' || $invoice->payments()->exists()) {
            throw ValidationException::withMessages(['invoice' => 'Only an unpaid invoice with no payments can be cancelled.']);
        }

        $actions->cancel($invoice);

        return $invoice->refresh();
    }

    /** With Selected on a client's invoice list. */
    public function bulk(Request $request, InvoiceActions $actions)
    {
        $data = $request->validate([
            'invoice_ids' => 'required|array|min:1|max:500',
            'invoice_ids.*' => 'integer',
            'action' => ['required', Rule::in(InvoiceActions::ACTIONS)],
        ]);

        return $actions->run($data['action'], Invoice::whereKey($data['invoice_ids'])->with('client')->orderBy('id')->get());
    }

    /** Edit: the due date and lines of an invoice nothing has been paid on. Credit lines stay as they are. */
    public function update(Request $request, Invoice $invoice)
    {
        if ($invoice->status !== 'unpaid' || $invoice->payments()->exists()) {
            throw ValidationException::withMessages(['invoice' => 'Only an unpaid invoice with no payments can be edited.']);
        }

        $data = $request->validate([
            'due_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|integer',
            'items.*.description' => 'required|string|max:255',
            'items.*.amount' => 'required|numeric|min:0|max:9999999',
        ]);

        DB::transaction(function () use ($invoice, $data) {
            $editable = $invoice->items()->where(fn ($q) => $q->where('description', '!=', 'Credit applied')->orWhere('amount', '>=', 0));
            $kept = collect($data['items'])->pluck('id')->filter()->all();
            (clone $editable)->whereKeyNot($kept)->delete();

            foreach ($data['items'] as $line) {
                $values = ['description' => $line['description'], 'amount' => number_format((float) $line['amount'], 2, '.', '')];
                empty($line['id']) ? $invoice->items()->create($values) : (clone $editable)->whereKey($line['id'])->update($values);
            }

            $total = $invoice->items()->pluck('amount')->reduce(fn (string $sum, $amount) => bcadd($sum, (string) $amount, 2), '0.00');
            if (bccomp($total, '0', 2) < 0) {
                throw ValidationException::withMessages(['items' => 'The lines must add up to at least the credit already applied.']);
            }

            $invoice->update(['due_date' => $data['due_date'], 'total' => $total]);
        });
        ActivityLog::record('invoice.edited', $invoice);

        return $invoice->refresh()->load('items');
    }

    public function destroy(Invoice $invoice, InvoiceActions $actions)
    {
        $actions->delete($invoice);

        return response()->noContent();
    }
}
