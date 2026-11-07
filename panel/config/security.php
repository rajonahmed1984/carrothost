<?php

return [
    /*
     * Content-Security-Policy: 'enforce' blocks anything not listed, 'report-only' only reports
     * it in the browser console, 'off' sends none. Switch to report-only if a page breaks.
     */
    'csp' => env('SECURITY_CSP', 'enforce'),

    // Strict-Transport-Security, sent on HTTPS only. One year, as browsers' preload list asks.
    'hsts_max_age' => (int) env('SECURITY_HSTS_MAX_AGE', 31536000),

    // An admin who does nothing for this many minutes is signed out. 0 turns it off.
    'admin_idle_minutes' => (int) env('ADMIN_IDLE_MINUTES', 30),
];
