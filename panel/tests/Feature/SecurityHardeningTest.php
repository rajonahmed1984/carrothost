<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use LogicException;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        return $admin;
    }

    public function test_every_page_carries_the_security_headers(): void
    {
        $response = $this->get('/admin/login')->assertOk();

        $response->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $csp = $response->headers->get('Content-Security-Policy');
        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
        $this->assertStringContainsString("object-src 'none'", $csp);
        $this->assertMatchesRegularExpression("/script-src 'self' 'nonce-[A-Za-z0-9]{32}'/", $csp);
        $this->assertFalse($response->headers->has('X-Powered-By'));
    }

    public function test_hsts_is_sent_over_https(): void
    {
        $this->get('https://localhost/admin/login')->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    public function test_an_idle_admin_is_signed_out_but_background_polling_does_not_keep_them_in(): void
    {
        $this->actingAs($this->admin())->getJson('/api/me')->assertOk();

        $this->travel(20)->minutes();
        $this->getJson('/api/me', ['X-Background' => '1'])->assertOk();

        // Polling did not count, so 31 minutes after the last real request the session ends.
        $this->travel(11)->minutes();
        $this->getJson('/api/me')->assertUnauthorized();
        $this->assertDatabaseHas('activity_logs', ['action' => 'admin.session_expired']);
    }

    public function test_audit_entries_are_chained_and_cannot_be_changed(): void
    {
        $first = ActivityLog::record('test.one', context: ['a' => 1]);
        $second = ActivityLog::record('test.two');
        $this->assertSame($first->hash, $second->prev_hash);
        $this->artisan('audit:verify')->assertExitCode(0);

        $this->expectException(LogicException::class);
        $first->update(['action' => 'test.changed']);
    }

    public function test_audit_verify_catches_edits_and_removals_made_in_the_database(): void
    {
        $first = ActivityLog::record('test.one');
        $second = ActivityLog::record('test.two');
        ActivityLog::record('test.three');

        DB::table('activity_logs')->where('id', $first->id)->update(['action' => 'test.forged']);
        $this->artisan('audit:verify')->expectsOutputToContain("#{$first->id}")->assertExitCode(1);

        DB::table('activity_logs')->where('id', $first->id)->update(['action' => 'test.one']);
        DB::table('activity_logs')->where('id', $second->id)->delete();
        $this->artisan('audit:verify')->expectsOutputToContain('removed')->assertExitCode(1);
    }

    public function test_failed_logins_and_lockouts_are_recorded_with_the_address(): void
    {
        $this->admin()->forceFill(['email' => 'boss@example.com'])->save();

        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/login', ['email' => 'boss@example.com', 'password' => 'wrong-password'], ['User-Agent' => 'TestBrowser']);
        }

        $this->assertDatabaseHas('activity_logs', ['action' => 'login.denied', 'ip' => '127.0.0.1', 'user_agent' => 'TestBrowser']);
        $this->assertDatabaseHas('activity_logs', ['action' => 'login.locked_out']);
    }
}
