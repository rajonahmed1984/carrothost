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

// Brand Colors
define('PRIMARY_COLOR', '#f16922'); // Orange - CTA buttons, pricing highlights
define('SECONDARY_COLOR', '#009247'); // Green - Trust badges, headings accents

// WHMCS Configuration
define('WHMCS_URL', 'https://portal.carrothost.com');
define('WHMCS_CART_URL', WHMCS_URL . '/cart.php');
define('WHMCS_CLIENT_AREA', WHMCS_URL . '/clientarea.php');
define('WHMCS_DOMAIN_REGISTER', WHMCS_URL . '/cart.php?a=add&domain=register');
define('WHMCS_DOMAIN_TRANSFER', WHMCS_URL . '/cart.php?a=add&domain=transfer');
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
