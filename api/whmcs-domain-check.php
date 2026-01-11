<?php
/**
 * WHMCS Domain Availability Proxy
 * Checks domain availability via WHMCS API.
 */

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

if (!WHMCS_API_IDENTIFIER || !WHMCS_API_SECRET) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'WHMCS API credentials are missing.'
    ]);
    exit;
}

$domain = isset($_GET['domain']) ? strtolower(trim($_GET['domain'])) : '';
$domain = preg_replace('/^https?:\\/\\//', '', $domain);
$domain = preg_replace('/\\/.*$/', '', $domain);

if ($domain === '' || strpos($domain, '.') === false || !preg_match('/^[a-z0-9.-]{3,253}$/', $domain)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid domain.'
    ]);
    exit;
}

$apiUrl = rtrim(WHMCS_URL, '/') . '/includes/api.php';
$postFields = [
    'identifier' => WHMCS_API_IDENTIFIER,
    'secret' => WHMCS_API_SECRET,
    'action' => 'DomainWhois',
    'domain' => $domain,
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
        'error' => $data['message'] ?? 'Invalid response from WHMCS API.'
    ]);
    exit;
}

$available = null;
$statusText = '';

if (isset($data['available'])) {
    if (is_bool($data['available'])) {
        $available = $data['available'];
    } elseif (is_numeric($data['available'])) {
        $available = ((int)$data['available']) === 1;
    } else {
        $available = filter_var($data['available'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }
}

if (isset($data['status'])) {
    $statusText = strtolower((string)$data['status']);
    if ($available === null) {
        $available = $statusText === 'available';
    }
}

if ($available === null) {
    $available = false;
}

echo json_encode([
    'success' => true,
    'domain' => $domain,
    'available' => $available,
    'status' => $available ? 'available' : 'unavailable'
]);
