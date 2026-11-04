<?php

namespace App\Providers;

use App\Addons\AddonManager;
use App\Models\Client;
use App\Services\Auth\LoginService;
use App\Support\MailFrom;
use App\Support\Settings;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\Mime\Address;

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

        // Reset links come from support, like sign-in codes.
        Event::listen(function (MessageSending $event) {
            if (str_contains((string) ($event->data['__laravel_notification'] ?? ''), 'ResetPassword')) {
                $from = MailFrom::for(MailFrom::SUPPORT);
                $event->message->from(new Address($from->address, $from->name));
            }
        });
    }
}
