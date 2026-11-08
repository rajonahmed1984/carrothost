<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** The product's direct order link: /store/{group slug}/{product slug}. */
class ProductLinkTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        return $admin;
    }

    private function body(ProductGroup $group, array $overrides = []): array
    {
        return [...['name' => 'Starter Plan', 'type' => 'shared_hosting', 'product_group_id' => $group->id, 'prices' => [['cycle' => 'annually', 'price' => '1200']]], ...$overrides];
    }

    public function test_a_slug_is_made_from_the_name_and_kept_unique_within_its_group(): void
    {
        $hosting = ProductGroup::create(['name' => 'Webuzo Hosting', 'slug' => 'webuzo-hosting']);
        $vps = ProductGroup::create(['name' => 'VPS', 'slug' => 'vps']);

        $this->assertSame('starter', $hosting->products()->create(['name' => 'Starter', 'type' => 'shared_hosting'])->slug);
        $this->assertSame('starter-2', $hosting->products()->create(['name' => 'Starter', 'type' => 'shared_hosting'])->slug);
        $this->assertSame('starter', $vps->products()->create(['name' => 'Starter', 'type' => 'vps'])->slug, 'Another group may use the same slug.');

        // Moved into a group that already uses its slug, it gets a numbered one.
        $moved = Product::where('product_group_id', $vps->id)->sole();
        $moved->update(['product_group_id' => $hosting->id]);
        $this->assertSame('starter-3', $moved->slug);

        // Renaming keeps the slug, so links already on the website keep working.
        $first = Product::where('slug', 'starter')->sole();
        $first->update(['name' => 'Starter Pro']);
        $this->assertSame('starter', $first->refresh()->slug);
    }

    public function test_admin_can_set_the_slug_and_a_taken_one_is_refused(): void
    {
        $group = ProductGroup::create(['name' => 'Webuzo Hosting', 'slug' => 'webuzo-hosting']);
        $this->actingAs($this->admin());

        $id = $this->postJson('/api/products', $this->body($group))->assertCreated()->assertJsonPath('slug', 'starter-plan')->json('id');
        $this->putJson("/api/products/{$id}", $this->body($group, ['slug' => 'Starter Deal']))->assertOk()->assertJsonPath('slug', 'starter-deal');
        $this->putJson("/api/products/{$id}", $this->body($group, ['slug' => '']))->assertOk()->assertJsonPath('slug', 'starter-plan');

        $this->postJson('/api/products', $this->body($group, ['name' => 'Other', 'slug' => 'starter-plan']))->assertJsonValidationErrors('slug');
    }

    public function test_store_lists_each_products_slug(): void
    {
        $group = ProductGroup::create(['name' => 'Webuzo Hosting', 'slug' => 'webuzo-hosting']);
        $group->products()->create(['name' => 'Starter', 'type' => 'shared_hosting'])->prices()->create(['cycle' => 'annually', 'price' => '1200']);
        Client::create(['name' => 'Mine', 'email' => 'mine@example.com', 'password' => 'correct-horse']);
        $this->postJson('/api/client/login', ['email' => 'mine@example.com', 'password' => 'correct-horse'])->assertOk();

        $this->getJson('/api/client/store')->assertOk()->assertJsonPath('0.slug', 'webuzo-hosting')->assertJsonPath('0.products.0.slug', 'starter');
    }

    public function test_the_order_link_serves_the_app(): void
    {
        $this->get('/store/webuzo-hosting/starter')->assertOk();
    }
}
