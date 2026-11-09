<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsEncryptedArrayObject;
use Illuminate\Database\Eloquent\Model;

class Gateway extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['config'];

    protected function casts(): array
    {
        return ['config' => AsEncryptedArrayObject::class, 'is_enabled' => 'boolean', 'test_mode' => 'boolean', 'fee_percent' => 'decimal:3', 'fee_fixed' => 'decimal:2'];
    }

    /**
     * What the gateway keeps from a payment of $amount: the percentage plus the fixed part, in the
     * payment's currency. Null when the gateway has no fee set (Account Credit, say).
     */
    public static function feeFor(string $code, string $amount): ?string
    {
        $gateway = self::where('code', $code)->first(['fee_percent', 'fee_fixed']);
        if (! $gateway || ((float) $gateway->fee_percent <= 0 && (float) $gateway->fee_fixed <= 0)) {
            return null;
        }

        $fee = round((float) $amount * (float) $gateway->fee_percent / 100 + (float) $gateway->fee_fixed, 2);

        return number_format(min($fee, (float) $amount), 2, '.', '');
    }
}
