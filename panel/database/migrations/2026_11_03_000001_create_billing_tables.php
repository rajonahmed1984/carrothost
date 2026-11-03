<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('password');
        });

        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company')->nullable();
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country', 2)->default('BD');
            $table->string('status')->default('active'); // active, inactive, closed
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('servers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('module'); // cpanel, webuzo, webdock
            $table->string('hostname');
            $table->unsignedInteger('port')->nullable();
            $table->string('username')->nullable();
            $table->text('credentials')->nullable(); // encrypted API token
            $table->boolean('verify_tls')->default(true);
            $table->unsignedInteger('max_accounts')->default(0); // 0 = unlimited
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // shared_hosting, vps, other
            $table->text('description')->nullable();
            $table->string('module')->nullable(); // null = manual fulfilment
            $table->string('module_package')->nullable(); // WHM package or VPS profile
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('product_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('cycle');
            $table->decimal('price', 12, 2);
            $table->decimal('setup_fee', 12, 2)->default(0);
            $table->unique(['product_id', 'cycle']);
        });

        Schema::create('tlds', function (Blueprint $table) {
            $table->id();
            $table->string('tld')->unique();
            $table->string('registrar')->nullable(); // null = manual fulfilment
            $table->decimal('register_price', 12, 2);
            $table->decimal('renew_price', 12, 2);
            $table->decimal('transfer_price', 12, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('pending'); // pending, active, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('server_id')->nullable()->constrained()->nullOnDelete();
            $table->string('domain')->nullable();
            $table->string('cycle');
            $table->decimal('recurring_amount', 12, 2);
            // pending, active, suspended, terminated, cancelled
            $table->string('status')->default('pending');
            // none, queued, running, done, failed, manual_required
            $table->string('provision_status')->default('none');
            $table->text('provision_error')->nullable();
            $table->string('remote_id')->nullable(); // username or VPS slug
            $table->text('credentials')->nullable(); // encrypted
            $table->boolean('auto_suspended')->default(false);
            $table->date('next_due_date')->nullable();
            $table->date('renewal_invoiced_for')->nullable();
            $table->timestamps();
            $table->index(['status', 'next_due_date']);
        });

        Schema::create('domains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('registrar')->nullable();
            $table->string('action'); // register, transfer
            $table->unsignedTinyInteger('years')->default(1);
            $table->decimal('recurring_amount', 12, 2);
            // pending, active, expired, transferred_out, cancelled
            $table->string('status')->default('pending');
            $table->string('provision_status')->default('none');
            $table->text('provision_error')->nullable();
            $table->text('epp_code')->nullable(); // encrypted
            $table->date('expires_at')->nullable();
            $table->date('renewal_invoiced_for')->nullable();
            $table->timestamps();
            $table->index(['status', 'expires_at']);
            $table->index('name');
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('number')->nullable()->unique();
            $table->string('status')->default('unpaid'); // unpaid, paid, cancelled
            $table->string('currency', 3)->default('BDT');
            $table->decimal('total', 12, 2)->default(0);
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'due_date']);
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->decimal('amount', 12, 2);
            $table->string('kind')->default('other'); // new, renewal, other
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('domain_id')->nullable()->constrained()->nullOnDelete();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->restrictOnDelete();
            $table->string('gateway');
            $table->string('transaction_id');
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('BDT');
            $table->json('meta')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            // A gateway callback delivered twice must never count as two payments.
            $table->unique(['gateway', 'transaction_id']);
        });

        Schema::create('gateways', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->boolean('is_enabled')->default(false);
            $table->boolean('test_mode')->default(true);
            $table->text('config')->nullable(); // encrypted JSON
            $table->timestamps();
        });

        Schema::create('addons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->boolean('is_enabled')->default(false);
            $table->text('config')->nullable(); // encrypted JSON
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->nullableMorphs('subject');
            $table->json('context')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        foreach (['activity_logs', 'addons', 'gateways', 'payments', 'invoice_items', 'invoices', 'domains', 'services', 'orders', 'tlds', 'product_prices', 'products', 'servers', 'clients'] as $table) {
            Schema::dropIfExists($table);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }
};
