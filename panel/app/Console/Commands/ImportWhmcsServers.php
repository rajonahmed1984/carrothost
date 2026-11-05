<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\Server;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Copies the IP address, assigned IPs and nameservers of WHMCS servers (tblservers) onto the
 * matching panel servers. Only fills fields that are empty in the panel unless --update is given.
 * Logins are not copied: WHMCS keeps them encrypted with its own key.
 */
class ImportWhmcsServers extends Command
{
    protected $signature = 'whmcs:import-servers {database : The database holding the WHMCS tables} {--update : Overwrite IPs and nameservers already set in the panel} {--dry-run : Report what would happen without writing}';

    protected $description = 'Import server IPs and nameservers from a WHMCS database';

    private const MODULES = ['cpanel' => 'cpanel', 'webuzo' => 'webuzo'];

    public function handle(): int
    {
        config(['database.connections.whmcs' => [...config('database.connections.mysql'), 'database' => $this->argument('database')]]);
        $rows = DB::connection('whmcs')->table('tblservers')->where('disabled', 0)->orderBy('id')->get();
        $servers = Server::all();
        $report = [];

        foreach ($rows as $row) {
            $module = self::MODULES[strtolower((string) $row->type)] ?? strtolower((string) $row->type);
            // The hostname may have changed since (hosts move accounts), so the login and IP also identify it.
            $server = $servers->first(fn (Server $s) => strcasecmp($s->hostname, (string) $row->hostname) === 0)
                ?? $servers->first(fn (Server $s) => $row->ipaddress && $s->ip_address === $row->ipaddress)
                ?? $servers->first(fn (Server $s) => $s->module === $module && $row->username && strcasecmp((string) $s->username, (string) $row->username) === 0);

            if (! $server) {
                $report[] = [$row->name, $row->hostname, '-', 'no matching panel server'];

                continue;
            }

            $nameservers = collect(range(1, 5))
                ->map(fn ($i) => ['host' => strtolower(trim((string) $row->{"nameserver{$i}"})), 'ip' => trim((string) $row->{"nameserver{$i}ip"}) ?: null])
                ->filter(fn ($ns) => $ns['host'] !== '')
                ->values()->all();
            $assigned = collect(preg_split('/\s+/', (string) $row->assignedips))->filter(fn ($ip) => filter_var($ip, FILTER_VALIDATE_IP))->implode("\n");

            $values = array_filter([
                'ip_address' => filter_var($row->ipaddress, FILTER_VALIDATE_IP) ? $row->ipaddress : null,
                'assigned_ips' => $assigned ?: null,
                'nameservers' => $nameservers ?: null,
            ], fn ($v) => $v !== null);

            if (! $this->option('update')) {
                $values = array_filter($values, fn ($v, $key) => empty($server->{$key}), ARRAY_FILTER_USE_BOTH);
            }

            if ($values && ! $this->option('dry-run')) {
                $server->forceFill($values)->save();
                ActivityLog::record('server.imported_details', $server, ['fields' => array_keys($values)]);
            }

            $report[] = [$row->name, $row->hostname, $server->name, $values ? 'set '.implode(', ', array_keys($values)) : 'nothing to change'];
        }

        $this->table(['WHMCS server', 'WHMCS hostname', 'Panel server', 'Result'], $report);
        $this->option('dry-run') && $this->warn('Dry run: nothing was written.');

        return self::SUCCESS;
    }
}
