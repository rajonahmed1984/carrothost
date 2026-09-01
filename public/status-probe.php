<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$targets = [
    [
        'id' => 'bdix',
        'name' => 'BDIX Cloud Node',
        'type' => 'Dhaka Datacenter Core Peering',
        'host' => '103.159.37.175',
        'port' => 80,
        'uptime' => '99.99%',
        'icon' => 'Globe'
    ],
    [
        'id' => 'mail',
        'name' => 'Email & Webmail Cluster',
        'type' => 'cPanel Mail / IMAP / SMTP Cluster',
        'host' => 'sng128.arandomserver.com',
        'port' => 443,
        'uptime' => '99.97%',
        'icon' => 'Mail'
    ],
    [
        'id' => 'xeon',
        'name' => 'Xeon Cloud VPS',
        'type' => 'High-Performance KVM Compute Node',
        'host' => '92.113.149.230',
        'port' => 80,
        'uptime' => '99.99%',
        'icon' => 'Cpu'
    ],
    [
        'id' => 'webuzo',
        'name' => 'Webuzo Shared Cloud',
        'type' => 'Speedy Cache & Webuzo Control Panel',
        'host' => 'earth.carrothost.com',
        'port' => 443,
        'uptime' => '99.98%',
        'icon' => 'Server'
    ],
    [
        'id' => 'nodefree',
        'name' => '100% Node-Free Tracking Proxy',
        'type' => 'Nginx First-Party Reverse Proxy',
        'host' => 'earth.carrothost.com',
        'port' => 443,
        'uptime' => '100.0%',
        'icon' => 'Zap'
    ],
    [
        'id' => 'dns',
        'name' => 'DNS Anycast Nameservers',
        'type' => 'Global DNS Resolution & Zone Files',
        'host' => 'ns1.carrothost.com',
        'port' => 53,
        'uptime' => '100.0%',
        'icon' => 'Shield'
    ]
];

$results = [];
$allOnline = true;

foreach ($targets as $t) {
    $start = microtime(true);
    $fp = @fsockopen($t['host'], $t['port'], $errno, $errstr, 2.0);
    $latencyMs = round((microtime(true) - $start) * 1000);
    
    $isOnline = ($fp !== false);
    if ($fp) {
        fclose($fp);
    } else {
        $allOnline = false;
    }

    $results[] = [
        'id' => $t['id'],
        'name' => $t['name'],
        'type' => $t['type'],
        'status' => $isOnline ? 'Operational' : 'Degraded',
        'online' => $isOnline,
        'latency' => $isOnline ? ($latencyMs . ' ms') : 'Timeout',
        'latencyMs' => $latencyMs,
        'uptime' => $t['uptime'],
        'icon' => $t['icon']
    ];
}

echo json_encode([
    'timestamp' => date('c'),
    'checkedAt' => date('h:i:s A T'),
    'allOperational' => $allOnline,
    'overallUptime' => '99.98%',
    'servers' => $results
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
