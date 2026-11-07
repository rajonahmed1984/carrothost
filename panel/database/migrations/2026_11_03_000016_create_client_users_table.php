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

