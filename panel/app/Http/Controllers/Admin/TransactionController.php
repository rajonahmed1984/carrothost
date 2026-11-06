<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\BillingService;
use App\Support\Currency;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    private const SORTS = ['date' => 'created_at', 'amount' => 'amount', 'fee' => 'fee', 'gateway' => 'gateway'];

    /** Every payment and refund, filtered, with the in/fees/out totals of the filtered set. */
    public function index(Request $request)
    {
        $data = $request->validate([
            'q' => 'nullable|string|max:100',
            'gateway' => 'nullable|string|max:50',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'direction' => 'nullable|in:in,out',
            'sort' => ['nullable', Rule::in(array_keys(self::SORTS))],
            'dir' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|in:25,50,100',
        ]);

        $filtered = Payment::query()
            ->when($data['q'] ?? null, fn ($query, $q) => $query->where(fn ($w) => $w
                ->where('transaction_id', 'like', "%{$q}%")
                ->orWhere('gateway', 'like', "%{$q}%")
                ->orWhereHas('invoice', fn ($inv) => $inv->where('number', 'like', "%{$q}%")
                    ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$q}%")->orWhere('company', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%")))))
            ->when($data['gateway'] ?? null, fn ($query, $gw) => $query->where('gateway', $gw))
            ->when($data['from'] ?? null, fn ($query, $from) => $query->whereDate('created_at', '>=', $from))
            ->when($data['to'] ?? null, fn ($query, $to) => $query->whereDate('created_at', '<=', $to))
            ->when(($data['direction'] ?? null) === 'in', fn ($query) => $query->where('amount', '>', 0))
            ->when(($data['direction'] ?? null) === 'out', fn ($query) => $query->where('amount', '<', 0));

        // Totals are in BDT: USD payments count at the current rate.
        $in = Currency::sumInBase((clone $filtered)->where('amount', '>', 0), 'amount');
        $fees = Currency::sumInBase(clone $filtered, 'fee');
        $out = bcmul(Currency::sumInBase((clone $filtered)->where('amount', '<', 0), 'amount'), '-1', 2);
        $gatewayName = fn (string $code) => $code === 'credit' ? 'Account Credit' : config("billing.gateways.{$code}.name", $code);

        $page = (clone $filtered)->with(['invoice:id,number,client_id', 'invoice.client:id,name,company'])
            ->orderBy(self::SORTS[$data['sort'] ?? 'date'], $data['dir'] ?? 'desc')
            ->orderBy('id', $data['dir'] ?? 'desc')
            ->paginate($data['per_page'] ?? 25);
        $page->getCollection()->transform(fn (Payment $p) => [...$p->toArray(), 'gateway_name' => $gatewayName($p->gateway)]);

        return [
            ...$page->toArray(),
            'totals' => ['in' => number_format((float) $in, 2, '.', ''), 'fees' => number_format((float) $fees, 2, '.', ''), 'out' => $out, 'balance' => bcsub(bcsub($in, $fees, 2), $out, 2)],
            'gateways' => Payment::query()->distinct()->orderBy('gateway')->pluck('gateway')->map(fn ($code) => ['code' => $code, 'name' => $gatewayName($code)]),
        ];
    }

    /** Corrects how a payment was recorded. The amount is fixed: delete and record again to change it. */
    public function update(Request $request, Payment $payment)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'transaction_id' => ['required', 'string', 'max:191', Rule::unique('payments')->where('gateway', $payment->gateway)->ignore($payment)],
            'fee' => 'required|numeric|min:0|max:9999999',
        ]);

        $payment->update([
            'created_at' => Carbon::parse($data['date'])->setTimeFrom($payment->created_at),
            'transaction_id' => $data['transaction_id'],
            'fee' => number_format((float) $data['fee'], 2, '.', ''),
        ]);
        ActivityLog::record('payment.edited', $payment->invoice, ['transaction_id' => $payment->transaction_id]);

        return $payment;
    }

    /** Removing a payment puts its invoice back to unpaid when what is left no longer covers it. */
    public function destroy(Payment $payment, BillingService $billing)
    {
        DB::transaction(function () use ($payment, $billing) {
            $invoice = Invoice::whereKey($payment->invoice_id)->lockForUpdate()->firstOrFail();
            $payment->delete();

            if ($invoice->status === 'paid' && bccomp($billing->balanceDue($invoice), '0', 2) > 0) {
                $invoice->update(['status' => 'unpaid', 'paid_at' => null]);
            }

            ActivityLog::record('payment.deleted', $invoice, ['transaction_id' => $payment->transaction_id, 'amount' => (string) $payment->amount]);
        });

        return response()->noContent();
    }
}

