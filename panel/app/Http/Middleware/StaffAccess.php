<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Support staff reach only what answering customers needs: tickets, chat, and a read-only look at
 * clients, orders, invoices, services and domains. Everything else (money, servers, settings,
 * staff users, server actions) is for admins. Admins pass straight through.
 */
class StaffAccess
{
    /** Paths under api/ that support may call with any method. */
    private const ANY = [
        '#^(logout|me|password|badges|meta)$#',
        '#^tickets(/.*)?$#',
        '#^chats(/.*)?$#',
    ];

    /** Paths under api/ that support may read. */
    private const READ = [
        '#^clients(/\d+(/(log|users|credits))?)?$#',
        '#^(orders|invoices|services|domains)(/\d+)?$#',
        '#^(products|product-groups)$#',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->isFullAdmin() && ! $this->supportMay($request)) {
            abort(403, 'Support staff cannot do this. Ask an admin.');
        }

        return $next($request);
    }

    private function supportMay(Request $request): bool
    {
        $path = preg_replace('#^api/#', '', $request->path());
        $rules = $request->isMethod('GET') ? [...self::ANY, ...self::READ] : self::ANY;

        foreach ($rules as $rule) {
            if (preg_match($rule, $path)) {
                return true;
            }
        }

        return false;
    }
}
