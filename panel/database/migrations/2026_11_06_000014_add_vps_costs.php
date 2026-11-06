<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // What one VPS of this product costs us a month (e.g. the Webdock price), for VPS Profit.
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('cost_amount', 12, 2)->nullable()->after('module_config');
            $table->string('cost_currency', 3)->nullable()->after('cost_amount');
        });

        // A VPS whose cost differs from its product's, like a custom profile.
        Schema::table('services', function (Blueprint $table) {
            $table->decimal('cost_amount', 12, 2)->nullable()->after('recurring_amount');
            $table->string('cost_currency', 3)->nullable()->after('cost_amount');
        });
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn(['cost_amount', 'cost_currency']));
        Schema::table('services', fn (Blueprint $table) => $table->dropColumn(['cost_amount', 'cost_currency']));
    }
};
