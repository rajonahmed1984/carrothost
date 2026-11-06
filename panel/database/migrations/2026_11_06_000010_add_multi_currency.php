<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Each client is billed in their own currency. Everyone so far was billed in BDT.
        Schema::table('clients', function (Blueprint $table) {
            $table->string('currency', 3)->default('BDT');
        });

        // Optional fixed USD prices. Blank means the BDT price converted at the current rate.
        Schema::table('product_prices', function (Blueprint $table) {
            $table->decimal('price_usd', 12, 2)->nullable();
            $table->decimal('setup_fee_usd', 12, 2)->nullable();
        });

        Schema::table('tlds', function (Blueprint $table) {
            $table->decimal('register_price_usd', 12, 2)->nullable();
            $table->decimal('renew_price_usd', 12, 2)->nullable();
            $table->decimal('transfer_price_usd', 12, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('clients', fn (Blueprint $table) => $table->dropColumn('currency'));
        Schema::table('product_prices', fn (Blueprint $table) => $table->dropColumn(['price_usd', 'setup_fee_usd']));
        Schema::table('tlds', fn (Blueprint $table) => $table->dropColumn(['register_price_usd', 'renew_price_usd', 'transfer_price_usd']));
    }
};
