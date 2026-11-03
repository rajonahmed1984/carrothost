<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // People the customer adds to their account; they get copies of the emails they opt into.
        Schema::create('client_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->boolean('receives_support')->default(true);
            $table->timestamps();
            $table->unique(['client_id', 'email']);
        });

        // A copy of every email sent to a customer or one of their contacts.
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('to');
            $table->string('subject');
            $table->longText('body')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['client_id', 'id']);
        });

        // Customer sign-ins, so they can see and end them. The session row itself lives in `sessions`.
        Schema::create('client_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('session_id')->unique();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::table('clients', function (Blueprint $table) {
            // Short-lived code a customer reads out so support can confirm who they are.
            $table->string('support_pin', 12)->nullable();
            $table->timestamp('support_pin_expires_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['support_pin', 'support_pin_expires_at']);
        });
        Schema::dropIfExists('client_sessions');
        Schema::dropIfExists('email_logs');
        Schema::dropIfExists('client_contacts');
    }
};
