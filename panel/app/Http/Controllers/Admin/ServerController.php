<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Server;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class ServerController extends Controller
{
    public function index()
    {
        return Server::withCount(['services' => fn ($q) => $q->whereIn('status', ['active', 'suspended'])])
            ->orderBy('name')->get();
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

        $server->update($data);
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

            return ['ok' => true, 'message' => 'Connection succeeded.'];
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
