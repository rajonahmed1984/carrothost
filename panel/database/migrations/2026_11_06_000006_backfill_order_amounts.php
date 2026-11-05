<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Orders placed in the panel never saved their total; take it from their invoices.
        DB::statement(<<<'SQL'
            UPDATE orders o
            JOIN (SELECT order_id, SUM(total) total FROM invoices WHERE order_id IS NOT NULL AND status <> 'cancelled' GROUP BY order_id) i ON i.order_id = o.id
            SET o.amount = i.total
            WHERE o.amount IS NULL OR o.amount = 0
            SQL);
    }

    public function down(): void
    {
        // Nothing to undo: the amounts were missing before.
    }
};
