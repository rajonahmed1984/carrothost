<?php

namespace App\Mail;

use App\Support\MailFrom;
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
        public string $sender = MailFrom::SUPPORT,
        public ?string $name = null,
        /** From the email template: replaces the built-in wording when set. */
        public ?string $templateHtml = null,
        public ?string $templateText = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(from: MailFrom::for($this->sender), subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return $this->templateHtml !== null
            ? new Content(view: 'emails.templated', text: 'emails.templated-text', with: ['html' => $this->templateHtml, 'text' => $this->templateText, 'buttonUrl' => null, 'buttonLabel' => null])
            : new Content(view: 'emails.verification-code', text: 'emails.verification-code-text');
    }
}
