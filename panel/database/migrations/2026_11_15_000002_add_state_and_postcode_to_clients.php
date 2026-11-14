<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Registrars need the registrant's state and postcode; the client profile keeps them. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->string('state', 100)->nullable()->after('city');
            $table->string('postcode', 16)->nullable()->after('state');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['state', 'postcode']);
        });
    }
};
