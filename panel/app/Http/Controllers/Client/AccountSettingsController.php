<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ClientContact;
use App\Models\ClientSession;
use App\Models\ClientUser;
use App\Models\SupportToken;
use App\Services\Auth\LoginService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** The account menu: details, contacts, emails, support PIN and sign-in sessions. */
class AccountSettingsController extends Controller
{
    private const PROFILE = ['name', 'company', 'email', 'phone', 'address', 'city', 'country'];

    public function profile(Request $request)
    {
        $client = $request->user('client');
        $parts = explode(' ', trim($client->name ?? ''), 2);

        return [
            ...$client->only(self::PROFILE),
            'first_name' => $parts[0] ?? $client->name,
            'last_name' => $parts[1] ?? '',
        ];
    }

    /** The email address is the login, so it is changed through support rather than here. */
    public function updateProfile(Request $request)
    {
        $client = $request->user('client');

        if ($request->has('first_name')) {
            $combined = trim($request->input('first_name', '').' '.$request->input('last_name', ''));
            if ($combined !== '') {
                $request->merge(['name' => $combined]);
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'country' => 'required|string|size:2|alpha',
        ]);

        $client->update($validated);
        ActivityLog::record('client.profile_updated', $client, ['by' => 'client']);

        return $client->only(self::PROFILE);
    }

    public function contacts(Request $request)
    {
        $client = $request->user('client');

        return $client->users()
            ->orderByDesc('is_owner')
            ->orderBy('id')
            ->get()
            ->map(fn (ClientUser $u) => [
                'id' => $u->id,
                'first_name' => $u->first_name,
                'last_name' => $u->last_name,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'language' => $u->language,
                'two_factor' => $u->two_factor,
                'is_owner' => $u->is_owner,
                'permissions' => $u->permissions_list,
                'status' => $u->status,
                'verification_token' => $u->verification_token,
                'email_verified_at' => $u->email_verified_at?->toISOString(),
                'last_login_at' => $u->last_login_at?->toISOString(),
                'receives_support' => $u->hasPermission('tickets'),
                'created_at' => $u->created_at?->toISOString(),
            ]);
    }

