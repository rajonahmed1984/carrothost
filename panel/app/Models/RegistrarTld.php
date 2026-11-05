<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegistrarTld extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'register_cost' => 'decimal:2',
            'renew_cost' => 'decimal:2',
            'transfer_cost' => 'decimal:2',
            'synced_at' => 'datetime',
        ];
    }
}
