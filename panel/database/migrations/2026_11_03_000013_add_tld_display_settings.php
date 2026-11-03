<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tlds', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('tld');
            $table->boolean('is_spotlight')->default(false)->after('sort_order'); // featured on the customer domain page
            $table->boolean('epp_required')->default(true)->after('transfer_price'); // transfers must give the EPP code
        });
    }

    public function down(): void
    {
        Schema::table('tlds', function (Blueprint $table) {
            $table->dropColumn(['sort_order', 'is_spotlight', 'epp_required']);
        });
    }
};
