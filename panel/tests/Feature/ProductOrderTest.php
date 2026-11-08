<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Admins arrange the products in a group; the store shows them in that order. */
class ProductOrderTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        return $admin;
    }

    private function product(ProductGroup $group, string $name): Product
    {
        $product = $group->products()->create(['name' => $name, 'type' => 'shared_hosting']);
        $product->prices()->create(['cycle' => 'annually', 'price' => '1200']);

        return $product;
    }

    public function test_new_products_go_to_the_bottom_of_their_group(): void
    {
        $hosting = ProductGroup::create(['name' => 'Webuzo Hosting', 'slug' => 'webuzo-hosting']);
        $vps = ProductGroup::create(['name' => 'VPS', 'slug' => 'vps']);

        $this->assertSame(1, $this->product($hosting, 'Starter')->sort_order);
        $this->assertSame(2, $this->product($hosting, 'Advanced')->sort_order);
        $nano = $this->product($vps, 'Nano');
        $this->assertSame(1, $nano->sort_order);

        $nano->update(['product_group_id' => $hosting->id]);
        $this->assertSame(3, $nano->sort_order, 'Moved to another group, it goes to the bottom there.');

        $nano->update(['name' => 'Nano 2']);
        $this->assertSame(3, $nano->refresh()->sort_order, 'Editing keeps its place.');
    }

    public function test_admin_reorders_a_group_and_the_store_follows(): void
    {
        $group = ProductGroup::create(['name' => 'Webuzo Hosting', 'slug' => 'webuzo-hosting']);
        [$starter, $standard, $advanced] = [$this->product($group, 'Starter'), $this->product($group, 'Standard'), $this->product($group, 'Advanced')];

        $this->actingAs($this->admin());
        $this->postJson('/api/products/reorder', ['ids' => [$advanced->id, $starter->id, $standard->id]])->assertNoContent();
        $this->getJson('/api/products')->assertOk()->assertJsonPath('0.name', 'Advanced')->assertJsonPath('1.name', 'Starter')->assertJsonPath('2.name', 'Standard');

        // Products of two groups cannot be mixed in one order.
        $other = $this->product(ProductGroup::create(['name' => 'VPS', 'slug' => 'vps', 'sort_order' => 5]), 'Nano');
        $this->postJson('/api/products/reorder', ['ids' => [$starter->id, $other->id]])->assertJsonValidationErrors('ids');

        Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => 'correct-horse']);
        $this->postJson('/api/client/login', ['email' => 'mine@example.com', 'password' => 'correct-horse'])->assertOk();
        $this->getJson('/api/client/store')->assertOk()
            ->assertJsonPath('0.products.0.name', 'Advanced')
            ->assertJsonPath('0.products.1.name', 'Starter')
            ->assertJsonPath('0.products.2.name', 'Standard');
    }
}
