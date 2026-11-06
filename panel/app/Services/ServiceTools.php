<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Product;
use App\Models\Service;
use App\Models\ServiceUpgrade;
use App\Provisioning\ManagesAccounts;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/** What an admin does to one service from its page, beyond editing the record. */
class ServiceTools
{
    public function __construct(private readonly BillingService $billing, private readonly CustomerMailer $mailer) {}

    /** The module for this service's account, or a message saying why there is none. */
    public function module(Service $service): ManagesAccounts
    {
        $class = config("billing.provisioning_modules.{$service->product->module}.class");

        if (! $class || ! is_subclass_of($class, ManagesAccounts::class)) {
            throw ValidationException::withMessages(['service' => 'This product has no server module that can do this.']);
        }

        if (! $service->remote_id || ! $service->server) {
            throw ValidationException::withMessages(['service' => 'This service has no account on a server yet.']);
        }

        return new $class($service->server);
    }

    public static function hasTools(Service $service): bool
    {
        $class = config("billing.provisioning_modules.{$service->product->module}.class");

        return $class && is_subclass_of($class, ManagesAccounts::class) && $service->remote_id && $service->server_id;
    }

    public function refreshUsage(Service $service): void
    {
        $usage = $this->run(fn () => $this->module($service)->usage($service));

        $service->update([
            'usage_metrics' => $usage['metrics'],
            'disk_usage' => $usage['disk_used'],
            'disk_limit' => $usage['disk_limit'],
            'bw_usage' => $usage['bw_used'],
            'bw_limit' => $usage['bw_limit'],
            'usage_updated_at' => now(),
        ]);
    }

    public function loginUrl(Service $service): string
    {
        $url = $this->run(fn () => $this->module($service)->loginUrl($service));
        ActivityLog::record('service.panel_login', $service);

        return $url;
    }

    public function changePassword(Service $service, string $password): void
    {
        $this->run(fn () => $this->module($service)->changePassword($service, $password));
        $service->update(['credentials' => [...($service->credentials?->toArray() ?? []), 'password' => $password]]);
        ActivityLog::record('service.password_changed', $service);
    }

    /** Puts the account on its product's package, after the product was changed here. */
    public function changePackage(Service $service): void
    {
        $package = $service->product->module_package;

        if (! $package) {
            throw ValidationException::withMessages(['service' => "{$service->product->name} has no server package set. Set one in the product settings."]);
        }

        $this->run(fn () => $this->module($service)->changePackage($service, $package));
        ActivityLog::record('service.package_changed', $service, ['package' => $package]);
    }

    /**
     * What moving to another product or cycle costs. On the same cycle the client pays the price
     * difference for the days left; on a new cycle they pay the new price less the unused days.
     *
     * @return array{days_left: int, cycle_days: int, credit: string, new_recurring: string, amount_due: string, new_next_due_date: string|null}
     */
    public function quote(Service $service, Product $product, string $cycle): array
    {
        $price = $product->prices()->where('cycle', $cycle)->first();

        if (! $price) {
            throw ValidationException::withMessages(['cycle' => "{$product->name} has no {$cycle} price."]);
        }

        $newRecurring = bcmul($price->priceIn($service->client->currencyCode()), (string) max(1, $service->quantity), 2);
        $due = $service->next_due_date;
        $daysLeft = 0;
        $cycleDays = 0;

        if ($due) {
            $start = $due->copy()->subMonthsNoOverflow(config("billing.cycles.{$service->cycle}"));
            $cycleDays = max(1, (int) $start->diffInDays($due));
            $daysLeft = $due->isFuture() ? min($cycleDays, (int) today()->diffInDays($due)) : 0;
        }

        $share = $cycleDays ? $daysLeft / $cycleDays : 0;
        $credit = round((float) $service->recurring_amount * $share, 2);

        if ($cycle === $service->cycle) {
            $amount = ((float) $newRecurring - (float) $service->recurring_amount) * $share;
            $nextDue = $due?->toDateString();
        } else {
            $amount = (float) $newRecurring - $credit;
            $nextDue = today()->addMonthsNoOverflow(config("billing.cycles.{$cycle}"))->toDateString();
        }

        return [
            'days_left' => $daysLeft,
            'cycle_days' => $cycleDays,
            'credit' => number_format($credit, 2, '.', ''),
            'new_recurring' => $newRecurring,
            'amount_due' => number_format(max(0, round($amount, 2)), 2, '.', ''),
            'new_next_due_date' => $nextDue,
        ];
    }

