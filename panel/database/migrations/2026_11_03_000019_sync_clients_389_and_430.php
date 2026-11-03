<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        try {
            DB::beginTransaction();

            // 1. Client 74 -> 389 (Iftekhar Mahmud / Dhaka Stream)
            $c74 = DB::table('clients')->where('id', 74)->first();
            $c389 = DB::table('clients')->where('id', 389)->first();

            if ($c74 && !$c389) {
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                DB::table('clients')->where('id', 74)->update(['id' => 389]);
                DB::table('services')->where('client_id', 74)->update(['client_id' => 389]);
                DB::table('domains')->where('client_id', 74)->update(['client_id' => 389]);
                DB::table('invoices')->where('client_id', 74)->update(['client_id' => 389]);
                DB::table('client_users')->where('client_id', 74)->update(['client_id' => 389]);
                DB::table('client_contacts')->where('client_id', 74)->update(['client_id' => 389]);
                DB::table('orders')->where('client_id', 74)->update(['client_id' => 389]);
                DB::table('activity_logs')->where('subject_type', 'App\\Models\\Client')->where('subject_id', 74)->update(['subject_id' => 389]);
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            }

            // Import contacts for 389 if not present
            if (DB::table('client_contacts')->where('client_id', 389)->count() === 0) {
                DB::table('client_contacts')->insert([
                    [
                        'client_id' => 389,
                        'name' => 'Maidul Islam',
                        'email' => 'mithunmaidul@gmail.com',
                        'phone' => '+880.1705-651960',
                        'receives_support' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'client_id' => 389,
                        'name' => 'Masud Karim',
                        'email' => 'masud@dhakastream.net',
                        'phone' => '+880.1632-974721',
                        'receives_support' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'client_id' => 389,
                        'name' => 'Minhaz Rahman',
                        'email' => 'sm.minhaz15@gmail.com',
                        'phone' => '1711-210583',
                        'receives_support' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                ]);
            }

            // 2. Client 430 user in client_users
            if (!DB::table('client_users')->where('client_id', 430)->exists()) {
                DB::table('client_users')->insert([
                    'client_id' => 430,
                    'first_name' => 'Borhanuddin',
                    'last_name' => 'Foundation',
                    'email' => 'borhanuddinfoundation@gmail.com',
                    'phone' => '+880.1747424667',
                    'language' => 'english',
                    'two_factor' => 0,
                    'is_owner' => 1,
                    'permissions' => '',
                    'status' => 'active',
                    'email_verified_at' => '2026-08-22 05:24:21',
                    'last_login_at' => '2026-10-29 05:16:42',
                    'created_at' => '2026-08-22 05:24:21',
                    'updated_at' => '2026-10-29 05:31:00',
                ]);
            }

            // 3. Invoice items for invoice 3899
            $inv = DB::table('invoices')->where('client_id', 430)->where('number', '3899')->first();
            if ($inv && !DB::table('invoice_items')->where('invoice_id', $inv->id)->exists()) {
                $srv = DB::table('services')->where('client_id', 430)->first();
                $dom = DB::table('domains')->where('client_id', 430)->first();

                DB::table('invoice_items')->insert([
                    [
                        'invoice_id' => $inv->id,
                        'kind' => 'service',
                        'service_id' => $srv ? $srv->id : null,
                        'domain_id' => null,
                        'description' => 'Starter - borhanuddinfoundation.com (28/10/2026 - 27/10/2027)',
                        'amount' => 4200.00,
                    ],
                    [
                        'invoice_id' => $inv->id,
                        'kind' => 'domain',
                        'service_id' => null,
                        'domain_id' => $dom ? $dom->id : null,
                        'description' => 'Domain Registration - borhanuddinfoundation.com - 1 Year/s (28/10/2026 - 27/10/2027)',
                        'amount' => 1600.00,
                    ],
                ]);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
        }
    }

    public function down(): void
    {
    }
};

