<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\BillingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        return Payment::with(['invoice:id,number,client_id', 'invoice.client:id,name'])
            ->when($request->query('q'), function ($query, $q) {
                $query->where('transaction_id', 'like', "%{$q}%")
                    ->orWhere('gateway', 'like', "%{$q}%")
                    ->orWhereHas('invoice', fn ($inv) => $inv->where('number', 'like', "%{$q}%")
                        ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$q}%")));
            })
            ->when($request->query('gateway'), fn ($query, $gw) => $query->where('gateway', $gw))
            ->latest('id')
            ->paginate(25);
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

