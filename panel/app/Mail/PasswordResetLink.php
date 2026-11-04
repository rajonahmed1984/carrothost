<?php

namespace App\Mail;

use App\Support\MailFrom;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** A client account user's link to set or reset their own password. */
class PasswordResetLink extends Mailable
{
    public function __construct(
        public string $name,
        public string $url,
        public int $minutes,
        public bool $hasPassword,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(from: MailFrom::for(MailFrom::SUPPORT), subject: $this->hasPassword ? 'Reset your password' : 'Set your password');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.password-reset-link', text: 'emails.password-reset-link-text');
    }
}
