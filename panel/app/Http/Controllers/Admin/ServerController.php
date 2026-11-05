<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Server;
use App\Models\ServerCost;
use App\Services\ServerProfit;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class ServerController extends Controller
{
    public function index(ServerProfit $profit)
    {
        $servers = Server::withCount(['services' => fn ($q) => $q->whereIn('status', ['active', 'suspended'])])->orderBy('name')->get();
        $month = CarbonImmutable::now()->startOfMonth();
        $report = collect($profit->report($month, $month, true)['servers'])->keyBy('id');

        return $servers->map(fn (Server $s) => [
            ...$s->toArray(),
            'has_credentials' => $s->credentials !== null && $s->credentials !== '',
            'this_month' => $report[$s->id]['months'][$month->format('Y-m')] ?? ['cost' => '0.00', 'sales' => '0.00', 'profit' => '0.00'],
        ]);
    }

    /** Profit by month: GET servers/profit?from=2026-01&to=2026-11&spread=1&server_id=1 */
    public function profit(Request $request, ServerProfit $profit)
    {
        $data = $request->validate([
            'from' => 'required|date_format:Y-m',
            'to' => 'required|date_format:Y-m|after_or_equal:from',
            'spread' => 'boolean',
            'server_id' => 'nullable|integer|exists:servers,id',
        ]);
        $from = CarbonImmutable::createFromFormat('Y-m-d', "{$data['from']}-01");
        $to = CarbonImmutable::createFromFormat('Y-m-d', "{$data['to']}-01");

        if ($from->diffInMonths($to) > 60) {
            throw ValidationException::withMessages(['from' => 'Choose at most five years.']);
        }

        return $profit->report($from, $to, $request->boolean('spread'), $data['server_id'] ?? null);
    }

    public function costs(Server $server)
    {
        return $server->costs()->orderByDesc('starts_on')->get();
    }

    /** Sets the monthly bill from a month on. Setting the same month again replaces it. */
    public function storeCost(Request $request, Server $server)
    {
        $data = $request->validate([
            'starts_on' => 'required|date_format:Y-m',
            'amount' => 'required|numeric|min:0|max:99999999',
            'note' => 'nullable|string|max:255',
        ]);

        $cost = $server->costs()->updateOrCreate(
            ['starts_on' => "{$data['starts_on']}-01"],
            ['amount' => number_format((float) $data['amount'], 2, '.', ''), 'note' => $data['note'] ?? null],
        );
        ActivityLog::record('server.cost_set', $server, ['from' => $data['starts_on'], 'amount' => $cost->amount]);

        return $this->costs($server);
    }

    public function destroyCost(Server $server, ServerCost $cost)
    {
        abort_unless($cost->server_id === $server->id, 404);
        $cost->delete();
        ActivityLog::record('server.cost_deleted', $server, ['from' => $cost->starts_on->format('Y-m')]);

        return $this->costs($server);
    }

    public function store(Request $request)
    {
        $server = Server::create($this->validated($request));
        ActivityLog::record('server.saved', $server);

        return response()->json($server, 201);
    }

    public function update(Request $request, Server $server)
    {
        $data = $this->validated($request);

        // A blank token on edit means "keep the current one".
        if (empty($data['credentials'])) {
            unset($data['credentials']);
        }

        $server->fill($data);

        // New login details: the last test no longer says anything about this server.
        if ($server->isDirty(['module', 'hostname', 'port', 'username', 'auth_type', 'credentials', 'verify_tls'])) {
            $server->forceFill(['connection_ok' => null, 'connection_error' => null, 'connection_checked_at' => null]);
        }

        $server->save();
        ActivityLog::record('server.saved', $server);

        return $server;
    }

    public function destroy(Server $server)
    {
        if ($server->services()->whereIn('status', ['active', 'suspended'])->exists()) {
            throw ValidationException::withMessages(['server' => 'This server still has live services. Deactivate it instead.']);
        }

        $server->delete();
        ActivityLog::record('server.deleted', context: ['name' => $server->name]);

        return response()->noContent();
    }

    public function test(Server $server)
    {
        $class = config("billing.provisioning_modules.{$server->module}.class");

        if (! $class) {
            return ['ok' => false, 'message' => 'This module is not connected yet.'];
        }

        try {
            (new $class($server))->testConnection();
            $result = ['ok' => true, 'message' => 'Connection succeeded.'];
        } catch (Throwable $e) {
            $result = ['ok' => false, 'message' => $e->getMessage()];
        }

        $server->forceFill([
            'connection_ok' => $result['ok'],
            'connection_error' => $result['ok'] ? null : mb_substr($result['message'], 0, 500),
            'connection_checked_at' => now(),
        ])->save();

        return [...$result, 'checked_at' => $server->connection_checked_at];
    }

    /**
     * Tests the values in the form without saving them. A blank secret on an existing
     * server uses the saved one. The saved connection status is left alone.
     */
    public function probe(Request $request)
    {
        $data = $this->validated($request);
        $saved = $request->filled('server_id') ? Server::findOrFail($request->integer('server_id')) : null;
        $server = ($saved?->replicate() ?? new Server)->forceFill(collect($data)->except(empty($data['credentials']) ? ['credentials'] : [])->all());
        $class = config("billing.provisioning_modules.{$server->module}.class");

        if (! $class) {
            return ['ok' => false, 'message' => 'This module is not connected yet.'];
        }
        if (! $server->credentials) {
            return ['ok' => false, 'message' => 'Enter the password or token to test.'];
        }

        try {
            (new $class($server))->testConnection();

            return ['ok' => true, 'message' => 'Connection succeeded with these details. Save to keep them.'];
        } catch (Throwable $e) {
            return ['ok' => false, 'message' => $e->getMessage()];
        }
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'module' => ['required', Rule::in(array_keys(config('billing.provisioning_modules')))],
            'hostname' => 'required|string|max:255',
            'port' => 'nullable|integer|between:1,65535',
            'username' => 'nullable|string|max:255',
            'auth_type' => 'sometimes|in:token,password',
            'credentials' => 'nullable|string',
            'verify_tls' => 'boolean',
            'max_accounts' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);
    }
}
