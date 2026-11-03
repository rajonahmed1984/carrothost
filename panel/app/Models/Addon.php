<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsEncryptedArrayObject;
use Illuminate\Database\Eloquent\Model;

class Addon extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['config'];

    protected function casts(): array
    {
        return ['config' => AsEncryptedArrayObject::class, 'is_enabled' => 'boolean'];
    }
}
