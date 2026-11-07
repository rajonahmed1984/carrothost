<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Product;
use App\Models\Server;
use App\Models\Service;
use App\Services\AutomationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EnforceSuspensionsTest extends TestCase
{
    use RefreshDatabase;

    private function service(string $module, string $username, string $status = 'suspended'): Service
    {
        $server = Server::firstOrCreate(['module' => $module], ['name' => $module, 'hostname' => "{$module}.test", 'username' => 'root', 'credentials' => 'token']);
        $product = Product::firstOrCreate(['module' => $module], ['name' => "Starter {$module}", 'type' => 'shared_hosting']);
        $client = Client::firstOrCreate(['email' => 'acme@example.com'], ['name' => 'Acme']);

        return Service::create([
            'client_id' => $client->id, 'product_id' => $product->id, 'server_id' => $server->id, 'domain' => "{$username}.com",
            'cycle' => 'annually', 'recurring_amount' => 4200, 'status' => $status, 'remote_id' => $username, 'provision_status' => 'done',
        ]);
    }

    public function test_accounts_suspended_in_the_panel_but_running_on_cpanel_are_suspended(): void
    {
        Http::fake(function ($request) {
            if (str_contains($request->url(), 'accountsummary')) {
                $user = $request['user'] ?? '';

                return Http::response(['metadata' => ['result' => 1], 'data' => ['acct' => [['user' => $user, 'suspended' => $user === 'already' ? 1 : 0]]]]);
            }

            return Http::response(['metadata' => ['result' => 1]]);
        });
        $running = $this->service('cpanel', 'running');
        $this->service('cpanel', 'already');
        $this->service('cpanel', 'live', 'active');

        $this->assertSame(1, app(AutomationService::class)->enforceSuspensions());

        Http::assertSent(fn ($r) => str_contains($r->url(), 'suspendacct') && $r['user'] === 'running');
        Http::assertNotSent(fn ($r) => str_contains($r->url(), 'suspendacct') && in_array($r['user'], ['already', 'live'], true));
        $this->assertSame('done', $running->refresh()->provision_status);
        $this->assertSame('suspended', $running->status);
    }

    public function test_webuzo_accounts_are_read_and_suspended(): void
    {
        Http::fake(function ($request) {
            if (str_contains($request->url(), 'act=users') && isset($request['search'])) {
                return Http::response(['users' => [
                    'running' => ['user' => 'running', 'status' => 'active'],
                    'stopped' => ['user' => 'stopped', 'status' => 'suspended'],
                ]]);
            }

            return Http::response(['done' => ['msg' => 'ok']]);
        });
        $this->service('webuzo', 'running');
        $this->service('webuzo', 'stopped');

        $status = collect(app(AutomationService::class)->serverStatus())->mapWithKeys(fn ($r) => [$r['service']->remote_id => $r['server_suspended']]);
        $this->assertSame(['running' => false, 'stopped' => true], $status->all());

        $this->assertSame(1, app(AutomationService::class)->enforceSuspensions());
        Http::assertSent(fn ($r) => ($r['suspend'] ?? null) === 'running');
        Http::assertNotSent(fn ($r) => ($r['suspend'] ?? null) === 'stopped');
    }

    public function test_an_unreadable_account_is_left_alone(): void
    {
        Http::fake(['*' => Http::response(['metadata' => ['result' => 0, 'reason' => 'Account does not exist']])]);
        $service = $this->service('cpanel', 'ghost');

        $this->assertSame(0, app(AutomationService::class)->enforceSuspensions());
        Http::assertNotSent(fn ($r) => str_contains($r->url(), 'suspendacct'));
        $this->assertSame('done', $service->refresh()->provision_status);
    }
}
