<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Paying an invoice used to mark its order Active even while a service still waited for an
 * admin to accept it, which hid the order from Pending Orders. Put those orders back.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('orders')
            ->where('status', 'active')
            ->whereExists(fn ($q) => $q->from('services')
                ->whereColumn('services.order_id', 'orders.id')
                ->whereIn('services.status', ['pending', 'active'])
                ->where('services.provision_status', 'awaiting_accept'))
            ->update(['status' => 'pending', 'updated_at' => now()]);
    }

    public function down(): void
    {
        // Nothing to undo: the orders are where they belonged.
    }
};
