<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\ClientContact;
use App\Models\ClientCredit;
use App\Models\Domain;
use App\Models\EmailLog;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Support\Currency;
use App\Models\Server;
use App\Models\Service;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Copies active WHMCS clients into the panel with their live services (and the products they use), all their
 * domains, invoices with payments and refunds, contacts, credit, support tickets, email history and activity log.
 * Safe to run again: clients match by email, services by client, product and domain, domains by client, name and
 * expiry, invoices by number (the WHMCS invoice id), tickets by number (the WHMCS ticket id).
 * While WHMCS is still the live billing system, a re-run brings existing services and invoices up to date with it:
 * status, due dates, amounts, invoice lines and any payments recorded since.
 * Service passwords are encrypted with the WHMCS key, so only usernames come across.
 */
class ImportWhmcs extends Command
{
    protected $signature = 'whmcs:import {database : The database holding the WHMCS tables} {--dry-run : Report what would happen without writing}';

    protected $description = 'Import active WHMCS clients with their services, domains, invoices, transactions and log';

    private const CYCLES = [
        'Monthly' => 'monthly', 'Quarterly' => 'quarterly', 'Semi-Annually' => 'semiannually',
        'Annually' => 'annually', 'Biennially' => 'biennially', 'Triennially' => 'triennially',
    ];

    private const PRICE_COLUMNS = [
        'monthly' => 'msetupfee', 'quarterly' => 'qsetupfee', 'semiannually' => 'ssetupfee',
        'annually' => 'asetupfee', 'biennially' => 'bsetupfee', 'triennially' => 'tsetupfee',
    ];

    private Connection $whmcs;

    /** @var array<int, Product> WHMCS product id => panel product */
    private array $products = [];

    /** @var array<int, Service> WHMCS service id => panel service */
    private array $serviceMap = [];

    /** @var array<int, Domain> WHMCS domain id => panel domain */
    private array $domainMap = [];

    private const GATEWAYS = ['bkash' => 'bkash', 'bkashrecurring' => 'bkash', 'bkashtokenized' => 'bkash', 'sslcommerz' => 'sslcommerz', 'paypal' => 'paypal'];

