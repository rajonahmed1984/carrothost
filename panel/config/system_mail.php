<?php

/**
 * Who each kind of email comes from. A blank address or name falls back to mail.from,
 * which the admin Settings page can change.
 */
return [
    // Registration codes, order confirmations and accepted orders.
    'sales' => [
        'address' => env('SYSTEM_MAIL_SALES_ADDRESS', 'sales@carrothost.com'),
        'name' => env('SYSTEM_MAIL_SALES_NAME', 'CarrotHost Sales'),
    ],
    // Sign-in codes, password resets, tickets and anything without a category.
    'support' => [
        'address' => env('SYSTEM_MAIL_SUPPORT_ADDRESS', 'support@carrothost.com'),
        'name' => env('SYSTEM_MAIL_SUPPORT_NAME', 'CarrotHost Support'),
    ],
    // Invoices and payment receipts.
    'billing' => [
        'address' => env('SYSTEM_MAIL_BILLING_ADDRESS', 'billing@carrothost.com'),
        'name' => env('SYSTEM_MAIL_BILLING_NAME', 'CarrotHost Billing'),
    ],
];
