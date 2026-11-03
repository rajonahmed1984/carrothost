<?php

namespace App\Listeners;

use App\Mail\VerificationCode;
use App\Models\Client;
use App\Models\ClientContact;
use App\Models\EmailLog;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Support\Str;

/** Keeps a copy of each email a customer (or one of their contacts) receives, for My Emails. */
class LogClientEmail
{
    public function handle(MessageSent $event): void
    {
        // Sign-in codes and password reset links stay out of the history.
        $notification = (string) ($event->data['__laravel_notification'] ?? '');
        if (($event->data['__laravel_mailable'] ?? null) === VerificationCode::class || str_contains($notification, 'ResetPassword')) {
            return;
        }

        $message = $event->message;
        $subject = Str::limit((string) $message->getSubject(), 250);
        $body = $message->getHtmlBody() ?? (($text = $message->getTextBody()) ? '<pre>'.e($text).'</pre>' : null);

        foreach ($message->getTo() as $address) {
            $email = strtolower($address->getAddress());
            $clientId = Client::where('email', $email)->value('id') ?? ClientContact::where('email', $email)->value('client_id');

            if ($clientId) {
                EmailLog::create(['client_id' => $clientId, 'to' => $email, 'subject' => $subject, 'body' => is_string($body) ? $body : null]);
            }
        }
    }
}
