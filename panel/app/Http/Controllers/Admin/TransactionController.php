<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        return Payment::with(['invoice:id,number,client_id', 'invoice.client:id,name'])
            ->when($request->query('q'), function ($query, $q) {
                $query->where('transaction_id', 'like', "%{$q}%")
                    ->orWhere('gateway', 'like', "%{$q}%")
                    ->orWhereHas('invoice', fn ($inv) => $inv->where('number', 'like', "%{$q}%")
                        ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$q}%")));
            })
            ->when($request->query('gateway'), fn ($query, $gw) => $query->where('gateway', $gw))
            ->latest('id')
            ->paginate(25);
    }
}

