<?php

use App\Models\Order;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Orders placed in the panel before it gave them numbers showed their ID as the order number. */
    public function up(): void
    {
        DB::table('orders')->whereNull('order_number')->orderBy('id')->pluck('id')
            ->each(fn ($id) => DB::table('orders')->where('id', $id)->update(['order_number' => Order::newNumber()]));
    }

    public function down(): void
    {
        // The numbers stay: customers may have seen them.
    }
};
