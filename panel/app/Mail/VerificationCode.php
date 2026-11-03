<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class VerificationCode extends Mailable
{
    public function __construct(
        public string $code,
        public string $subjectLine,
        public string $heading,
        public string $intro,
        public string $instructions,
        public string $footer,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.verification-code', text: 'emails.verification-code-text');
    }
}
