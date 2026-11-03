<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->string('auth_type')->default('token')->after('username'); // token, password
        });

        Schema::create('registrars', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('reseller_id')->nullable();
            $table->text('api_key')->nullable(); // encrypted
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrars');

        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('auth_type');
        });
    }
};
