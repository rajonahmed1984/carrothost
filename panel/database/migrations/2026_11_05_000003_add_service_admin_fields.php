<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->date('registered_at')->nullable()->after('next_due_date');
            $table->date('termination_date')->nullable()->after('registered_at');
            $table->unsignedInteger('quantity')->default(1)->after('cycle');
            $table->decimal('first_payment_amount', 12, 2)->default(0)->after('recurring_amount');
            $table->string('payment_method')->nullable()->after('first_payment_amount');
            $table->string('subscription_id')->nullable()->after('payment_method');
            $table->string('dedicated_ip', 64)->nullable()->after('remote_id');
            $table->date('override_suspend_until')->nullable()->after('auto_suspended'); // no overdue suspension before this
            $table->boolean('terminate_end_of_cycle')->default(false)->after('override_suspend_until');
            $table->string('terminate_reason')->nullable()->after('terminate_end_of_cycle');
            $table->text('admin_notes')->nullable();
            // Last known usage in MB, as the server reported it.
            $table->unsignedInteger('disk_usage')->nullable();
            $table->unsignedInteger('disk_limit')->nullable();
            $table->unsignedInteger('bw_usage')->nullable();
            $table->unsignedInteger('bw_limit')->nullable();
            $table->timestamp('usage_updated_at')->nullable();
        });

        DB::table('services')->update([
            'registered_at' => DB::raw('DATE(created_at)'),
            'first_payment_amount' => DB::raw('recurring_amount'),
        ]);
        DB::table('services')->whereNull('payment_method')->update([
            'payment_method' => DB::table('orders')->select('payment_method')->whereColumn('orders.id', 'services.order_id'),
        ]);

    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn([
                'registered_at', 'termination_date', 'quantity', 'first_payment_amount', 'payment_method', 'subscription_id', 'dedicated_ip',
                'override_suspend_until', 'terminate_end_of_cycle', 'terminate_reason', 'admin_notes',
                'disk_usage', 'disk_limit', 'bw_usage', 'bw_limit', 'usage_updated_at',
            ]);
        });
    }
};
