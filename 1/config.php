<?php
/**
 * CarrotHost Configuration File
 * Hosting Business Website Configuration
 */

// Optional local overrides (keep secrets out of version control)
$localConfigPath = __DIR__ . '/config.local.php';
if (file_exists($localConfigPath)) {
    require $localConfigPath;
}

// Site Configuration
define('SITE_NAME', 'CarrotHost');
define('SITE_TAGLINE', 'Fast, Secure & Optimized Web Hosting');
// Derive base URL from the current request so localhost works without manual edits.
$siteScheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$siteHost = $_SERVER['HTTP_HOST'] ?? 'carrothost.com';
$scriptDir = isset($_SERVER['SCRIPT_NAME']) ? rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') : '';
$siteBase = $scriptDir === '/' ? '' : $scriptDir;
define('SITE_URL', $siteScheme . '://' . $siteHost . $siteBase);
define('SITE_EMAIL', 'support@carrothost.com');
define('SITE_PHONE', '+8801787882277');
define('WHATSAPP_NUMBER', '8801787882277');
define('ASSET_VERSION', '2026-01-16');
define('GTM_ID', 'GTM-T46T43FF');
define('GA4_ID', '');
define('YANDEX_METRICA_ID', '37a44d71328c7cfa');
define('SITE_ADDRESS', 'Dhaka, Bangladesh');

// Brand Colors
define('PRIMARY_COLOR', '#f16922'); // Orange - CTA buttons, pricing highlights
define('SECONDARY_COLOR', '#009247'); // Green - Trust badges, headings accents

// WHMCS Configuration
define('WHMCS_URL', 'https://portal.carrothost.com');
define('WHMCS_CART_URL', WHMCS_URL . '/cart.php');
define('WHMCS_CLIENT_AREA', WHMCS_URL . '/clientarea.php');
define('WHMCS_DOMAIN_REGISTER', WHMCS_URL . '/cart.php?a=add&domain=register');
define('WHMCS_DOMAIN_TRANSFER', WHMCS_URL . '/cart.php?a=add&domain=transfer');
if (!defined('WHMCS_API_URL')) {
    define('WHMCS_API_URL', rtrim(WHMCS_URL, '/') . '/includes/api.php');
}
if (!defined('WHMCS_API_IDENTIFIER')) {
    define('WHMCS_API_IDENTIFIER', getenv('WHMCS_API_IDENTIFIER') ?: '');
}
if (!defined('WHMCS_API_SECRET')) {
    define('WHMCS_API_SECRET', getenv('WHMCS_API_SECRET') ?: '');
}

// Currency Configuration
define('DEFAULT_CURRENCY', 'BDT');
define('CURRENCY_SYMBOL_BDT', '৳');
define('CURRENCY_SYMBOL_USD', '$');
define('USD_TO_BDT_RATE', 120); // Update this rate as needed

// SEO Configuration
define('META_KEYWORDS', 'web hosting bangladesh, bdix hosting, vps hosting, dedicated server, domain registration, cpanel hosting, cheap hosting bd');
define('META_AUTHOR', 'CarrotHost - Apptimatic');

// Social Media
define('FACEBOOK_URL', 'https://www.facebook.com/carrothost');
define('YOUTUBE_URL', 'https://www.youtube.com/channel/UC6tLTlc-43puBNtR2JrNKGQ');

// Support URLs
define('SUPPORT_TICKET_URL', WHMCS_URL . '/submitticket.php');
define('KNOWLEDGEBASE_URL', SITE_URL . '/knowledgebase/');
define('WHOIS_URL', SITE_URL . '/whois/');

// Session Configuration
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set default currency if not set
if (!isset($_SESSION['currency'])) {
    $_SESSION['currency'] = DEFAULT_CURRENCY;
}

/**
 * Convert price based on selected currency
 * @param float $bdtPrice Price in BDT
 * @return array ['amount' => float, 'symbol' => string, 'currency' => string]
 */
function convertPrice($bdtPrice) {
    $currency = $_SESSION['currency'] ?? DEFAULT_CURRENCY;
    
    if ($currency === 'USD') {
        $amount = round($bdtPrice / USD_TO_BDT_RATE, 2);
        $symbol = CURRENCY_SYMBOL_USD;
    } else {
        $amount = $bdtPrice;
        $symbol = CURRENCY_SYMBOL_BDT;
    }
    
    return [
        'amount' => $amount,
        'symbol' => $symbol,
        'currency' => $currency,
        'formatted' => $symbol . number_format($amount, ($currency === 'USD' ? 2 : 0))
    ];
}

/**
 * Format price for display
 * @param float $bdtPrice Price in BDT
 * @return string Formatted price with currency symbol
 */