    public function handle(): int
    {
        config(['database.connections.whmcs' => [...config('database.connections.mysql'), 'database' => $this->argument('database')]]);
        $this->whmcs = DB::connection('whmcs');
        $currency = $this->whmcs->table('tblcurrencies')->where('code', config('billing.currency'))->value('id');

        if (! $currency) {
            $this->error('WHMCS has no '.config('billing.currency').' currency to read prices in.');

            return self::FAILURE;
        }

        // WHMCS marks a client Inactive while they have no active service, so a new customer whose
        // first order is still pending is Inactive: take them too, or their order would be lost.
        $clients = $this->whmcs->table('tblclients')
            ->where(fn ($q) => $q->where('status', 'Active')
                ->orWhereIn('id', $this->whmcs->table('tblorders')->where('status', 'Pending')->select('userid'))
                ->orWhereIn('id', $this->whmcs->table('tblhosting')->where('domainstatus', 'Pending')->select('userid'))
                ->orWhereIn('id', $this->whmcs->table('tbldomains')->whereIn('status', ['Pending', 'Pending Transfer', 'Pending Registration'])->select('userid')))
            ->where('status', '!=', 'Closed')
            ->orderBy('id')->get();
        $services = $this->whmcs->table('tblhosting')
            ->whereIn('userid', $clients->pluck('id'))
            ->whereIn('domainstatus', ['Active', 'Suspended', 'Pending', 'Terminated', 'Cancelled'])
            ->orderBy('id')
            ->get()
            ->groupBy('userid');
        $domains = $this->whmcs->table('tbldomains')->whereIn('userid', $clients->pluck('id'))->orderBy('id')->get()->groupBy('userid');
        $invoices = $this->whmcs->table('tblinvoices')->whereIn('userid', $clients->pluck('id'))->where('status', '!=', 'Draft')->orderBy('id')->get()->groupBy('userid');
        $currencies = $this->whmcs->table('tblcurrencies')->pluck('code', 'id');
        // By hostname, else by IP: hosts move accounts to a new machine name (Hawkhost hkg112 -> sng128)
        // while WHMCS keeps the old one, but the IP stays the same.
        $servers = $this->whmcs->table('tblservers')->get(['id', 'hostname', 'ipaddress'])->mapWithKeys(fn ($s) => [
            $s->id => Server::where('hostname', $s->hostname)->value('id')
                ?? (trim((string) $s->ipaddress) !== '' ? Server::where('ip_address', trim($s->ipaddress))->value('id') : null),
        ]);

        $counts = [
            'clients new' => 0, 'clients existing' => 0, 'services new' => 0, 'services updated' => 0, 'services unchanged' => 0, 'services skipped' => 0,
            'domains new' => 0, 'domains existing' => 0, 'invoices new' => 0, 'invoices updated' => 0, 'invoices unchanged' => 0,
            'transactions' => 0, 'contacts' => 0, 'credit entries' => 0, 'tickets' => 0, 'ticket replies' => 0, 'emails' => 0, 'log entries' => 0,
        ];
        $lateDue = [];

        $run = function () use ($clients, $services, $domains, $invoices, $currencies, $servers, $currency, &$counts, &$lateDue) {
            foreach ($clients as $row) {
                $client = $this->client($row, $currencies->get($row->currency));
                $counts[$client->wasRecentlyCreated ? 'clients new' : 'clients existing']++;

                foreach ($services->get($row->id, []) as $hosting) {
                    $cycle = self::CYCLES[$hosting->billingcycle] ?? null;

                    if (! $cycle) {
                        $this->warn("Skipped service #{$hosting->id} ({$hosting->domain}): billing cycle {$hosting->billingcycle} has no equivalent.");
                        $counts['services skipped']++;

                        continue;
                    }

                    $service = $this->serviceMap[$hosting->id] = $this->service($client, $hosting, $this->product($hosting->packageid, $currency), $cycle, $servers->get($hosting->server));
                    $counts[$service->wasRecentlyCreated ? 'services new' : ($service->wasChanged() ? 'services updated' : 'services unchanged')]++;

                    if ($service->status === 'active' && $service->next_due_date?->lt(today())) {
                        $lateDue[] = [$client->name, $service->domain, $service->next_due_date->toDateString()];
                    }
                }

                foreach ($domains->get($row->id, []) as $domainRow) {
                    $domain = $this->domainMap[$domainRow->id] = $this->domain($client, $domainRow);
                    $counts[$domain->wasRecentlyCreated ? 'domains new' : 'domains existing']++;
                }

                foreach ($invoices->get($row->id, []) as $invoiceRow) {
                    $currencyCode = $currencies->get($row->currency) ?? config('billing.currency');
                    [$result, $transactions] = $this->invoice($client, $invoiceRow, $currencyCode);
                    $counts["invoices {$result}"]++;
                    $counts['transactions'] += $transactions;
                }

                $counts['transactions'] += $this->orphanPayments($client, $row->id, $currencies->get($row->currency) ?? config('billing.currency'));
                $counts['contacts'] += $this->contacts($client, $row->id);
                $counts['credit entries'] += $this->credit($client, $row);
                [$tickets, $replies] = $this->tickets($client, $row->id);
                $counts['tickets'] += $tickets;
                $counts['ticket replies'] += $replies;
                $counts['emails'] += $this->emails($client, $row->id);
                $counts['log entries'] += $this->log($client, $row->id);
            }
        };

        if ($this->option('dry-run')) {
            DB::beginTransaction();
            $run();
            DB::rollBack();
            $this->info('Dry run: nothing was saved.');
        } else {
            DB::transaction($run);
        }

        $this->table(['', 'count'], collect($counts)->map(fn ($n, $k) => [$k, $n])->values());

        if ($lateDue) {
            $this->warn('Active services already past their due date. Check their invoices in WHMCS; overdue suspension will act on these:');
            $this->table(['client', 'domain', 'next due'], $lateDue);
        }

        return self::SUCCESS;
    }

