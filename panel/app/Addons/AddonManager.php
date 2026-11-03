<?php

namespace App\Addons;

use App\Models\Addon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Addons live in addons/<Name>/ with an addon.json manifest and an Addon.php
 * class. They run with full panel access, so they are installed by deploying
 * code; the panel only switches them on and off and never accepts uploads.
 */
class AddonManager
{
    public function manifests(): array
    {
        $manifests = [];

        foreach (File::glob(base_path('addons/*/addon.json')) as $path) {
            $manifest = json_decode((string) file_get_contents($path), true);

            if (! is_array($manifest) || empty($manifest['code']) || empty($manifest['class'])) {
                Log::warning("Skipping invalid addon manifest: {$path}");

                continue;
            }

            $manifests[$manifest['code']] = $manifest;
        }

        return $manifests;
    }

    public function find(string $code): ?array
    {
        return $this->manifests()[$code] ?? null;
    }

    public function all(): array
    {
        $saved = Addon::all()->keyBy('code');

        return array_values(array_map(fn (array $manifest) => [
            'code' => $manifest['code'],
            'name' => $manifest['name'] ?? $manifest['code'],
            'version' => $manifest['version'] ?? null,
            'description' => $manifest['description'] ?? null,
            'is_enabled' => (bool) $saved->get($manifest['code'])?->is_enabled,
        ], $this->manifests()));
    }

    public function bootEnabled(): void
    {
        // Artisan runs before the first migration too, when this table is absent.
        if (! Schema::hasTable('addons')) {
            return;
        }

        $manifests = $this->manifests();

        foreach (Addon::where('is_enabled', true)->get() as $addon) {
            $manifest = $manifests[$addon->code] ?? null;

            if (! $manifest) {
                continue;
            }

            // A broken addon must not take the billing panel down with it.
            try {
                $instance = app($manifest['class']);

                if ($instance instanceof PanelAddon) {
                    $instance->boot($addon->config?->toArray() ?? []);
                }
            } catch (Throwable $e) {
                Log::error("Addon {$addon->code} failed to boot: {$e->getMessage()}");
            }
        }
    }
}
