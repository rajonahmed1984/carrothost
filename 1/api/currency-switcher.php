<?php
/**
 * Currency Switcher API
 * Handles currency switching between BDT and USD
 */

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['currency'])) {
        $currency = strtoupper($input['currency']);
        
        if ($currency === 'BDT' || $currency === 'USD') {
            $_SESSION['currency'] = $currency;
            
            echo json_encode([
                'success' => true,
                'currency' => $currency,
                'symbol' => $currency === 'BDT' ? CURRENCY_SYMBOL_BDT : CURRENCY_SYMBOL_USD
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid currency'
            ]);
        }
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Currency parameter missing'
        ]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Return current currency
    echo json_encode([
        'success' => true,
        'currency' => $_SESSION['currency'] ?? DEFAULT_CURRENCY,
        'symbol' => ($_SESSION['currency'] ?? DEFAULT_CURRENCY) === 'BDT' ? CURRENCY_SYMBOL_BDT : CURRENCY_SYMBOL_USD
    ]);
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
}