    private function client(object $row, ?string $currency = null): Client
    {
        $client = Client::firstOrNew(['email' => strtolower(trim($row->email))]);
        // WHMCS bills each client in their own currency, and their invoices and service amounts came in it.
        $currency = in_array(strtoupper((string) $currency), Currency::SUPPORTED, true) ? strtoupper($currency) : null;

        if ($client->exists) {
            if ($currency && $client->currency !== $currency) {
                $client->forceFill(['currency' => $currency])->save();
            }

            return $client;
        }

        if ($currency) {
            $client->currency = $currency;
        }

        $client->forceFill([
            'name' => trim("{$row->firstname} {$row->lastname}") ?: $row->email,
            'company' => trim($row->companyname) ?: null,
            'phone' => trim($row->phonenumber) ?: null,
            'address' => trim(implode(', ', array_filter([trim($row->address1), trim($row->address2)]))) ?: null,
            'city' => trim($row->city) ?: null,
            'country' => strlen(trim($row->country)) === 2 ? strtoupper(trim($row->country)) : 'BD',
            // As in WHMCS, so Active Clients matches; an Inactive owner can still sign in and pay.
            // A client made active here stays active: WHMCS's automatic Inactive does not undo it.
            'status' => $client->exists && $client->status === 'active' && $row->status === 'Inactive'
                ? 'active'
                : (['Active' => 'active', 'Inactive' => 'inactive', 'Closed' => 'closed'][$row->status] ?? 'active'),
            'notes' => trim(html_entity_decode((string) $row->notes, ENT_QUOTES)) ?: null,
            'last_login_at' => $row->lastlogin && $row->lastlogin > '1970' ? $row->lastlogin : null,
            'created_at' => $this->date($row->datecreated) ?? now(),
        ])->save();

        // WHMCS keeps bcrypt hashes, which work here as they are. Bypass the hashing cast so they are not hashed twice.
        if (str_starts_with((string) $row->password, '$2y$')) {
            DB::table('clients')->where('id', $client->id)->update(['password' => $row->password]);
        }

        return $client;
    }

    private function product(int $whmcsId, int $currency): Product
    {
        if (isset($this->products[$whmcsId])) {
            return $this->products[$whmcsId];
        }

        $row = $this->whmcs->table('tblproducts')->find($whmcsId);
        $group = $this->whmcs->table('tblproductgroups')->find($row->gid);
        $groupName = trim($group?->name ?? '');
        $existing = Product::where('name', trim($row->name))->first();

        if ($existing) {
            return $this->products[$whmcsId] = $existing;
        }

        $module = in_array($row->servertype, array_keys(config('billing.provisioning_modules')), true) ? $row->servertype : null;
        $productGroup = $groupName ? ProductGroup::firstOrCreate(['name' => $groupName], [
            'slug' => Str::slug($groupName),
            'is_visible' => ! $group->hidden,
            'sort_order' => (int) $group->order,
        ]) : null;

        $product = Product::create([
            'product_group_id' => $productGroup?->id,
            'name' => trim($row->name),
            'type' => ['hostingaccount' => 'shared_hosting', 'server' => 'vps'][$row->type] ?? 'other',
            'description' => trim(html_entity_decode(strip_tags((string) $row->description), ENT_QUOTES)) ?: null,
            'module' => $module,
            'module_package' => $module ? $this->package($row->configoption1) : null,
            'is_active' => ! $row->hidden && ! $row->retired,
        ]);

        $pricing = $this->whmcs->table('tblpricing')->where(['type' => 'product', 'relid' => $whmcsId, 'currency' => $currency])->first();

        foreach (self::PRICE_COLUMNS as $cycle => $setupColumn) {
            if ($pricing && (float) $pricing->{$cycle} >= 0) {
                $product->prices()->create(['cycle' => $cycle, 'price' => $pricing->{$cycle}, 'setup_fee' => max(0, (float) $pricing->{$setupColumn})]);
            }
        }

        $this->line("Created product {$product->name}".($productGroup ? " in {$productGroup->name}" : ''));

        return $this->products[$whmcsId] = $product;
    }

