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

    }

    public function down(): void
    {
        Schema::dropIfExists('domain_reminders');

        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn(['registered_at', 'next_due_date', 'first_payment_amount', 'payment_method', 'subscription_id', 'registrar_lock', 'dns_management', 'email_forwarding', 'id_protection']);
        });
    }
};
