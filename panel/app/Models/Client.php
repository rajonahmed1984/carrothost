<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Client extends Authenticatable
{
    use Notifiable;

    protected $guarded = ['id'];

    protected $attributes = ['status' => 'active'];

    protected $hidden = ['password', 'remember_token', 'login_otp_code', 'login_otp_expires_at', 'support_pin', 'support_pin_expires_at'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'otp_enabled' => 'boolean',
            'login_otp_expires_at' => 'datetime',
            'support_pin_expires_at' => 'datetime',
            'credit_balance' => 'decimal:2',
        ];
    }

    public function credits(): HasMany
    {
        return $this->hasMany(ClientCredit::class);
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

    public function contacts(): HasMany
    {
        return $this->hasMany(ClientContact::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(ClientUser::class);
    }

    public function ownerUser(): HasOne
    {
        return $this->hasOne(ClientUser::class)->where('is_owner', true);
    }

    public function emailLogs(): HasMany
    {
        return $this->hasMany(EmailLog::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(ClientSession::class);
    }

    public function supportTokens(): HasMany
    {
        return $this->hasMany(SupportToken::class);
    }

    /** The support PIN while it is still valid. */
    public function activeSupportPin(): ?string
    {
        return $this->support_pin && $this->support_pin_expires_at?->isFuture() ? $this->support_pin : null;
    }
}
