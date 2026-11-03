<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('login_otp_code')->nullable();
            $table->timestamp('login_otp_expires_at')->nullable();
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->boolean('otp_enabled')->default(false);
            $table->string('login_otp_code')->nullable();
            $table->timestamp('login_otp_expires_at')->nullable();
        });

        // An admin and a client may share an email, so their reset tokens are kept apart.
        Schema::create('client_password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_password_reset_tokens');

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['otp_enabled', 'login_otp_code', 'login_otp_expires_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['login_otp_code', 'login_otp_expires_at']);
        });
    }
};
