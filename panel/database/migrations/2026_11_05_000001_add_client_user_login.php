<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Users of a client account (not the owner) sign in with their own password and only see what they are allowed to. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_users', function (Blueprint $table) {
            $table->string('password')->nullable();
            $table->string('login_otp_code')->nullable();
            $table->timestamp('login_otp_expires_at')->nullable();
        });

        // Keyed by the user, not the email: one address can be a user of several clients.
        Schema::create('client_user_password_resets', function (Blueprint $table) {
            $table->foreignId('client_user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('token'); // sha256 of the emailed token
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_user_password_resets');

        Schema::table('client_users', function (Blueprint $table) {
            $table->dropColumn(['password', 'login_otp_code', 'login_otp_expires_at']);
        });
    }
};
