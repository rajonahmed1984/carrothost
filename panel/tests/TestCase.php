<?php

namespace Tests;

use App\Models\Client;
use App\Models\ClientUser;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Testing\TestResponse;

abstract class TestCase extends BaseTestCase
{
    /**
     * Signs a customer (or a user of their account) in the way the client area does: password,
     * then the emailed code, which every sign-in needs. Returns the code step's response.
     */
    protected function loginClientWithCode(string $email, string $password, array $extra = []): TestResponse
    {
        $this->postJson('/api/client/login', ['email' => $email, 'password' => $password, ...$extra])
            ->assertOk()->assertJsonPath('requires_otp', true);

        // The real code is only emailed (and stored hashed), so swap in a known one.
        $code = '424242';
        $match = fn ($q) => $q->whereRaw('LOWER(email) = ?', [strtolower($email)]);
        Client::where($match)->update(['login_otp_code' => hash('sha256', $code), 'login_otp_expires_at' => now()->addMinutes(5)]);
        ClientUser::where($match)->update(['login_otp_code' => hash('sha256', $code), 'login_otp_expires_at' => now()->addMinutes(5)]);

        return $this->postJson('/api/login/otp', ['otp' => $code])->assertOk();
    }
}