    private function service(Client $client, object $row, Product $product, string $cycle, ?int $serverId): Service
    {
        $domain = strtolower(trim($row->domain)) ?: null;
        $existing = Service::where(['client_id' => $client->id, 'product_id' => $product->id, 'domain' => $domain])->first();
        $status = ['Active' => 'active', 'Suspended' => 'suspended', 'Pending' => 'pending', 'Terminated' => 'terminated', 'Cancelled' => 'cancelled'][$row->domainstatus] ?? 'pending';
        $nextDue = $this->date($row->nextduedate);

        if ($existing) {
            // Billing still runs in WHMCS, so its dates and amounts win. The server side (provisioning) stays as it is.
            $existing->fill([
                'status' => $status,
                'cycle' => $cycle,
                'recurring_amount' => $row->amount,
                'next_due_date' => $nextDue,
                'termination_date' => $this->date($row->termination_date ?? null),
                'payment_method' => ($row->paymentmethod ?? '') ?: null,
                'dedicated_ip' => ($row->dedicatedip ?? '') ?: null,
                'auto_suspended' => $status === 'suspended' && str_contains(strtolower((string) $row->suspendreason), 'overdue'),
            ]);

            if ($nextDue && $nextDue <= now()->addDays(config('billing.renewal_notice_days'))->toDateString()) {
                $existing->renewal_invoiced_for = $nextDue;
            }

            // A service imported before its server could be matched gets it now; a server set here is never replaced.
            if (! $existing->server_id && $serverId) {
                $existing->server_id = $serverId;
                if (! $existing->remote_id && in_array($status, ['active', 'suspended'], true) && $row->username && config("billing.provisioning_modules.{$product->module}.class")) {
                    $existing->remote_id = $row->username;
                    $existing->provision_status = 'done';
                }
            }

            $existing->save();

            return $existing;
        }

        // The account already lives on the server only when a connected module can manage it.
        $managed = in_array($status, ['active', 'suspended'], true) && $serverId && config("billing.provisioning_modules.{$product->module}.class") && $row->username;

        $service = new Service([
            'client_id' => $client->id,
            'product_id' => $product->id,
            'server_id' => $serverId,
            'domain' => $domain,
            'cycle' => $cycle,
            'recurring_amount' => $row->amount,
            'status' => $status,
            'provision_status' => $managed ? 'done' : 'none',
            'remote_id' => $managed ? $row->username : null,
            'credentials' => $row->username ? ['username' => $row->username] : null,
            'auto_suspended' => $status === 'suspended' && str_contains(strtolower((string) $row->suspendreason), 'overdue'),
            'next_due_date' => $nextDue,
            'registered_at' => $this->date($row->regdate),
            'termination_date' => $this->date($row->termination_date ?? null),
            'quantity' => max(1, (int) ($row->qty ?? 1)),
            'first_payment_amount' => $row->firstpaymentamount ?? $row->amount,
            'payment_method' => ($row->paymentmethod ?? '') ?: null,
            'subscription_id' => ($row->subscriptionid ?? '') ?: null,
            'dedicated_ip' => ($row->dedicatedip ?? '') ?: null,
            'admin_notes' => ($row->notes ?? '') ?: null,
            'disk_usage' => $row->diskusage ?? null,
            'disk_limit' => $row->disklimit ?? null,
            'bw_usage' => $row->bwusage ?? null,
            'bw_limit' => $row->bwlimit ?? null,
            // WHMCS raised the invoice for this due date already; do not raise a second one.
            'renewal_invoiced_for' => $nextDue && $nextDue <= now()->addDays(config('billing.renewal_notice_days'))->toDateString() ? $nextDue : null,
        ]);
        $service->created_at = $this->date($row->regdate) ?? now();
        $service->save();

        return $service;
    }

