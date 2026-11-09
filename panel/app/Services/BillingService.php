<?php

namespace App\Services;

use App\Events\InvoicePaid;
use App\Jobs\ProvisionService;
use App\Jobs\SendInvoiceSms;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Service;
use App\Models\Tld;
use App\Support\PaymentMethods;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BillingService
{
    public function __construct(private readonly CustomerMailer $mailer) {}

    /**
     * @param  array<int, array{product_id: int, cycle: string, domain?: ?string, module_options?: ?array}>  $services
     * @param  array<int, array{name: string, action: string, years: int, epp_code?: ?string}>  $domains
     */
    public function createOrder(Client $client, array $services, array $domains = []): Order
    {
        // Everything on the order is priced in the client's currency.
        $currency = $client->currencyCode();

        return DB::transaction(function () use ($client, $services, $domains, $currency) {
            $order = Order::create(['client_id' => $client->id]);
            $items = [];
            $setupOnOrder = [];

            foreach ($services as $line) {
                $product = Product::with('prices')->findOrFail($line['product_id']);
                $price = $product->prices->firstWhere('cycle', $line['cycle']);

                if (! $price) {
                    throw ValidationException::withMessages(['services' => "{$product->name} has no {$line['cycle']} price."]);
                }

                $service = Service::create([
                    'client_id' => $client->id,
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'domain' => $line['domain'] ?? null,
                    'cycle' => $line['cycle'],
                    'recurring_amount' => $price->priceIn($currency),
                    'module_options' => $line['module_options'] ?? null,
                ]);

                if ($product->module && $product->setup_mode === 'order') {
                    $setupOnOrder[] = $service;
                }

                $items[] = [
                    'description' => "{$product->name} ({$line['cycle']})".($service->domain ? " - {$service->domain}" : ''),
                    'amount' => bcadd($price->priceIn($currency), $price->setupFeeIn($currency), 2),
                    'kind' => 'new',
                    'service_id' => $service->id,
                ];
            }

            foreach ($domains as $line) {
                $name = strtolower($line['name']);
                $tld = $this->tldFor($name);
                $years = (string) $line['years'];
                $unit = $tld->priceIn($line['action'] === 'transfer' ? 'transfer' : 'register', $currency);

                $domain = Domain::create([
                    'client_id' => $client->id,
                    'order_id' => $order->id,
                    'name' => $name,
                    'registrar' => $tld->registrar,
                    'action' => $line['action'],
                    'epp_code' => $line['epp_code'] ?? null,
                    'years' => $line['years'],
                    'auto_renew' => (bool) config('billing.domains.auto_renew'),
                    'nameservers' => Domain::defaultNameservers() ?: null,
                    'recurring_amount' => bcmul($tld->priceIn('renew', $currency), $years, 2),
                    'first_payment_amount' => bcmul($unit, $years, 2),
                    'payment_method' => $order->payment_method,
                ]);

                $items[] = [
                    'description' => ucfirst($line['action'])." {$name} ({$years} yr)",
                    'amount' => bcmul($unit, $years, 2),
                    'kind' => 'new',
                    'domain_id' => $domain->id,
                ];
            }

            $invoice = $this->createInvoice($client, $items, now()->addDays((int) config('billing.invoice_due_days')), $order);
            $order->update(['amount' => $invoice->total]);

            // Set up before payment: the service runs from now and falls due with the first
            // invoice, so overdue suspension catches it if that invoice is never paid.
            foreach ($setupOnOrder as $service) {
                $service->update([
                    'status' => 'active',
                    'next_due_date' => $invoice->due_date,
                    'renewal_invoiced_for' => $invoice->due_date,
                    'provision_status' => 'queued',
                ]);
                ProvisionService::dispatch($service->id, 'create')->afterCommit();
            }

            DB::afterCommit(fn () => $this->mailer->orderPlaced($order));

            return $order;
        });
    }

    public function createInvoice(Client $client, array $items, CarbonInterface $dueDate, ?Order $order = null): Invoice
    {
        return DB::transaction(function () use ($client, $items, $dueDate, $order) {
            $total = array_reduce($items, fn (string $sum, array $item) => bcadd($sum, (string) $item['amount'], 2), '0');

            $invoice = Invoice::create([
                'number' => Invoice::nextNumber(),
                'client_id' => $client->id,
                'order_id' => $order?->id,
                // Item amounts are already in the client's currency: prices, renewals and credit all are.
                'currency' => $client->currencyCode(),
                'total' => $total,
                'due_date' => $dueDate->toDateString(),
            ]);

            $invoice->items()->createMany($items);
            DB::afterCommit(function () use ($invoice, $order) {
                $this->mailer->invoiceCreated($invoice);
                // An order's invoice is in the admins' new order email already.
                if (! $order) {
                    app(AdminNotifier::class)->invoiceCreated($invoice);
                }
                // Credit the client already holds pays new invoices straight away. Add Funds invoices are how credit is bought, so never.
                if (! self::isPrepayment($invoice)) {
                    app(CreditService::class)->applyToInvoice($invoice);
                    // Queued after credit: one that credit paid in full gets only the paid SMS.
                    SendInvoiceSms::notify($invoice->id, 'invoice_created');
                }
            });

            return $invoice->refresh();
        });
    }

    /**
     * Safe to call repeatedly with the same gateway and transaction id: gateways
     * redeliver callbacks, and a redelivery returns the original payment.
     */
    public function recordPayment(Invoice $invoice, string $gateway, string $transactionId, string $amount, array $meta = []): Payment
    {
        if (bccomp($amount, '0', 2) <= 0) {
            throw ValidationException::withMessages(['amount' => 'Amount must be greater than zero.']);
        }

        [$payment, $becamePaid, $locked] = DB::transaction(function () use ($invoice, $gateway, $transactionId, $amount, $meta) {
            $locked = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            $existing = Payment::where('gateway', $gateway)->where('transaction_id', $transactionId)->first();
            if ($existing) {
                if ($existing->invoice_id !== $locked->id) {
                    throw ValidationException::withMessages(['transaction_id' => "Transaction {$transactionId} is already recorded on another invoice."]);
                }

                return [$existing, false, $locked];
            }

            if ($locked->status === 'cancelled') {
                throw ValidationException::withMessages(['invoice' => 'This invoice is cancelled.']);
            }

            $payment = $locked->payments()->create([
                'gateway' => $gateway,
                'transaction_id' => $transactionId,
                'amount' => $amount,
                'currency' => $locked->currency,
                'meta' => $meta ?: null,
                'recorded_by' => auth('web')->id(),
            ]);

            ActivityLog::record('payment.recorded', $locked, ['gateway' => $gateway, 'amount' => $amount]);

            return [$payment, $this->markPaidIfCovered($locked, $gateway, $transactionId), $locked];
        });

        if ($becamePaid) {
            $this->announcePaid($locked);
        }

        return $payment;
    }

    /** What is still owed: the total less what has been paid. Never negative. */
    public function balanceDue(Invoice $invoice): string
    {
        $due = bcsub((string) $invoice->total, $this->paid($invoice), 2);

        return bccomp($due, '0', 2) > 0 ? $due : '0.00';
    }

    /**
     * Marks an unpaid invoice paid once payments cover its total, and sets up what it was for.
     * Call inside a transaction with the invoice locked. True when it became paid now.
     */
    public function markPaidIfCovered(Invoice $locked, string $gateway, string $transactionId = ''): bool
    {
        if ($locked->status !== 'unpaid' || bccomp($this->paid($locked), (string) $locked->total, 2) < 0) {
            return false;
        }

        $locked->update(['status' => 'paid', 'paid_at' => now()]);
        $this->applyPaidInvoice($locked, $gateway, $transactionId);

        return true;
    }

    /** Tells listeners and the customer, once the payment is safely stored. */
    public function announcePaid(Invoice $invoice): void
    {
        event(new InvoicePaid($invoice));
        DB::afterCommit(fn () => $this->mailer->paymentReceived($invoice));
        DB::afterCommit(fn () => app(AdminNotifier::class)->invoicePaid($invoice));
        SendInvoiceSms::notify($invoice->id, 'invoice_paid');
    }

    /** Item kinds that pay for something other than a service: buying credit, or other invoices at once. */
    public const PREPAYMENT_KINDS = ['add_funds', 'mass_pay'];

    /** Credit never pays these: Add Funds is how credit is bought, and Mass Pay only bundles other invoices. */
    public static function isPrepayment(Invoice $invoice): bool
    {
        return $invoice->items()->whereIn('kind', self::PREPAYMENT_KINDS)->exists();
    }

    private function paid(Invoice $invoice): string
    {
        return array_reduce(
            $invoice->payments()->pluck('amount')->all(),
            fn (string $sum, $value) => bcadd($sum, (string) $value, 2),
            '0',
        );
    }

    /**
     * One line of a paid Mass Pay invoice. It pays what its invoice still owes now, which can
     * be less than when the bundle was made; anything over becomes credit, so nothing is lost.
     */
    private function payBundledInvoice(Invoice $bundle, ?int $targetId, string $amount, string $gateway): void
    {
        $target = $targetId ? Invoice::find($targetId) : null;
        $owed = $target && $target->status === 'unpaid' ? $this->balanceDue($target) : '0.00';
        $paying = bccomp($owed, $amount, 2) < 0 ? $owed : $amount;

        if (bccomp($paying, '0', 2) > 0) {
            $this->recordPayment($target, $gateway, "MASSPAY-{$bundle->number}-{$target->id}", $paying, ['mass_pay_invoice' => $bundle->id]);
        }

        $left = bcsub($amount, $paying, 2);
        if (bccomp($left, '0', 2) > 0) {
            app(CreditService::class)->add($bundle->client, $left, "Overpayment on Mass Pay Invoice #{$bundle->number}", $bundle);
        }
    }

    private function applyPaidInvoice(Invoice $invoice, string $gateway, string $transactionId): void
    {
        foreach ($invoice->items()->with(['service.product', 'domain'])->get() as $item) {
            if ($item->kind === 'add_funds') {
                $via = config("billing.gateways.{$gateway}.name", $gateway);
                app(CreditService::class)->add($invoice->client, (string) $item->amount, "Add Funds via {$via}".($transactionId !== '' ? " (TRXID: {$transactionId})" : ''), $invoice);
            }

            if ($item->kind === 'mass_pay') {
                $this->payBundledInvoice($invoice, $item->target_invoice_id, (string) $item->amount, $gateway);
            }

            if ($item->kind === 'upgrade') {
                if ($item->service) {
                    $item->service->update(PaymentMethods::isGateway($gateway) ? ['payment_method' => $gateway] : []);
                    app(ServiceTools::class)->applyPaid($item->service, $invoice);
                }

                continue;
            }

            // The gateway the client last paid with becomes the record's payment method.
            $paidWith = PaymentMethods::isGateway($gateway) ? ['payment_method' => $gateway] : [];

            if ($item->service) {
                $item->service->update($paidWith);
                $item->kind === 'renewal' ? $this->renewService($item->service) : $this->activateService($item->service);
            }

            if ($item->domain) {
                $item->domain->update($paidWith);
                $item->kind === 'renewal' ? $this->renewDomain($item->domain) : $this->activateDomain($item->domain);
            }
        }

        if ($invoice->order_id) {
            Order::whereKey($invoice->order_id)->where('status', 'pending')->update(['status' => 'active']);
        }
    }

    private function activateService(Service $service): void
    {
        $product = $service->product;
        $alreadySetUp = $service->remote_id || in_array($service->provision_status, ['queued', 'running', 'done'], true);

        $service->update([
            'status' => 'active',
            'next_due_date' => now()->addMonthsNoOverflow($this->cycleMonths($service->cycle))->toDateString(),
            'renewal_invoiced_for' => null,
            ...$alreadySetUp ? [] : ['provision_status' => match (true) {
                ! $product->module, $product->setup_mode === 'manual' => 'manual_required',
                $product->setup_mode === 'accept' => 'awaiting_accept',
                default => 'queued',
            }],
        ]);

        if (! $alreadySetUp && $service->provision_status === 'queued') {
            ProvisionService::dispatch($service->id, 'create')->afterCommit();
        }
    }

    private function renewService(Service $service): void
    {
        $changes = [
            'next_due_date' => $service->next_due_date->copy()->addMonthsNoOverflow($this->cycleMonths($service->cycle))->toDateString(),
        ];

        // Only lift suspensions billing applied; an admin suspension (abuse, say) stays.
        if ($service->status === 'suspended' && $service->auto_suspended && config('billing.unsuspension_enabled')) {
            if ($service->remote_id) {
                $changes['provision_status'] = 'queued';
                ProvisionService::dispatch($service->id, 'unsuspend')->afterCommit();
            } else {
                $changes += ['status' => 'active', 'auto_suspended' => false];
            }
        }

        $service->update($changes);

        // Nothing on a server to unsuspend: it is back on now, so tell the client.
        if (($changes['status'] ?? null) === 'active') {
            DB::afterCommit(fn () => $this->mailer->serviceUnsuspended($service));
        }
    }

    private function activateDomain(Domain $domain): void
    {
        // Registrar modules are not connected yet, so fulfilment waits on an admin.
        // The domain stays pending until someone records the registration.
        $domain->update(['provision_status' => 'manual_required']);
    }

    private function renewDomain(Domain $domain): void
    {
        $expires = $domain->expires_at->copy()->addYearsNoOverflow($domain->years)->toDateString();
        $domain->update([
            'expires_at' => $expires,
            'next_due_date' => $expires,
            'provision_status' => 'manual_required',
            // Paid: an expired or grace domain is live again once renewed at the registrar.
            ...in_array($domain->status, ['expired', 'grace'], true) ? ['status' => 'active'] : [],
        ]);
    }

    public function tldFor(string $domain): Tld
    {
        // Longest suffix first, so example.com.bd matches .com.bd rather than .bd.
        $parts = explode('.', $domain);

        for ($i = 1; $i < count($parts); $i++) {
            $tld = Tld::where('tld', '.'.implode('.', array_slice($parts, $i)))->where('is_active', true)->first();
            if ($tld) {
                return $tld;
            }
        }

        throw ValidationException::withMessages(['domains' => "No active pricing for {$domain}."]);
    }

    private function cycleMonths(string $cycle): int
    {
        return config("billing.cycles.{$cycle}");
    }
}
