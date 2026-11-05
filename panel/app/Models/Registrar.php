<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Registrar extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['api_key'];

    protected function casts(): array
    {
        return ['api_key' => 'encrypted', 'last_synced_at' => 'datetime', 'tlds_synced_at' => 'datetime', 'connection_ok' => 'boolean', 'connection_checked_at' => 'datetime'];
    }

    /** Remembers whether the last API call got through, for the Connection column. */
    public function markConnection(bool $ok, ?string $error = null): void
    {
        $this->forceFill([
            'connection_ok' => $ok,
            'connection_error' => $ok ? null : mb_substr((string) $error, 0, 500),
            'connection_checked_at' => now(),
        ])->save();
    }
}
