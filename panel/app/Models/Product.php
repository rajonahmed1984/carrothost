<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'module_config' => 'array', 'cost_amount' => 'decimal:2', 'sort_order' => 'integer'];
    }

    public const SETUP_MODES = ['order', 'payment', 'accept', 'manual'];

    /** A product saved without a slug gets one from its name, unique within its group. */
    protected static function booted(): void
    {
        // A new product, or one moved to another group, goes to the bottom of its group.
        static::saving(function (Product $product) {
            if (! $product->exists || $product->isDirty('product_group_id')) {
                $product->sort_order = (int) static::where('product_group_id', $product->product_group_id)
                    ->when($product->exists, fn ($q) => $q->whereKeyNot($product->getKey()))
                    ->max('sort_order') + 1;
            }
        });

        static::saving(function (Product $product) {
            // Moving to a group that already uses the slug gets it a numbered one instead.
            if (! $product->slug || ($product->isDirty('product_group_id') && $product->slugTaken($product->slug))) {
                $base = Str::slug($product->slug ?: $product->name) ?: 'product';
                $slug = $base;
                for ($n = 2; $product->slugTaken($slug); $n++) {
                    $slug = "{$base}-{$n}";
                }
                $product->slug = $slug;
            }
        });
    }

    private function slugTaken(string $slug): bool
    {
        return static::where('product_group_id', $this->product_group_id)->where('slug', $slug)
            ->when($this->exists, fn ($q) => $q->whereKeyNot($this->getKey()))
            ->exists();
    }

    /** VPS actions a customer may use when the product does not say otherwise. */
    public const DEFAULT_CLIENT_ACTIONS = ['start', 'stop', 'reboot', 'reinstall', 'password', 'console'];

    /**
     * The VPS settings from the product's Module tab, with defaults filled in.
     *
     * @return array{default_image: ?string, images: list<array{slug: string, name: string}>, client_actions: list<string>, client_upgrade: bool}
     */
    /**
     * A VPS bought from a provider and set up by hand: the admin enters its hostname, IP, SSH port
     * and root login, and the client gets them by email.
     */
    public function isManualVps(): bool
    {
        return $this->type === 'vps' && ! config("billing.provisioning_modules.{$this->module}.class");
    }

    public function vpsConfig(): array
    {
        $c = $this->module_config ?? [];

        return [
            'default_image' => ($c['default_image'] ?? '') ?: null,
            'images' => array_values(array_filter($c['images'] ?? [], fn ($i) => is_array($i) && ! empty($i['slug']))),
            'client_actions' => array_values(array_intersect(self::DEFAULT_CLIENT_ACTIONS, $c['client_actions'] ?? self::DEFAULT_CLIENT_ACTIONS)),
            'client_upgrade' => (bool) ($c['client_upgrade'] ?? true),
        ];
    }

    /** OS images a customer may pick, by slug. Empty means the product offers no choice. */
    public function allowedImages(): array
    {
        return array_column($this->vpsConfig()['images'], 'slug');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ProductGroup::class, 'product_group_id');
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function prices(): HasMany
    {
        return $this->hasMany(ProductPrice::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }
}
