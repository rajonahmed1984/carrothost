<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\Server;
use App\Models\Service;
use Illuminate\Console\Command;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Copies active WHMCS clients into the panel with their live services (and the products they use), all their
 * domains, invoices with payments and refunds, and their activity log.
 * Safe to run again: clients match by email, services by client, product and domain, domains by client, name and
 * expiry, invoices by number (the WHMCS invoice id), and a client's log is copied only once.
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

        $clients = $this->whmcs->table('tblclients')->where('status', 'Active')->orderBy('id')->get();
        $services = $this->whmcs->table('tblhosting')
            ->whereIn('userid', $clients->pluck('id'))
            ->whereIn('domainstatus', ['Active', 'Suspended', 'Pending', 'Terminated', 'Cancelled'])
            ->orderBy('id')
            ->get()
            ->groupBy('userid');
        $domains = $this->whmcs->table('tbldomains')->whereIn('userid', $clients->pluck('id'))->orderBy('id')->get()->groupBy('userid');
        $invoices = $this->whmcs->table('tblinvoices')->whereIn('userid', $clients->pluck('id'))->where('status', '!=', 'Draft')->orderBy('id')->get()->groupBy('userid');
        $currencies = $this->whmcs->table('tblcurrencies')->pluck('code', 'id');
        $servers = $this->whmcs->table('tblservers')->pluck('hostname', 'id')
            ->map(fn ($hostname) => Server::where('hostname', $hostname)->value('id'));

        $counts = [
            'clients new' => 0, 'clients existing' => 0, 'services new' => 0, 'services existing' => 0, 'services skipped' => 0,
            'domains new' => 0, 'domains existing' => 0, 'invoices new' => 0, 'invoices existing' => 0,
            'transactions' => 0, 'log entries' => 0,
        ];
        $lateDue = [];

        $run = function () use ($clients, $services, $domains, $invoices, $currencies, $servers, $currency, &$counts, &$lateDue) {
            foreach ($clients as $row) {
                $client = $this->client($row);
                $counts[$client->wasRecentlyCreated ? 'clients new' : 'clients existing']++;

                foreach ($services->get($row->id, []) as $hosting) {
                    $cycle = self::CYCLES[$hosting->billingcycle] ?? null;

                    if (! $cycle) {
                        $this->warn("Skipped service #{$hosting->id} ({$hosting->domain}): billing cycle {$hosting->billingcycle} has no equivalent.");
                        $counts['services skipped']++;

                        continue;
                    }

                    $service = $this->serviceMap[$hosting->id] = $this->service($client, $hosting, $this->product($hosting->packageid, $currency), $cycle, $servers->get($hosting->server));
                    $counts[$service->wasRecentlyCreated ? 'services new' : 'services existing']++;

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
                    $imported = $this->invoice($client, $invoiceRow, $currencyCode);
                    $counts[$imported === null ? 'invoices existing' : 'invoices new']++;
                    $counts['transactions'] += (int) $imported;
                }

                $counts['transactions'] += $this->orphanPayments($client, $row->id, $currencies->get($row->currency) ?? config('billing.currency'));
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

    private function client(object $row): Client
    {
        $client = Client::firstOrNew(['email' => strtolower(trim($row->email))]);

        if ($client->exists) {
            return $client;
        }

        $client->forceFill([
            'name' => trim("{$row->firstname} {$row->lastname}") ?: $row->email,
            'company' => trim($row->companyname) ?: null,
            'phone' => trim($row->phonenumber) ?: null,
            'address' => trim(implode(', ', array_filter([trim($row->address1), trim($row->address2)]))) ?: null,
            'city' => trim($row->city) ?: null,
            'country' => strlen(trim($row->country)) === 2 ? strtoupper(trim($row->country)) : 'BD',
            'status' => 'active',
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

        if ($existing) {
            return $existing;
        }

        $status = ['Active' => 'active', 'Suspended' => 'suspended', 'Pending' => 'pending', 'Terminated' => 'terminated', 'Cancelled' => 'cancelled'][$row->domainstatus] ?? 'pending';
        $nextDue = $this->date($row->nextduedate);
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
     * Copies one invoice with its lines and transactions. Returns how many transactions were copied, or null when the
     * invoice was imported before. Lines tie to the imported service or domain, so paying an open invoice here renews it.
     */
    private function invoice(Client $client, object $row, string $currency): ?int
    {
        $number = (string) $row->id;

        if (Invoice::where('number', $number)->exists()) {
            return null;
        }

        $status = ['Paid' => 'paid', 'Cancelled' => 'cancelled', 'Refunded' => 'refunded'][$row->status] ?? 'unpaid';
        $invoice = new Invoice([
            'client_id' => $client->id,
            'number' => $number,
            'status' => $status,
            'currency' => $currency,
            'total' => $row->total,
            'due_date' => $this->date($row->duedate) ?? $this->date($row->date) ?? today()->toDateString(),
            'paid_at' => $status === 'paid' && $row->datepaid > '1970' ? $row->datepaid : null,
        ]);
        $invoice->created_at = $this->date($row->date) ?? now();
        $invoice->save();

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

        $transactions = $this->whmcs->table('tblaccounts')->where('invoiceid', $row->id)->orderBy('id')->get();
        $this->payments($invoice, $transactions, $currency);

        return $transactions->count();
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
            $this->payments($invoice, $transactions, $currency);
            $count += $transactions->count();
        }

        return $count;
    }

    private function payments(Invoice $invoice, iterable $transactions, string $currency): void
    {
        foreach ($transactions as $tx) {
            $refund = (float) $tx->amountout > 0;
            $gateway = self::GATEWAYS[$tx->gateway] ?? 'manual';
            $transactionId = trim((string) $tx->transid) ?: "WHMCS-{$tx->id}";

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
                    'whmcs_gateway' => $tx->gateway,
                    'description' => trim((string) $tx->description) ?: null,
                    'fees' => (float) $tx->fees ? $tx->fees : null,
                    'refund' => $refund ?: null,
                ]),
            ]);
            $payment->created_at = $tx->date && $tx->date > '1970' ? $tx->date : $invoice->created_at;
            $payment->save();
        }
    }

    /** The client's WHMCS activity log, copied once as read-only history. */
    private function log(Client $client, int $whmcsUserId): int
    {
        if (ActivityLog::where(['action' => 'whmcs.log', 'subject_type' => $client->getMorphClass(), 'subject_id' => $client->id])->exists()) {
            return 0;
        }

        $count = 0;
        $this->whmcs->table('tblactivitylog')->where('userid', $whmcsUserId)->orderBy('id')->chunk(500, function ($rows) use ($client, &$count) {
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
