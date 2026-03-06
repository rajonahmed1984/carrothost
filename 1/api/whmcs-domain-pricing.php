<?php
/**
 * WHMCS Domain Pricing Proxy
 * Fetches TLD pricing from WHMCS and returns a trimmed JSON payload.
 */

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');

if (!WHMCS_API_IDENTIFIER || !WHMCS_API_SECRET || !WHMCS_API_URL) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'ok' => false,
        'error' => 'Service temporarily unavailable.'
    ]);
    exit;
}

$tldsParam = isset($_GET['tlds']) ? trim($_GET['tlds']) : '';
$typesParam = isset($_GET['types']) ? trim($_GET['types']) : '';

$tlds = [];
if ($tldsParam !== '') {
    foreach (explode(',', $tldsParam) as $tld) {
        $clean = '.' . ltrim(strtolower(trim($tld)), '.');
        if ($clean !== '.' && $clean !== '') {
            $tlds[$clean] = true;
        }
    }
}

$types = [];
if ($typesParam !== '') {
    foreach (explode(',', $typesParam) as $type) {
        $clean = strtolower(trim($type));
        if ($clean !== '') {
            $types[$clean] = true;
        }
    }
}
if (!$types) {
    $types = ['register' => true];
}

$apiUrl = WHMCS_API_URL;
$postFields = [
    'identifier' => WHMCS_API_IDENTIFIER,
    'secret' => WHMCS_API_SECRET,
    'action' => 'GetTLDPricing',
    'responsetype' => 'json'
];

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
if ($response === false) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'ok' => false,
        'error' => 'WHMCS API request failed.'
    ]);
    curl_close($ch);
    exit;
}

$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);
if ($status >= 400 || !is_array($data) || ($data['result'] ?? '') !== 'success') {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'ok' => false,
        'error' => $data['message'] ?? 'Invalid response from WHMCS API.'
    ]);
    exit;
}

$pricing = [];
$rawPricing = $data['pricing'] ?? [];

foreach ($rawPricing as $tld => $details) {
    $tldKey = '.' . ltrim(strtolower($tld), '.');

    if ($tlds && !isset($tlds[$tldKey])) {
        continue;
    }

    foreach ($types as $type => $_) {
        $yearPrice = $details[$type]['1'] ?? null;
        if ($yearPrice === null) {
            continue;
        }
        $pricing[$tldKey][$type] = (float)$yearPrice;
    }
}

echo json_encode([
    'success' => true,
    'ok' => true,
    'currency' => $data['currency'] ?? null,
    'pricing' => $pricing
]);
