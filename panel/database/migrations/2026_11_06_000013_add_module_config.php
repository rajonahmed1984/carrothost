<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Per-product module settings, e.g. a VPS's default OS, the OS choices and what customers may do.
        Schema::table('products', function (Blueprint $table) {
            $table->json('module_config')->nullable()->after('module_package');
        });

        // What the customer chose when ordering, e.g. the VPS operating system.
        Schema::table('services', function (Blueprint $table) {
            $table->json('module_options')->nullable()->after('remote_id');
        });
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn('module_config'));
        Schema::table('services', fn (Blueprint $table) => $table->dropColumn('module_options'));
    }
};
