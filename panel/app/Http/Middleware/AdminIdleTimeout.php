<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Signs an admin out after a spell of doing nothing, so a staff computer left open does not stay
 * a way into every client's account. Polling the page does by itself (badges, chat list) is sent
 * with X-Background and does not count as activity.
 */
class AdminIdleTimeout
{
    public const KEY = 'admin_last_activity';

    public function handle(Request $request, Closure $next): Response
    {
        $minutes = (int) config('security.admin_idle_minutes');
        if ($minutes <= 0 || ! Auth::guard('web')->check()) {
            return $next($request);
        }

        $session = $request->session();
        $last = $session->get(self::KEY);

        if ($last && now()->timestamp - $last > $minutes * 60) {
            ActivityLog::record('admin.session_expired', context: ['idle_minutes' => $minutes]);
            Auth::guard('web')->logout();
            $session->invalidate();
            $session->regenerateToken();

            return response()->json(['message' => 'You were signed out after '.$minutes.' minutes without activity.'], 401);
        }

        if (! $last || ! $request->headers->has('X-Background')) {
            $session->put(self::KEY, now()->timestamp);
        }

        return $next($request);
    }
}
