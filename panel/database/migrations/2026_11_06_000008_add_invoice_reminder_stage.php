<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // How far the automatic payment reminders got: 0 none, 1 before due, 2-4 first to third overdue notice.
        Schema::table('invoices', function (Blueprint $table) {
            $table->unsignedTinyInteger('reminder_stage')->default(0)->after('status');
            $table->timestamp('reminded_at')->nullable()->after('reminder_stage');
        });

        // Unpaid invoices already well past due (mostly imported) are not emailed all at once on the first run.
        DB::table('invoices')->where('status', 'unpaid')->whereDate('due_date', '<', now()->subDays(21)->toDateString())->update(['reminder_stage' => 4]);
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['reminder_stage', 'reminded_at']);
        });
    }
};
