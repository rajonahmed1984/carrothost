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
        /** From the email template: replaces the built-in wording and subject when set. */
        public ?string $templateHtml = null,
        public ?string $templateText = null,
        public ?string $subjectLine = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(from: MailFrom::for(MailFrom::SUPPORT), subject: $this->subjectLine ?? ($this->hasPassword ? 'Reset your password' : 'Set your password'));
    }

    public function content(): Content
    {
        return $this->templateHtml !== null
            ? new Content(view: 'emails.templated', text: 'emails.templated-text', with: ['html' => $this->templateHtml, 'text' => $this->templateText, 'buttonUrl' => $this->url, 'buttonLabel' => $this->hasPassword ? 'Reset Password' : 'Set Password'])
            : new Content(view: 'emails.password-reset-link', text: 'emails.password-reset-link-text');
    }
}
