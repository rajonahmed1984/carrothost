<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrars', function (Blueprint $table) {
            $table->string('currency', 3)->default('USD')->after('code'); // what the registrar account is billed in
            $table->timestamp('last_synced_at')->nullable();
            $table->text('sync_error')->nullable();
        });

        // Money sent to top up the registrar account: what left the bank, the fee, and what the registrar credited.
        Schema::create('registrar_deposits', function (Blueprint $table) {
            $table->id();
            $table->string('registrar_code', 32)->index();
            $table->date('paid_on');
            $table->string('method', 16); // bank, card, bkash, other
            $table->decimal('amount_bdt', 14, 2); // sent, in BDT
            $table->decimal('fee_bdt', 14, 2)->default(0); // bank, card or bKash charge
            $table->decimal('credited', 14, 2); // added to the registrar balance, in the registrar's currency
            $table->string('reference')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();
        });

        // What the registrar took from (debit) or gave back to (credit) the balance, in its currency.
        Schema::create('registrar_charges', function (Blueprint $table) {
            $table->id();
            $table->string('registrar_code', 32);
            $table->string('external_id')->nullable(); // the registrar's transaction id; null when entered by hand
            $table->string('type', 8); // debit, credit
            $table->dateTime('charged_at');
            $table->string('description')->nullable();
            $table->decimal('amount', 14, 2); // always positive
            $table->foreignId('domain_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 16)->default('other'); // register, renew, transfer, other
            $table->string('source', 8)->default('manual'); // sync, manual
            $table->timestamps();
            $table->unique(['registrar_code', 'external_id']);
            $table->index(['registrar_code', 'charged_at']);
        });

        DB::table('registrars')->where('code', 'resellcube')->update(['currency' => 'BDT']);
        DB::table('registrars')->where('code', 'stargate')->update(['currency' => 'USD']);
    }

    public function down(): void
    {
        Schema::dropIfExists('registrar_charges');
        Schema::dropIfExists('registrar_deposits');

        Schema::table('registrars', function (Blueprint $table) {
            $table->dropColumn(['currency', 'last_synced_at', 'sync_error']);
        });
    }
};
