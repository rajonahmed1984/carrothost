<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Auth;
use App\Http\Controllers\Client\AccountController;
use App\Http\Controllers\Client\ChatController as ClientChatController;
use App\Http\Controllers\Client\StoreController;
use App\Http\Controllers\Client\TicketController as ClientTicketController;
use App\Http\Controllers\PaymentCallbackController;
use App\Support\Auth\Portal;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function () {
    Route::get('auth/config', Auth\AuthConfigController::class);
    Route::get('auth/sandbox/google', [Auth\GoogleLoginController::class, 'sandbox']);
    Route::post('auth/sandbox/google', [Auth\GoogleLoginController::class, 'sandboxLogin'])->middleware('throttle:20,1');
    Route::post('login', [Admin\AuthController::class, 'login'])->middleware('throttle:login');

    Route::prefix('login/otp')->controller(Auth\LoginOtpController::class)->group(function () {
        Route::get('/', 'show');
        Route::post('/', 'verify')->middleware('throttle:10,1');
        Route::post('resend', 'resend')->middleware('throttle:3,1');
        Route::post('cancel', 'cancel');
    });

    Route::prefix('{portal}')->whereIn('portal', [Portal::CLIENT, Portal::ADMIN])->controller(Auth\PasswordController::class)->group(function () {
        Route::post('forgot-password', 'forgot')->middleware('throttle:5,1');
        Route::post('reset-password', 'reset')->middleware('throttle:5,1');
    });

    Route::prefix('client')->group(function () {
        Route::post('login', [AccountController::class, 'login'])->middleware('throttle:login');

        Route::prefix('register')->controller(Auth\RegistrationController::class)->group(function () {
            Route::post('/', 'store')->middleware('throttle:10,1');
            Route::get('verify', 'show');
            Route::post('verify', 'verify')->middleware('throttle:10,1');
            Route::post('verify/resend', 'resend')->middleware('throttle:3,1');
            Route::post('verify/cancel', 'cancel');
        });

        Route::middleware('auth:client')->group(function () {
            // Outside client.active so an admin is never stuck in a client that was closed meanwhile.
            Route::post('impersonate/stop', [Auth\ImpersonationController::class, 'stop']);

            Route::middleware('client.active')->group(function () {
                Route::post('logout', [AccountController::class, 'logout']);
                Route::get('me', [AccountController::class, 'me']);
                Route::put('security', [AccountController::class, 'security']);
                Route::post('password', [Auth\PasswordController::class, 'change'])->defaults('portal', Portal::CLIENT)->middleware('throttle:5,1');
                Route::get('overview', [AccountController::class, 'overview']);
                Route::get('invoices/{id}', [AccountController::class, 'invoice'])->whereNumber('id');
                Route::post('invoices/{id}/pay', [AccountController::class, 'pay'])->whereNumber('id')->middleware('throttle:10,1');
                Route::get('store', [StoreController::class, 'index']);
                Route::post('orders', [StoreController::class, 'order'])->middleware('throttle:10,1');

                Route::get('badges', [ClientChatController::class, 'badges']);
                Route::get('tickets', [ClientTicketController::class, 'index']);
                Route::post('tickets', [ClientTicketController::class, 'store'])->middleware('throttle:10,1');
                Route::get('tickets/{id}', [ClientTicketController::class, 'show'])->whereNumber('id');
                Route::post('tickets/{id}/replies', [ClientTicketController::class, 'reply'])->whereNumber('id')->middleware('throttle:20,1');
                Route::get('tickets/{id}/replies/{reply}/attachment', [ClientTicketController::class, 'attachment'])->whereNumber(['id', 'reply']);
                Route::post('tickets/{id}/close', [ClientTicketController::class, 'close'])->whereNumber('id');
                Route::get('chat', [ClientChatController::class, 'index']);
                Route::post('chat', [ClientChatController::class, 'store'])->middleware('throttle:30,1');
                Route::get('chat/{message}/attachment', [ClientChatController::class, 'attachment'])->whereNumber('message');
            });
        });
    });

    Route::middleware(['auth:web', 'admin'])->group(function () {
        Route::post('logout', [Admin\AuthController::class, 'logout']);
        Route::get('me', [Admin\AuthController::class, 'me']);
        Route::post('password', [Auth\PasswordController::class, 'change'])->defaults('portal', Portal::ADMIN)->middleware('throttle:5,1');
        Route::post('clients/{client}/impersonate', [Auth\ImpersonationController::class, 'start']);
        Route::get('dashboard', Admin\DashboardController::class);
        Route::get('activity', [Admin\DashboardController::class, 'activity']);

        Route::apiResource('clients', Admin\ClientController::class);
        Route::put('clients/{client}/notes', [Admin\ClientController::class, 'notes']);
        Route::post('clients/{client}/invoices', [Admin\ClientController::class, 'invoice']);
        Route::post('clients/{client}/close', [Admin\ClientController::class, 'close']);
        Route::post('clients/{client}/reopen', [Admin\ClientController::class, 'reopen']);
        Route::apiResource('product-groups', Admin\ProductGroupController::class)->except('show');
        Route::apiResource('products', Admin\ProductController::class)->except('show');
        Route::apiResource('tlds', Admin\TldController::class)->except('show');
        Route::apiResource('servers', Admin\ServerController::class)->except('show');
        Route::post('servers/{server}/test', [Admin\ServerController::class, 'test']);

        Route::get('registrars', [Admin\RegistrarController::class, 'index']);
        Route::put('registrars/{code}', [Admin\RegistrarController::class, 'update']);
        Route::post('registrars/{code}/test', [Admin\RegistrarController::class, 'test']);

        Route::get('orders', [Admin\OrderController::class, 'index']);
        Route::post('orders', [Admin\OrderController::class, 'store']);
        Route::get('orders/{order}', [Admin\OrderController::class, 'show']);

        Route::get('invoices', [Admin\InvoiceController::class, 'index']);
        Route::get('invoices/{invoice}', [Admin\InvoiceController::class, 'show']);
        Route::post('invoices/{invoice}/payments', [Admin\InvoiceController::class, 'pay']);
        Route::post('invoices/{invoice}/cancel', [Admin\InvoiceController::class, 'cancel']);

        Route::get('services', [Admin\ServiceController::class, 'index']);
        Route::get('services/{service}', [Admin\ServiceController::class, 'show']);
        Route::post('services/{service}/action', [Admin\ServiceController::class, 'action']);
        Route::post('services/{service}/credentials', [Admin\ServiceController::class, 'credentials']);

        Route::get('domains', [Admin\DomainController::class, 'index']);
        Route::get('domains/{domain}', [Admin\DomainController::class, 'show']);
        Route::post('domains/{domain}/complete', [Admin\DomainController::class, 'complete']);

        Route::get('gateways', [Admin\GatewayController::class, 'index']);
        Route::put('gateways/{code}', [Admin\GatewayController::class, 'update']);

        Route::get('settings', [Admin\SettingController::class, 'show']);
        Route::post('settings', [Admin\SettingController::class, 'update']);
        Route::post('settings/test-email', [Admin\SettingController::class, 'testEmail'])->middleware('throttle:5,1');

        Route::get('badges', [Admin\ChatController::class, 'badges']);
        Route::get('tickets', [Admin\TicketController::class, 'index']);
        Route::get('tickets/{ticket}', [Admin\TicketController::class, 'show']);
        Route::put('tickets/{ticket}', [Admin\TicketController::class, 'update']);
        Route::post('tickets/{ticket}/replies', [Admin\TicketController::class, 'reply']);
        Route::get('tickets/{ticket}/replies/{reply}/attachment', [Admin\TicketController::class, 'attachment']);
        Route::get('chats', [Admin\ChatController::class, 'index']);
        Route::get('chats/{client}', [Admin\ChatController::class, 'show']);
        Route::post('chats/{client}', [Admin\ChatController::class, 'store']);
        Route::get('chats/{client}/messages/{message}/attachment', [Admin\ChatController::class, 'attachment']);

        Route::get('addons', [Admin\AddonController::class, 'index']);
        Route::put('addons/{code}', [Admin\AddonController::class, 'update']);

        Route::get('meta', [Admin\DashboardController::class, 'meta']);
    });

    Route::any('{any}', fn () => response()->json(['message' => 'Not found.'], 404))->where('any', '.*');
});

Route::get('auth/google/redirect', [Auth\GoogleLoginController::class, 'redirect'])->middleware('throttle:20,1');
Route::get('auth/google/callback', [Auth\GoogleLoginController::class, 'callback'])->middleware('throttle:20,1');

Route::prefix('pay')->middleware('throttle:60,1')->controller(PaymentCallbackController::class)->group(function () {
    Route::post('sslcommerz/success', 'sslcommerzSuccess');
    Route::post('sslcommerz/fail', 'sslcommerzFail');
    Route::post('sslcommerz/cancel', 'sslcommerzCancel');
    Route::post('sslcommerz/ipn', 'sslcommerzIpn');
    Route::get('bkash/callback', 'bkash');
    Route::post('paypal/ipn', 'paypalIpn');
});

// React handles every other URL.
Route::view('/{any?}', 'panel')->where('any', '.*');
