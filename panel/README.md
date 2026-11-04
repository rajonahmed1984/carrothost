# CarrotHost Panel

Admin panel for clients, orders, invoices, hosting, domains, gateways and addons.
Laravel 13 API with a React admin UI. It is separate from the marketing site in the
repository root and is deployed on its own.

## Local setup

```sh
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan panel:make-admin you@example.com "Your Name"
npm run build
php artisan serve
```

## Production

- Point a subdomain's document root at `panel/public`. Never expose the `panel` folder itself.
- Set `APP_ENV=production`, `APP_DEBUG=false` and an HTTPS `APP_URL`.
- Back up `APP_KEY`. Server tokens and account passwords are encrypted with it, so
  losing it makes them unreadable.
- Add one cron entry. It runs billing and drains the provisioning queue:

  ```
  * * * * * cd /path/to/panel && php artisan schedule:run >> /dev/null 2>&1
  ```

## Sign-in

Customers use `/login` (`clients` table, `client` guard). Admins use `/admin/login`
(`users` table, `web` guard). The flows follow the Apptimatic portal:

- **Admin login** always needs a 6-digit code sent by email. Customers can turn the
  same check on under Security.
- **Registration** creates nothing until the emailed code comes back.
- **Forgot password** works for both portals, with separate tokens.
- **Google login** is for customers only. The button appears once `GOOGLE_CLIENT_ID` and
  `GOOGLE_CLIENT_SECRET` are set. Add `https://your-panel/auth/google/callback` as an
  authorised redirect URI in Google.
- **reCAPTCHA** protects login, registration and forgot password once its keys are set.
- **Login as Client** on a client's page lets an admin see their account. Both ends are
  logged, and their password and security settings stay locked meanwhile.

**Mail** goes out through the server's own sendmail (`MAIL_MAILER=sendmail`), the same way
myapptimatic does, so on cPanel nothing else is needed. Senders (`config/system_mail.php`):

- **sales@carrothost.com**: registration codes, order confirmations, accepted orders
- **support@carrothost.com**: sign-in codes, password resets, tickets
- **billing@carrothost.com**: new invoices (orders, renewals, manual) and payment receipts

An SMTP server saved under Settings → Email replaces sendmail.

**Configure a working mailer before going live.** Without one, no admin can receive a code
and nobody can sign in to the admin panel. To recover, set `MAIL_MAILER=log` and read the
code from `storage/logs/laravel.log`.

With `APP_ENV=local` and `APP_DEBUG=true`, the code `123456` is also accepted, and with no
Google keys the Google button opens a sandbox at `/auth/sandbox/google` that signs in as any
customer without a password. Never deploy with those values.

## Connection status

| Area | Connected | Not connected yet (falls back to manual) |
| --- | --- | --- |
| Provisioning | cPanel/WHM, Webuzo | Webdock |
| Registrars | Connection test only (LogicBoxes API) | Register, renew and transfer for ResellCube, StarGate/UK2 |
| Gateways | Manual/Bank, bKash, SSLCommerz, PayPal | Stripe |

To connect a provisioning module, implement `App\Provisioning\ProvisioningModule` and set
its class in `config/billing.php`.

## Addons

An addon is a folder in `addons/` holding `addon.json` and an `Addon.php` class that
implements `App\Addons\PanelAddon`. See `addons/PaidLog`. Addons run with full panel
access, so they are installed by deploying code. The admin UI only turns them on and off.

## Tests

```sh
php artisan test
```
