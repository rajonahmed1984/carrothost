<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        return Invoice::with('client:id,name')
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->latest()
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

    public function cancel(Invoice $invoice)
    {
        if ($invoice->status !== 'unpaid' || $invoice->payments()->exists()) {
            throw ValidationException::withMessages(['invoice' => 'Only an unpaid invoice with no payments can be cancelled.']);
        }

        $invoice->update(['status' => 'cancelled']);
        ActivityLog::record('invoice.cancelled', $invoice);

        return $invoice;
    }
}
