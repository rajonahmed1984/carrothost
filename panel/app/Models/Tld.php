<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tld extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'register_price' => 'decimal:2',
            'renew_price' => 'decimal:2',
            'transfer_price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }
}
