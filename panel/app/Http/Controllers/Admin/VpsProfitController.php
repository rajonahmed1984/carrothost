<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\VpsProfit;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Admin > Products/Services > VPS Profit: what each VPS costs, earns and keeps, month by month. */
class VpsProfitController extends Controller
{
    /** GET vps/profit?from=2026-01&to=2026-11&spread=1&product_id=3 */
    public function index(Request $request, VpsProfit $profit)
    {
        $data = $request->validate([
            'from' => 'required|date_format:Y-m',
            'to' => 'required|date_format:Y-m|after_or_equal:from',
            'spread' => 'boolean',
            'product_id' => 'nullable|integer|exists:products,id',
        ]);
        $from = CarbonImmutable::createFromFormat('Y-m-d', "{$data['from']}-01");
        $to = CarbonImmutable::createFromFormat('Y-m-d', "{$data['to']}-01");

        if ($from->diffInMonths($to) > 60) {
            throw ValidationException::withMessages(['from' => 'Choose at most five years.']);
        }

        return [
            ...$profit->report($from, $to, $request->boolean('spread', true), $data['product_id'] ?? null),
            'products' => Product::where('type', 'vps')->orderBy('name')->get(['id', 'name', 'cost_amount', 'cost_currency']),
        ];
    }
}
