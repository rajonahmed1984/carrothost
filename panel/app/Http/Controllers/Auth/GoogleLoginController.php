<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Services\Auth\LoginOtpService;
use App\Services\Auth\LoginService;
use App\Support\Auth\Portal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** Customers only. Admins always sign in with a password and an emailed code. */
class GoogleLoginController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        $config = config('services.google');

        if (empty($config['client_id'])) {
            if (! LoginOtpService::isLocalDev()) {
                return $this->failed('google_unavailable');
            }

            $target = $this->safeRedirect($request->query('redirect'));

            return redirect('/auth/sandbox/google'.($target ? '?'.http_build_query(['redirect' => $target]) : ''));
        }

        $state = Str::random(40);
        $request->session()->put('oauth_state_google', $state);
        $request->session()->put('oauth_redirect_google', $this->safeRedirect($request->query('redirect')));

        return redirect('https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => $config['client_id'],
            'redirect_uri' => $this->redirectUri(),
            'response_type' => 'code',
            'scope' => 'openid profile email',
            'state' => $state,
        ]));
    }

    public function callback(Request $request, LoginService $login): RedirectResponse
    {
        $expectedState = $request->session()->pull('oauth_state_google');
        $target = $request->session()->pull('oauth_redirect_google');
        $state = $request->query('state');
        $code = $request->query('code');

        if (! is_string($expectedState) || ! is_string($state) || ! hash_equals($expectedState, $state) || ! is_string($code) || $code === '') {
            return $this->failed('google_failed');
        }

        try {
            $profile = $this->profile($code);
        } catch (\Throwable $e) {
            Log::warning('Google login failed.', ['error' => $e->getMessage()]);

            return $this->failed('google_failed');
        }

        // Accounts are matched by email, so only trust addresses Google has verified.
        if (($profile['email_verified'] ?? false) !== true || empty($profile['email'])) {
            return $this->failed('google_unverified');
        }

        if (! $this->signIn($request, $login, $profile['email'], $profile['name'] ?? null, 'google')) {
            return $this->failed('google_closed');
        }

        return redirect($target ?: '/');
    }

    /** Lists customers to pick from. Local development only, because it signs in without a password. */
    public function sandbox()
    {
        abort_unless(LoginOtpService::isLocalDev(), 404);

        return ['clients' => Client::whereIn('status', Client::CAN_SIGN_IN)->orderBy('name')->limit(20)->get(['id', 'name', 'email'])];
    }

    /** Stands in for Google's callback while no Google keys are set. Only ever reaches the client guard. */
    public function sandboxLogin(Request $request, LoginService $login)
    {
        abort_unless(LoginOtpService::isLocalDev(), 404);

        $data = $request->validate(['email' => 'required|email|max:255', 'name' => 'nullable|string|max:255']);

        if (! $this->signIn($request, $login, $data['email'], $data['name'] ?? null, 'google_sandbox')) {
            throw ValidationException::withMessages(['email' => 'This account is not active.']);
        }

        return ['ok' => true];
    }

    /** Finds or creates the customer for a proven email. False means the account may not sign in. */
    private function signIn(Request $request, LoginService $login, string $email, ?string $name, string $via): bool
    {
        $email = Str::lower(trim($email));
        $client = Client::whereRaw('LOWER(TRIM(email)) = ?', [$email])->orderBy('id')->first();

        if (! $client) {
            $client = Client::create(['name' => $name ?: explode('@', $email)[0], 'email' => $email])->refresh();
            ActivityLog::record('client.registered', $client, ['via' => $via]);
        }

        if (! Portal::allows(Portal::CLIENT, $client)) {
            ActivityLog::record('login.denied', context: ['portal' => Portal::CLIENT, 'email' => $email, 'ip' => $request->ip(), 'via' => $via]);

            return false;
        }

        $login->complete($request, Portal::CLIENT, $client);

        return true;
    }

    private function profile(string $code): array
    {
        $config = config('services.google');

        $token = Http::asForm()->timeout(10)->post('https://oauth2.googleapis.com/token', [
            'code' => $code,
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'redirect_uri' => $this->redirectUri(),
            'grant_type' => 'authorization_code',
        ])->throw()->json('access_token');

        return Http::withToken($token)->timeout(10)->get('https://www.googleapis.com/oauth2/v3/userinfo')->throw()->json();
    }

    private function redirectUri(): string
    {
        return config('services.google.redirect') ?: url('auth/google/callback');
    }

    /** Only a path on this site: browsers read // and /\ as another host, and drop tabs and newlines first. */
    private function safeRedirect(mixed $redirect): ?string
    {
        return is_string($redirect) && ! preg_match('/[\x00-\x1F\x7F]/', $redirect) && preg_match('#^/(?![/\\\\])#', $redirect) ? $redirect : null;
    }

    private function failed(string $reason): RedirectResponse
    {
        return redirect('/login?error='.$reason);
    }
}
