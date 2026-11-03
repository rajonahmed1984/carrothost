<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class RecaptchaService
{
    public function isEnabled(): bool
    {
        $siteKey = config('recaptcha.site_key');

        return (bool) config('recaptcha.enabled') && is_string($siteKey) && $siteKey !== '';
    }

    public function assertValid(Request $request, string $action): void
    {
        if (! $this->isEnabled()) {
            return;
        }

        $token = $request->input('g-recaptcha-response');

        if (! is_string($token) || $token === '') {
            throw ValidationException::withMessages(['recaptcha' => 'Please complete the reCAPTCHA.']);
        }

        $result = $this->verify($token, config('recaptcha.site_key'), $action, $request->ip());

        if ($result === 'not_configured') {
            throw ValidationException::withMessages(['recaptcha' => 'reCAPTCHA is not configured.']);
        }

        if ($result !== true) {
            throw ValidationException::withMessages(['recaptcha' => 'reCAPTCHA verification failed. Please try again.']);
        }
    }

    private function verify(string $token, string $siteKey, string $action, ?string $ip): bool|string
    {
        $secret = config('recaptcha.secret_key');
        $projectId = config('recaptcha.project_id');
        $apiKey = config('recaptcha.api_key');
        $scoreThreshold = (float) config('recaptcha.score_threshold', 0.5);

        try {
            if (! empty($projectId) && ! empty($apiKey)) {
                $response = Http::timeout(8)->post(
                    'https://recaptchaenterprise.googleapis.com/v1/projects/'
                        .rawurlencode($projectId).'/assessments?key='.rawurlencode($apiKey),
                    ['event' => ['token' => $token, 'siteKey' => $siteKey, 'expectedAction' => $action]]
                );

                if (! $response->ok()) {
                    return false;
                }

                $data = $response->json();
                $actionValue = data_get($data, 'tokenProperties.action');
                $score = data_get($data, 'riskAnalysis.score');

                return (bool) data_get($data, 'tokenProperties.valid', false)
                    && (empty($actionValue) || $actionValue === $action)
                    && ($score === null || $score >= $scoreThreshold);
            }

            if (! empty($secret)) {
                $response = Http::asForm()->timeout(8)->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $ip,
                ]);

                if (! $response->ok()) {
                    return false;
                }

                $data = $response->json();
                $actionValue = data_get($data, 'action');
                $score = data_get($data, 'score');

                return (bool) data_get($data, 'success', false)
                    && (empty($actionValue) || $actionValue === $action)
                    && ($score === null || $score >= $scoreThreshold);
            }
        } catch (\Throwable $e) {
            Log::warning('reCAPTCHA verification failed.', ['error' => $e->getMessage()]);

            return false;
        }

        return 'not_configured';
    }
}
