<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A client's cancellation request. Nothing happens until an admin accepts it: then the
     * service is cancelled in the panel and suspended on its server, right away ("immediate") or
     * on its due date ("end_of_period").
     */
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('cancellation_type', 20)->nullable()->after('terminate_reason');
            $table->text('cancellation_reason')->nullable()->after('cancellation_type');
            $table->timestamp('cancellation_requested_at')->nullable()->after('cancellation_reason');
            $table->timestamp('cancellation_accepted_at')->nullable()->after('cancellation_requested_at');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['cancellation_type', 'cancellation_reason', 'cancellation_requested_at', 'cancellation_accepted_at']);
        });
    }
};
