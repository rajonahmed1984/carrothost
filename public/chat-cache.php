<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$cacheFile = 'chatbot-cache.json';

// Handle POST - Save QA pair
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['query']) && isset($input['response'])) {
        $query = trim(strtolower($input['query']));
        $response = trim($input['response']);
        
        if (!empty($query) && !empty($response)) {
            // Load existing cache
            $cache = [];
            if (file_exists($cacheFile)) {
                $cache = json_decode(file_get_contents($cacheFile), true) ?: [];
            }
            
            // Limit cache size to 500 entries to prevent server file bloat
            if (count($cache) > 500) {
                array_shift($cache); // remove oldest
            }
            $cache[$query] = $response;
            
            file_put_contents($cacheFile, json_encode($cache, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            echo json_encode(["status" => "success"]);
            exit;
        }
    }
    echo json_encode(["status" => "error", "message" => "Invalid input"]);
    exit;
}

// Handle GET - Retrieve cache
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($cacheFile)) {
        echo file_get_contents($cacheFile);
    } else {
        echo json_encode(new stdClass());
    }
    exit;
}
