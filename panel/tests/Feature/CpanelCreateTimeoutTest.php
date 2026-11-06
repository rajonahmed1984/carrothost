<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Product;
use App\Models\Server;
use App\Models\Service;
use App\Provisioning\CpanelModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class CpanelCreateTimeoutTest extends TestCase
{
    use RefreshDatabase;

    private function service(): array
    {
        $server = Server::create(['name' => 'Hawkhost', 'module' => 'cpanel', 'hostname' => 'whm.test', 'username' => 'carrotho', 'credentials' => 'TOKEN']);
        $product = Product::create(['name' => 'Email Hosting Basic', 'type' => 'shared_hosting', 'module' => 'cpanel', 'module_package' => 'carrotho_Email Hosting Basic']);
        $client = Client::create(['name' => 'Rahim', 'email' => 'rahim@example.com']);
        $service = Service::create([
            'client_id' => $client->id, 'product_id' => $product->id, 'server_id' => $server->id, 'domain' => 'asiagrofeeds.com',
            'cycle' => 'monthly', 'recurring_amount' => 1500, 'status' => 'active', 'credentials' => ['username' => 'asiagro1', 'password' => 'Str0ng-Pass!x'],
        ]);

        return [new CpanelModule($server), $service->load('product', 'client')];
    }

    public function test_a_create_that_times_out_but_finished_on_whm_counts_as_created(): void
    {
        [$module, $service] = $this->service();
        Http::fake([
            'whm.test:2087/json-api/createacct*' => fn () => throw new ConnectionException('cURL error 28: Operation timed out after 300000 milliseconds'),
            'whm.test:2087/json-api/accountsummary*' => Http::response(['metadata' => ['result' => 1], 'data' => ['acct' => [['user' => 'asiagro1', 'domain' => 'asiagrofeeds.com']]]]),
        ]);

        $this->assertSame('asiagro1', $module->create($service)['remote_id']);
        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'accountsummary') && str_contains($r->url(), 'user=asiagro1'));
    }

    public function test_a_create_that_really_failed_still_fails(): void
    {
        [$module, $service] = $this->service();
        Http::fake([
            'whm.test:2087/json-api/createacct*' => fn () => throw new ConnectionException('cURL error 28: Operation timed out'),
            'whm.test:2087/json-api/accountsummary*' => Http::response(['metadata' => ['result' => 0, 'reason' => 'Account does not exist.']]),
        ]);

        $this->expectException(RuntimeException::class);
        $module->create($service);
    }
}
