<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DomainReminder extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['sent_on' => 'date:Y-m-d'];
    }
}
