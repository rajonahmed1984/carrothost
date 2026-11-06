<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Gateway;
use App\Models\Registrar;
use App\Models\Server;
use App\Support\Settings;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Saved passwords and API keys, shown to an admin only when they press the eye button.
 * Pages never get them with the rest of the form; each look is recorded in the activity log.
 */
class SecretController extends Controller
{
    /** Admin > Settings: reCAPTCHA keys, SMTP password, SMS API key. */
    public function setting(Request $request)
    {
        $key = $request->validate(['key' => ['required', Rule::in(Settings::SECRETS)]])['key'];
        ActivityLog::record('secret.viewed', context: ['setting' => $key]);

        return ['value' => (string) (config(Settings::MAP[$key]) ?? '')];
    }

    /** System > Servers: the API token, password or access hash. */
    public function server(Server $server)
    {
        ActivityLog::record('secret.viewed', $server, ['field' => 'credentials']);

        return ['value' => (string) ($server->credentials ?? '')];
    }

    /** Domain Registrars: the reseller API key. */
    public function registrar(string $code)
    {
        abort_unless(config("billing.registrars.{$code}"), 404);
        $registrar = Registrar::where('code', $code)->first();
        ActivityLog::record('secret.viewed', $registrar, ['registrar' => $code]);

        return ['value' => (string) ($registrar?->api_key ?? '')];
    }

    /** Payment Gateways: one of the gateway's secret fields. */
    public function gateway(Request $request, string $code)
    {
        $fields = collect(config("billing.gateways.{$code}.fields") ?? abort(404))->where('type', 'secret')->pluck('key');
        $field = $request->validate(['field' => ['required', Rule::in($fields->all())]])['field'];
        $gateway = Gateway::where('code', $code)->first();
        ActivityLog::record('secret.viewed', $gateway, ['gateway' => $code, 'field' => $field]);

        return ['value' => (string) ($gateway?->config[$field] ?? '')];
    }
}
