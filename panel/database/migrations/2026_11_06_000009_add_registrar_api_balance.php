<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrars', function (Blueprint $table) {
            // The balance the registrar reports, read on each sync and test.
            $table->decimal('api_balance', 14, 2)->nullable()->after('currency');
            $table->timestamp('api_balance_at')->nullable()->after('api_balance');
        });
    }

    public function down(): void
    {
        Schema::table('registrars', function (Blueprint $table) {
            $table->dropColumn(['api_balance', 'api_balance_at']);
        });
    }
};
