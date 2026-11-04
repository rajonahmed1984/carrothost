<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\User;
use App\Services\Auth\LoginService;
use App\Services\Auth\SubUsers;
use App\Support\Auth\Portal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ImpersonationController extends Controller
{
    public function start(Request $request, Client $client)
    {
        if (! Portal::allows(Portal::CLIENT, $client)) {
            throw ValidationException::withMessages(['client' => 'Only an active client can be logged in as.']);
        }

        ActivityLog::record('client.impersonated', $client);

        $request->session()->put(LoginService::IMPERSONATOR, $request->user()->id);
        $request->session()->forget(SubUsers::SESSION_KEY); // the admin sees the whole account
        Auth::guard('web')->logoutCurrentDevice();
        Auth::guard('client')->login($client);
        $request->session()->regenerate();

        return ['ok' => true];
    }

    public function stop(Request $request)
    {
        $adminId = $request->session()->pull(LoginService::IMPERSONATOR);
        abort_unless($adminId, 403, 'You are not logged in as a client.');

        $clientId = Auth::guard('client')->id();
        // logout() would cycle the remember token and sign the customer out of their own devices.
        Auth::guard('client')->logoutCurrentDevice();

        $admin = User::find($adminId);

        // The admin may have lost access since starting, and must not get it back this way.
        if (! $admin || ! Portal::allows(Portal::ADMIN, $admin)) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            abort(403, 'This admin account no longer has access.');
        }

        Auth::guard('web')->login($admin);
        $request->session()->regenerate();
        ActivityLog::record('client.impersonation_stopped', context: ['client_id' => $clientId]);

        return ['client_id' => $clientId];
    }
}
