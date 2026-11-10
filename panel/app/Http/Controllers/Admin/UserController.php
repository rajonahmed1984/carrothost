<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use App\Support\Auth\Portal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Staff who sign in to the admin panel: admins and support users. */
class UserController extends Controller
{
    private const FIELDS = ['id', 'name', 'email', 'role', 'is_active', 'created_at'];

    public function index(Request $request)
    {
        $search = trim((string) $request->query('q'));

        return User::where('is_admin', true)
            ->when($search !== '', fn ($q) => $q->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")))
            ->when(in_array($request->query('role'), User::ROLES, true), fn ($q) => $q->where('role', $request->query('role')))
            ->when($request->query('role') === 'disabled', fn ($q) => $q->where('is_active', false))
            ->orderBy('name')
            ->paginate(25, self::FIELDS);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'role' => ['required', Rule::in(User::ROLES)],
            'password' => 'required|string|min:'.Portal::minPassword(Portal::ADMIN),
        ]);

        $user = new User;
        $user->forceFill([...$data, 'is_admin' => true, 'is_active' => true])->save();
        ActivityLog::record('staff.created', $user, ['role' => $user->role, 'by' => $request->user()->email]);

        return response()->json($user->refresh()->only(self::FIELDS), 201);
    }

    public function update(Request $request, User $user)
    {
        abort_unless($user->is_admin, 404);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', Rule::in(User::ROLES)],
            'is_active' => 'required|boolean',
            'password' => 'nullable|string|min:'.Portal::minPassword(Portal::ADMIN),
        ]);

        $self = $user->is($request->user());
        if ($self && $data['role'] !== $user->role) {
            throw ValidationException::withMessages(['role' => 'You cannot change your own role.']);
        }
        if ($self && ! $data['is_active']) {
            throw ValidationException::withMessages(['is_active' => 'You cannot disable your own account.']);
        }
        // Stops being a working admin: demoted or disabled.
        if ($user->role === 'admin' && $user->is_active && ($data['role'] !== 'admin' || ! $data['is_active'])) {
            $this->keepAnAdmin($user);
        }

        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }

        $user->forceFill($data)->save();
        if (! $user->is_active) {
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }
        ActivityLog::record('staff.updated', $user, ['role' => $user->role, 'active' => $user->is_active, 'password_changed' => isset($data['password']), 'by' => $request->user()->email]);

        return $user->only(self::FIELDS);
    }

    public function destroy(Request $request, User $user)
    {
        abort_unless($user->is_admin, 404);

        if ($user->is($request->user())) {
            throw ValidationException::withMessages(['user' => 'You cannot delete your own account.']);
        }
        if ($user->is_active) {
            $this->keepAnAdmin($user);
        }
        // Their replies would lose their author and read as if the customer wrote them.
        if (DB::table('ticket_replies')->where('user_id', $user->id)->exists() || DB::table('chat_messages')->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages(['user' => 'This user has replied to tickets or chats, so deleting would hide who wrote them. Disable the user instead.']);
        }

        ActivityLog::record('staff.deleted', $user, ['email' => $user->email, 'role' => $user->role, 'by' => $request->user()->email]);
        DB::table('sessions')->where('user_id', $user->id)->delete();
        $user->delete();

        return response()->noContent();
    }

    /** The panel must always keep one working admin, or nobody could manage it. */
    private function keepAnAdmin(User $user): void
    {
        if ($user->role === 'admin' && User::where('is_admin', true)->where('is_active', true)->where('role', 'admin')->whereKeyNot($user->id)->doesntExist()) {
            throw ValidationException::withMessages(['role' => 'This is the last active admin. Make another admin first.']);
        }
    }
}
