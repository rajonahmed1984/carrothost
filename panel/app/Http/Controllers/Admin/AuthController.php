<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Auth\LoginService;
use App\Support\Auth\Portal;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(Request $request, LoginService $login)
    {
        return $login->authenticate($request, Portal::ADMIN);
    }

    public function logout(Request $request, LoginService $login)
    {
        $login->logout($request);

        return response()->noContent();
    }

    public function me(Request $request)
    {
        return $request->user()->only('id', 'name', 'email');
    }
}
