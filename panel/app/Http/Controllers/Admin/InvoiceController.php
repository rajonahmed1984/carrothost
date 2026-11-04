<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Services\BillingService;
use App\Models\PaymentAttempt;
use App\Services\CreditService;
use App\Services\CustomerMailer;
use App\Services\InvoiceActions;
use Illuminate\Support\Carbon;
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

    public function show(Invoice $invoice, BillingService $billing)
    {
        return $this->detail($invoice, $billing);
    }

    /** Add Payment: any gateway, with its own date and fee. Paying in full sets up what the invoice was for. */
    public function pay(Request $request, Invoice $invoice, BillingService $billing)
    {
        $data = $request->validate([
            'transaction_id' => 'required|string|max:191',
            'amount' => 'required|numeric|min:0.01|max:9999999',
            'gateway' => ['sometimes', Rule::in(array_keys(config('billing.gateways')))],
            'date' => 'sometimes|nullable|date|before_or_equal:today',
            'fee' => 'sometimes|nullable|numeric|min:0|max:9999999',
        ]);

        $payment = $billing->recordPayment($invoice, $data['gateway'] ?? 'manual', $data['transaction_id'], number_format((float) $data['amount'], 2, '.', ''));
        $extra = array_filter([
            'fee' => isset($data['fee']) ? number_format((float) $data['fee'], 2, '.', '') : null,
            'created_at' => ! empty($data['date']) && $payment->wasRecentlyCreated ? Carbon::parse($data['date'])->setTimeFrom(now()) : null,
        ], fn ($v) => $v !== null);
        if ($extra) {
            $payment->update($extra);
        }

        return $this->detail($invoice->refresh(), $billing);
    }

    /** Credit tab: put some of the client's credit on this invoice, or take the applied credit back off. */
    public function credit(Request $request, Invoice $invoice, BillingService $billing, CreditService $credits)
    {
        $data = $request->validate(['action' => 'required|in:apply,remove', 'amount' => 'required_if:action,apply|nullable|numeric|min:0.01']);

        if ($invoice->status !== 'unpaid') {
            throw ValidationException::withMessages(['amount' => 'Credit can only be changed on an unpaid invoice.']);
        }

        if ($data['action'] === 'apply') {
            $used = $credits->applyToInvoice($invoice, number_format((float) $data['amount'], 2, '.', ''));
            if (bccomp($used, '0', 2) <= 0) {
                throw ValidationException::withMessages(['amount' => 'No credit could be applied. Check the client has credit and the invoice has a balance.']);
            }
        } else {
            // Kept on the account: re-applying it would put it straight back on this invoice.
            DB::transaction(fn () => $credits->returnFromInvoice($invoice, applyToInvoices: false));
            ActivityLog::record('invoice.credit_removed', $invoice);
        }

        return $this->detail($invoice->refresh(), $billing);
    }

    /**
     * Records money sent back for one payment, as a negative transaction. The refund itself happens
     * at the gateway or bank; "credit" keeps the money on the client's account instead.
     */
    public function refund(Request $request, Invoice $invoice, BillingService $billing, CreditService $credits)
    {
        $data = $request->validate([
            'payment_id' => 'required|integer',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:record,credit',
            'transaction_id' => 'nullable|string|max:191',
        ]);

        $payment = $invoice->payments()->where('amount', '>', 0)->findOrFail($data['payment_id']);
        $amount = number_format((float) $data['amount'], 2, '.', '');

        DB::transaction(function () use ($invoice, $payment, $amount, $data, $credits) {
            $locked = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            $refunded = $locked->payments()->where('amount', '<', 0)->get()
                ->filter(fn ($p) => ($p->meta['refund_of'] ?? null) === $payment->id)
                ->reduce(fn (string $sum, $p) => bcsub($sum, (string) $p->amount, 2), '0.00');
            $left = bcsub((string) $payment->amount, $refunded, 2);

            if (bccomp($amount, $left, 2) > 0) {
                throw ValidationException::withMessages(['amount' => "Only {$left} of this payment is left to refund."]);
            }

            $locked->payments()->create([
                'gateway' => $data['type'] === 'credit' ? 'credit' : $payment->gateway,
                'transaction_id' => ($data['transaction_id'] ?? null) ?: "REFUND-{$payment->id}-".now()->format('YmdHisv'),
                'amount' => '-'.$amount,
                'currency' => $payment->currency,
                'meta' => ['refund_of' => $payment->id, 'refund' => true],
                'recorded_by' => auth('web')->id(),
            ]);

            if ($data['type'] === 'credit') {
                $credits->add($locked->client, $amount, "Refund from Invoice #{$locked->number} as credit", $locked);
            }

            $net = $locked->payments()->pluck('amount')->reduce(fn (string $sum, $v) => bcadd($sum, (string) $v, 2), '0.00');
            if ($locked->status === 'paid' && bccomp($net, '0', 2) <= 0) {
                $locked->update(['status' => 'refunded']);
            }

            ActivityLog::record('invoice.refunded', $locked, ['amount' => $amount, 'type' => $data['type'], 'payment_id' => $payment->id]);
        });

        return $this->detail($invoice->refresh(), $billing);
    }

    public function notes(Request $request, Invoice $invoice, BillingService $billing)
    {
        $data = $request->validate(['admin_notes' => 'nullable|string|max:20000']);
        $invoice->update(['admin_notes' => $data['admin_notes'] ?: null]);

        return $this->detail($invoice, $billing);
    }

    /** Send Email: one of the invoice emails, again. */
    public function email(Request $request, Invoice $invoice, BillingService $billing, CustomerMailer $mailer)
    {
        $template = $request->validate(['template' => 'required|in:created,reminder,paid'])['template'];

        if ($template === 'paid' && $invoice->status !== 'paid') {
            throw ValidationException::withMessages(['template' => 'The payment confirmation is only for a paid invoice.']);
        }
        if ($template === 'reminder' && $invoice->status !== 'unpaid') {
            throw ValidationException::withMessages(['template' => 'A reminder is only for an unpaid invoice.']);
        }

        $invoice->load('client', 'items');
        match ($template) {
            'created' => $mailer->invoiceCreated($invoice),
            'reminder' => $mailer->invoiceReminder($invoice, $billing->balanceDue($invoice)),
            'paid' => $mailer->paymentReceived($invoice),
        };
        ActivityLog::record("invoice.email.{$template}", $invoice);

        return ['message' => "Email sent to {$invoice->client->email}."];
    }

    private function detail(Invoice $invoice, BillingService $billing): array
    {
        $invoice->load(['client:id,name,company,email,phone,address,city,country,credit_balance,status', 'items', 'payments' => fn ($q) => $q->oldest()]);
        $gatewayName = fn (string $code) => match ($code) {
            'credit' => 'Account Credit',
            default => config("billing.gateways.{$code}.name", $code),
        };
        $creditLines = $invoice->items->filter(fn ($i) => $i->description === 'Credit applied' && (float) $i->amount < 0);

        return [
            ...$invoice->toArray(),
            'subtotal' => $invoice->items->diff($creditLines)->reduce(fn (string $sum, $i) => bcadd($sum, (string) $i->amount, 2), '0.00'),
            'credit_applied' => $creditLines->reduce(fn (string $sum, $i) => bcsub($sum, (string) $i->amount, 2), '0.00'),
            'balance' => $billing->balanceDue($invoice),
            'payments' => $invoice->payments->map(fn ($p) => [
                ...$p->only('id', 'gateway', 'transaction_id', 'amount', 'fee', 'currency', 'created_at'),
                'gateway_name' => $gatewayName($p->gateway),
                'refund_of' => $p->meta['refund_of'] ?? null,
            ]),
            'payment_method' => $invoice->payments->where('amount', '>', 0)->pluck('gateway')->unique()->map($gatewayName)->implode(', ') ?: null,
            'attempts' => PaymentAttempt::where('invoice_id', $invoice->id)->latest('id')->limit(100)->get()
                ->map(fn ($a) => [...$a->only('id', 'reference', 'external_id', 'amount', 'status', 'failure_reason', 'created_at'), 'gateway_name' => $gatewayName($a->gateway)]),
            'gateways' => collect(config('billing.gateways'))->map(fn ($g, $code) => ['code' => $code, 'name' => $g['name']])->values(),
            'company' => ['name' => config('app.name'), 'email' => config('billing.company_email'), 'pay_to' => config('billing.pay_to')],
        ];
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
