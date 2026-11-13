<?php

namespace App\Services;

use App\Jobs\ProvisionService;
use App\Models\Domain;
use App\Models\Service;

class RenewalService
{
    public function __construct(private BillingService $billing) {}

    /** Raises each renewal invoice once per due date, so cron can run as often as it likes. */
    public function generateInvoices(): int
    {
        $cutoff = now()->addDays(config('billing.renewal_notice_days'))->toDateString();
        $count = 0;

        $services = Service::with(['client', 'product'])
            ->whereIn('status', ['active', 'suspended'])
            // Ending on the due date (set to terminate, or an accepted cancellation): not billed again.
            ->where('terminate_end_of_cycle', false)
            ->whereNull('cancellation_accepted_at')
            ->whereDate('next_due_date', '<=', $cutoff)
            ->get();

        foreach ($services as $service) {
            if ($service->renewal_invoiced_for?->equalTo($service->next_due_date)) {
                continue;
            }

            $this->billing->createInvoice($service->client, [[
                'description' => "Renewal: {$service->product->name}".($service->domain ? " - {$service->domain}" : ''),
                'amount' => $service->recurring_amount,
                'kind' => 'renewal',
                'service_id' => $service->id,
            ]], $service->next_due_date);

            $service->update(['renewal_invoiced_for' => $service->next_due_date]);
            $count++;
        }

        $domains = Domain::with('client')
            ->where('status', 'active')
            ->where('auto_renew', true)
            ->whereDate('expires_at', '<=', $cutoff)
            ->get();

        foreach ($domains as $domain) {
            if ($domain->renewal_invoiced_for?->equalTo($domain->expires_at)) {
                continue;
            }

            $this->billing->createInvoice($domain->client, [[
                'description' => "Domain renewal: {$domain->name} ({$domain->years} yr)",
                'amount' => $domain->recurring_amount,
                'kind' => 'renewal',
                'domain_id' => $domain->id,
            ]], $domain->expires_at);

            $domain->update(['renewal_invoiced_for' => $domain->expires_at]);
            $count++;
        }

        return $count;
    }

    public function suspendOverdue(): int
    {
        if (! config('billing.suspension_enabled')) {
            return 0;
        }

        $this->unsuspendOverridden();

        $days = max((int) config('billing.suspend_after_days'), 0);
        $cutoff = today()->subDays($days)->toDateString();
        $op = $days === 0 ? '<' : '<=';

        $services = Service::where('status', 'active')
            ->where(function ($q) use ($op, $cutoff) {
                $q->whereDate('next_due_date', $op, $cutoff)
                    ->orWhere(function ($w) use ($op, $cutoff) {
                        $w->whereNull('next_due_date')
                            ->whereHas('invoiceItems.invoice', fn ($inv) => $inv->where('status', 'unpaid')->whereDate('due_date', $op, $cutoff));
                    });
            })
            ->whereNotIn('provision_status', ['queued', 'running'])
            // Avoid hammering an unreachable server every minute; retry failed attempts after 15 minutes.
            ->where(fn ($q) => $q->where('provision_status', '!=', 'failed')->orWhere('updated_at', '<=', now()->subMinutes(15)))
            // An admin can hold off suspension until a date ("do not suspend until").
            ->where(fn ($q) => $q->whereNull('override_suspend_until')->orWhereDate('override_suspend_until', '<', today()))
            ->get();

        foreach ($services as $service) {
            if ($service->remote_id) {
                $service->update(['provision_status' => 'queued']);
                ProvisionService::dispatch($service->id, 'suspend');
            } else {
                // Nothing on a server to suspend (manual product): flag it for an admin.
                $service->update(['status' => 'suspended', 'auto_suspended' => true, 'provision_status' => 'manual_required']);
                app(CustomerMailer::class)->serviceSuspended($service);
            }
        }

        return $services->count();
    }

    /** Keeps any auto-suspended service active until its "do not suspend until" override date passes. */
    private function unsuspendOverridden(): void
    {
        $services = Service::with('product')
            ->where('status', 'suspended')
            ->where('auto_suspended', true)
            ->whereNotNull('override_suspend_until')
            ->whereDate('override_suspend_until', '>=', today())
            ->whereNotIn('provision_status', ['queued', 'running'])
            ->where(fn ($q) => $q->where('provision_status', '!=', 'failed')->orWhere('updated_at', '<=', now()->subMinutes(15)))
            ->get();

        foreach ($services as $service) {
            if ($service->remote_id) {
                $service->update(['provision_status' => 'queued']);
                ProvisionService::dispatch($service->id, 'unsuspend', true, false);
            } else {
                $service->update([
                    'status' => 'active',
                    'auto_suspended' => false,
                    'provision_status' => $service->product?->module ? 'manual_required' : 'none',
                ]);
            }
        }
    }
}
