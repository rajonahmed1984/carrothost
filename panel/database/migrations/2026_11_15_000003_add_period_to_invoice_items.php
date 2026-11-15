<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The stretch of service an invoice line pays for ("16/07/2026 - 15/07/2027"), kept as dates so it
     * can be shown, checked for duplicates and reused. record_only marks a line billed for a renewal
     * that was already done by hand: paying it must not push the due date a second time.
     */
    public function up(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->date('period_start')->nullable()->after('kind');
            $table->date('period_end')->nullable()->after('period_start');
            $table->boolean('record_only')->default(false)->after('period_end');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn(['period_start', 'period_end', 'record_only']);
        });
    }
};
