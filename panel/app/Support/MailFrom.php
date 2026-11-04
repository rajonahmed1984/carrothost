<?php

namespace App\Support;

use Illuminate\Mail\Mailables\Address;

/** The sender for a category in config/system_mail.php, falling back to mail.from. */
class MailFrom
{
    public const SALES = 'sales';

    public const SUPPORT = 'support';

    public const BILLING = 'billing';

    public static function for(string $category): Address
    {
        $configured = config("system_mail.{$category}", []);

        return new Address(
            trim((string) ($configured['address'] ?? '')) ?: (string) config('mail.from.address'),
            trim((string) ($configured['name'] ?? '')) ?: (string) config('mail.from.name'),
        );
    }
}
