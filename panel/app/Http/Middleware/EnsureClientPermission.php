<?php

namespace App\Http\Middleware;

use App\Services\Auth\SubUsers;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * client.can:invoices lets the owner through, and a user of the account only when that
 * permission is ticked for them. client.can:owner is for the owner alone.
 */
class EnsureClientPermission
{
    public function __construct(private readonly SubUsers $subUsers) {}

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $this->subUsers->current($request);

        if ($user && ($permission === 'owner' || ! $user->hasPermission($permission))) {
            abort(403, 'Your user does not have access to this. Ask the account owner to give you permission.');
        }

        return $next($request);
    }
}