    private function domain(Client $client, object $row): Domain
    {
        $name = strtolower(trim($row->domain));
        $expires = $this->date($row->expirydate);
        $existing = Domain::where(['client_id' => $client->id, 'name' => $name, 'expires_at' => $expires])->first();

        if ($existing) {
            return $existing;
        }

        $status = [
            'Active' => 'active', 'Expired' => 'expired', 'Grace' => 'expired', 'Redemption' => 'expired',
            'Cancelled' => 'cancelled', 'Fraud' => 'cancelled', 'Transferred Away' => 'transferred_out',
        ][$row->status] ?? 'pending';
        $registrar = array_key_exists($row->registrar, config('billing.registrars')) ? $row->registrar : null;

        $domain = new Domain([
            'client_id' => $client->id,
            'name' => $name,
            'registrar' => $registrar,
            'action' => $row->type === 'Transfer' ? 'transfer' : 'register',
            'years' => max(1, (int) $row->registrationperiod),
            'auto_renew' => ! $row->donotrenew,
            'recurring_amount' => $row->recurringamount,
            'first_payment_amount' => $row->firstpaymentamount,
            'payment_method' => $row->paymentmethod ?: null,
            'subscription_id' => $row->subscriptionid ?: null,
            'dns_management' => (bool) $row->dnsmanagement,
            'email_forwarding' => (bool) $row->emailforwarding,
            'id_protection' => (bool) $row->idprotection,
            'registered_at' => $this->date($row->registrationdate),
            'next_due_date' => $this->date($row->nextduedate),
            'status' => $status,
            // Registered or transferred at the registrar already, unless WHMCS still had it pending.
            'provision_status' => $status === 'pending' ? 'manual_required' : 'done',
            'expires_at' => $expires,
            // WHMCS raised the renewal invoice for this expiry already; do not raise a second one.
            'renewal_invoiced_for' => $status === 'active' && $expires && $expires <= now()->addDays(config('billing.renewal_notice_days'))->toDateString() ? $expires : null,
        ]);
        $domain->created_at = $this->date($row->registrationdate) ?? now();
        $domain->save();

        return $domain;
    }

    /**
     * Copies one invoice with its lines and transactions, or brings one imported before up to date with WHMCS.
     * Returns ['new'|'updated'|'unchanged', transactions copied]. Lines tie to the imported service or domain, so
     * paying an open invoice here renews it.
     */
    private function invoice(Client $client, object $row, string $currency): array
    {
        $number = (string) $row->id;
        $status = ['Paid' => 'paid', 'Cancelled' => 'cancelled', 'Refunded' => 'refunded'][$row->status] ?? 'unpaid';
        $fields = [
            'status' => $status,
            'total' => $row->total,
            'due_date' => $this->date($row->duedate) ?? $this->date($row->date) ?? today()->toDateString(),
            'paid_at' => $status === 'paid' && $row->datepaid > '1970' ? $row->datepaid : null,
        ];
        $transactions = $this->whmcs->table('tblaccounts')->where('invoiceid', $row->id)->orderBy('id')->get();
        $invoice = Invoice::where('number', $number)->first();

        if ($invoice) {
            $totalChanged = bccomp((string) $invoice->total, (string) $row->total, 2) !== 0;
            $invoice->fill($fields);
            $changed = $invoice->isDirty();
            $invoice->save();

            if ($totalChanged) {
                $invoice->items()->delete();
                $this->items($invoice, $row);
            }

            $added = $this->payments($invoice, $transactions, $currency);

            return [$changed || $totalChanged || $added ? 'updated' : 'unchanged', $added];
        }

        $invoice = new Invoice(['client_id' => $client->id, 'number' => $number, 'currency' => $currency, ...$fields]);
        $invoice->created_at = $this->date($row->date) ?? now();
        $invoice->save();
        $this->items($invoice, $row);

        return ['new', $this->payments($invoice, $transactions, $currency)];
    }

    private function items(Invoice $invoice, object $row): void
    {
        foreach ($this->whmcs->table('tblinvoiceitems')->where('invoiceid', $row->id)->orderBy('id')->get() as $item) {
            // Usage lines are mostly zero-amount bandwidth and disk readings.
            if ($item->type === 'Usage' && (float) $item->amount == 0) {
                continue;
            }

            $service = in_array($item->type, ['Hosting', 'PromoHosting', 'Setup', 'Upgrade'], true) ? ($this->serviceMap[$item->relid] ?? null) : null;
            $domain = in_array($item->type, ['Domain', 'DomainRegister', 'DomainTransfer'], true) ? ($this->domainMap[$item->relid] ?? null) : null;
            $kind = match (true) {
                $service && $item->type === 'Hosting' => $service->status === 'pending' ? 'new' : 'renewal',
                $domain && $item->type === 'Domain' => 'renewal',
                $domain !== null => 'new',
                default => 'other',
            };

            $invoice->items()->create([
                'description' => Str::limit(trim(preg_replace('/\s+/', ' ', html_entity_decode((string) $item->description, ENT_QUOTES))), 250),
                'amount' => $item->amount,
                'kind' => $kind,
                'service_id' => $kind === 'other' ? null : $service?->id,
                'domain_id' => $kind === 'other' ? null : $domain?->id,
            ]);
        }

        // WHMCS can record more credit than the invoice needed, so take the credit actually used from the totals.
        $creditUsed = min(0, (float) $row->total - (float) $row->subtotal - (float) $row->tax - (float) $row->tax2);

        foreach ([['Tax', $row->tax], ['Tax', $row->tax2], ['Credit applied', $creditUsed]] as [$label, $amount]) {
            if ((float) $amount != 0) {
                $invoice->items()->create(['description' => $label, 'amount' => $amount, 'kind' => 'other']);
            }
        }
    }

