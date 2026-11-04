<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrarCharge extends Model
{
    public const ACTIONS = ['register', 'renew', 'transfer', 'other'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['charged_at' => 'datetime', 'amount' => 'decimal:2'];
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }
}
