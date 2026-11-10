<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token', 'login_otp_code', 'login_otp_expires_at'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'is_active' => 'boolean',
            'login_otp_expires_at' => 'datetime',
        ];
    }

    public const ROLES = ['admin', 'support'];

    /** Admins run the whole panel; support staff only reach customers, tickets and chat. */
    public function isFullAdmin(): bool
    {
        return $this->role !== 'support';
    }

    /** Every account here is staff, and a staff sign-in always needs the emailed code. */
    public function requiresLoginOtp(): bool
    {
        return true;
    }
}
