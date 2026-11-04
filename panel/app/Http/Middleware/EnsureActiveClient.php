<?php

namespace App\Http\Middleware;

use App\Services\Auth\SubUsers;
use App\Support\Auth\Portal;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/** Closing an account ends any session it already has, and so does removing or suspending the user signed in. */
class EnsureActiveClient
{
    public function __construct(private readonly SubUsers $subUsers) {}

    public function handle(Request $request, Closure $next): Response
    {
        $client = $request->user('client');
        $user = $this->subUsers->current($request);

        if (! Portal::allows(Portal::CLIENT, $client) || ($user && ! $this->subUsers->stillAllowed($user, (int) $client->id))) {
            Auth::guard('client')->logout();
            $request->session()->forget(SubUsers::SESSION_KEY);
            abort(401, 'Your account is not active.');
        }

        return $next($request);
    }
}
