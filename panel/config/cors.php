<?php

// Only the public, read-only marketing endpoints are reachable cross-origin.
return [
    'paths' => ['api/public/*'],
    'allowed_methods' => ['GET'],
    'allowed_origins' => array_filter(explode(',', env('CORS_ALLOWED_ORIGINS', 'https://carrothost.com,https://www.carrothost.com'))),
    'allowed_origins_patterns' => env('APP_ENV') === 'production' ? [] : ['#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#'],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 600,
    'supports_credentials' => false,
];
