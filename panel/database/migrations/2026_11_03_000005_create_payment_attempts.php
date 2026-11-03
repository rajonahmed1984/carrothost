<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->restrictOnDelete();
            $table->string('gateway');
            $table->string('reference')->unique(); // our id, sent to the gateway
            $table->string('external_id')->nullable()->index(); // the gateway's id
            $table->decimal('amount', 12, 2); // credited to the invoice
            $table->decimal('charge_amount', 12, 2); // charged at the gateway
            $table->string('charge_currency', 3);
            $table->string('status')->default('pending'); // pending, paid, failed, cancelled
            $table->string('failure_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_attempts');
    }
};
