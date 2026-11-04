<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('fee', 12, 2)->default(0)->after('amount'); // what the gateway kept
        });

        // Payments imported from WHMCS kept their fee in meta until now.
        DB::table('payments')->where('meta', 'like', '%"fees"%')->orderBy('id')->each(function ($payment) {
            $fee = json_decode((string) $payment->meta, true)['fees'] ?? null;
            if (is_numeric($fee)) {
                DB::table('payments')->where('id', $payment->id)->update(['fee' => $fee]);
            }
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            // On a Mass Pay invoice, the invoice each line pays.
            $table->foreignId('target_invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('target_invoice_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('fee');
        });
    }
};
