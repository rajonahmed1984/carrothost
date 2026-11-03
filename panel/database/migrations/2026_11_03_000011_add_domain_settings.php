<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            // False stops renewal invoices, so the domain lapses at expiry.
            $table->boolean('auto_renew')->default(true)->after('years');
            $table->json('nameservers')->nullable()->after('auto_renew');
        });
    }

    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn(['auto_renew', 'nameservers']);
        });
    }
};
