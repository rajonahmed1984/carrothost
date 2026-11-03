<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Services\Auth\LoginService;
use App\Services\RecaptchaService;
use App\Support\Auth\Portal;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PasswordController extends Controller
{
    /** The answer is the same whether or not the address has an account. */
    public function forgot(Request $request, RecaptchaService $recaptcha, string $portal)
    {
        $data = $request->validate(['email' => 'required|email']);
        $recaptcha->assertValid($request, 'FORGOT_PASSWORD');

        try {
            Password::broker(Portal::broker($portal))->sendResetLink([...$data, ...Portal::scope($portal)]);
        } catch (\Throwable $e) {
            Log::error('Failed to send a password reset link.', ['portal' => $portal, 'email' => $data['email'], 'exception' => $e->getMessage()]);

            throw ValidationException::withMessages(['email' => 'Unable to send the reset link right now. Please try again later.']);
        }

        return ['message' => 'If your email is in our system, we have sent a reset link.'];
    }

    public function reset(Request $request, string $portal)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|confirmed|min:'.Portal::minPassword($portal),
        ]);

        $status = Password::broker(Portal::broker($portal))->reset(
            [...$data, 'password_confirmation' => $request->input('password_confirmation'), ...Portal::scope($portal)],
            function ($account, string $password) {
                $account->forceFill(['password' => $password])->setRememberToken(Str::random(60));
                $account->save();

                event(new PasswordReset($account));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => __($status)]);
        }

        ActivityLog::record('password.reset', context: ['portal' => $portal, 'email' => $data['email'], 'ip' => $request->ip()]);

        return ['message' => __($status)];
    }

    /** A customer with no password yet (Google, or created by an admin) can set one directly. */
    public function change(Request $request, string $portal)
    {
        abort_if($request->session()->has(LoginService::IMPERSONATOR), 403, 'Passwords cannot be changed while logged in as a client.');

        $guard = Portal::guard($portal);
        $account = $request->user($guard);

        $data = $request->validate([
            'current_password' => [Rule::requiredIf($account->password !== null), 'nullable', 'string', 'current_password:'.$guard],
            'password' => 'required|string|confirmed|min:'.Portal::minPassword($portal),
        ]);

        $account->forceFill(['password' => $data['password']])->setRememberToken(Str::random(60));
        $account->save();
        ActivityLog::record('password.changed', context: ['portal' => $portal, 'ip' => $request->ip()]);

        return ['message' => 'Your password has been changed.'];
    }
}
