<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\LoginOtpService;
use App\Services\RecaptchaService;
use App\Support\Branding;

/** What the sign-in pages need to know before rendering. Also refreshes the CSRF cookie for a stale tab. */
class AuthConfigController extends Controller
{
    public function __invoke(RecaptchaService $recaptcha)
    {
        return [
            'recaptcha' => [
                'enabled' => $recaptcha->isEnabled(),
                'site_key' => (string) config('recaptcha.site_key', ''),
                'enterprise' => ! empty(config('recaptcha.project_id')) && ! empty(config('recaptcha.api_key')),
            ],
            'branding' => Branding::public(),
            // Without keys, local development gets the sandbox behind the same button.
            'google' => ! empty(config('services.google.client_id')) || LoginOtpService::isLocalDev(),
        ];
    }
}
