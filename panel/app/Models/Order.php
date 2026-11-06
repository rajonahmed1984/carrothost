<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $guarded = ['id'];

    protected static function booted(): void
    {
        // A random 10-digit number like WHMCS's, so it is not the same as the ID and does not reveal the order count.
        static::creating(function (Order $order) {
            $order->order_number ??= self::newNumber();
        });
    }

    public static function newNumber(): string
    {
        do {
            $number = (string) random_int(1000000000, 9999999999);
        } while (static::where('order_number', $number)->exists());

        return $number;
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
