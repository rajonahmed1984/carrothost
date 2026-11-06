<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Product;
use App\Models\Server;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class ProductController extends Controller
{
    public function index()
    {
        // How many accounts each plan has, for the Services column.
        return Product::with('prices')->withCount([
            'services as active_count' => fn ($q) => $q->where('status', 'active'),
            'services as suspended_count' => fn ($q) => $q->where('status', 'suspended'),
            'services as inactive_count' => fn ($q) => $q->whereIn('status', ['pending', 'cancelled', 'terminated', 'fraud']),
        ])->orderBy('name')->get();
    }

    public function show(Product $product)
    {
        return $product->load('prices');
    }

    /** Live plan list from the chosen server, or the least used one of the module. */
    public function packages(Request $request)
    {
        $data = $request->validate([
            'module' => ['required', Rule::in(array_keys(config('billing.provisioning_modules')))],
            'server_id' => 'nullable|integer',
        ]);

        $class = config("billing.provisioning_modules.{$data['module']}.class");
        $server = Server::where('module', $data['module'])
            ->when($data['server_id'] ?? null, fn ($q, $id) => $q->whereKey($id), fn ($q) => $q->where('is_active', true))
            ->first();

        if (! $class || ! $server) {
            return response()->json(['message' => $class ? 'Add a server for this module first.' : 'This module is not connected yet.'], 422);
        }

        try {
            return ['server' => $server->name, 'packages' => (new $class($server))->packages()];
        } catch (Throwable $e) {
            return response()->json(['message' => "Could not load plans from {$server->name}: {$e->getMessage()}"], 422);
        }
    }

    /** The operating systems a VPS module can install, for the product's OS settings. */
    public function images(Request $request)
    {
        $data = $request->validate(['module' => ['required', Rule::in(array_keys(config('billing.provisioning_modules')))], 'server_id' => 'nullable|integer']);
        $class = config("billing.provisioning_modules.{$data['module']}.class");
        $server = Server::where('module', $data['module'])
            ->when($data['server_id'] ?? null, fn ($q, $id) => $q->whereKey($id), fn ($q) => $q->where('is_active', true))
            ->first();

        if (! $class || ! is_subclass_of($class, \App\Provisioning\ManagesVps::class) || ! $server) {
            return response()->json(['message' => 'This module has no operating system choices, or no server is added for it yet.'], 422);
        }

        try {
            return ['images' => (new $class($server))->images(new Service)];
        } catch (Throwable $e) {
            return response()->json(['message' => "Could not load operating systems from {$server->name}: {$e->getMessage()}"], 422);
        }
    }

    public function store(Request $request)
    {
        return response()->json($this->save(new Product, $request), 201);
    }

    public function update(Request $request, Product $product)
    {
        return $this->save($product, $request);
    }

    public function destroy(Product $product)
    {
        if (Service::where('product_id', $product->id)->exists()) {
            throw ValidationException::withMessages(['product' => 'This product has services. Deactivate it instead.']);
        }

        $product->delete();
        ActivityLog::record('product.deleted', context: ['name' => $product->name]);

        return response()->noContent();
    }

    private function save(Product $product, Request $request): Product
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'product_group_id' => 'nullable|exists:product_groups,id',
            'type' => 'required|in:shared_hosting,vps,other',
            'description' => 'nullable|string',
            'module' => ['nullable', Rule::in(array_keys(config('billing.provisioning_modules')))],
            'module_package' => 'nullable|string|max:255',
            'server_id' => ['nullable', Rule::exists('servers', 'id')->where('module', $request->input('module'))],
            'setup_mode' => ['sometimes', Rule::in(Product::SETUP_MODES)],
            // VPS settings (Webdock): default OS, the OS choices customers get, and what they may do.
            'module_config' => 'nullable|array',
            'module_config.default_image' => 'nullable|string|max:120',
            'module_config.images' => 'nullable|array|max:50',
            'module_config.images.*.slug' => 'required|string|max:120',
            'module_config.images.*.name' => 'required|string|max:255',
            'module_config.client_actions' => 'nullable|array',
            'module_config.client_actions.*' => ['string', Rule::in(Product::DEFAULT_CLIENT_ACTIONS)],
            'module_config.client_upgrade' => 'nullable|boolean',
            // What one VPS costs us a month, for VPS Profit.
            'cost_amount' => 'nullable|numeric|min:0|max:9999999',
            'cost_currency' => 'nullable|in:BDT,USD',
            'is_active' => 'boolean',
            'prices' => 'required|array|min:1',
            'prices.*.cycle' => ['required', 'distinct', Rule::in(array_keys(config('billing.cycles')))],
            'prices.*.price' => 'required|numeric|min:0',
            'prices.*.setup_fee' => 'nullable|numeric|min:0',
            // Optional fixed USD prices; blank = the BDT price converted at the current rate.
            'prices.*.price_usd' => 'nullable|numeric|min:0',
            'prices.*.setup_fee_usd' => 'nullable|numeric|min:0',
        ]);

        return DB::transaction(function () use ($product, $data) {
            $prices = $data['prices'];
            unset($data['prices']);
            if (array_key_exists('cost_amount', $data)) {
                $data['cost_amount'] = ($data['cost_amount'] ?? '') === '' ? null : $data['cost_amount'];
                $data['cost_currency'] = $data['cost_amount'] === null ? null : ($data['cost_currency'] ?? 'BDT');
            }

            $product->fill($data)->save();
            $product->prices()->delete();
            $product->prices()->createMany(array_map(fn ($p) => [
                ...$p,
                'setup_fee' => $p['setup_fee'] ?? 0,
                'price_usd' => ($p['price_usd'] ?? '') === '' ? null : $p['price_usd'],
                'setup_fee_usd' => ($p['setup_fee_usd'] ?? '') === '' ? null : $p['setup_fee_usd'],
            ], $prices));
            ActivityLog::record('product.saved', $product);

            return $product->load('prices');
        });
    }
}
