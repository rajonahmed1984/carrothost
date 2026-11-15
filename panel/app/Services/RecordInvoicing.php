<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Service;
use App\Support\BillingPeriod;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Invoices an admin raises by hand for services and domains, the "Invoice Selected Items" of the
 * client profile and the "Create Invoice" of a service or domain page.
 *
 * Two modes:
 *  - renewal: the usual renewal invoice for the coming term. Paying it moves the due date on.
 *  - already_renewed: the renewal was done by hand (a domain renewed at the registrar, a due date
 *    pushed forward) and never invoiced. The invoice covers the term that just started and paying
 *    it records the money only, so the due date is not moved a second time.
 */
class RecordInvoicing
{
    public const MODES = ['renewal', 'already_renewed'];

    /** Statuses a record can still be billed in. A terminated or cancelled one has nothing left to renew. */
    private const SERVICE_STATUSES = ['active', 'suspended', 'pending'];

    private const DOMAIN_STATUSES = ['active', 'grace', 'expired'];

    public function __construct(private readonly BillingService $billing) {}

    /**
     * @param  Collection<int, Service>  $services
     * @param  Collection<int, Domain>  $domains
     * @param  array{0: CarbonInterface, 1: CarbonInterface}|null  $period  replaces the period of the single record picked
     */
    public function create(Collection $services, Collection $domains, string $mode, ?CarbonInterface $dueDate = null, bool $notify = true, ?array $period = null): Invoice
    {
        $services->load(['client', 'product']);
        $domains->load('client');

        $records = $services->concat($domains);
        if ($records->isEmpty()) {
            throw ValidationException::withMessages(['records' => 'Pick at least one product/service or domain.']);
        }
        if ($records->pluck('client_id')->unique()->count() > 1) {
            throw ValidationException::withMessages(['records' => 'An invoice belongs to one client. Pick records of the same client.']);
        }

        $recordOnly = $mode === 'already_renewed';
        $lines = [];
        $due = [];
        $errors = [];

        foreach ($services as $service) {
            try {
                [$lines[], $due[]] = $this->serviceLine($service, $recordOnly, $records->count() === 1 ? $period : null);
            } catch (ValidationException $e) {
                $errors[] = $e->errors()['records'][0];
            }
        }
        foreach ($domains as $domain) {
            try {
                [$lines[], $due[]] = $this->domainLine($domain, $recordOnly, $records->count() === 1 ? $period : null);
            } catch (ValidationException $e) {
                $errors[] = $e->errors()['records'][0];
            }
        }
        if ($errors) {
            throw ValidationException::withMessages(['records' => implode(' ', $errors)]);
        }

        $client = $records->first()->client;
        $earliest = collect($due)->min();
        $dueDate ??= $recordOnly || $earliest->lessThan(today()) ? today() : $earliest;

        $invoice = $this->billing->createInvoice($client, $lines, $dueDate, null, notify: $notify, applyCredit: ! $recordOnly);

        if (! $recordOnly) {
            // The daily renewal run then skips this term instead of raising a second invoice.
            foreach ($services as $service) {
                $service->forceFill(['renewal_invoiced_for' => $service->next_due_date])->save();
            }
            foreach ($domains as $domain) {
                $domain->forceFill(['renewal_invoiced_for' => $domain->expires_at])->save();
            }
        }

        ActivityLog::record('invoice.created', $invoice, ['source' => 'records', 'mode' => $mode]);

        return $invoice;
    }

    /** @return array{0: array<string, mixed>, 1: CarbonInterface} the invoice line and the date it falls due */
    private function serviceLine(Service $service, bool $recordOnly, ?array $period): array
    {
        $name = "{$service->product->name}".($service->domain ? " - {$service->domain}" : '');

        if (! in_array($service->status, self::SERVICE_STATUSES, true)) {
            $this->fail("{$name} is {$service->status}, so there is nothing to renew.");
        }
        if (! $service->next_due_date) {
            $this->fail("{$name} has no next due date.");
        }
        if (bccomp((string) $service->recurring_amount, '0', 2) <= 0) {
            $this->fail("{$name} has no recurring price.");
        }

        $months = (int) config("billing.cycles.{$service->cycle}");
        if ($months <= 0) {
            $this->fail("{$name} is billed {$service->cycle}, which has no renewal period.");
        }

        $period ??= $recordOnly
            ? BillingPeriod::endingBefore($service->next_due_date, $months)
            : BillingPeriod::forCycle($service->cycle, $service->next_due_date);
        $this->guardDuplicate(InvoiceItem::where('service_id', $service->id), $name, $period[0], $recordOnly);

        return [
            BillingPeriod::line([
                'description' => "Renewal: {$name}",
                'amount' => $service->recurring_amount,
                'kind' => 'renewal',
                'service_id' => $service->id,
                'record_only' => $recordOnly,
            ], $period),
            Carbon::parse($service->next_due_date),
        ];
    }

    /** @return array{0: array<string, mixed>, 1: CarbonInterface} */
    private function domainLine(Domain $domain, bool $recordOnly, ?array $period): array
    {
        if (! in_array($domain->status, self::DOMAIN_STATUSES, true)) {
            $this->fail("{$domain->name} is {$domain->status}, so it cannot be renewed.");
        }
        if (! $domain->expires_at) {
            $this->fail("{$domain->name} has no expiry date.");
        }
        if (bccomp((string) $domain->recurring_amount, '0', 2) <= 0) {
            $this->fail("{$domain->name} has no renewal price.");
        }

        $period ??= $recordOnly
            ? BillingPeriod::endingBefore($domain->expires_at, $domain->years * 12)
            : BillingPeriod::forYears($domain->years, $domain->expires_at);
        $this->guardDuplicate(InvoiceItem::where('domain_id', $domain->id), $domain->name, $period[0], $recordOnly);

        return [
            BillingPeriod::line([
                'description' => "Domain renewal: {$domain->name} ({$domain->years} yr)",
                'amount' => $domain->recurring_amount,
                'kind' => 'renewal',
                'domain_id' => $domain->id,
                'record_only' => $recordOnly,
            ], $period),
            Carbon::parse($domain->expires_at),
        ];
    }

    /**
     * One live invoice per term: an unpaid renewal still waiting, or any invoice that already
     * covers the term starting on this date. Cancelled invoices do not count.
     */
    private function guardDuplicate($items, string $name, CarbonInterface $start, bool $recordOnly): void
    {
        $same = (clone $items)->where('kind', 'renewal')
            ->whereHas('invoice', fn ($q) => $q->where('status', '!=', 'cancelled'))
            ->where(fn ($q) => $q->whereDate('period_start', $start->toDateString())
                ->when(! $recordOnly, fn ($w) => $w->orWhereHas('invoice', fn ($i) => $i->where('status', 'unpaid'))))
            ->with('invoice:id,number')
            ->first();

        if ($same) {
            $this->fail("{$name} already has invoice #{$same->invoice->number} for this term.");
        }
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['records' => $message]);
    }
}
