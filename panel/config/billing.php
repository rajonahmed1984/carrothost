<?php

return [
    'currency' => env('BILLING_CURRENCY', 'BDT'),

    // Company details shown to customers. Admin > Settings overrides these.
    'company_email' => env('MAIL_FROM_ADDRESS'),
    'pay_to' => null,
    'country' => 'Bangladesh',
    'logo_path' => null, // on the branding disk; null = the bundled logo
    'favicon_path' => null,

    // Days after the order that its first invoice falls due.
    'invoice_due_days' => 0,

    'cycles' => [
        'monthly' => 1,
        'quarterly' => 3,
        'semiannually' => 6,
        'annually' => 12,
        'biennially' => 24,
        'triennially' => 36,
    ],

    // Days before the due date that a renewal invoice is raised.
    'renewal_notice_days' => (int) env('BILLING_RENEWAL_NOTICE_DAYS', 14),

    // Days after the due date that an unpaid service is suspended.
    'suspension_enabled' => true,
    'suspend_after_days' => (int) env('BILLING_SUSPEND_AFTER_DAYS', 3),

    // Whether paying lifts a suspension that billing applied.
    'unsuspension_enabled' => true,

    // Close tickets left Answered this many days with no customer reply. 0 = never.
    'ticket_auto_close_days' => 0,

    // Support ticket departments a customer can choose from.
    'ticket_departments' => [
        'support' => 'Technical Support',
        'billing' => 'Billing',
        'sales' => 'Sales',
    ],

    // Terminating deletes customer data, so nothing here does it automatically.
    // It remains an explicit admin action.

    'provisioning_modules' => [
        'cpanel' => ['name' => 'cPanel / WHM', 'class' => App\Provisioning\CpanelModule::class],
        'webuzo' => ['name' => 'Webuzo', 'class' => App\Provisioning\WebuzoModule::class],
        'webdock' => ['name' => 'Webdock', 'class' => null],
    ],

    'registrars' => [
        'resellcube' => ['name' => 'ResellCube', 'class' => null],
        'stargate' => ['name' => 'StarGate / UK2', 'class' => null],
    ],

    'gateways' => [
        'manual' => [
            'name' => 'Manual / Bank',
            'implemented' => true,
            'fields' => [
                ['key' => 'instructions', 'label' => 'Payment instructions', 'type' => 'textarea', 'hint' => 'Bank account or Send Money number shown to clients.'],
            ],
        ],
        'bkash' => [
            'name' => 'bKash',
            'implemented' => true,
            'driver' => App\Payments\BkashDriver::class,
            'has_sandbox' => true,
            'fields' => [
                ['key' => 'display_name', 'label' => 'Display name', 'required' => true],
                ['key' => 'button_label', 'label' => 'Payment button label'],
                ['key' => 'app_key', 'label' => 'bKash App Key', 'required' => true],
                ['key' => 'token_url', 'label' => 'Token API URL', 'type' => 'url', 'required' => true, 'hint' => 'Returns the bKash grant token.'],
                ['key' => 'token_secret', 'label' => 'Token API secret', 'type' => 'secret', 'required' => true, 'hint' => 'Bearer token for the Token API.'],
            ],
        ],
        'sslcommerz' => [
            'name' => 'SSLCommerz',
            'implemented' => true,
            'driver' => App\Payments\SslCommerzDriver::class,
            'has_sandbox' => true,
            'fields' => [
                ['key' => 'display_name', 'label' => 'Display name', 'required' => true],
                ['key' => 'button_label', 'label' => 'Payment button label'],
                ['key' => 'store_id', 'label' => 'Store ID', 'required' => true],
                ['key' => 'store_password', 'label' => 'Store password', 'type' => 'secret', 'required' => true],
            ],
        ],
        'paypal' => [
            'name' => 'PayPal',
            'implemented' => true,
            'driver' => App\Payments\PayPalDriver::class,
            'has_sandbox' => true,
            'callback' => '/pay/paypal/ipn',
            'fields' => [
                ['key' => 'display_name', 'label' => 'Display name', 'required' => true],
                ['key' => 'button_label', 'label' => 'Payment button label'],
                ['key' => 'email', 'label' => 'PayPal email', 'type' => 'email', 'required' => true],
                ['key' => 'usd_rate', 'label' => 'BDT per 1 USD', 'type' => 'number', 'required' => true, 'hint' => 'Invoices are in BDT and PayPal charges USD. Keep this rate current.'],
            ],
        ],
        'stripe' => ['name' => 'Stripe', 'implemented' => false],
    ],
];
