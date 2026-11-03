<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Null = any active server of the module, fewest accounts first.
            $table->foreignId('server_id')->nullable()->after('module_package')->constrained()->nullOnDelete();
            // order, payment, accept, manual
            $table->string('setup_mode')->default('payment')->after('server_id');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('server_id');
            $table->dropColumn('setup_mode');
        });
    }
};
