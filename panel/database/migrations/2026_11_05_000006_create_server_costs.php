<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // What a server costs each month, from a month on, until a later entry replaces it. 0 stops the cost.
        Schema::create('server_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('server_id')->constrained()->cascadeOnDelete();
            $table->date('starts_on'); // always the 1st of a month
            $table->decimal('amount', 12, 2);
            $table->string('note')->nullable();
            $table->timestamps();
            $table->unique(['server_id', 'starts_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('server_costs');
    }
};
