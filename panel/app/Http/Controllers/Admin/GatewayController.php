<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Gateway;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class GatewayController extends Controller
{
    public function index()
    {
        $saved = Gateway::all()->keyBy('code');

        return collect(config('billing.gateways'))->map(function ($definition, $code) use ($saved) {
            $gateway = $saved->get($code);
            $config = $gateway?->config;

            return [
                'code' => $code,
                'name' => $definition['name'],
                'implemented' => $definition['implemented'],
                'has_sandbox' => $definition['has_sandbox'] ?? false,
                'callback_url' => isset($definition['callback']) ? url($definition['callback']) : null,
                'is_enabled' => (bool) $gateway?->is_enabled,
                'test_mode' => (bool) ($gateway?->test_mode ?? true),
                'fee_percent' => (string) ($gateway?->fee_percent ?? '0'),
                'fee_fixed' => (string) ($gateway?->fee_fixed ?? '0'),
                // Secrets only ever report whether they are set.
                'fields' => array_map(fn ($field) => [
                    ...$field,
                    'value' => ($field['type'] ?? 'text') === 'secret' ? '' : ($config[$field['key']] ?? ''),
                    'is_set' => filled($config[$field['key']] ?? null),
                ], $definition['fields'] ?? []),
            ];
        })->values();
    }

    /** Checks the saved credentials with the gateway, without taking a payment. */
    public function test(string $code)
    {
        $definition = config("billing.gateways.{$code}");
        abort_unless($definition, 404);
        $gateway = Gateway::where('code', $code)->first();
        $driver = $gateway && ($definition['driver'] ?? null) ? new $definition['driver']($gateway) : null;

        if (! $driver || ! method_exists($driver, 'testConnection')) {
            throw ValidationException::withMessages(['gateway' => "Save the {$definition['name']} settings first. This gateway has no connection test."]);
        }

        try {
            $message = $driver->testConnection();
        } catch (\RuntimeException $e) {
            throw ValidationException::withMessages(['gateway' => $e->getMessage()]);
        }
        ActivityLog::record('gateway.tested', $gateway);

        return ['message' => $message];
    }

    public function update(Request $request, string $code)
    {
        $definition = config("billing.gateways.{$code}");
        abort_unless($definition, 404);

        $fields = $definition['fields'] ?? [];
        $rules = ['is_enabled' => 'required|boolean', 'test_mode' => 'boolean', 'config' => 'array', 'fee_percent' => 'nullable|numeric|min:0|max:100', 'fee_fixed' => 'nullable|numeric|min:0|max:100000'];

        foreach ($fields as $field) {
            $rules["config.{$field['key']}"] = match ($field['type'] ?? 'text') {
                'url' => 'nullable|url:https|max:500',
                'email' => 'nullable|email|max:255',
                'number' => 'nullable|numeric|gt:0',
                'textarea' => 'nullable|string|max:2000',
                default => 'nullable|string|max:500',
            };
        }

        $data = $request->validate($rules);

        if ($data['is_enabled'] && ! $definition['implemented']) {
            throw ValidationException::withMessages(['is_enabled' => "{$definition['name']} is not connected yet."]);
        }

        $gateway = Gateway::firstOrNew(['code' => $code]);
        $config = $gateway->config?->toArray() ?? [];

        foreach ($fields as $field) {
            $value = $data['config'][$field['key']] ?? null;

            // A blank secret means "keep the current one".
            if (($field['type'] ?? 'text') === 'secret' && blank($value)) {
                continue;
            }

            $config[$field['key']] = $value;
        }

        if ($data['is_enabled']) {
            foreach ($fields as $field) {
                if (($field['required'] ?? false) && blank($config[$field['key']] ?? null)) {
                    throw ValidationException::withMessages(['is_enabled' => "Fill in {$field['label']} before turning {$definition['name']} on."]);
                }
            }
            // A gateway with alternative credential sets needs one of them complete.
            if ($sets = $definition['required_any'] ?? null) {
                $complete = collect($sets)->contains(fn ($keys) => collect($keys)->every(fn ($key) => filled($config[$key] ?? null)));
                if (! $complete) {
                    throw ValidationException::withMessages(['is_enabled' => $definition['required_any_message'] ?? "Fill in the {$definition['name']} credentials first."]);
                }
            }
        }

        $gateway->config = $config;
        $gateway->is_enabled = $data['is_enabled'];
        $gateway->test_mode = $data['test_mode'] ?? $gateway->test_mode ?? true;
        // Left out of the request: keep what is saved.
        if ($request->has('fee_percent')) {
            $gateway->fee_percent = $data['fee_percent'] ?? 0;
        }
        if ($request->has('fee_fixed')) {
            $gateway->fee_fixed = $data['fee_fixed'] ?? 0;
        }
        $gateway->save();
        ActivityLog::record('gateway.updated', $gateway, ['enabled' => $gateway->is_enabled, 'test_mode' => $gateway->test_mode, 'fee_percent' => $gateway->fee_percent, 'fee_fixed' => $gateway->fee_fixed]);

        return ['ok' => true];
    }
}