    public function storeContact(Request $request)
    {
        $client = $request->user('client');
        abort_if($client->users()->count() >= 25, 422, 'You can add up to 25 users.');

        $isSimpleContact = $request->has('name') && !$request->has('permissions');

        if ($request->has('name') && !$request->has('first_name')) {
            $parts = explode(' ', trim((string) $request->input('name')), 2);
            $request->merge([
                'first_name' => $parts[0] ?? $request->input('name'),
                'last_name' => $parts[1] ?? '',
            ]);
        }

        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('client_contacts')->where('client_id', $client->id),
            ],
            'phone' => 'nullable|string|max:50',
            'receives_support' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:'.implode(',', array_keys(ClientUser::ALL_PERMISSIONS)),
        ]);

        $email = strtolower($data['email']);
        $fullName = trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? '')) ?: $request->input('name', $email);
        $receivesSupport = $request->boolean('receives_support', true);

        if (!empty($data['permissions'])) {
            $receivesSupport = in_array('tickets', $data['permissions'], true);
        }

        $contact = $client->contacts()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $fullName,
                'phone' => $data['phone'] ?? null,
                'receives_support' => $receivesSupport,
            ]
        );

        if ($isSimpleContact) {
            $user = $client->users()->updateOrCreate(
                ['email' => $email],
                [
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'] ?? '',
                    'phone' => $data['phone'] ?? null,
                    'language' => 'English',
                    'two_factor' => false,
                    'is_owner' => false,
                    'permissions' => $receivesSupport ? 'tickets' : '',
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]
            );

            ActivityLog::record('client.contact_added', $client, ['email' => $contact->email]);

            return response()->json($contact->only('id', 'name', 'email', 'phone', 'receives_support'), 201);
        }

        $perms = !empty($data['permissions'])
            ? implode(',', $data['permissions'])
            : 'contacts,products,manageproducts,productsso,domains,managedomains,invoices,quotes,tickets,affiliates,emails,orders';

        $token = Str::random(48);

        $user = $client->users()->updateOrCreate(
            ['email' => $email],
            [
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'] ?? '',
                'phone' => $data['phone'] ?? null,
                'language' => 'English',
                'two_factor' => false,
                'is_owner' => false,
                'permissions' => $perms,
                'status' => 'pending_verification',
                'verification_token' => $token,
                'verification_token_expires_at' => now()->addDays(3),
                'email_verified_at' => null,
            ]
        );

        $verifyUrl = url("/account/contacts?verify_token={$token}");

        $client->emailLogs()->create([
            'to' => $user->email,
            'subject' => 'Confirm Your Email Address - CarrotHost Sub-Account Invitation',
            'body' => "Hello {$user->name},\n\nYou have been invited by {$client->name} to manage their CarrotHost account.\n\nPlease verify your email address by opening the following link:\n{$verifyUrl}\n\nOnce verified, a CarrotHost administrator will review and approve your sub-account access.\n\nThank you,\nCarrotHost Team",
        ]);

        ActivityLog::record('client.user_invited', $client, ['email' => $user->email]);

        return response()->json([
            'message' => "Invitation sent to {$user->email}. A verification email has been dispatched.",
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_owner' => false,
                'permissions' => $user->permissions_list,
                'status' => $user->status,
                'verification_token' => $user->verification_token,
                'receives_support' => $user->hasPermission('tickets'),
                'created_at' => $user->created_at?->toISOString(),
            ],
        ], 201);
    }

    public function updateContact(Request $request, int $id)
    {
        $client = $request->user('client');
        $user = $client->users()->findOrFail($id);

        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:'.implode(',', array_keys(ClientUser::ALL_PERMISSIONS)),
        ]);

        $update = [
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'phone' => $data['phone'] ?? null,
        ];

        if (isset($data['permissions']) && !$user->is_owner) {
            $update['permissions'] = implode(',', $data['permissions']);
        }

        $user->update($update);
        ActivityLog::record('client.user_updated', $client, ['email' => $user->email]);

        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_owner' => $user->is_owner,
            'permissions' => $user->permissions_list,
            'status' => $user->status,
            'receives_support' => $user->hasPermission('tickets'),
        ];
    }

    public function destroyContact(Request $request, int $id)
    {
        $client = $request->user('client');
        $user = $client->users()->findOrFail($id);
        abort_if($user->is_owner, 422, 'The account owner cannot be removed.');

        $user->delete();
        ActivityLog::record('client.user_removed', $client, ['email' => $user->email]);

        return response()->noContent();
    }

    public function resendContactVerification(Request $request, int $id)
    {
        $client = $request->user('client');
        $user = $client->users()->findOrFail($id);
        abort_if($user->status === 'active', 422, 'This user is already active.');

        $token = Str::random(48);
        $user->update([
            'verification_token' => $token,
            'verification_token_expires_at' => now()->addDays(3),
        ]);

        $verifyUrl = url("/account/contacts?verify_token={$token}");

        $client->emailLogs()->create([
            'to' => $user->email,
            'subject' => 'Confirm Your Email Address - CarrotHost Sub-Account Invitation',
            'body' => "Hello {$user->name},\n\nHere is your verification link for CarrotHost:\n{$verifyUrl}\n\nPlease verify your email to submit your sub-account for admin approval.\n\nThank you,\nCarrotHost Team",
        ]);

        return ['ok' => true, 'message' => "Verification link sent to {$user->email}."];
    }

    public function verifyContact(Request $request)
    {
        $token = $request->input('token') ?? $request->query('token');
        abort_if(empty($token), 422, 'Verification token is required.');

        $user = ClientUser::where('verification_token', $token)->first();
        if (!$user) {
            abort(422, 'Invalid or expired verification link.');
        }

        if ($user->verification_token_expires_at && $user->verification_token_expires_at->isPast()) {
            abort(422, 'This verification link has expired. Please request a new one.');
        }

        $user->update([
            'email_verified_at' => now(),
            'status' => 'pending_approval',
            'verification_token' => null,
            'verification_token_expires_at' => null,
        ]);

        $client = $user->client;
        if ($client) {
            $client->emailLogs()->create([
                'to' => $user->email,
                'subject' => 'Email Verified - Awaiting Administrator Approval',
                'body' => "Hello {$user->name},\n\nThank you for verifying your email address.\n\nYour sub-account access for {$client->name} is now pending approval by a CarrotHost administrator. You will receive an email once your account has been approved.\n\nThank you,\nCarrotHost Team",
            ]);

            ActivityLog::record('client.user_email_verified', $client, ['email' => $user->email]);
        }

        return [
            'ok' => true,
            'message' => 'Email address verified successfully! Your request has been submitted for administrator approval.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
            ],
        ];
    }

    public function verifyContactPublic(Request $request)
    {
        return $this->verifyContact($request);
    }

    public function emails(Request $request)
    {
        return $request->user('client')->emailLogs()->latest('id')->paginate(20, ['id', 'to', 'subject', 'created_at']);
    }

    public function email(Request $request, int $id)
    {
        return $request->user('client')->emailLogs()->findOrFail($id, ['id', 'to', 'subject', 'body', 'created_at']);
    }

    public function supportPin(Request $request)
    {
        $client = $request->user('client');
        $activePin = $client->activeSupportPin();

        $tokens = $client->supportTokens()->latest('id')->get()->map(function (SupportToken $t) {
            $status = $t->computed_status;
            if ($t->status !== $status && $t->status === 'active') {
                $t->update(['status' => $status]);
            }

            return [
                'id' => $t->id,
                'token' => $t->token,
                'created_at' => $t->created_at->toISOString(),
                'expires_at' => $t->expires_at->toISOString(),
                'used_at' => $t->used_at?->toISOString(),
                'cancelled_at' => $t->cancelled_at?->toISOString(),
                'status' => $status,
            ];
        });

        $activeToken = $tokens->firstWhere('status', 'active');

        return [
            'pin' => $activePin,
            'expires_at' => $activePin ? $client->support_pin_expires_at?->toISOString() : null,
            'active' => $activeToken,
            'tokens' => $tokens,
        ];
    }

    /** A fresh PIN replaces the old one and lasts an hour. */
    public function generateSupportPin(Request $request)
    {
        $client = $request->user('client');
        $pin = (string) random_int(100000, 999999);
        $expiresAt = now()->addHour();

        $client->supportTokens()
            ->where('status', 'active')
            ->where('expires_at', '>', now())
            ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        $tokenRecord = $client->supportTokens()->create([
            'token' => $pin,
            'expires_at' => $expiresAt,
            'status' => 'active',
        ]);

        $client->forceFill([
            'support_pin' => $pin,
            'support_pin_expires_at' => $expiresAt,
        ])->save();

        ActivityLog::record('client.support_pin_generated', $client, ['token_id' => $tokenRecord->id]);

        return $this->supportPin($request);
    }

    public function cancelSupportPin(Request $request, ?int $id = null)
    {
        $client = $request->user('client');

        if ($id) {
            $token = $client->supportTokens()->findOrFail($id);
            $token->update(['status' => 'cancelled', 'cancelled_at' => now()]);
            if ($client->support_pin === $token->token) {
                $client->forceFill(['support_pin' => null, 'support_pin_expires_at' => null])->save();
            }
        } else {
            $client->supportTokens()->where('status', 'active')->update(['status' => 'cancelled', 'cancelled_at' => now()]);
            $client->forceFill(['support_pin' => null, 'support_pin_expires_at' => null])->save();
        }

        ActivityLog::record('client.support_pin_cancelled', $client);

        return $this->supportPin($request);
    }

    public function sessions(Request $request)
    {
        $client = $request->user('client');
        $current = $request->session()->getId();
        $live = DB::table('sessions')->whereIn('id', $client->sessions()->select('session_id'))->pluck('last_activity', 'id');

        // Sessions that expired or signed out are gone from `sessions`; forget them here too.
        $client->sessions()->whereNotIn('session_id', $live->keys())->where('session_id', '!=', $current)->delete();

        return $client->sessions()->latest('id')->get()->map(fn (ClientSession $s) => [
            'id' => $s->id,
            'ip_address' => $s->ip_address,
            'user_agent' => $s->user_agent,
            'signed_in_at' => $s->created_at,
            'last_active_at' => isset($live[$s->session_id]) ? date(DATE_ATOM, $live[$s->session_id]) : $s->created_at,
            'current' => $s->session_id === $current,
        ]);
    }

    public function destroySession(Request $request, int $id)
    {
        $this->ensureOwnSession($request);
        $session = $request->user('client')->sessions()->findOrFail($id);
        abort_if($session->session_id === $request->session()->getId(), 422, 'Use Logout to end this session.');

        DB::table('sessions')->where('id', $session->session_id)->delete();
        $session->delete();
        ActivityLog::record('client.session_ended', $request->user('client'), ['ip' => $session->ip_address]);

        return response()->noContent();
    }

    /** Ends every other session and resets the remember-me token so no device signs back in on its own. */
    public function destroyOtherSessions(Request $request)
    {
        $this->ensureOwnSession($request);
        $client = $request->user('client');
        $others = $client->sessions()->where('session_id', '!=', $request->session()->getId());

        DB::table('sessions')->whereIn('id', (clone $others)->select('session_id'))->delete();
        $count = $others->delete();
        $client->setRememberToken(null);
        $client->save();
        ActivityLog::record('client.sessions_ended', $client, ['count' => $count]);

        return ['ended' => $count];
    }

    private function contactData(Request $request, int $clientId, ?ClientContact $contact = null): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('client_contacts')->where('client_id', $clientId)->ignore($contact)],
            'phone' => 'nullable|string|max:50',
            'receives_support' => 'boolean',
        ]);

        return [...$data, 'email' => strtolower($data['email'])];
    }

    /** An admin viewing the account must not sign the customer out of their devices. */
    private function ensureOwnSession(Request $request): void
    {
        abort_if($request->session()->has(LoginService::IMPERSONATOR), 403, 'Sessions cannot be changed while logged in as a client.');
    }
}
