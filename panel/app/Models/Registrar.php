<?php

namespace App\Models;

use App\Support\Currency;
use Illuminate\Database\Eloquent\Model;

class Registrar extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['api_key'];

    protected function casts(): array
    {
        return ['api_key' => 'encrypted', 'last_synced_at' => 'datetime', 'tlds_synced_at' => 'datetime', 'connection_ok' => 'boolean', 'connection_checked_at' => 'datetime', 'api_balance' => 'decimal:2', 'api_balance_at' => 'datetime'];
    }

    /**
     * Reads the account balance from the registrar and keeps it. LogicBoxes names the field
     * differently between brands, so several are accepted. Returns null when none is readable.
     */
    public function refreshApiBalance(array $answer): ?float
    {
        foreach (['sellingcurrencybalance', 'accountingcurrencybalance', 'availablebalance', 'balance'] as $key) {
            foreach ($answer as $field => $value) {
                if (strtolower(preg_replace('/^.*\./', '', (string) $field)) === $key && is_numeric($value)) {
                    $this->forceFill(['api_balance' => round((float) $value, 2), 'api_balance_at' => now()])->save();

                    return (float) $value;
                }
            }
        }

        return null;
    }

    /** BDT per 1 unit of the account currency: 1 for BDT, else the rate in Settings > Currencies, else the deposits' average. */
    public function bdtRate(?float $depositAverage = null): ?float
    {
        return Currency::bdtRate($this->currency ?? 'USD') ?? ($depositAverage ?: null);
    }

    /** Remembers whether the last API call got through, for the Connection column. */
    public function markConnection(bool $ok, ?string $error = null): void
    {
        $this->forceFill([
            'connection_ok' => $ok,
            'connection_error' => $ok ? null : mb_substr((string) $error, 0, 500),
            'connection_checked_at' => now(),
        ])->save();
    }
}
