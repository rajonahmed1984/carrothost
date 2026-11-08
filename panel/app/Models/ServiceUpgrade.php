<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceUpgrade extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'new_recurring_amount' => 'decimal:2',
            'amount_due' => 'decimal:2',
            'new_next_due_date' => 'date:Y-m-d',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function oldProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'old_product_id');
    }

    public function newProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'new_product_id');
    }
}
