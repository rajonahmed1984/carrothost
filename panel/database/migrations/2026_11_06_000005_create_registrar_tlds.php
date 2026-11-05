<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The TLDs each registrar sells and what they cost us for 1 year, as of the last sync.
        Schema::create('registrar_tlds', function (Blueprint $table) {
            $table->id();
            $table->string('registrar_code');
            $table->string('tld'); // with the leading dot, e.g. .com.bd
            $table->string('product_key')->nullable();
            $table->string('currency', 3);
            $table->decimal('register_cost', 12, 2)->nullable();
            $table->decimal('renew_cost', 12, 2)->nullable();
            $table->decimal('transfer_cost', 12, 2)->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
            $table->unique(['registrar_code', 'tld']);
        });

        Schema::table('registrars', function (Blueprint $table) {
            $table->timestamp('tlds_synced_at')->nullable()->after('last_synced_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrar_tlds');
        Schema::table('registrars', function (Blueprint $table) {
            $table->dropColumn('tlds_synced_at');
        });
    }
};
