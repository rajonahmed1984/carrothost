<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Domain extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['epp_code'];

    protected function casts(): array
    {
        return [
            'epp_code' => 'encrypted',
            'auto_renew' => 'boolean',
            'nameservers' => 'array',
            'recurring_amount' => 'decimal:2',
            'expires_at' => 'date:Y-m-d',
            'renewal_invoiced_for' => 'date:Y-m-d',
        ];
    }

    /** Hostnames that pass this are accepted for a domain or nameserver. */
    public const NAME_PATTERN = '/^([a-z0-9-]+\.)+[a-z]{2,}$/i';

    /** @return list<string> the nameservers set in Admin > Settings > Domains */
    public static function defaultNameservers(): array
    {
        return array_values(array_filter(config('billing.domains.nameservers', [])));
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
