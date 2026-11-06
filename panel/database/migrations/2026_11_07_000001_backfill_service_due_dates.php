<?php

use App\Models\Invoice;
use App\Models\Service;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Services accepted before their order's invoice was paid got no next due date, so overdue
     * suspension never saw them. They fall due with that invoice; one already paid runs a cycle from payment.
     */
    public function up(): void
    {
        Service::whereNull('next_due_date')->whereIn('status', ['active', 'suspended'])->whereNotNull('order_id')->get()
            ->each(function (Service $service) {
                $invoices = Invoice::where('order_id', $service->order_id)->whereIn('status', ['unpaid', 'paid'])->orderBy('id')->get();

                if ($unpaid = $invoices->firstWhere('status', 'unpaid')) {
                    $service->forceFill(['next_due_date' => $unpaid->due_date, 'renewal_invoiced_for' => $unpaid->due_date])->save();
                } elseif (($paid = $invoices->firstWhere('status', 'paid')) && $paid->paid_at) {
                    $months = (int) config("billing.cycles.{$service->cycle}", 1);
                    $service->forceFill(['next_due_date' => $paid->paid_at->copy()->addMonthsNoOverflow($months)->toDateString()])->save();
                }
            });
    }

    public function down(): void
    {
        // The dates stay: billing has used them.
    }
};
