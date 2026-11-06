<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $guarded = ['id'];

    /**
     * The next panel invoice number: one above the highest plain number at or past the start.
     * Called inside the creating transaction; the row lock keeps two invoices from sharing one.
     */
    public static function nextNumber(): string
    {
        $start = (int) config('billing.invoice_number_start', 10001);
        // MySQL in production; SQLite (the test database) has no REGEXP or UNSIGNED.
        [$digitsOnly, $asNumber] = static::query()->getConnection()->getDriverName() === 'sqlite'
            ? ["number <> '' AND number NOT GLOB '*[^0-9]*'", 'CAST(number AS INTEGER)']
            : ["number REGEXP '^[0-9]+$'", 'CAST(number AS UNSIGNED)'];
        $highest = (int) static::query()
            ->whereRaw($digitsOnly)
            ->whereRaw("{$asNumber} >= ?", [$start])
            ->lockForUpdate()
            ->max(\Illuminate\Support\Facades\DB::raw($asNumber));

        return (string) max($start, $highest + 1);
    }

    protected function casts(): array
    {
        return ['total' => 'decimal:2', 'due_date' => 'date:Y-m-d', 'paid_at' => 'datetime'];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
