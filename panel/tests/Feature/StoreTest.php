<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreTest extends TestCase
{
    use RefreshDatabase;

    private function product(ProductGroup $group, array $attributes = []): Product
    {
        $product = $group->products()->create([...['name' => 'Starter', 'type' => 'shared_hosting'], ...$attributes]);
        $product->prices()->create(['cycle' => 'annually', 'price' => '4200.00', 'setup_fee' => '100.00']);

        return $product;
    }

    private function signIn(): Client
    {
        $client = Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => 'correct-horse']);
        $this->loginClientWithCode('mine@example.com', 'correct-horse');

        return $client;
    }

    public function test_store_lists_only_visible_groups_and_active_products(): void
    {
        $shared = ProductGroup::create(['name' => 'Shared Hosting', 'slug' => 'shared-hosting', 'sort_order' => 2]);
        $vps = ProductGroup::create(['name' => 'VPS', 'slug' => 'vps', 'sort_order' => 1]);
        $hidden = ProductGroup::create(['name' => 'Internal', 'slug' => 'internal', 'is_visible' => false]);
        $this->product($shared);
        $this->product($shared, ['name' => 'Retired Plan', 'is_active' => false]);
        $this->product($hidden, ['name' => 'Secret Plan']);
        $this->signIn();

        $this->getJson('/api/client/store')
            ->assertOk()
            ->assertJsonPath('0.slug', 'vps')
            ->assertJsonPath('1.products.0.name', 'Starter')
            ->assertJsonCount(1, '1.products')
            ->assertDontSee('Internal')
            ->assertDontSee('Retired Plan')
            ->assertDontSee('Secret Plan');
    }

    public function test_customer_order_raises_an_invoice(): void
    {
        $product = $this->product(ProductGroup::create(['name' => 'Shared Hosting', 'slug' => 'shared-hosting']));
        $client = $this->signIn();

        $this->postJson('/api/client/orders', ['product_id' => $product->id, 'cycle' => 'annually'])->assertUnprocessable()->assertJsonValidationErrors('domain');

        $id = $this->postJson('/api/client/orders', ['product_id' => $product->id, 'cycle' => 'annually', 'domain' => 'Example.com'])->assertCreated()->json('invoice_id');

        $invoice = Invoice::findOrFail($id);
        $this->assertSame($client->id, $invoice->client_id);
        $this->assertSame('4300.00', $invoice->total);
        $this->assertSame('example.com', $client->services()->value('domain'));
    }

    public function test_hidden_or_inactive_products_cannot_be_ordered(): void
    {
        $hidden = $this->product(ProductGroup::create(['name' => 'Internal', 'slug' => 'internal', 'is_visible' => false]));
        $inactive = $this->product(ProductGroup::create(['name' => 'Shared', 'slug' => 'shared']), ['is_active' => false]);
        $ungrouped = Product::create(['name' => 'Loose', 'type' => 'other']);
        $ungrouped->prices()->create(['cycle' => 'annually', 'price' => '10.00']);
        $this->signIn();

        foreach ([$hidden, $inactive, $ungrouped] as $product) {
            $this->postJson('/api/client/orders', ['product_id' => $product->id, 'cycle' => 'annually', 'domain' => 'example.com'])->assertUnprocessable()->assertJsonValidationErrors('product_id');
        }

        $this->assertSame(0, Invoice::count());
    }

    public function test_admin_manages_groups(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin);

        $id = $this->postJson('/api/product-groups', ['name' => 'Shared Hosting'])->assertCreated()->assertJsonPath('slug', 'shared-hosting')->json('id');
        $this->postJson('/api/product-groups', ['name' => 'Shared Hosting'])->assertUnprocessable()->assertJsonValidationErrors('slug');

        $this->postJson('/api/products', ['name' => 'Starter', 'product_group_id' => $id, 'type' => 'shared_hosting', 'prices' => [['cycle' => 'annually', 'price' => 10]]])->assertCreated()->assertJsonPath('product_group_id', $id);
        $this->deleteJson("/api/product-groups/{$id}")->assertUnprocessable();

        Product::query()->update(['product_group_id' => null]);
        $this->deleteJson("/api/product-groups/{$id}")->assertNoContent();
    }
}
