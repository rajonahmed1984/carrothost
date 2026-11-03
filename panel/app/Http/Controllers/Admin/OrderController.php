<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Order;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index()
    {
        return Order::with(['client:id,name', 'invoices:id,order_id,number,status,total'])
            ->withCount(['services', 'domains'])
            ->latest()
            ->paginate(25);
    }

    public function show(Order $order)
    {
        return $order->load(['client:id,name', 'services.product:id,name', 'domains', 'invoices:id,order_id,number,status,total']);
    }

    public function store(Request $request, BillingService $billing)
    {
        $data = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'services' => 'array',
            'services.*.product_id' => 'required|exists:products,id',
            'services.*.cycle' => ['required', Rule::in(array_keys(config('billing.cycles')))],
            'services.*.domain' => ['nullable', 'regex:/^([a-z0-9-]+\.)+[a-z]{2,}$/i'],
            'domains' => 'array',
            'domains.*.name' => ['required', 'regex:/^([a-z0-9-]+\.)+[a-z]{2,}$/i'],
            'domains.*.action' => 'required|in:register,transfer',
            'domains.*.years' => 'required|integer|between:1,10',
        ]);

        if (empty($data['services']) && empty($data['domains'])) {
            return response()->json(['message' => 'Add at least one service or domain.'], 422);
        }

        $order = $billing->createOrder(Client::findOrFail($data['client_id']), $data['services'] ?? [], $data['domains'] ?? []);
        ActivityLog::record('order.created', $order);

        return response()->json($order->load('invoices'), 201);
    }
}
