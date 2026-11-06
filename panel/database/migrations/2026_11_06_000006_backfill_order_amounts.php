<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Orders placed in the panel never saved their total; take it from their invoices.
        // Plain subqueries, so it also runs on the SQLite test database.
        DB::statement(<<<'SQL'
            UPDATE orders
            SET amount = (SELECT SUM(invoices.total) FROM invoices WHERE invoices.order_id = orders.id AND invoices.status <> 'cancelled')
            WHERE (amount IS NULL OR amount = 0)
              AND EXISTS (SELECT 1 FROM invoices WHERE invoices.order_id = orders.id AND invoices.status <> 'cancelled')
            SQL);
    }

    public function down(): void
    {
        // Nothing to undo: the amounts were missing before.
    }
};
