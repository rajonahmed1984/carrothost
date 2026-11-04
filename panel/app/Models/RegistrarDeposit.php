<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegistrarDeposit extends Model
{
    public const METHODS = ['bank', 'card', 'bkash', 'other'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['paid_on' => 'date:Y-m-d', 'amount_bdt' => 'decimal:2', 'fee_bdt' => 'decimal:2', 'credited' => 'decimal:2'];
    }

    /** BDT it took to put one unit of the registrar's currency in the account, fee included. */
    public function rate(): float
    {
        return (float) $this->credited > 0 ? ((float) $this->amount_bdt + (float) $this->fee_bdt) / (float) $this->credited : 0.0;
    }
}
