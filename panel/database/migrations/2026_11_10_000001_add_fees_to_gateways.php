<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** What each gateway takes per payment (e.g. bKash 1.7%), recorded as the payment's fee. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gateways', function (Blueprint $table) {
            $table->decimal('fee_percent', 6, 3)->default(0)->after('test_mode');
            $table->decimal('fee_fixed', 10, 2)->default(0)->after('fee_percent');
        });
    }

    public function down(): void
    {
        Schema::table('gateways', function (Blueprint $table) {
            $table->dropColumn(['fee_percent', 'fee_fixed']);
        });
    }
};
