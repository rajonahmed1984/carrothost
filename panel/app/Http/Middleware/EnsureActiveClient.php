<?php

namespace App\Http\Middleware;

use App\Support\Auth\Portal;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/** Closing an account ends any session it already has. */
class EnsureActiveClient
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Portal::allows(Portal::CLIENT, $request->user('client'))) {
            Auth::guard('client')->logout();
            abort(401, 'Your account is not active.');
        }

        return $next($request);
    }
}
