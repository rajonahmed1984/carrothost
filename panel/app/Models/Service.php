<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsEncryptedArrayObject;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['credentials'];

    protected static function booted(): void
    {
        static::creating(function (Service $service) {
            $service->registered_at ??= today();
        });
    }

    protected function casts(): array
    {
        return [
            'credentials' => AsEncryptedArrayObject::class,
            'recurring_amount' => 'decimal:2',
            'auto_suspended' => 'boolean',
            'next_due_date' => 'date:Y-m-d',
            'registered_at' => 'date:Y-m-d',
            'termination_date' => 'date:Y-m-d',
            'override_suspend_until' => 'date:Y-m-d',
            'terminate_end_of_cycle' => 'boolean',
            'first_payment_amount' => 'decimal:2',
            'usage_updated_at' => 'datetime',
            'usage_metrics' => 'array',
            'module_options' => 'array',
            'renewal_invoiced_for' => 'date:Y-m-d',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function upgrades(): HasMany
    {
        return $this->hasMany(ServiceUpgrade::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }
}
