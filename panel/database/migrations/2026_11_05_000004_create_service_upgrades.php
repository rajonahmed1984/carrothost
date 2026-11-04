<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A product or billing cycle change waiting on its invoice; applied when that invoice is paid.
        Schema::create('service_upgrades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('old_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('old_cycle');
            $table->foreignId('new_product_id')->constrained('products')->restrictOnDelete();
            $table->string('new_cycle');
            $table->decimal('new_recurring_amount', 12, 2);
            $table->date('new_next_due_date')->nullable();
            $table->decimal('amount_due', 12, 2)->default(0);
            $table->string('status')->default('pending'); // pending, done, cancelled
            $table->timestamps();
        });

        // The full metric table from the last usage refresh.
        Schema::table('services', function (Blueprint $table) {
            $table->json('usage_metrics')->nullable()->after('usage_updated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_upgrades');

        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('usage_metrics');
        });
    }
};
