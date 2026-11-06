<?php

use App\Payments\BkashDriver;
use App\Payments\PayPalDriver;
use App\Payments\SslCommerzDriver;
use App\Provisioning\CpanelModule;
use App\Provisioning\WebdockModule;
use App\Provisioning\WebuzoModule;

return [
    'currency' => env('BILLING_CURRENCY', 'BDT'),

    // BDT per 1 unit of each other currency: domain costs at USD registrars, and PayPal unless
    // its gateway sets its own rate. Admin > Settings > Currencies overrides these.
    'exchange_rates' => [
        'USD' => env('USD_RATE'),
    ],

    // Company details shown to customers. Admin > Settings overrides these.
    'company_email' => env('MAIL_FROM_ADDRESS'),
    'pay_to' => null,
    'country' => 'Bangladesh',
    'logo_path' => null, // on the branding disk; null = the bundled logo
    'favicon_path' => null,

    // Days after the order that its first invoice falls due.
    'invoice_due_days' => 0,

    // Invoices made in the panel are numbered from here on (plain numbers, like WHMCS's).
    // Imported WHMCS invoices keep their WHMCS id as the number, so this sits well above it.
    'invoice_number_start' => (int) env('INVOICE_NUMBER_START', 10001),

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

    // Terminate services left suspended for unpaid bills this many days past due. Off by default.
    'termination_enabled' => false,
    'terminate_after_days' => 30,

    // Automatic emails. before_due_days: one reminder this many days before the due date (0 = none).
    // overdue_days: up to three overdue notices, days after the due date (0 = none).
    // domain_days: expiry reminders, days before expiry; a negative number is days after it.
    'reminders' => [
        'before_due_days' => 3,
        'overdue_days' => [1, 3, 7],
        'domain_days' => '30,14,7,3,1,-3',
    ],

    // Daily: refresh disk and bandwidth from the servers, and expiry and status from the registrars.
    'usage_update_enabled' => true,
    'domain_sync_enabled' => true,

    // Admin emails sent at midnight, like WHMCS: what the daily jobs did the day before, and
    // what the domain sync changed. recipients: comma separated; blank means every admin.
    'reports' => [
        'cron_activity' => true,
        'domain_sync' => true,
        'recipients' => null,
    ],

    // Add Funds limits, in the billing currency. Admin > Settings overrides these.
    'credit' => [
        'min_deposit' => '100.00',
        'max_deposit' => '50000.00',
        'max_balance' => '100000.00',
    ],

    // Close tickets left Answered this many days with no customer reply. 0 = never.
    'ticket_auto_close_days' => 0,

    // Domain ordering and defaults. Admin > Settings > Domains overrides these.
    'domains' => [
        'allow_register' => true,
        'allow_transfer' => true,
        'allow_own' => true, // hosting for a domain registered elsewhere
        'auto_renew' => true, // whether new domains get renewal invoices
        'nameservers' => [null, null, null, null, null],
        'lookup_provider' => null, // registrar code that answers availability checks
        'premium_enabled' => false, // premium names: true = ask for a quote, false = shown as unavailable
    ],

    // Support ticket departments a customer can choose from.
    'ticket_departments' => [
        'support' => 'Technical Support',
        'billing' => 'Billing',
        'sales' => 'Sales',
    ],

    // Terminating deletes customer data, so nothing here does it automatically.
    // It remains an explicit admin action.

    'provisioning_modules' => [
        'cpanel' => ['name' => 'cPanel / WHM', 'class' => CpanelModule::class],
        'webuzo' => ['name' => 'Webuzo', 'class' => WebuzoModule::class],
        'webdock' => ['name' => 'Webdock', 'class' => WebdockModule::class],
    ],

    // Webdock: the OS new VPSes get. Blank picks the newest plain Ubuntu image Webdock offers.
    'webdock' => ['default_image' => env('WEBDOCK_DEFAULT_IMAGE')],

    'registrars' => [
        'resellcube' => ['name' => 'ResellCube', 'class' => \App\Services\LogicBoxesClient::class],
        'stargate' => ['name' => 'StarGate / UK2', 'class' => \App\Services\LogicBoxesClient::class],
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
            'driver' => BkashDriver::class,
            'has_sandbox' => true,
            'fields' => [
                ['key' => 'display_name', 'label' => 'Display name', 'required' => true],
                ['key' => 'button_label', 'label' => 'Payment button label'],
                ['key' => 'username', 'label' => 'Username (PGW)', 'hint' => 'From bKash, usually the merchant number.'],
                ['key' => 'password', 'label' => 'Password (PGW)', 'type' => 'secret'],
                ['key' => 'app_key', 'label' => 'app_key (PGW)', 'required' => true],
                ['key' => 'app_secret', 'label' => 'app_secret (PGW)', 'type' => 'secret'],
                ['key' => 'base_url', 'label' => 'API base URL (optional)', 'type' => 'url', 'hint' => 'Blank uses https://tokenized.pay.bka.sh/v1.2.0-beta, or the sandbox one in Sandbox mode.'],
                ['key' => 'token_url', 'label' => 'Token API URL (older setup only)', 'type' => 'url', 'hint' => 'Only for a separate token service. Leave blank when using the username and password above.'],
                ['key' => 'token_secret', 'label' => 'Token API secret (older setup only)', 'type' => 'secret'],
            ],
            // Either set is enough to turn it on: the merchant credentials, or the older token service.
            'required_any' => [['username', 'password', 'app_secret'], ['token_url', 'token_secret']],
            'required_any_message' => 'Fill in the bKash Username, Password and app_secret (or the older Token API URL and secret) before turning bKash on.',
        ],
        'sslcommerz' => [
            'name' => 'SSLCommerz',
            'implemented' => true,
            'driver' => SslCommerzDriver::class,
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
            'driver' => PayPalDriver::class,
            'has_sandbox' => true,
            'callback' => '/pay/paypal/ipn',
            'fields' => [
                ['key' => 'display_name', 'label' => 'Display name', 'required' => true],
                ['key' => 'button_label', 'label' => 'Payment button label'],
                ['key' => 'email', 'label' => 'PayPal email', 'type' => 'email', 'required' => true, 'hint' => 'Receives the payments. This is all checkout needs.'],
                ['key' => 'api_username', 'label' => 'API username (optional)', 'hint' => 'PayPal > Account Settings > API access (NVP/SOAP). Used to test the account.'],
                ['key' => 'api_password', 'label' => 'API password (optional)', 'type' => 'secret'],
                ['key' => 'api_signature', 'label' => 'API signature (optional)', 'type' => 'secret'],
                ['key' => 'usd_rate', 'label' => 'BDT per 1 USD', 'type' => 'number', 'hint' => 'Invoices are in BDT and PayPal charges USD. Leave blank to use the rate in Settings > Currencies.'],
            ],
        ],
        'stripe' => ['name' => 'Stripe', 'implemented' => false],
    ],
];
