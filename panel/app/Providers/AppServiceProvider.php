<?php

namespace App\Providers;

use App\Mail\PasswordResetLink;
use App\Models\Client;
use App\Services\CustomerMailer;
use App\Support\EmailTemplates;
use Illuminate\Notifications\Messages\MailMessage;
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

        LoginService::registerRateLimiter();

        // The emailed link opens the reset page of the portal the account belongs to.
        $resetUrl = function ($account, string $token) {
            $path = $account instanceof Client ? 'reset-password' : 'admin/reset-password';

            return url("{$path}/{$token}").'?'.http_build_query(['email' => $account->getEmailForPasswordReset()]);
        };
        ResetPassword::createUrlUsing($resetUrl);

        // Customers get the Password Reset Validation template; staff keep Laravel's own email.
        ResetPassword::toMailUsing(function ($account, string $token) use ($resetUrl) {
            $url = $resetUrl($account, $token);
            $minutes = (int) config('auth.passwords.'.($account instanceof Client ? 'clients' : config('auth.defaults.passwords')).'.expire', 60);

            if (! $account instanceof Client) {
                return (new MailMessage)
                    ->subject('Reset Password Notification')
                    ->line('You are receiving this email because we received a password reset request for your account.')
                    ->action('Reset Password', $url)
                    ->line("This password reset link will expire in {$minutes} minutes.")
                    ->line('If you did not request a password reset, no further action is required.');
            }

            $template = EmailTemplates::render('password_reset', [...CustomerMailer::clientValues($account), 'reset_link' => $url, 'expiry_minutes' => $minutes]);

            return (new PasswordResetLink(
                name: $account->name,
                url: $url,
                minutes: $minutes,
                hasPassword: true,
                templateHtml: $template['html'] ?? null,
                templateText: $template['text'] ?? null,
                subjectLine: $template['subject'] ?? null,
            ))->to($account->email);
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
