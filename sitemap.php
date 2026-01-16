<?php
/**
 * Dynamic sitemap generator.
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/xml; charset=UTF-8');

$pages = [
    ['path' => '', 'file' => 'index.php', 'priority' => '1.0'],
    ['path' => 'domain-register', 'file' => 'domain-register.php', 'priority' => '0.9'],
    ['path' => 'domain-transfer', 'file' => 'domain-transfer.php', 'priority' => '0.8'],
    ['path' => 'cpanel-hosting', 'file' => 'cpanel-hosting.php', 'priority' => '0.8'],
    ['path' => 'webuzo-hosting', 'file' => 'webuzo-hosting.php', 'priority' => '0.8'],
    ['path' => 'dedicated-server', 'file' => 'dedicated-server.php', 'priority' => '0.7'],
    ['path' => 'bdix-vps', 'file' => 'bdix-vps.php', 'priority' => '0.7'],
    ['path' => 'xeon-vps', 'file' => 'xeon-vps.php', 'priority' => '0.7'],
    ['path' => 'ryzen-vps', 'file' => 'ryzen-vps.php', 'priority' => '0.7'],
];

echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
echo "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";

foreach ($pages as $page) {
    $url = buildCanonicalUrlFromPath($page['path']);
    $filePath = __DIR__ . '/' . $page['file'];
    $lastmod = file_exists($filePath) ? date('Y-m-d', filemtime($filePath)) : date('Y-m-d');
    $priority = $page['priority'];

    echo "  <url>\n";
    echo "    <loc>" . htmlspecialchars($url, ENT_XML1) . "</loc>\n";
    echo "    <lastmod>{$lastmod}</lastmod>\n";
    echo "    <changefreq>weekly</changefreq>\n";
    echo "    <priority>{$priority}</priority>\n";
    echo "  </url>\n";
}

echo "</urlset>\n";
