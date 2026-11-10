<?php

namespace App\Services;

use App\Mail\CustomerNotice;
use App\Mail\TicketNotification;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Ticket;
use App\Models\User;
use App\Support\EmailTemplates;
use App\Support\MailFrom;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class TicketService
{
    public function open(Client $client, array $data, array $attachment = []): Ticket
    {
        $ticket = DB::transaction(function () use ($client, $data, $attachment) {
            $ticket = $client->tickets()->create([
                'number' => $this->number(),
                'service_id' => $data['service_id'] ?? null,
                'department' => $data['department'],
                'subject' => $data['subject'],
                'priority' => $data['priority'] ?? 'medium',
                'status' => 'open',
                'last_reply_at' => now(),
            ]);
            $ticket->replies()->create(['message' => $data['message'], ...$attachment]);

            return $ticket;
        });

        ActivityLog::record('ticket.opened', $ticket);
        $this->notifyStaff($ticket, "New ticket #{$ticket->number}: {$ticket->subject}", "{$client->name} opened a new ticket.", $data['message']);

        return $ticket;
    }

    /** A staff reply marks the ticket answered unless a status is given; a customer reply reopens it. */
    public function reply(Ticket $ticket, string $message, ?User $staff = null, ?string $status = null, array $attachment = []): Ticket
    {
        DB::transaction(function () use ($ticket, $message, $staff, $status, $attachment) {
            $ticket->replies()->create(['message' => $message, 'user_id' => $staff?->id, ...$attachment]);
            $ticket->update([
                'status' => $staff ? ($status ?? 'answered') : 'customer_reply',
                'last_reply_at' => now(),
            ]);
        });

        ActivityLog::record($staff ? 'ticket.answered' : 'ticket.customer_reply', $ticket);

        if ($staff) {
            $recipients = [$ticket->client->email, ...$ticket->client->contacts()->where('receives_support', true)->pluck('email')];

            // The Support Ticket Reply template; turned off, the customer gets no email.
            $mail = EmailTemplates::render('ticket_reply', [
                ...CustomerMailer::clientValues($ticket->client),
                'ticket_number' => $ticket->number,
                'ticket_subject' => $ticket->subject,
                'ticket_message' => nl2br(e($message), false),
                'ticket_status' => ucwords(str_replace('_', ' ', (string) $ticket->refresh()->status)),
                'staff_name' => $staff->name,
                'ticket_link' => url("tickets/{$ticket->id}"),
            ]);

            foreach ($mail ? array_unique($recipients) : [] as $email) {
                $this->send($email, new CustomerNotice(
                    sender: MailFrom::SUPPORT,
                    subjectLine: $mail['subject'],
                    heading: '',
                    body: $mail['text'],
                    url: url("tickets/{$ticket->id}"),
                    button: 'View ticket',
                    richBody: $mail['html'],
                ));
            }
        } else {
            $this->notifyStaff($ticket, "Customer reply on #{$ticket->number}: {$ticket->subject}", "{$ticket->client->name} replied.", $message);
        }

        return $ticket;
    }

    /** Tickets left Answered past the configured days are closed. */
    public function autoClose(): int
    {
        $days = (int) config('billing.ticket_auto_close_days');

        if ($days <= 0) {
            return 0;
        }

        return Ticket::where('status', 'answered')->where('last_reply_at', '<', now()->subDays($days))->update(['status' => 'closed']);
    }

    private function notifyStaff(Ticket $ticket, string $subject, string $heading, string $message): void
    {
        foreach (User::where('is_admin', true)->where('is_active', true)->pluck('email') as $email) {
            $this->send($email, new TicketNotification($subject, $heading, $message, url("tickets/{$ticket->id}")));
        }
    }

    /** A mail outage must never lose the reply itself. */
    private function send(string $email, TicketNotification|CustomerNotice $mail): void
    {
        try {
            Mail::to($email)->send($mail);
        } catch (Throwable $e) {
            Log::warning("Failed to send a ticket email to {$email}: ".$e->getMessage());
        }
    }

    private function number(): string
    {
        do {
            $number = (string) random_int(100000, 999999);
        } while (Ticket::where('number', $number)->exists());

        return $number;
    }
}
