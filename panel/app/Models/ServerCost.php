<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServerCost extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['starts_on' => 'date:Y-m', 'amount' => 'decimal:2'];
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }
}
