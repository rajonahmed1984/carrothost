<?php

namespace App\Mail;

use App\Support\MailFrom;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** A plain notice to a customer about their order or invoice, sent from sales or billing. */
class CustomerNotice extends Mailable
{
    public function __construct(
        public string $sender,
        public string $subjectLine,
        public string $heading,
        public string $body,
        public string $url,
        public string $button,
        /** Already sanitized HTML that replaces the plain body in the HTML part. */
        public ?string $richBody = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(from: MailFrom::for($this->sender), subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.notice', text: 'emails.notice-text');
    }
}
