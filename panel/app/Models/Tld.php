<?php

namespace App\Models;

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
            'is_active' => 'boolean',
            'is_spotlight' => 'boolean',
            'epp_required' => 'boolean',
        ];
    }
}
