<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** What a customer can order: active products in visible groups only. */
class StoreController extends Controller
{
    public function index()
    {
        return ProductGroup::where('is_visible', true)
            ->with(['products' => fn ($q) => $q->where('is_active', true)->orderBy('name')->with('prices')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'headline'])
            ->map(fn (ProductGroup $group) => [
                ...$group->only('id', 'name', 'slug', 'headline'),
                'products' => $group->products->map(fn (Product $product) => [
                    ...$product->only('id', 'name', 'type', 'description'),
                    'prices' => $product->prices->map->only('cycle', 'price', 'setup_fee')->values(),
                ]),
            ]);
    }

    public function order(Request $request, BillingService $billing)
    {
        $data = $request->validate([
            'product_id' => 'required|integer',
            'cycle' => ['required', Rule::in(array_keys(config('billing.cycles')))],
            'domain' => ['nullable', 'regex:/^([a-z0-9-]+\.)+[a-z]{2,}$/i'],
        ]);

        $product = Product::where('is_active', true)
            ->whereHas('group', fn ($q) => $q->where('is_visible', true))
            ->find($data['product_id']);

        if (! $product) {
            throw ValidationException::withMessages(['product_id' => 'This product is not available to order.']);
        }

        if ($product->type === 'shared_hosting' && empty($data['domain'])) {
            throw ValidationException::withMessages(['domain' => 'Enter the domain this hosting is for.']);
        }

        $order = $billing->createOrder($request->user('client'), [
            ['product_id' => $product->id, 'cycle' => $data['cycle'], 'domain' => isset($data['domain']) ? strtolower($data['domain']) : null],
        ]);
        ActivityLog::record('order.created', $order, ['by' => 'client']);

        return response()->json(['invoice_id' => $order->invoices()->value('id')], 201);
    }
}
