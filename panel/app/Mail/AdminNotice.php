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
        public ?string $hostOf = null,
        public ?string $body = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(from: MailFrom::for($this->sender), subject: $this->subjectLine);
    }

    public function content(): Content
    {
        // Reverse DNS is slow, so it is looked up here, in the queue worker, not during checkout.
        if ($this->hostOf !== null) {
            $host = self::host($this->hostOf);
            $this->hostOf = null;
            foreach ($this->groups as $i => $group) {
                if (array_key_exists('Host', $group['rows'])) {
                    $this->groups[$i]['rows']['Host'] = $host;
                }
            }
        }

        return new Content(view: 'emails.admin-notice', text: 'emails.admin-notice-text');
    }

    /** Reverse DNS of a public address, when it has one. */
    private static function host(string $ip): ?string
    {
        if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return null;
        }
        $host = @gethostbyaddr($ip);

        return $host && $host !== $ip ? $host : null;
    }
}