    /**
     * Payments whose invoice was deleted in WHMCS. The money did come in, so each such invoice is rebuilt under its
     * original number as a paid invoice holding one line for its payments.
     */
    private function orphanPayments(Client $client, int $whmcsUserId, string $currency): int
    {
        $orphans = $this->whmcs->table('tblaccounts as a')
            ->leftJoin('tblinvoices as i', 'i.id', '=', 'a.invoiceid')
            ->where('a.userid', $whmcsUserId)
            ->where('a.invoiceid', '>', 0)
            ->whereNull('i.id')
            ->orderBy('a.id')
            ->get(['a.*'])
            ->groupBy('invoiceid');
        $count = 0;

        foreach ($orphans as $whmcsInvoiceId => $transactions) {
            if (Invoice::where('number', (string) $whmcsInvoiceId)->exists()) {
                continue;
            }

            $total = number_format($transactions->sum(fn ($tx) => (float) $tx->amountin - (float) $tx->amountout), 2, '.', '');
            $first = substr((string) $transactions->first()->date, 0, 10);
            $invoice = new Invoice([
                'client_id' => $client->id,
                'number' => (string) $whmcsInvoiceId,
                'status' => 'paid',
                'currency' => $currency,
                'total' => $total,
                'due_date' => $first,
                'paid_at' => $transactions->last()->date,
            ]);
            $invoice->created_at = $first;
            $invoice->save();
            $invoice->items()->create(['description' => "WHMCS invoice #{$whmcsInvoiceId} (deleted in WHMCS; rebuilt from its payments)", 'amount' => $total, 'kind' => 'other']);
            $count += $this->payments($invoice, $transactions, $currency);
        }

        return $count;
    }

    /** Copies the transactions not already on the invoice. Returns how many were copied. */
    private function payments(Invoice $invoice, iterable $transactions, string $currency): int
    {
        $copied = 0;
        $existing = Payment::where('invoice_id', $invoice->id)->get(['transaction_id', 'meta']);

        foreach ($transactions as $tx) {
            $refund = (float) $tx->amountout > 0;
            $gateway = self::GATEWAYS[$tx->gateway] ?? 'manual';
            $transactionId = trim((string) $tx->transid) ?: "WHMCS-{$tx->id}";

            // Copied before: recorded with its WHMCS id, or (older imports) under one of the ids given below.
            if ($existing->contains(fn ($p) => (int) ($p->meta['whmcs_id'] ?? 0) === (int) $tx->id
                || in_array($p->transaction_id, [$transactionId, "{$transactionId}-WHMCS-{$tx->id}"], true))) {
                continue;
            }

            // Gateway and transaction id are unique here; WHMCS repeats ids like "free".
            if (Payment::where(['gateway' => $gateway, 'transaction_id' => $transactionId])->exists()) {
                $transactionId .= "-WHMCS-{$tx->id}";
            }

            $payment = new Payment([
                'invoice_id' => $invoice->id,
                'gateway' => $gateway,
                'transaction_id' => $transactionId,
                'amount' => $refund ? -$tx->amountout : $tx->amountin,
                'fee' => (float) $tx->fees,
                'currency' => $currency,
                'meta' => array_filter([
                    'source' => 'whmcs',
                    'whmcs_id' => $tx->id,
                    'whmcs_gateway' => $tx->gateway,
                    'description' => trim((string) $tx->description) ?: null,
                    'fees' => (float) $tx->fees ? $tx->fees : null,
                    'refund' => $refund ?: null,
                ]),
            ]);
            $payment->created_at = $tx->date && $tx->date > '1970' ? $tx->date : $invoice->created_at;
            $payment->save();
            $copied++;
        }

        return $copied;
    }

