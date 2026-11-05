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
        $highest = (int) static::query()
            ->whereRaw("number REGEXP '^[0-9]+$'")
            ->whereRaw('CAST(number AS UNSIGNED) >= ?', [$start])
            ->lockForUpdate()
            ->max(\Illuminate\Support\Facades\DB::raw('CAST(number AS UNSIGNED)'));

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
