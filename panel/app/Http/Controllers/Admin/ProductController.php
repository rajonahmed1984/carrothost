<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Product;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function index()
    {
        return Product::with('prices')->orderBy('name')->get();
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
            'is_active' => 'boolean',
            'prices' => 'required|array|min:1',
            'prices.*.cycle' => ['required', 'distinct', Rule::in(array_keys(config('billing.cycles')))],
            'prices.*.price' => 'required|numeric|min:0',
            'prices.*.setup_fee' => 'nullable|numeric|min:0',
        ]);

        return DB::transaction(function () use ($product, $data) {
            $prices = $data['prices'];
            unset($data['prices']);

            $product->fill($data)->save();
            $product->prices()->delete();
            $product->prices()->createMany(array_map(fn ($p) => [...$p, 'setup_fee' => $p['setup_fee'] ?? 0], $prices));
            ActivityLog::record('product.saved', $product);

            return $product->load('prices');
        });
    }
}