function formatPrice($bdtPrice) {
    $price = convertPrice($bdtPrice);
    return $price['formatted'];
}

/**
 * Get WHMCS product URL
 * @param int $productId WHMCS product ID
 * @return string Complete WHMCS cart URL
 */
function getWHMCSProductURL($productId) {
    return WHMCS_CART_URL . '?a=add&pid=' . $productId;
}

/**
 * Get current page name
 * @return string Current page filename without extension
 */
function getCurrentPage() {
    return basename($_SERVER['PHP_SELF'], '.php');
}

/**
 * Normalize a request or route fragment into a clean path for URLs.
 *
 * @param string|null $rawPath Raw path (can include query string or site URL).
 * @param bool $stripBasePath Whether to remove the configured SITE_URL base path.
 * @return string Clean path that always starts with '/' and has no file extension.
 */
function normalizePathForUrls($rawPath = null, $stripBasePath = true) {
    $path = $rawPath;

    if ($path === null) {
        $path = $_SERVER['REQUEST_URI'] ?? '/';
    }

    $path = parse_url($path, PHP_URL_PATH) ?? $path;
    $path = (string)$path;
    $path = trim($path);

    if ($path === '') {
        $path = '/';
    }

    $basePath = '';

    if ($stripBasePath) {
        $basePath = parse_url(SITE_URL, PHP_URL_PATH) ?? '';
        $basePath = rtrim($basePath, '/');
    }

    if ($basePath && strpos($path, $basePath) === 0) {
        $path = substr($path, strlen($basePath));
        if ($path === '' || $path === false) {
            $path = '/';
        }
    }

    if (($path !== '/') && substr($path, -1) === '/') {
        $path = rtrim($path, '/');
    }

    if (substr($path, -4) === '.php') {
        $path = substr($path, 0, -4);
        if ($path === '' || $path === false) {
            $path = '/';
        }
    }

    if ($path === '/index') {
        $path = '/';
    }

    if ($path === '') {
        $path = '/';
    }

    if ($path !== '/' && $path[0] !== '/') {
        $path = '/' . ltrim($path, '/');
    }

    return $path;
}

/**
 * Build a canonical URL based on the current request path.
 * @return string
 */
function getCanonicalUrl() {
    $siteUrl = rtrim(SITE_URL, '/');
    $path = normalizePathForUrls(null, true);

    return $siteUrl . $path;
}

/**
 * Build a canonical URL for a known path (used by sitemap).
 * @param string $path
 * @return string
 */
function buildCanonicalUrlFromPath($path) {
    $siteUrl = rtrim(SITE_URL, '/');
    $cleanPath = normalizePathForUrls($path, false);

    return $siteUrl . $cleanPath;
}

function jsonLdScript(array $data) {
    return '<script type="application/ld+json">' . PHP_EOL
        . json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
        . PHP_EOL . '</script>';
}

function buildBreadcrumbSchema(array $items) {
    if (!$items) {
        return '';
    }

    $script = [
        '@context' => 'https://schema.org',
        '@type' => 'BreadcrumbList',
        'itemListElement' => []
    ];

    foreach ($items as $index => $item) {
        if (empty($item['name']) || empty($item['url'])) {
            continue;
        }
        $script['itemListElement'][] = [
            '@type' => 'ListItem',
            'position' => $index + 1,
            'name' => $item['name'],
            'item' => $item['url']
        ];
    }

    if (!$script['itemListElement']) {
        return '';
    }

    return jsonLdScript($script);
}

function buildServiceSchema($type, $name, $description, $url = null, array $offers = null) {
    if (!$name || !$description) {
        return '';
    }

    $script = [
        '@context' => 'https://schema.org',
        '@type' => $type ?: 'Service',
        'name' => $name,
        'description' => $description
    ];

    if ($url) {
        $script['url'] = $url;
    }

    if ($offers) {
        $script['offers'] = $offers;
    }

    return jsonLdScript($script);
}

function buildFaqSchema(array $faqs) {
    if (!$faqs) {
        return '';
    }

    $script = [
        '@context' => 'https://schema.org',
        '@type' => 'FAQPage',
        'mainEntity' => []
    ];

    foreach ($faqs as $faq) {
        if (empty($faq['question']) || empty($faq['answer'])) {
            continue;
        }
        $script['mainEntity'][] = [
            '@type' => 'Question',
            'name' => $faq['question'],
            'acceptedAnswer' => [
                '@type' => 'Answer',
                'text' => $faq['answer']
            ]
        ];
    }

    if (!$script['mainEntity']) {
        return '';
    }

    return jsonLdScript($script);
}
