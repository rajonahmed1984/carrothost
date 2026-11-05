<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The server's main IP, any extra IPs, and the nameservers its accounts use (shown to customers).
        Schema::table('servers', function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable()->after('hostname');
            $table->text('assigned_ips')->nullable()->after('ip_address'); // one per line
            $table->json('nameservers')->nullable()->after('assigned_ips'); // [{host, ip}], up to 5
        });
    }

    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn(['ip_address', 'assigned_ips', 'nameservers']);
        });
    }
};
