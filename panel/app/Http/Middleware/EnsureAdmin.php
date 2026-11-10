<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // A user disabled while signed in loses access on their next request.
        abort_unless($request->user()?->is_admin && $request->user()->is_active !== false, 403);

        return $next($request);
    }
}
