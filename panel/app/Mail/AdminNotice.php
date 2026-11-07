<?php

namespace App\Mail;

use App\Support\MailFrom;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * An event the admins should know about: a new order, an invoice raised or paid. Groups of
 * "Label: value" lines, an optional item table, and a link to the record in the admin area.
 */
class AdminNotice extends Mailable
{
    /**
     * @param  list<array{title: string, rows: array<string, string|null>}>  $groups
     * @param  list<array{0: string, 1: string}>  $items  description and amount
     */
    public function __construct(
        public string $sender,
        public string $subjectLine,
        public string $heading,
        public string $intro,
        public array $groups,
        public array $items,
        public ?string $totalLabel,
        public ?string $total,
        public string $url,
        public string $button,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(from: MailFrom::for($this->sender), subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.admin-notice', text: 'emails.admin-notice-text');
    }
}
