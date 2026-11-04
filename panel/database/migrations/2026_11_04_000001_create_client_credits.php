<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->decimal('credit_balance', 12, 2)->default(0);
        });

        // Every change to a client's credit, so the balance can always be explained.
        Schema::create('client_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // the admin, when one made it
            $table->string('description');
            $table->decimal('amount', 12, 2); // negative when credit is used or removed
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_credits');

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('credit_balance');
        });
    }
};
