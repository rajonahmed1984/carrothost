<?php

namespace App\Models;

use App\Support\Currency;
use Illuminate\Database\Eloquent\Model;

class ProductPrice extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['price' => 'decimal:2', 'setup_fee' => 'decimal:2', 'price_usd' => 'decimal:2', 'setup_fee_usd' => 'decimal:2'];
    }

    /** The recurring price in a currency: a fixed USD price when set, else the BDT price converted. */
    public function priceIn(string $currency): string
    {
        return Currency::price($this->price, $this->price_usd, $currency);
    }

    public function setupFeeIn(string $currency): string
    {
        return Currency::price($this->setup_fee, $this->setup_fee_usd, $currency);
    }
}
