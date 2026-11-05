<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Server extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['credentials'];

    protected function casts(): array
    {
        return ['credentials' => 'encrypted', 'verify_tls' => 'boolean', 'is_active' => 'boolean', 'connection_ok' => 'boolean', 'connection_checked_at' => 'datetime', 'nameservers' => 'array'];
    }

    public function costs(): HasMany
    {
        return $this->hasMany(ServerCost::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }
}
