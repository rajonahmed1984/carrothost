<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /** The product's part of its direct order link: /store/{group slug}/{product slug}. */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
        });

        $taken = [];
        foreach (DB::table('products')->orderBy('id')->get(['id', 'name', 'product_group_id']) as $product) {
            $base = Str::slug($product->name) ?: 'product';
            $slug = $base;
            for ($n = 2; isset($taken[$product->product_group_id][$slug]); $n++) {
                $slug = "{$base}-{$n}";
            }
            $taken[$product->product_group_id][$slug] = true;
            DB::table('products')->where('id', $product->id)->update(['slug' => $slug]);
        }

        Schema::table('products', function (Blueprint $table) {
            $table->unique(['product_group_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['product_group_id', 'slug']);
            $table->dropColumn('slug');
        });
    }
};
