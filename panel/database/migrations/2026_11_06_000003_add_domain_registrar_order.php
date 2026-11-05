<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The registrar's own order id for the domain, found by name on first use.
        Schema::table('domains', function (Blueprint $table) {
            $table->string('registrar_order_id')->nullable()->after('registrar');
            $table->timestamp('registrar_synced_at')->nullable()->after('registrar_order_id');
        });
    }

    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn(['registrar_order_id', 'registrar_synced_at']);
        });
    }
};
