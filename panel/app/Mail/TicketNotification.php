<?php

namespace App\Mail;

use App\Support\MailFrom;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class TicketNotification extends Mailable
{
    public function __construct(
        public string $subjectLine,
        public string $heading,
        public string $body,
        public string $url,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(from: MailFrom::for(MailFrom::SUPPORT), subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.ticket', text: 'emails.ticket-text');
    }
}
