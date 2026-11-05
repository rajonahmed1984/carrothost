<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Auth;
use App\Http\Controllers\Client\AccountController;
use App\Http\Controllers\Client\AccountSettingsController;
use App\Http\Controllers\Client\ChatController as ClientChatController;
use App\Http\Controllers\Client\CreditController;
use App\Http\Controllers\Client\DomainController as ClientDomainController;
use App\Http\Controllers\Client\ServiceController as ClientServiceController;
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

    Route::match(['get', 'post'], 'contacts/verify', [AccountSettingsController::class, 'verifyContactPublic']);

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
                // Everyone signed in to the account: the owner, and its users within their permissions.
                Route::post('logout', [AccountController::class, 'logout']);
                Route::get('me', [AccountController::class, 'me']);
                Route::post('password', [Auth\PasswordController::class, 'change'])->defaults('portal', Portal::CLIENT)->middleware('throttle:5,1');
                Route::get('overview', [AccountController::class, 'overview']);
                Route::get('badges', [ClientChatController::class, 'badges']);

                Route::controller(AccountSettingsController::class)->prefix('account')->group(function () {
                    Route::get('profile', 'profile');
                    Route::put('profile', 'updateProfile')->middleware('client.can:profile');
                    Route::post('contacts/verify', 'verifyContact');
                    Route::get('support-pin', 'supportPin');
                    Route::post('support-pin', 'generateSupportPin')->middleware('throttle:10,1');
                    Route::post('support-pin/cancel', 'cancelSupportPin');
                    Route::delete('support-pin/{id}', 'cancelSupportPin')->whereNumber('id');

                    Route::get('contacts', 'contacts')->middleware('client.can:contacts');
                    // These manage the account's users and their permissions, so a user could raise their own: owner only.
                    Route::middleware('client.can:owner')->group(function () {
                        Route::post('contacts', 'storeContact')->middleware('throttle:20,1');
                        Route::put('contacts/{id}', 'updateContact')->whereNumber('id');
                        Route::delete('contacts/{id}', 'destroyContact')->whereNumber('id');
                        Route::post('contacts/{id}/resend', 'resendContactVerification')->whereNumber('id');
                    });

                    Route::middleware('client.can:emails')->group(function () {
                        Route::get('emails', 'emails');
                        Route::get('emails/{id}', 'email')->whereNumber('id');
                    });

                    // Sign-in security belongs to the account owner.
                    Route::middleware('client.can:owner')->group(function () {
                        Route::get('sessions', 'sessions');
                        Route::delete('sessions/{id}', 'destroySession')->whereNumber('id');
                        Route::delete('sessions', 'destroyOtherSessions');
                    });
                });
                Route::put('security', [AccountController::class, 'security'])->middleware('client.can:owner');

                Route::middleware('client.can:products')->group(function () {
                    Route::get('services', [ClientServiceController::class, 'index']);
                    Route::get('services/{id}', [ClientServiceController::class, 'show'])->whereNumber('id');
                });
                Route::post('services/{id}/password', [ClientServiceController::class, 'password'])->whereNumber('id')->middleware(['client.can:manageproducts', 'throttle:10,1']);

                Route::middleware('client.can:domains')->group(function () {
                    Route::get('domains', [ClientDomainController::class, 'index']);
                    Route::get('domains/{id}', [ClientDomainController::class, 'show'])->whereNumber('id');
                });
                Route::put('domains/{id}', [ClientDomainController::class, 'update'])->whereNumber('id')->middleware('client.can:managedomains');

                Route::middleware('client.can:invoices')->group(function () {
                    Route::get('invoices', [AccountController::class, 'invoices']);
                    Route::get('invoices/{id}', [AccountController::class, 'invoice'])->whereNumber('id');
                    Route::post('invoices/{id}/pay', [AccountController::class, 'pay'])->whereNumber('id')->middleware('throttle:10,1');
                    Route::get('credits', [CreditController::class, 'index']);
                    Route::post('credits', [CreditController::class, 'store'])->middleware('throttle:10,1');
                });

                Route::middleware('client.can:orders')->group(function () {
                    Route::get('store', [StoreController::class, 'index']);
                    Route::post('orders', [StoreController::class, 'order'])->middleware('throttle:10,1');
                    Route::get('store/domains', [StoreController::class, 'domainOptions']);
                    Route::get('store/domains/lookup', [StoreController::class, 'lookup'])->middleware('throttle:30,1');
                    Route::post('orders/domain', [StoreController::class, 'orderDomain'])->middleware('throttle:10,1');
                });

                Route::middleware('client.can:tickets')->group(function () {
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
    });

    Route::middleware(['auth:web', 'admin'])->group(function () {
        Route::post('logout', [Admin\AuthController::class, 'logout']);
        Route::get('me', [Admin\AuthController::class, 'me']);
        Route::post('password', [Auth\PasswordController::class, 'change'])->defaults('portal', Portal::ADMIN)->middleware('throttle:5,1');
        Route::post('clients/{client}/impersonate', [Auth\ImpersonationController::class, 'start']);
        Route::get('dashboard', Admin\DashboardController::class);
        Route::get('activity', [Admin\DashboardController::class, 'activity']);

        Route::post('clients/message', [Admin\ClientController::class, 'message'])->middleware('throttle:10,1');
        Route::apiResource('clients', Admin\ClientController::class);
        Route::put('clients/{client}/notes', [Admin\ClientController::class, 'notes']);
        Route::get('clients/{client}/log', [Admin\ClientController::class, 'log']);
        Route::post('clients/{client}/invoices', [Admin\ClientController::class, 'invoice']);
        Route::post('clients/{client}/emails/{email}/resend', [Admin\ClientController::class, 'resendEmail'])->whereNumber('email')->middleware('throttle:20,1');
        Route::delete('clients/{client}/emails/{email}', [Admin\ClientController::class, 'destroyEmail'])->whereNumber('email');
        Route::post('clients/{client}/users/{user}/password-reset', [Admin\ClientController::class, 'sendPasswordReset'])->whereNumber('user')->middleware('throttle:10,1');
        Route::put('clients/{client}/users/{user}/password', [Admin\ClientController::class, 'changePassword'])->whereNumber('user');
        Route::get('clients/{client}/credits', [Admin\ClientController::class, 'credits']);
        Route::post('clients/{client}/credits', [Admin\ClientController::class, 'adjustCredit']);
        Route::post('clients/{client}/close', [Admin\ClientController::class, 'close']);
        Route::post('clients/{client}/reopen', [Admin\ClientController::class, 'reopen']);
        Route::get('clients/{client}/users', [Admin\ClientController::class, 'users']);
        Route::post('clients/{client}/users', [Admin\ClientController::class, 'storeUser']);
        Route::put('clients/{client}/users/{user}', [Admin\ClientController::class, 'updateUser']);
        Route::post('clients/{client}/users/{user}/approve', [Admin\ClientController::class, 'approveUser']);
        Route::delete('clients/{client}/users/{user}', [Admin\ClientController::class, 'destroyUser']);
        Route::apiResource('product-groups', Admin\ProductGroupController::class)->except('show');
        Route::get('products/packages', [Admin\ProductController::class, 'packages']);
        Route::apiResource('products', Admin\ProductController::class);
        Route::put('tlds', [Admin\TldController::class, 'bulkUpdate']);
        Route::get('tlds/lookup', [Admin\TldController::class, 'lookup']);
        Route::get('tlds/registrar-list', [Admin\TldController::class, 'registrarList']);
        Route::post('tlds/registrar-sync/{code}', [Admin\TldController::class, 'registrarSync']);
        Route::put('tlds/lookup', [Admin\TldController::class, 'updateLookup']);
        Route::post('tlds/pricing', [Admin\TldController::class, 'bulkPricing']);
        Route::apiResource('tlds', Admin\TldController::class)->except('show');
        Route::get('servers/profit', [Admin\ServerController::class, 'profit']);
        Route::get('servers/{server}/costs', [Admin\ServerController::class, 'costs']);
        Route::post('servers/{server}/costs', [Admin\ServerController::class, 'storeCost']);
        Route::delete('servers/{server}/costs/{cost}', [Admin\ServerController::class, 'destroyCost']);
        Route::post('servers/probe', [Admin\ServerController::class, 'probe']);
        Route::apiResource('servers', Admin\ServerController::class)->except('show');
        Route::post('servers/{server}/test', [Admin\ServerController::class, 'test']);

        Route::get('registrars', [Admin\RegistrarController::class, 'index']);
        Route::get('registrars/profit', [Admin\RegistrarController::class, 'profit']);
        Route::get('registrars/{code}/ledger', [Admin\RegistrarController::class, 'ledger']);
        Route::post('registrars/{code}/deposits', [Admin\RegistrarController::class, 'storeDeposit']);
        Route::delete('registrars/{code}/deposits/{deposit}', [Admin\RegistrarController::class, 'destroyDeposit']);
        Route::post('registrars/{code}/charges', [Admin\RegistrarController::class, 'storeCharge']);
        Route::put('registrars/{code}/charges/{charge}', [Admin\RegistrarController::class, 'updateCharge']);
        Route::delete('registrars/{code}/charges/{charge}', [Admin\RegistrarController::class, 'destroyCharge']);
        Route::post('registrars/{code}/sync', [Admin\RegistrarController::class, 'sync'])->middleware('throttle:10,1');
        Route::put('registrars/{code}', [Admin\RegistrarController::class, 'update']);
        Route::post('registrars/{code}/test', [Admin\RegistrarController::class, 'test']);

        Route::get('orders', [Admin\OrderController::class, 'index']);
        Route::post('orders', [Admin\OrderController::class, 'store']);
        Route::post('orders/batch-action', [Admin\OrderController::class, 'batchAction']);
        Route::get('orders/{order}', [Admin\OrderController::class, 'show']);
        Route::post('orders/{order}/accept', [Admin\OrderController::class, 'accept']);
        Route::post('orders/{order}/cancel', [Admin\OrderController::class, 'cancel']);
        Route::patch('orders/{order}/status', [Admin\OrderController::class, 'updateStatus']);
        Route::post('orders/{order}/resend-verification', [Admin\OrderController::class, 'resendVerification']);
        Route::post('orders/{order}/notes', [Admin\OrderController::class, 'saveNotes']);
        Route::delete('orders/{order}', [Admin\OrderController::class, 'destroy']);

        Route::get('invoices', [Admin\InvoiceController::class, 'index']);
        Route::get('invoices/{invoice}', [Admin\InvoiceController::class, 'show']);
        Route::post('invoices/{invoice}/payments', [Admin\InvoiceController::class, 'pay']);
        Route::post('invoices/{invoice}/credit', [Admin\InvoiceController::class, 'credit']);
        Route::post('invoices/{invoice}/refund', [Admin\InvoiceController::class, 'refund']);
        Route::put('invoices/{invoice}/notes', [Admin\InvoiceController::class, 'notes']);
        Route::post('invoices/{invoice}/email', [Admin\InvoiceController::class, 'email'])->middleware('throttle:10,1');
        Route::post('invoices/{invoice}/cancel', [Admin\InvoiceController::class, 'cancel']);
        Route::post('invoices/bulk', [Admin\InvoiceController::class, 'bulk']);
        Route::put('invoices/{invoice}', [Admin\InvoiceController::class, 'update']);
        Route::delete('invoices/{invoice}', [Admin\InvoiceController::class, 'destroy']);
        Route::get('transactions', [Admin\TransactionController::class, 'index']);
        Route::put('transactions/{payment}', [Admin\TransactionController::class, 'update']);
        Route::delete('transactions/{payment}', [Admin\TransactionController::class, 'destroy']);

        Route::get('services', [Admin\ServiceController::class, 'index']);
        Route::get('services/{service}', [Admin\ServiceController::class, 'show']);
        Route::put('services/{service}', [Admin\ServiceController::class, 'update']);
        Route::delete('services/{service}', [Admin\ServiceController::class, 'destroy']);
        Route::post('services/{service}/usage', [Admin\ServiceController::class, 'refreshUsage'])->middleware('throttle:20,1');
        Route::post('services/{service}/sso', [Admin\ServiceController::class, 'sso'])->middleware('throttle:20,1');
        Route::post('services/{service}/password', [Admin\ServiceController::class, 'changePassword'])->middleware('throttle:10,1');
        Route::post('services/{service}/package', [Admin\ServiceController::class, 'changePackage'])->middleware('throttle:10,1');
        Route::get('services/{service}/upgrade', [Admin\ServiceController::class, 'upgradeQuote']);
        Route::post('services/{service}/upgrade', [Admin\ServiceController::class, 'upgrade']);
        Route::post('services/{service}/transfer', [Admin\ServiceController::class, 'transfer']);
        Route::post('services/{service}/welcome', [Admin\ServiceController::class, 'welcome'])->middleware('throttle:10,1');
        Route::post('services/{service}/action', [Admin\ServiceController::class, 'action']);
        Route::post('services/{service}/credentials', [Admin\ServiceController::class, 'credentials']);

        Route::get('domains', [Admin\DomainController::class, 'index']);
        Route::get('domains/{domain}', [Admin\DomainController::class, 'show']);
        Route::put('domains/{domain}', [Admin\DomainController::class, 'update']);
        Route::get('domains/{domain}/epp', [Admin\DomainController::class, 'epp']);
        Route::get('domains/{domain}/registrar', [Admin\DomainController::class, 'registrarInfo']);
        Route::post('domains/{domain}/registrar/sync', [Admin\DomainController::class, 'registrarSync']);
        Route::post('domains/{domain}/registrar/{command}', [Admin\DomainController::class, 'registrarCommand'])
            ->whereIn('command', ['register', 'transfer', 'renew', 'contacts', 'delete', 'release', 'privacy', 'lock']);
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
