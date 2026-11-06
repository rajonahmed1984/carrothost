<?php

namespace App\Models;

use App\Support\Currency;
use Illuminate\Database\Eloquent\Model;

class Tld extends Model
{
    protected $guarded = ['id'];

    /** Spotlight slots on the customer domain page. */
    public const SPOTLIGHT_LIMIT = 8;

    protected function casts(): array
    {
        return [
            'register_price' => 'decimal:2',
            'renew_price' => 'decimal:2',
            'transfer_price' => 'decimal:2',
            'register_price_usd' => 'decimal:2',
            'renew_price_usd' => 'decimal:2',
            'transfer_price_usd' => 'decimal:2',
            'is_active' => 'boolean',
            'is_spotlight' => 'boolean',
            'epp_required' => 'boolean',
        ];
    }

    /** One year's price for register, renew or transfer in a currency: a fixed USD price when set, else BDT converted. */
    public function priceIn(string $action, string $currency): string
    {
        return Currency::price($this->{"{$action}_price"}, $this->{"{$action}_price_usd"}, $currency);
    }
}
