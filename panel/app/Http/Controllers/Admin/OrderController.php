<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProvisionService;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Order;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        return Order::with(['client:id,name,email', 'invoices:id,order_id,number,status,total'])
            ->withCount(['services', 'domains'])
            ->when($request->query('status'), function ($q, $status) {
                if ($status === 'all_active') {
                    return $q->whereIn('status', ['active', 'pending']);
                }
                if ($status === 'all') {
                    return $q;
                }
                return $q->where('status', $status);
            })
            ->when($request->query('q'), function ($q, $search) {
                $q->where(function ($w) use ($search) {
                    $w->where('id', 'like', "%{$search}%")
                        ->orWhere('order_number', 'like', "%{$search}%")
                        ->orWhere('amount', 'like', "%{$search}%")
                        ->orWhere('payment_method', 'like', "%{$search}%")
                        ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(min($request->integer('per_page', 25), 100));
    }

    public function show(Order $order)
    {
        return $order->load([
            'client',
            'services.product:id,name,type',
            'services.server:id,name',
            'domains',
            'invoices:id,order_id,number,status,total,due_date',
        ]);
    }

    /** Sets up the paid services whose product waits for an admin to accept the order. */
    public function accept(Order $order)
    {
        $waiting = $order->services()->where('provision_status', 'awaiting_accept')->get();

        if ($waiting->isEmpty()) {
            throw ValidationException::withMessages(['order' => 'Nothing in this order is waiting to be accepted.']);
        }

        $order->update(['status' => 'active']);

        foreach ($waiting as $service) {
            $service->update(['provision_status' => 'queued', 'status' => 'active']);
            ProvisionService::dispatch($service->id, 'create');
        }

        foreach ($order->domains as $domain) {
            $domain->update(['status' => 'active']);
        }

        ActivityLog::record('order.accepted', $order);

        return $this->show($order);
    }

    public function cancel(Order $order)
    {
        if ($order->status === 'cancelled') {
            throw ValidationException::withMessages(['order' => 'This order is already cancelled.']);
        }

        $order->update(['status' => 'cancelled']);
        $order->invoices()->where('status', 'unpaid')->update(['status' => 'cancelled']);
        ActivityLog::record('order.cancelled', $order);

        return $this->show($order);
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
            'domains.*.epp_code' => 'nullable|string|max:255',
        ]);

        if (empty($data['services']) && empty($data['domains'])) {
            return response()->json(['message' => 'Add at least one service or domain.'], 422);
        }

        $order = $billing->createOrder(Client::findOrFail($data['client_id']), $data['services'] ?? [], $data['domains'] ?? []);
        ActivityLog::record('order.created', $order);

        return response()->json($order->load('invoices'), 201);
    }

    public function batchAction(Request $request)
    {
        $data = $request->validate([
            'order_ids' => 'required|array',
            'order_ids.*' => 'integer|exists:orders,id',
            'action' => 'required|in:accept,cancel,delete',
        ]);

        $orders = Order::whereIn('id', $data['order_ids'])->get();

        foreach ($orders as $order) {
            if ($data['action'] === 'accept') {
                $waiting = $order->services()->where('provision_status', 'awaiting_accept')->get();
                foreach ($waiting as $service) {
                    $service->update(['provision_status' => 'queued']);
                    ProvisionService::dispatch($service->id, 'create');
                }
                $order->update(['status' => 'active']);
                ActivityLog::record('order.accepted', $order);
            } elseif ($data['action'] === 'cancel') {
                $order->update(['status' => 'cancelled']);
                $order->invoices()->where('status', 'unpaid')->update(['status' => 'cancelled']);
                ActivityLog::record('order.cancelled', $order);
            } elseif ($data['action'] === 'delete') {
                $order->delete();
                ActivityLog::record('order.deleted', $order);
            }
        }

        return response()->json(['ok' => true, 'count' => count($orders)]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,active,fraud,cancelled',
        ]);

        $order->update(['status' => $data['status']]);
        ActivityLog::record('order.status_updated', $order, ['status' => $data['status']]);

        return $this->show($order);
    }

    public function resendVerification(Order $order)
    {
        $client = $order->client;
        if ($client) {
            $client->emailLogs()->create([
                'to' => $client->email,
                'subject' => 'Please Confirm Your Email Address - CarrotHost',
                'body' => "Hello {$client->name},\n\nPlease verify your email address to confirm ownership of your account.\n\nThank you,\nCarrotHost Team",
            ]);
        }
        ActivityLog::record('order.verification_resent', $order);

        return response()->json(['ok' => true]);
    }

    public function saveNotes(Request $request, Order $order)
    {
        $order->update(['notes' => $request->input('notes')]);
        return $this->show($order);
    }

    public function destroy(Order $order)
    {
        $order->delete();
        ActivityLog::record('order.deleted', $order);

        return response()->json(['ok' => true]);
    }
}
