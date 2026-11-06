<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** An admin's change to one of the built-in templates in App\Support\EmailTemplates. */
class EmailTemplate extends Model
{
    protected $primaryKey = 'key';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
