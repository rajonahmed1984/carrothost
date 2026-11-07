<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Records brought in from the old billing system carried its name in log actions, invoice
 * lines and payment references. The panel is the only system now, so those markers go.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('activity_logs')->where('action', 'whmcs.log')->update(['action' => 'client.history']);

        DB::table('invoice_items')->where('description', 'like', '%WHMCS%')->orderBy('id')->each(function ($item) {
            $description = preg_replace('/\s*\(deleted in WHMCS; rebuilt from its payments\)/i', ' (rebuilt from its payments)', $item->description);
            $description = trim(preg_replace('/\bWHMCS\s*/i', '', $description));
            DB::table('invoice_items')->where('id', $item->id)->update(['description' => ucfirst($description)]);
        });

        DB::table('payments')->where('transaction_id', 'like', '%WHMCS%')->orderBy('id')->each(function ($payment) {
            $base = preg_replace('/^WHMCS-/i', 'TXN-', $payment->transaction_id);
            $base = preg_replace('/-WHMCS-/i', '-', $base);
            $id = $base;
            for ($n = 2; DB::table('payments')->where('gateway', $payment->gateway)->where('transaction_id', $id)->where('id', '!=', $payment->id)->exists(); $n++) {
                $id = "{$base}-{$n}";
            }
            DB::table('payments')->where('id', $payment->id)->update(['transaction_id' => $id]);
        });

        DB::table('payments')->where('meta', 'like', '%whmcs%')->orderBy('id')->each(function ($payment) {
            $meta = json_decode((string) $payment->meta, true);
            if (! is_array($meta)) {
                return;
            }
            if (($meta['source'] ?? null) === 'whmcs') {
                unset($meta['source']);
            }
            if (isset($meta['whmcs_gateway'])) {
                $meta['gateway_code'] = $meta['whmcs_gateway'];
            }
            unset($meta['whmcs_id'], $meta['whmcs_gateway']);
            DB::table('payments')->where('id', $payment->id)->update(['meta' => $meta ? json_encode($meta) : null]);
        });
    }

    public function down(): void
    {
        // The old names are not needed again.
    }
};
