<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Services\BillingService;
use App\Services\PaymentService;
use App\Support\Currency;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Add Funds and Credit History in the client area. */
class CreditController extends Controller
{
    public function index(Request $request)
    {
        $client = $request->user('client');
        $methods = PaymentService::customerMethods();

        return [
            'balance' => $client->credit_balance,
            'currency' => $client->currencyCode(),
            'limits' => $this->limits($client->currencyCode()),
            'gateways' => $methods['gateways'],
            'bank_transfer' => $methods['payment_instructions'] !== null,
            'history' => $client->credits()->with('invoice:id,number')->latest('id')->limit(500)
                ->get(['id', 'invoice_id', 'description', 'amount', 'created_at']),
        ];
    }

    /** Raises an Add Funds invoice. Paying it turns into credit, which then pays any due invoices. */
    public function store(Request $request, BillingService $billing, PaymentService $payments)
    {
        $client = $request->user('client');
        $currency = $client->currencyCode();
        $limits = $this->limits($currency);
        $data = $request->validate([
            'amount' => "required|numeric|min:{$limits['min_deposit']}|max:{$limits['max_deposit']}",
            'gateway' => 'required|string',
        ]);
        $amount = number_format((float) $data['amount'], 2, '.', '');

        if (bccomp(bcadd((string) $client->credit_balance, $amount, 2), (string) $limits['max_balance'], 2) > 0) {
            throw ValidationException::withMessages(['amount' => "Your credit balance cannot go above {$limits['max_balance']} {$currency}."]);
        }

        $methods = PaymentService::customerMethods();
        $online = collect($methods['gateways'])->contains('code', $data['gateway']);
        if (! $online && ! ($data['gateway'] === 'manual' && $methods['payment_instructions'] !== null)) {
            throw ValidationException::withMessages(['gateway' => 'This payment method is not available.']);
        }

        $invoice = $billing->createInvoice($client, [['description' => 'Add Funds', 'amount' => $amount, 'kind' => 'add_funds']], today());
        ActivityLog::record('client.add_funds', $invoice, ['amount' => $amount, 'gateway' => $data['gateway']]);

        // Bank transfer shows its instructions on the invoice; online gateways go straight to payment.
        return [
            'invoice_id' => $invoice->id,
            'redirect_url' => $online ? $payments->begin($invoice, $data['gateway']) : null,
        ];
    }

    /** The Add Funds limits are set in BDT; a client in another currency sees them converted. */
    private function limits(string $currency): array
    {
        return array_map(fn ($bdt) => Currency::fromBase((string) $bdt, $currency), (array) config('billing.credit'));
    }
}
