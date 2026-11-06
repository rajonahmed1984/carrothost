<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Every customer SMS the panel tried to send, and what the gateway said.
        Schema::create('sms_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event', 40);
            $table->string('mobile', 20)->nullable();
            $table->text('message')->nullable();
            $table->string('status', 20); // sent, failed, skipped
            $table->string('response')->nullable();
            $table->timestamp('created_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
    }
};
