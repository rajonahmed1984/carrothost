<?php

/*
 * Customer SMS through the 24bulksmsbd.com gateway. Admin > Settings > SMS
 * overrides these once saved; keep real keys in .env, not here.
 */
return [
    'enabled' => (bool) env('SMS_ENABLED', false),
    'api_url' => env('SMS_API_URL', 'https://www.24bulksmsbd.com/api/smsSendApi'),
    'customer_id' => env('SMS_CUSTOMER_ID'),
    'api_key' => env('SMS_API_KEY'),
    // For reference only: the gateway rejects requests from any other server IP.
    'whitelisted_ip' => env('SMS_WHITELISTED_IP'),
    'timeout' => (int) env('SMS_TIMEOUT', 15),

    'invoice' => [
        'created' => true,
        'paid' => true,
        'reminder' => true,
    ],

    'templates' => [
        'invoice_created' => 'Dear {{client_name}}, invoice #{{invoice_number}} of {{invoice_total}} has been created. Due date: {{invoice_due_date}}. Pay: {{payment_url}} - {{company_name}}',
        'invoice_paid' => 'Dear {{client_name}}, we have received your payment of {{invoice_total}} for invoice #{{invoice_number}}. Thank you! - {{company_name}}',
        'invoice_reminder' => 'Dear {{client_name}}, reminder: invoice #{{invoice_number}} of {{amount_due}} is unpaid. Due date: {{invoice_due_date}}. Pay: {{payment_url}} - {{company_name}}',
    ],
];
