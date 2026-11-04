<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->date('registered_at')->nullable()->after('expires_at');
            $table->date('next_due_date')->nullable()->after('registered_at');
            $table->decimal('first_payment_amount', 12, 2)->default(0)->after('recurring_amount');
            $table->string('payment_method')->nullable()->after('first_payment_amount');
            $table->string('subscription_id')->nullable()->after('payment_method');
            $table->boolean('registrar_lock')->default(true)->after('nameservers');
            $table->boolean('dns_management')->default(false)->after('registrar_lock');
            $table->boolean('email_forwarding')->default(false)->after('dns_management');
            $table->boolean('id_protection')->default(false)->after('email_forwarding');
        });

        // Expiry reminders sent to the client, newest first on the domain page.
        Schema::create('domain_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('type'); // 1 = first reminder ... 5 = fifth
            $table->text('recipients');
            $table->smallInteger('days_before_expiry');
            $table->date('sent_on');
            $table->index(['domain_id', 'sent_on']);
        });

        DB::table('domains')->update([
            'registered_at' => DB::raw('DATE(created_at)'),
            'next_due_date' => DB::raw('expires_at'),
            'first_payment_amount' => DB::raw('recurring_amount'),
        ]);
        DB::table('domains')->whereNull('payment_method')->update([
            'payment_method' => DB::table('orders')->select('payment_method')->whereColumn('orders.id', 'domains.order_id'),
        ]);

        $this->importFromWhmcs();
    }

    /** Copies the fields WHMCS kept for each domain, when its database sits on the same server. */
    private function importFromWhmcs(): void
    {
        try {
            if (DB::getDriverName() !== 'mysql' || empty(DB::select("SHOW DATABASES LIKE 'carrothost_portal'"))) {
                return;
            }

            $map = []; // WHMCS domain id => panel domain id
            foreach (DB::table('domains')->get(['id', 'name', 'order_id', 'expires_at']) as $domain) {
                $row = DB::table('carrothost_portal.tbldomains')->where('domain', $domain->name)
                    ->orderByRaw('orderid = ? desc, expirydate = ? desc', [(int) $domain->order_id, (string) $domain->expires_at])
                    ->first();

                if (! $row) {
                    continue;
                }

                $map[$row->id] = $domain->id;
                $date = fn ($value) => $value && $value !== '0000-00-00' ? $value : null;
                DB::table('domains')->where('id', $domain->id)->update(array_filter([
                    'registered_at' => $date($row->registrationdate),
                    'next_due_date' => $date($row->nextduedate),
                    'first_payment_amount' => $row->firstpaymentamount,
                    'payment_method' => $row->paymentmethod ?: null,
                    'subscription_id' => $row->subscriptionid ?: null,
                    'dns_management' => (bool) $row->dnsmanagement,
                    'email_forwarding' => (bool) $row->emailforwarding,
                    'id_protection' => (bool) $row->idprotection,
                ], fn ($v) => $v !== null));
            }

            foreach (array_chunk(array_keys($map), 200) as $ids) {
                $rows = DB::table('carrothost_portal.tbldomainreminders')->whereIn('domain_id', $ids)->get();
                DB::table('domain_reminders')->insert($rows->map(fn ($r) => [
                    'domain_id' => $map[$r->domain_id],
                    'type' => $r->type,
                    'recipients' => $r->recipients,
                    'days_before_expiry' => $r->days_before_expiry,
                    'sent_on' => $r->date,
                ])->all());
            }
        } catch (\Throwable) {
            // Cross-database reads not allowed here; the defaults above stand.
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('domain_reminders');

        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn(['registered_at', 'next_due_date', 'first_payment_amount', 'payment_method', 'subscription_id', 'registrar_lock', 'dns_management', 'email_forwarding', 'id_protection']);
        });
    }
};