    /** Contacts (sub-accounts) by email. Their WHMCS logins are not carried over. */
    private function contacts(Client $client, int $whmcsUserId): int
    {
        $count = 0;

        foreach ($this->whmcs->table('tblcontacts')->where('userid', $whmcsUserId)->orderBy('id')->get() as $row) {
            $email = strtolower(trim((string) $row->email));

            if ($email === '' || $email === $client->email) {
                continue;
            }

            $contact = ClientContact::firstOrCreate(['client_id' => $client->id, 'email' => $email], [
                'name' => trim("{$row->firstname} {$row->lastname}") ?: $email,
                'phone' => trim((string) $row->phonenumber) ?: null,
                'receives_support' => (bool) $row->supportemails,
            ]);
            $count += (int) $contact->wasRecentlyCreated;
        }

        return $count;
    }

    /**
     * The client's credit history, and the balance as WHMCS has it now. The balance is not spent on open invoices
     * here: WHMCS decided that already.
     */
    private function credit(Client $client, object $row): int
    {
        $count = 0;
        $invoiceIds = Invoice::where('client_id', $client->id)->pluck('id', 'number');
        // WHMCS can hold identical entries (same day, amount and text), so match by how many times each one occurs.
        $seen = [];

        foreach ($this->whmcs->table('tblcredit')->where('clientid', $row->id)->orderBy('id')->get() as $credit) {
            $date = $credit->date > '1970' ? $credit->date.' 00:00:00' : now()->toDateTimeString();
            $description = Str::limit(trim(html_entity_decode((string) $credit->description, ENT_QUOTES)) ?: 'Credit (WHMCS)', 250);
            $key = "{$date}|{$credit->amount}|{$description}";
            $seen[$key] = ($seen[$key] ?? 0) + 1;

            if (ClientCredit::where(['client_id' => $client->id, 'amount' => $credit->amount, 'description' => $description, 'created_at' => $date])->count() >= $seen[$key]) {
                continue;
            }

            $entry = new ClientCredit([
                'client_id' => $client->id,
                'invoice_id' => $credit->relid ? $invoiceIds->get((string) $credit->relid) : null,
                'description' => $description,
                'amount' => $credit->amount,
            ]);
            $entry->created_at = $date;
            $entry->save();
            $count++;
        }

        DB::table('clients')->where('id', $client->id)->update(['credit_balance' => $row->credit]);

        return $count;
    }

    /** Support tickets with their conversation. Staff replies are credited to the first panel admin. */
    private function tickets(Client $client, int $whmcsUserId): array
    {
        $staff = User::where('is_admin', true)->orderBy('id')->value('id');
        $departments = $this->whmcs->table('tblticketdepartments')->pluck('name', 'id');
        $text = fn (?string $message) => trim(html_entity_decode((string) $message, ENT_QUOTES)) ?: '(no message)';
        [$tickets, $replies] = [0, 0];

        foreach ($this->whmcs->table('tbltickets')->where('userid', $whmcsUserId)->where('merged_ticket_id', 0)->orderBy('id')->get() as $row) {
            $department = strtolower((string) $departments->get($row->did));
            $status = ['Open' => 'open', 'Answered' => 'answered', 'Customer-Reply' => 'customer_reply', 'On Hold' => 'on_hold', 'In Progress' => 'open', 'Closed' => 'closed'][$row->status] ?? 'open';
            $ticket = Ticket::firstOrNew(['number' => (string) $row->tid]);
            $ticket->fill([
                'client_id' => $client->id,
                'service_id' => preg_match('/^S(\d+)$/', (string) $row->service, $m) ? ($this->serviceMap[(int) $m[1]]->id ?? null) : null,
                'department' => str_contains($department, 'billing') ? 'billing' : (str_contains($department, 'sales') ? 'sales' : 'support'),
                'subject' => Str::limit(trim(html_entity_decode((string) $row->title, ENT_QUOTES)) ?: '(no subject)', 250),
                'priority' => strtolower((string) $row->urgency) ?: 'medium',
                'status' => $status,
                'last_reply_at' => $row->lastreply > '1970' ? $row->lastreply : $row->date,
            ]);

            if (! $ticket->exists) {
                $ticket->created_at = $row->date;
                $tickets++;
            }

            $ticket->save();

            $messages = collect([['date' => $row->date, 'message' => $row->message, 'admin' => $row->admin]])
                ->concat($this->whmcs->table('tblticketreplies')->where('tid', $row->id)->orderBy('id')->get()->map(fn ($r) => ['date' => $r->date, 'message' => $r->message, 'admin' => $r->admin]));

            foreach ($messages as $message) {
                if ($ticket->replies()->where('created_at', $message['date'])->exists()) {
                    continue;
                }

                $reply = $ticket->replies()->make(['message' => $text($message['message']), 'user_id' => trim((string) $message['admin']) !== '' ? $staff : null]);
                $reply->created_at = $message['date'];
                $reply->save();
                $replies++;
            }
        }

        return [$tickets, $replies];
    }

