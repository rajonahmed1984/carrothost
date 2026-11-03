<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('language', 32)->default('English');
            $table->boolean('two_factor')->default(false);
            $table->boolean('is_owner')->default(false);
            $table->text('permissions')->nullable();
            $table->string('status', 32)->default('active');
            $table->string('verification_token', 100)->nullable()->index();
            $table->timestamp('verification_token_expires_at')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();

            $table->unique(['client_id', 'email']);
        });

        // Import existing WHMCS users from carrothost_portal if available
        try {
            $portalCheck = DB::select("SHOW DATABASES LIKE 'carrothost_portal'");
            if (!empty($portalCheck)) {
                $whmcsUsers = DB::select("
                    SELECT 
                        c.id as client_id,
                        u.first_name,
                        u.last_name,
                        u.email,
                        COALESCE(NULLIF(u.language, ''), 'English') as language,
                        CASE WHEN u.second_factor IS NOT NULL AND u.second_factor != '' THEN 1 ELSE 0 END as two_factor,
                        uc.owner as is_owner,
                        uc.permissions,
                        'active' as status,
                        u.email_verified_at,
                        COALESCE(uc.last_login, u.last_login) as last_login_at,
                        u.created_at,
                        u.updated_at
                    FROM carrothost_portal.tblusers_clients uc
                    JOIN carrothost_portal.tblusers u ON u.id = uc.auth_user_id
                    JOIN carrothost_portal.tblclients wc ON wc.id = uc.client_id
                    JOIN carrothost_panel.clients c ON c.email = wc.email
                ");

                foreach ($whmcsUsers as $u) {
                    DB::table('client_users')->updateOrInsert(
                        ['client_id' => $u->client_id, 'email' => strtolower($u->email)],
                        [
                            'first_name' => $u->first_name,
                            'last_name' => $u->last_name,
                            'language' => $u->language ?: 'English',
                            'two_factor' => (bool) $u->two_factor,
                            'is_owner' => (bool) $u->is_owner,
                            'permissions' => $u->permissions,
                            'status' => 'active',
                            'email_verified_at' => $u->email_verified_at,
                            'last_login_at' => $u->last_login_at,
                            'created_at' => $u->created_at ?: now(),
                            'updated_at' => $u->updated_at ?: now(),
                        ]
                    );
                }
            }
        } catch (\Throwable $e) {
            // Silently continue if cross-database query is not permitted
        }

        // For any clients in carrothost_panel that don't have an owner user yet, create one
        $clientsWithoutOwner = DB::select("
            SELECT c.id, c.name, c.email, c.phone, c.last_login_at, c.created_at, c.updated_at
            FROM clients c
            WHERE c.id NOT IN (SELECT client_id FROM client_users WHERE is_owner = 1)
        ");

        foreach ($clientsWithoutOwner as $c) {
            $parts = explode(' ', trim($c->name), 2);
            $firstName = $parts[0] ?? $c->name;
            $lastName = $parts[1] ?? '';

            DB::table('client_users')->updateOrInsert(
                ['client_id' => $c->id, 'email' => strtolower($c->email)],
                [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'phone' => $c->phone,
                    'language' => 'English',
                    'two_factor' => false,
                    'is_owner' => true,
                    'permissions' => 'profile,contacts,products,manageproducts,productsso,domains,managedomains,invoices,quotes,tickets,affiliates,emails,orders',
                    'status' => 'active',
                    'email_verified_at' => $c->created_at ?: now(),
                    'last_login_at' => $c->last_login_at,
                    'created_at' => $c->created_at ?: now(),
                    'updated_at' => $c->updated_at ?: now(),
                ]
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('client_users');
    }
};

