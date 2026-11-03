<?php

namespace App\Providers;

use App\Addons\AddonManager;
use App\Models\Client;
use App\Services\Auth\LoginService;
use App\Support\Settings;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Settings::apply();

        $this->app->make(AddonManager::class)->bootEnabled();

        LoginService::registerRateLimiter();

        // The emailed link opens the reset page of the portal the account belongs to.
        ResetPassword::createUrlUsing(function ($account, string $token) {
            $path = $account instanceof Client ? 'reset-password' : 'admin/reset-password';

            return url("{$path}/{$token}").'?'.http_build_query(['email' => $account->getEmailForPasswordReset()]);
        });
    }
}
