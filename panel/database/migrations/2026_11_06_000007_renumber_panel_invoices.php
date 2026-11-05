<?php

use App\Models\Invoice;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Panel invoices were numbered INV-001163; give them plain numbers like the WHMCS ones,
        // from billing.invoice_number_start on, oldest first.
        DB::transaction(function () {
            foreach (Invoice::where('number', 'like', 'INV-%')->orderBy('id')->get() as $invoice) {
                $invoice->update(['number' => Invoice::nextNumber()]);
            }
        });
    }

    public function down(): void
    {
        // The old INV- numbers are not kept.
    }
};
