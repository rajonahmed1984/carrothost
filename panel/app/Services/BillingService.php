<?php

namespace App\Services;

use App\Events\InvoicePaid;
use App\Jobs\ProvisionService;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Service;
use App\Models\Tld;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BillingService
{
    /**
     * @param  array<int, array{product_id: int, cycle: string, domain?: ?string}>  $services
     * @param  array<int, array{name: string, action: string, years: int, epp_code?: ?string}>  $domains
     */
    public function createOrder(Client $client, array $services, array $domains = []): Order
    {
        return DB::transaction(function () use ($client, $services, $domains) {
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
                    'recurring_amount' => $price->price,
                ]);

                if ($product->module && $product->setup_mode === 'order') {
                    $setupOnOrder[] = $service;
                }

                $items[] = [
                    'description' => "{$product->name} ({$line['cycle']})".($service->domain ? " - {$service->domain}" : ''),
                    'amount' => bcadd($price->price, $price->setup_fee, 2),
                    'kind' => 'new',
                    'service_id' => $service->id,
                ];
            }

            foreach ($domains as $line) {
                $name = strtolower($line['name']);
                $tld = $this->tldFor($name);
                $years = (string) $line['years'];
                $unit = $line['action'] === 'transfer' ? $tld->transfer_price : $tld->register_price;

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
                    'recurring_amount' => bcmul($tld->renew_price, $years, 2),
                ]);

                $items[] = [
                    'description' => ucfirst($line['action'])." {$name} ({$years} yr)",
                    'amount' => bcmul($unit, $years, 2),
                    'kind' => 'new',
                    'domain_id' => $domain->id,
                ];
            }

            $invoice = $this->createInvoice($client, $items, now()->addDays((int) config('billing.invoice_due_days')), $order);

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

            return $order;
        });
    }

    public function createInvoice(Client $client, array $items, CarbonInterface $dueDate, ?Order $order = null): Invoice
    {
        return DB::transaction(function () use ($client, $items, $dueDate, $order) {
            $total = array_reduce($items, fn (string $sum, array $item) => bcadd($sum, (string) $item['amount'], 2), '0');

            $invoice = Invoice::create([
                'client_id' => $client->id,
                'order_id' => $order?->id,
                'currency' => config('billing.currency'),
                'total' => $total,
                'due_date' => $dueDate->toDateString(),
            ]);

            $invoice->update(['number' => 'INV-'.str_pad((string) $invoice->id, 6, '0', STR_PAD_LEFT)]);
            $invoice->items()->createMany($items);

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

            $paid = array_reduce(
                $locked->payments()->pluck('amount')->all(),
                fn (string $sum, $value) => bcadd($sum, (string) $value, 2),
                '0',
            );

            $becamePaid = $locked->status === 'unpaid' && bccomp($paid, (string) $locked->total, 2) >= 0;

            if ($becamePaid) {
                $locked->update(['status' => 'paid', 'paid_at' => now()]);
                $this->applyPaidInvoice($locked);
            }

            return [$payment, $becamePaid, $locked];
        });

        if ($becamePaid) {
            event(new InvoicePaid($locked));
        }

        return $payment;
    }

    private function applyPaidInvoice(Invoice $invoice): void
    {
        foreach ($invoice->items()->with(['service.product', 'domain'])->get() as $item) {
            if ($item->service) {
                $item->kind === 'renewal' ? $this->renewService($item->service) : $this->activateService($item->service);
            }

            if ($item->domain) {
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
    }

    private function activateDomain(Domain $domain): void
    {
        // Registrar modules are not connected yet, so fulfilment waits on an admin.
        // The domain stays pending until someone records the registration.
        $domain->update(['provision_status' => 'manual_required']);
    }

    private function renewDomain(Domain $domain): void
    {
        $domain->update([
            'expires_at' => $domain->expires_at->copy()->addYearsNoOverflow($domain->years)->toDateString(),
            'provision_status' => 'manual_required',
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