    /** Emails WHMCS sent the client, for My Emails. Password reset mails stay out, as they do for mail sent here. */
    private function emails(Client $client, int $whmcsUserId): int
    {
        $seen = EmailLog::where('client_id', $client->id)->get(['subject', 'created_at'])
            ->map(fn ($e) => $e->subject.'|'.$e->created_at)->flip();
        $rows = [];

        foreach ($this->whmcs->table('tblemails')->where('userid', $whmcsUserId)->where('pending', 0)->orderBy('id')->cursor() as $row) {
            $subject = Str::limit(trim(html_entity_decode((string) $row->subject, ENT_QUOTES)) ?: '(no subject)', 250);
            $date = $row->date > '1970' ? $row->date : null;

            if (! $date || preg_match('/password reset|reset your password|verification code/i', $subject) || $seen->has($subject.'|'.$date)) {
                continue;
            }

            $rows[] = [
                'client_id' => $client->id,
                'to' => Str::limit(strtolower(trim(explode(',', (string) $row->to)[0])) ?: $client->email, 250, ''),
                'subject' => $subject,
                'body' => (string) $row->message ?: null,
                'created_at' => $date,
            ];
        }

        foreach (array_chunk($rows, 200) as $chunk) {
            EmailLog::insert($chunk);
        }

        return count($rows);
    }

    /** The client's WHMCS activity log as read-only history; a re-run adds only entries newer than those copied. */
    private function log(Client $client, int $whmcsUserId): int
    {
        $since = ActivityLog::where(['action' => 'whmcs.log', 'subject_type' => $client->getMorphClass(), 'subject_id' => $client->id])->max('created_at');

        $count = 0;
        $this->whmcs->table('tblactivitylog')->where('userid', $whmcsUserId)->when($since, fn ($q) => $q->where('date', '>', $since))->orderBy('id')->chunk(500, function ($rows) use ($client, &$count) {
            ActivityLog::insert($rows->map(fn ($row) => [
                'action' => 'whmcs.log',
                'subject_type' => $client->getMorphClass(),
                'subject_id' => $client->id,
                'context' => json_encode(array_filter([
                    'description' => html_entity_decode((string) $row->description, ENT_QUOTES),
                    'by' => trim((string) $row->user) ?: null,
                    'ip' => trim((string) $row->ipaddr) ?: null,
                ])),
                'created_at' => $row->date > '1970' ? $row->date : now(),
            ])->all());
            $count += $rows->count();
        });

        return $count;
    }

    /** WHMCS stores Webuzo plans as "starter (Name : Starter)"; the plan id is the first word. */
    private function package(?string $value): ?string
    {
        $value = trim((string) $value);

        if ($value === '' || $value === 'Choose a Plan') {
            return null;
        }

        return preg_match('/^(\S+) \(Name : .*\)$/', $value, $m) ? $m[1] : $value;
    }

    private function date(?string $value): ?string
    {
        return $value && $value > '1970' ? substr($value, 0, 10) : null;
    }
}
