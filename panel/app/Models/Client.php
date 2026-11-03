<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Client extends Authenticatable
{
    use Notifiable;

    protected $guarded = ['id'];

    protected $attributes = ['status' => 'active'];

    protected $hidden = ['password', 'remember_token', 'login_otp_code', 'login_otp_expires_at'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'otp_enabled' => 'boolean',
            'login_otp_expires_at' => 'datetime',
        ];
    }

    public function requiresLoginOtp(): bool
    {
        return $this->otp_enabled;
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function chatMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }
}
