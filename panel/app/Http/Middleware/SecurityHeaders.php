<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Browser-side protection on every response: no framing (clickjacking), no MIME sniffing, HTTPS
 * only once seen over HTTPS, and a Content-Security-Policy that lets scripts load only from this
 * site and from Google's reCAPTCHA.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $nonce = Str::random(32);
        Vite::useCspNonce($nonce);

        $response = $next($request);
        $headers = $response->headers;

        // PHP adds its version on its own; it only helps an attacker pick an exploit.
        if (! headers_sent()) {
            header_remove('X-Powered-By');
        }
        $headers->remove('X-Powered-By');

        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('X-Frame-Options', 'DENY');
        $headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), usb=(), interest-cohort=()');
        // Payment and Google sign-in open in their own window and come back by redirect.
        $headers->set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

        if ($this->https($request) && config('security.hsts_max_age') > 0) {
            $headers->set('Strict-Transport-Security', 'max-age='.config('security.hsts_max_age').'; includeSubDomains');
        }

        $mode = config('security.csp');
        if ($mode !== 'off' && ! $headers->has('Content-Security-Policy')) {
            $headers->set($mode === 'report-only' ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', $this->policy($nonce, $this->https($request)));
        }

        return $response;
    }

    /** Behind Cloudflare the request may reach PHP as plain HTTP; the site's own URL says what visitors use. */
    private function https(Request $request): bool
    {
        return $request->isSecure() || (app()->isProduction() && str_starts_with((string) config('app.url'), 'https://'));
    }

    private function policy(string $nonce, bool $https): string
    {
        $google = 'https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://recaptcha.google.com/recaptcha/';
        // The Vite dev server, while it runs on a developer's machine.
        $dev = Vite::isRunningHot() ? ' '.$this->devServer() : '';

        return implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'nonce-{$nonce}' {$google}{$dev}",
            // React sets style attributes, and email previews carry their own inline styles.
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com{$dev}",
            "font-src 'self' data: https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https://www.google.com/recaptcha/{$dev}".($dev ? ' '.str_replace('http', 'ws', trim($dev)) : ''),
            "frame-src 'self' {$google}",
            "frame-ancestors 'none'",
            // Payment pages post on to the gateway's own site.
            "form-action 'self' https:",
            "base-uri 'self'",
            "object-src 'none'",
            ...($https ? ['upgrade-insecure-requests'] : []),
        ]);
    }

    private function devServer(): string
    {
        $url = trim((string) @file_get_contents(Vite::hotFile()));

        return $url !== '' ? $url : 'http://localhost:5173';
    }
}
