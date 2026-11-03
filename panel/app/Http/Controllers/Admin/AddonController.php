<?php

namespace App\Http\Controllers\Admin;

use App\Addons\AddonManager;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Addon;
use Illuminate\Http\Request;

class AddonController extends Controller
{
    public function index(AddonManager $addons)
    {
        return $addons->all();
    }

    public function update(Request $request, string $code, AddonManager $addons)
    {
        abort_unless($addons->find($code), 404);

        $data = $request->validate(['is_enabled' => 'required|boolean']);

        $addon = Addon::firstOrNew(['code' => $code]);
        $addon->is_enabled = $data['is_enabled'];
        $addon->save();
        ActivityLog::record('addon.updated', $addon, ['enabled' => $addon->is_enabled]);

        return ['ok' => true];
    }
}
