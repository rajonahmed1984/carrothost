<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientUser extends Model
{
    use HasFactory;

    public const ALL_PERMISSIONS = [
        'profile' => 'Modify Master Account Profile',
        'contacts' => 'View & Manage Contacts',
        'products' => 'View Products & Services',
        'manageproducts' => 'View & Modify Product Passwords',
        'productsso' => 'Allow Single Signon',
        'domains' => 'View Domains',
        'managedomains' => 'Manage Domain Settings',
        'invoices' => 'View & Pay Invoices',
        'quotes' => 'View & Accept Quotes',
        'tickets' => 'View & Open Support Tickets',
        'affiliates' => 'View & Manage Affiliate Account',
        'emails' => 'View Emails',
        'orders' => 'Place New Orders/Upgrades/Cancellations',
    ];

    protected $fillable = [
        'client_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'language',
        'two_factor',
        'is_owner',
        'permissions',
        'status',
        'verification_token',
        'verification_token_expires_at',
        'email_verified_at',
        'last_login_at',
    ];

    protected function casts(): array
    {
        return [
            'is_owner' => 'boolean',
            'two_factor' => 'boolean',
            'email_verified_at' => 'datetime',
            'verification_token_expires_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    protected $appends = ['name', 'permissions_list'];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function getNameAttribute(): string
    {
        $name = trim(($this->first_name ?? '').' '.($this->last_name ?? ''));

        return $name !== '' ? $name : $this->email;
    }

    public function getPermissionsListAttribute(): array
    {
        if (empty($this->permissions)) {
            return [];
        }

        if (is_array($this->permissions)) {
            return $this->permissions;
        }

        return array_values(array_filter(array_map('trim', explode(',', (string) $this->permissions))));
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->is_owner) {
            return true;
        }

        return in_array($permission, $this->permissions_list, true);
    }
}

