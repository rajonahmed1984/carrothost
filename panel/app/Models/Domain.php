<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Domain extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['epp_code'];

    protected function casts(): array
    {
        return [
            'epp_code' => 'encrypted',
            'recurring_amount' => 'decimal:2',
            'expires_at' => 'date:Y-m-d',
            'renewal_invoiced_for' => 'date:Y-m-d',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
