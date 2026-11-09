<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** The addon system was removed; its on/off table goes with it. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('addons');
    }

    public function down(): void
    {
        Schema::create('addons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->boolean('is_enabled')->default(false);
            $table->text('config')->nullable(); // encrypted JSON
            $table->timestamps();
        });
    }
};
