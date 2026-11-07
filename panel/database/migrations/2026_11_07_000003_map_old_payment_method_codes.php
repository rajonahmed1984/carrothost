<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Services, domains and orders still carried payment codes no gateway uses. Each is mapped to
 * the gateway that takes those payments now, so the Payment Method list can show it.
 */
return new class extends Migration
{
    private const MAP = ['bkashtokenized' => 'bkash', 'bkashrecurring' => 'bkash', 'mailin' => 'manual', 'banktransfer' => 'manual'];

    public function up(): void
    {
        foreach (['services', 'domains', 'orders'] as $table) {
            foreach (self::MAP as $old => $new) {
                DB::table($table)->where('payment_method', $old)->update(['payment_method' => $new]);
            }
        }
    }

    public function down(): void
    {
        // The old codes named no gateway, so there is nothing to go back to.
    }
};
