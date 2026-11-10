<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Gateway;
use App\Models\Registrar;
use App\Models\Server;
use App\Models\User;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecretRevealTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        return $admin;
    }

    public function test_admins_see_saved_secrets_on_request_and_each_look_is_logged(): void
    {
        $this->actingAs($this->admin());
        Settings::save(['sms_api_key' => 'sms-secret-1']);
        $server = Server::create(['name' => 'WHM', 'module' => 'cpanel', 'hostname' => 'whm.test', 'username' => 'root', 'credentials' => 'whm-token-1']);
        Registrar::create(['code' => 'resellcube', 'reseller_id' => '1', 'api_key' => 'rc-key-1']);
        Gateway::create(['code' => 'bkash', 'is_enabled' => true, 'config' => ['app_key' => 'k', 'app_secret' => 'bkash-secret-1']]);

        // The forms never carry them.
        $this->getJson('/api/settings')->assertOk()->assertJsonPath('secrets.sms_api_key', true)->assertDontSee('sms-secret-1');

        $this->postJson('/api/secrets/setting', ['key' => 'sms_api_key'])->assertOk()->assertJsonPath('value', 'sms-secret-1');
        $this->postJson('/api/secrets/setting', ['key' => 'company_name'])->assertJsonValidationErrors('key');
        $this->postJson("/api/secrets/servers/{$server->id}")->assertOk()->assertJsonPath('value', 'whm-token-1');
        $this->postJson('/api/secrets/registrars/resellcube')->assertOk()->assertJsonPath('value', 'rc-key-1');

        $secretFields = collect(config('billing.gateways.bkash.fields'))->where('type', 'secret')->pluck('key');
        if ($secretFields->contains('app_secret')) {
            $this->postJson('/api/secrets/gateways/bkash', ['field' => 'app_secret'])->assertOk()->assertJsonPath('value', 'bkash-secret-1');
        }
        $this->postJson('/api/secrets/gateways/bkash', ['field' => 'not_a_field'])->assertJsonValidationErrors('field');

        $this->assertGreaterThanOrEqual(3, ActivityLog::where('action', 'secret.viewed')->count());
    }

    public function test_customers_and_guests_cannot_reveal_anything(): void
    {
        $this->postJson('/api/secrets/setting', ['key' => 'sms_api_key'])->assertUnauthorized();

        Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com', 'password' => 'correct-horse']);
        $this->loginClientWithCode('rahim@example.com', 'correct-horse');
        $this->postJson('/api/secrets/setting', ['key' => 'sms_api_key'])->assertUnauthorized();
    }
}
