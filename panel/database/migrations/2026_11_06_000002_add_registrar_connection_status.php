<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The result of the last API call (test or sync), shown on Domain Registrars.
        Schema::table('registrars', function (Blueprint $table) {
            $table->boolean('connection_ok')->nullable()->after('api_key');
            $table->string('connection_error', 500)->nullable()->after('connection_ok');
            $table->timestamp('connection_checked_at')->nullable()->after('connection_error');
        });
    }

    public function down(): void
    {
        Schema::table('registrars', function (Blueprint $table) {
            $table->dropColumn(['connection_ok', 'connection_error', 'connection_checked_at']);
        });
    }
};
