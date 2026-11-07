<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who did it from where, and a hash chain over the audit trail: each row's hash covers its own
 * fields and the row before it, so editing or deleting a past row shows up in audit:verify.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->string('ip', 45)->nullable()->after('context');
            $table->string('user_agent', 255)->nullable()->after('ip');
            $table->char('prev_hash', 64)->nullable()->after('user_agent');
            $table->char('hash', 64)->nullable()->after('prev_hash');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropColumn(['ip', 'user_agent', 'prev_hash', 'hash']);
        });
    }
};
