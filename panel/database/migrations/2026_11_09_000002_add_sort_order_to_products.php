<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Where a product sits in its group, in the admin list and on the customer's order page. */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('product_group_id');
        });

        // Starts from the old alphabetical order, so nothing moves until an admin reorders.
        $position = [];
        foreach (DB::table('products')->orderBy('name')->orderBy('id')->get(['id', 'product_group_id']) as $product) {
            $group = $product->product_group_id ?? 0;
            $position[$group] = ($position[$group] ?? 0) + 1;
            DB::table('products')->where('id', $product->id)->update(['sort_order' => $position[$group]]);
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};
