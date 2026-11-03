<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One conversation per client, between them and the support team.
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // set = staff, null = the customer
            $table->text('message')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('attachment_name')->nullable();
            $table->timestamps();
            $table->index(['client_id', 'id']);
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->unsignedBigInteger('chat_read_id')->default(0); // last message the client has seen
            $table->unsignedBigInteger('chat_staff_read_id')->default(0); // last message any staff member has seen
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['chat_read_id', 'chat_staff_read_id']);
        });

        Schema::dropIfExists('chat_messages');
    }
};
