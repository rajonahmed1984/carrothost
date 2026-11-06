<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Domain;
use App\Models\Service;
use App\Support\Currency;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Moves a client to another currency. Their services, domains and credit balance are kept in
 * the client's currency, so they are converted at the current rate. Unpaid invoices must be
 * settled or cancelled first: an invoice keeps the currency it was raised in.
 */
class ClientCurrency
{
    public function change(Client $client, string $to): void
    {
        $to = strtoupper($to);
        $from = $client->currencyCode();
        if ($from === $to) {
            return;
        }

        if (! in_array($to, Currency::SUPPORTED, true)) {
            throw ValidationException::withMessages(['currency' => "{$to} is not a supported currency."]);
        }

        // Both rates must exist before anything is touched.
        Currency::requireRate($from);
        Currency::requireRate($to);

        $unpaid = $client->invoices()->where('status', 'unpaid')->count();
        if ($unpaid > 0) {
            throw ValidationException::withMessages(['currency' => "This client has {$unpaid} unpaid invoice(s) in {$from}. Get them paid or cancel them before changing the currency."]);
        }

        DB::transaction(function () use ($client, $from, $to) {
            $locked = Client::whereKey($client->id)->lockForUpdate()->firstOrFail();

            foreach (Service::where('client_id', $client->id)->get() as $service) {
                $service->update(['recurring_amount' => Currency::convert($service->recurring_amount, $from, $to)]);
            }
            foreach (Domain::where('client_id', $client->id)->get() as $domain) {
                $domain->update(['recurring_amount' => Currency::convert($domain->recurring_amount, $from, $to)]);
            }

            $oldBalance = (string) $locked->credit_balance;
            $newBalance = Currency::convert($oldBalance, $from, $to);
            $locked->update(['currency' => $to, 'credit_balance' => $newBalance]);

            if (bccomp($oldBalance, '0', 2) !== 0) {
                // A zero-amount history line, so the credit history explains the new balance.
                $locked->credits()->create([
                    'amount' => '0.00',
                    'description' => "Currency changed from {$from} to {$to}: balance {$oldBalance} {$from} is now {$newBalance} {$to}",
                    'user_id' => auth('web')->id(),
                ]);
            }

            ActivityLog::record('client.currency_changed', $locked, ['from' => $from, 'to' => $to, 'credit' => [$oldBalance, $newBalance]]);
        });

        $client->refresh();
    }
}
