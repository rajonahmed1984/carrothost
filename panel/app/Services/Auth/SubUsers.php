<?php

namespace App\Services\Auth;

use App\Support\EmailTemplates;
use App\Mail\PasswordResetLink;
use App\Models\ActivityLog;
use App\Models\ClientUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Users of a client account other than its owner. They sign in to the client's
 * account with their own password, and the session remembers which user they are so their
 * permissions apply. The owner signs in as the client itself and has no such session key.
 */
class SubUsers
{
    public const SESSION_KEY = 'client_user_id';

    public const RESET_MINUTES = 60;

    /** The active user of an active client with this email and password, if any. */
    public function attempt(string $email, string $password): ?ClientUser
    {
        return $this->eligible()->whereRaw('lower(email) = ?', [strtolower(trim($email))])->get()
            ->first(fn (ClientUser $user) => Hash::check($password, $user->password));
    }

    /** The user acting in this session, or null for the owner (and for an admin logged in as the client). */
    public function current(Request $request): ?ClientUser
    {
        $id = $request->hasSession() ? $request->session()->get(self::SESSION_KEY) : null;

        return $id ? ClientUser::find($id) : null;
    }

    /** Whether the user may still use the account: removed, suspended or moved users lose access at once. */
    public function stillAllowed(ClientUser $user, int $clientId): bool
    {
        return (int) $user->client_id === $clientId &&$this->eligible()->whereKey($user->id)->exists();
    }

    /** A user's own reset link. Kept out of My Emails, where the account owner could use it. */
    public function sendResetLink(ClientUser $user): void
    {
        $token = Str::random(64);

        DB::table('client_user_password_resets')->updateOrInsert(
            ['client_user_id' => $user->id],
            ['token' => hash('sha256', $token), 'created_at' => now()],
        );

        $url = url("reset-password/{$token}").'?'.http_build_query(['email' => $user->email]);
        $action = $user->password !== null ? 'Reset' : 'Set';
        $template = EmailTemplates::render('account_user_password', [
            'user_name' => $user->name, 'client_email' => $user->email, 'reset_link' => $url, 'expiry_minutes' => self::RESET_MINUTES,
            'password_action' => $action, 'password_action_lower' => strtolower($action),
        ]);

        Mail::to($user->email)->send(new PasswordResetLink(
            name: $user->name,
            url: $url,
            minutes: self::RESET_MINUTES,
            hasPassword: $user->password !== null,
            templateHtml: $template['html'] ?? null,
            templateText: $template['text'] ?? null,
            subjectLine: $template['subject'] ?? null,
        ));
    }

    /** Sends a link to every active user with this email; used by the public Forgot Password form. */
    public function sendResetLinks(string $email): void
    {
        $this->eligible(requirePassword: false)->whereRaw('lower(email) = ?', [strtolower(trim($email))])->get()->each(fn (ClientUser $user) => $this->sendResetLink($user));
    }

    /** True when the token was one of this email's users' and their password is now set. */
    public function reset(string $email, string $token, string $password): bool
    {
        $hash = hash('sha256', $token);
        $row = DB::table('client_user_password_resets')
            ->join('client_users', 'client_users.id', '=', 'client_user_password_resets.client_user_id')
            ->whereRaw('lower(client_users.email) = ?', [strtolower(trim($email))])
            ->where('client_user_password_resets.created_at', '>=', now()->subMinutes(self::RESET_MINUTES))
            ->get(['client_user_password_resets.client_user_id', 'client_user_password_resets.token'])
            ->first(fn ($row) => hash_equals($row->token, $hash));

        if (! $row) {
            return false;
        }

        $user = ClientUser::findOrFail($row->client_user_id);
        $this->setPassword($user, $password);
        ActivityLog::record('client.user_password_reset', $user->client, ['email' => $user->email]);

        return true;
    }

    public function setPassword(ClientUser $user, string $password): void
    {
        $user->forceFill(['password' => $password])->save();
        DB::table('client_user_password_resets')->where('client_user_id', $user->id)->delete();
    }

    private function eligible(bool $requirePassword = true)
    {
        return ClientUser::query()
            ->where('is_owner', false)
            ->where('status', 'active')
            ->when($requirePassword, fn ($q) => $q->whereNotNull('password'))
            ->whereHas('client', fn ($q) => $q->where('status', 'active'));
    }
}
