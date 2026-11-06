<?php

namespace App\Mail;

use App\Support\MailFrom;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * A system report to the admins, such as the daily cron activity or domain sync report.
 *
 * @phpstan-type Section array{title: string, columns?: list<string>, rows: list<list<string>>, empty?: string}
 */
class AdminReport extends Mailable
{
    /**
     * @param  list<string>  $notes  short lines shown above the sections, e.g. warnings
     * @param  list<array{title: string, columns?: list<string>, rows: list<list<string>>, empty?: string}>  $sections
     */
    public function __construct(
        public string $subjectLine,
        public string $heading,
        public string $period,
        public array $notes,
        public array $sections,
        public string $url,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(from: MailFrom::for(MailFrom::SUPPORT), subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.admin-report', text: 'emails.admin-report-text');
    }
}
