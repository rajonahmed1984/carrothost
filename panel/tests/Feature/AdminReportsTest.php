<?php

namespace Tests\Feature;

use App\Mail\AdminReport;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Domain;
use App\Models\Registrar;
use App\Models\User;
use App\Services\DomainRegistrar;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Tests\TestCase;

class AdminReportsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['email' => 'boss@example.com']);
        $this->admin->forceFill(['is_admin' => true])->save();
        Mail::fake();
    }

    private function log(string $action, array $context, string $at): void
    {
        // Audit entries cannot be backdated, so the clock is moved instead.
        $now = now();
        $this->travelTo($at);
        ActivityLog::record($action, context: $context);
        $this->travelTo($now);
    }

    public function test_cron_activity_reports_yesterdays_tasks_failures_and_missing_runs(): void
    {
        Cache::put('scheduler.heartbeat', now()->toISOString());
        $yesterday = today()->subDay();
        $this->log('automation.run', ['task' => 'renewals', 'count' => 4], $yesterday->copy()->setTime(1, 0)->toDateTimeString());
        $this->log('automation.failed', ['task' => 'suspensions', 'error' => 'WHM timed out'], $yesterday->copy()->setTime(2, 0)->toDateTimeString());
        // Today's run belongs to tomorrow's report.
        $this->log('automation.run', ['task' => 'renewals', 'count' => 9], now()->toDateTimeString());

        $this->artisan('reports:cron-activity')->assertSuccessful();

        Mail::assertSent(AdminReport::class, function (AdminReport $mail) {
            $html = $mail->render();

            return $mail->hasTo('boss@example.com')
                && $mail->subjectLine === config('app.name').' Cron Job Activity'
                && str_contains($html, 'Renewal invoices created')
                && collect($mail->sections[0]['rows'])->contains(fn ($row) => $row[0] === 'Renewal invoices created' && $row[1] === '4')
                && str_contains($html, 'WHM timed out')
                && str_contains($html, 'Services suspended: this task did not run.')
                && ! str_contains($html, 'Cron looks stopped');
        });
    }

    public function test_reports_go_to_saved_recipients_and_can_be_turned_off(): void
    {
        config(['billing.reports.recipients' => 'a@example.com, b@example.com']);
        $this->artisan('reports:cron-activity')->assertSuccessful();
        Mail::assertSent(AdminReport::class, fn (AdminReport $mail) => $mail->hasTo('a@example.com') && $mail->hasTo('b@example.com') && ! $mail->hasTo('boss@example.com'));

        Mail::fake();
        config(['billing.reports.cron_activity' => false]);
        $this->artisan('reports:cron-activity')->assertSuccessful();
        Mail::assertNothingSent();
    }

    public function test_domain_sync_report_lists_updates_errors_and_missing_domains(): void
    {
        Registrar::create(['code' => 'stargate', 'currency' => 'USD', 'reseller_id' => '123', 'api_key' => 'key']);
        $client = Client::create(['name' => 'Acme', 'email' => 'acme@example.com']);
        $base = ['client_id' => $client->id, 'action' => 'register', 'recurring_amount' => '1600.00', 'status' => 'active', 'registrar' => 'stargate', 'expires_at' => '2027-01-10', 'next_due_date' => '2027-01-10'];
        Domain::create([...$base, 'name' => 'renewed.com']);
        Domain::create([...$base, 'name' => 'same.com']);
        Domain::create([...$base, 'name' => 'broken.com']);
        Domain::create([...$base, 'name' => 'gone.com']);

        $registrar = $this->mock(DomainRegistrar::class);
        $registrar->shouldReceive('orderId')->andReturnUsing(fn (Domain $d) => $d->name === 'gone.com' ? null : '1');
        $registrar->shouldReceive('syncToPanel')->andReturnUsing(function (Domain $d) {
            if ($d->name === 'broken.com') {
                throw new RuntimeException('Registrar API down');
            }
            $d->forceFill(['expires_at' => $d->name === 'renewed.com' ? '2028-01-10' : '2027-01-10', 'registrar_synced_at' => now()])->save();

            return [];
        });

        $this->artisan('domains:sync')->assertSuccessful();

        Mail::assertSent(AdminReport::class, function (AdminReport $mail) {
            $rows = collect($mail->sections)->keyBy('title')->map(fn ($s) => $s['rows']);

            return $mail->subjectLine === config('app.name').' Domain Synchronisation Cron Report'
                && $rows['Updated'] === [['renewed.com', 'stargate', 'Expiry date 2027-01-10 → 2028-01-10']]
                && $rows['Errors'] === [['broken.com', 'stargate', 'Registrar API down']]
                && $rows['Not Found at the Registrar'] === [['gone.com', 'stargate']]
                && $rows['Already in Sync'] === [['same.com', 'stargate']]
                && str_contains($mail->render(), '1 domain(s) still need a sync');
        });
        $this->assertDatabaseHas('activity_logs', ['action' => 'automation.run']);
    }

    public function test_midnight_schedule_includes_both_reports(): void
    {
        $events = collect(app(\Illuminate\Console\Scheduling\Schedule::class)->events());
        $at = fn (string $command) => $events->first(fn ($e) => str_ends_with((string) $e->command, $command))?->expression;

        $this->assertSame('0 0 * * *', $at('reports:cron-activity'));
        $this->assertSame('0 0 * * *', $at('domains:sync'));
    }
}
