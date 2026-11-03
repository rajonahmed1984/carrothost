<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Gateway;
use App\Models\Invoice;
use App\Services\Auth\LoginService;
use App\Services\PaymentService;
use App\Support\Auth\Portal;
use Illuminate\Http\Request;

/** The customer's own data. Every query starts from the signed-in client. */
class AccountController extends Controller
{
    public function login(Request $request, LoginService $login)
    {
        return $login->authenticate($request, Portal::CLIENT);
    }

    public function logout(Request $request, LoginService $login)
    {
        $login->logout($request);

        return response()->noContent();
    }

    public function me(Request $request)
    {
        return $this->profile($request);
    }

    /** The emailed code at sign-in is the customer's own choice, so an admin logged in as them cannot change it. */
    public function security(Request $request)
    {
        abort_if($request->session()->has(LoginService::IMPERSONATOR), 403, 'Security settings cannot be changed while logged in as a client.');

        $data = $request->validate(['otp_enabled' => 'required|boolean']);
        $request->user('client')->update($data);
        ActivityLog::record($data['otp_enabled'] ? 'client.otp_enabled' : 'client.otp_disabled', $request->user('client'));

        return $this->profile($request);
    }

    public function overview(Request $request)
    {
        $client = $request->user('client');

        return [
            'services' => $client->services()
                ->with('product:id,name')
                ->latest()
                ->get(['id', 'product_id', 'domain', 'cycle', 'recurring_amount', 'status', 'next_due_date']),
            'domains' => $client->domains()
                ->latest()
                ->get(['id', 'name', 'status', 'expires_at', 'recurring_amount']),
            'invoices' => $client->invoices()
                ->latest()
                ->limit(50)
                ->get(['id', 'number', 'status', 'currency', 'total', 'due_date']),
        ];
    }

    public function invoice(Request $request, int $id, PaymentService $payments)
    {
        /** @var Invoice $invoice */
        $invoice = $request->user('client')->invoices()->findOrFail($id);
        $enabled = Gateway::where('is_enabled', true)->get()->keyBy('code');
        $unpaid = $invoice->status === 'unpaid';

        return [
            ...$invoice->only('id', 'number', 'status', 'currency', 'total', 'due_date'),
            'balance' => $payments->balance($invoice),
            'pay_to' => config('billing.pay_to'),
            'items' => $invoice->items()->get(['id', 'description', 'amount']),
            'payments' => $invoice->payments()->get(['id', 'gateway', 'transaction_id', 'amount']),
            'payment_instructions' => $unpaid ? ($enabled->get('manual')?->config['instructions'] ?? null) : null,
            'gateways' => $unpaid
                ? $enabled->except('manual')
                    ->filter(fn (Gateway $gateway) => config("billing.gateways.{$gateway->code}.driver"))
                    ->map(fn (Gateway $gateway) => [
                        'code' => $gateway->code,
                        'name' => $gateway->config['display_name'] ?? config("billing.gateways.{$gateway->code}.name"),
                        'button' => $gateway->config['button_label'] ?? null,
                    ])
                    ->values()
                : [],
        ];
    }

    public function pay(Request $request, int $id, PaymentService $payments)
    {
        $invoice = $request->user('client')->invoices()->findOrFail($id);
        $data = $request->validate(['gateway' => 'required|string']);

        return ['redirect_url' => $payments->begin($invoice, $data['gateway'])];
    }

    private function profile(Request $request): array
    {
        $client = $request->user('client');

        return [
            ...$client->only('id', 'name', 'email', 'otp_enabled'),
            'has_password' => $client->password !== null,
            'impersonating' => $request->session()->has(LoginService::IMPERSONATOR),
        ];
    }
}
