<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ProductGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductGroupController extends Controller
{
    public function index()
    {
        return ProductGroup::withCount('products')->orderBy('sort_order')->orderBy('name')->get();
    }

    public function store(Request $request)
    {
        return response()->json($this->save(new ProductGroup, $request), 201);
    }

    public function update(Request $request, ProductGroup $productGroup)
    {
        return $this->save($productGroup, $request);
    }

    public function destroy(ProductGroup $productGroup)
    {
        if ($productGroup->products()->exists()) {
            throw ValidationException::withMessages(['group' => 'Move or delete the products in this group first.']);
        }

        $productGroup->delete();
        ActivityLog::record('product_group.deleted', context: ['name' => $productGroup->name]);

        return response()->noContent();
    }

    private function save(ProductGroup $group, Request $request): ProductGroup
    {
        $request->merge(['slug' => Str::slug($request->input('slug') ?: $request->input('name', ''))]);
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:255', Rule::unique('product_groups')->ignore($group->id)],
            'headline' => 'nullable|string|max:255',
            'sort_order' => 'integer|min:0',
            'is_visible' => 'boolean',
        ]);

        $group->fill($data)->save();
        ActivityLog::record('product_group.saved', $group);

        return $group->loadCount('products');
    }
}
