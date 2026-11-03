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
                // Secrets only ever report whether they are set.
                'fields' => array_map(fn ($field) => [
                    ...$field,
                    'value' => ($field['type'] ?? 'text') === 'secret' ? '' : ($config[$field['key']] ?? ''),
                    'is_set' => filled($config[$field['key']] ?? null),
                ], $definition['fields'] ?? []),
            ];
        })->values();
    }

    public function update(Request $request, string $code)
    {
        $definition = config("billing.gateways.{$code}");
        abort_unless($definition, 404);

        $fields = $definition['fields'] ?? [];
        $rules = ['is_enabled' => 'required|boolean', 'test_mode' => 'boolean', 'config' => 'array'];

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
        }

        $gateway->config = $config;
        $gateway->is_enabled = $data['is_enabled'];
        $gateway->test_mode = $data['test_mode'] ?? $gateway->test_mode ?? true;
        $gateway->save();
        ActivityLog::record('gateway.updated', $gateway, ['enabled' => $gateway->is_enabled, 'test_mode' => $gateway->test_mode]);

        return ['ok' => true];
    }
}