    /** Applies the change now when nothing is owed; otherwise raises an order and invoice that apply it when paid. */
    public function upgrade(Service $service, Product $product, string $cycle): ?Invoice
    {
        if ($product->id === $service->product_id && $cycle === $service->cycle) {
            throw ValidationException::withMessages(['product_id' => 'Choose a different product or billing cycle.']);
        }

        if ($this->pendingUpgrade($service)) {
            throw ValidationException::withMessages(['product_id' => 'This service already has an upgrade waiting on payment. Cancel that invoice first.']);
        }

        $quote = $this->quote($service, $product, $cycle);

        return DB::transaction(function () use ($service, $product, $cycle, $quote) {
            $upgrade = $service->upgrades()->create([
                'old_product_id' => $service->product_id,
                'old_cycle' => $service->cycle,
                'new_product_id' => $product->id,
                'new_cycle' => $cycle,
                'new_recurring_amount' => $quote['new_recurring'],
                'new_next_due_date' => $quote['new_next_due_date'],
                'amount_due' => $quote['amount_due'],
            ]);
            ActivityLog::record('service.upgrade.requested', $service, ['to' => $product->name, 'cycle' => $cycle, 'due' => $quote['amount_due']]);

            if (bccomp($quote['amount_due'], '0', 2) <= 0) {
                $this->apply($upgrade);

                return null;
            }

            $order = Order::create(['client_id' => $service->client_id, 'amount' => $quote['amount_due'], 'payment_method' => $service->payment_method]);
            $invoice = $this->billing->createInvoice($service->client, [[
                'description' => "Upgrade/Downgrade: {$service->product->name} to {$product->name} ({$cycle})".($service->domain ? " - {$service->domain}" : ''),
                'amount' => $quote['amount_due'],
                'kind' => 'upgrade',
                'service_id' => $service->id,
            ]], today(), $order);
            $upgrade->update(['invoice_id' => $invoice->id]);

            return $invoice;
        });
    }

    /** The upgrade still waiting on payment. One whose invoice was cancelled, merged away or deleted is closed here. */
    public function pendingUpgrade(Service $service): ?ServiceUpgrade
    {
        foreach ($service->upgrades()->where('status', 'pending')->with('invoice:id,status,number')->get() as $upgrade) {
            if ($upgrade->invoice && $upgrade->invoice->status === 'unpaid') {
                return $upgrade->load('newProduct:id,name');
            }
            $upgrade->update(['status' => 'cancelled']);
        }

        return null;
    }

    /** Called when an upgrade invoice is paid. */
    public function applyPaid(Service $service, Invoice $invoice): void
    {
        $upgrade = $service->upgrades()->where('invoice_id', $invoice->id)->where('status', 'pending')->first();

        if ($upgrade) {
            $this->apply($upgrade);
        }
    }

    private function apply(ServiceUpgrade $upgrade): void
    {
        $service = $upgrade->service()->with('product')->first();
        $oldPackage = $service->product->module_package;
        $service->update([
            'product_id' => $upgrade->new_product_id,
            'cycle' => $upgrade->new_cycle,
            'recurring_amount' => $upgrade->new_recurring_amount,
            'next_due_date' => $upgrade->new_next_due_date ?? $service->next_due_date,
            'renewal_invoiced_for' => null,
        ]);
        $upgrade->update(['status' => 'done']);
        ActivityLog::record('service.upgraded', $service, ['product_id' => $upgrade->new_product_id, 'cycle' => $upgrade->new_cycle]);

        // Move the account to the new package; a failure is shown on the service, the billing change stands.
        $service->load('product', 'server');
        if (self::hasTools($service) && $service->product->module_package && $service->product->module_package !== $oldPackage) {
            try {
                $this->changePackage($service);
            } catch (\Throwable $e) {
                $service->update(['provision_error' => 'Upgrade billed, but the package change on the server failed: '.$e->getMessage()]);
            }
        }
    }

    public function transfer(Service $service, Client $to): void
    {
        if ($to->id === $service->client_id) {
            throw ValidationException::withMessages(['client_id' => 'The service already belongs to this client.']);
        }

        $from = $service->client;
        $service->update(['client_id' => $to->id]);
        ActivityLog::record('service.transferred', $service, ['from' => $from->id, 'to' => $to->id]);
    }

    public function sendWelcome(Service $service): void
    {
        if (! $service->client->email) {
            throw ValidationException::withMessages(['service' => 'The client has no email address.']);
        }

        $this->mailer->serviceWelcome($service);
        ActivityLog::record('service.welcome_sent', $service);
    }

    /** Server errors become a form error the admin can read, never a 500. */
    private function run(callable $call): mixed
    {
        try {
            return $call();
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw ValidationException::withMessages(['service' => $e instanceof RuntimeException ? $e->getMessage() : 'The server did not respond: '.class_basename($e)]);
        }
    }
}
