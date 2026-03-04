<?php
// Proxy API to backend Node.js server
$target = "http://127.0.0.1:5000" . $_SERVER["REQUEST_URI"];
$method = $_SERVER["REQUEST_METHOD"];

// CORS preflight handling
if ($method === 'OPTIONS') {
    http_response_code(204);
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    exit;
}

// Prepare headers
$headers = [];
$incomingHeaders = function_exists('getallheaders') ? getallheaders() : [];
foreach ($incomingHeaders as $k => $v) {
    if (!in_array(strtolower($k), ["host", "connection"])) {
        $headers[] = $k . ": " . $v;
    }
}

// Ensure Authorization header is forwarded (Apache/PHP may drop it)
if (!array_key_exists('Authorization', $incomingHeaders)) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
    if ($auth) {
        $headers[] = "Authorization: " . $auth;
    }
}

// Prepare request body
$body = null;
if ($method !== "GET" && $method !== "HEAD") {
    $body = file_get_contents("php://input");
}

// Use curl if available
if (function_exists("curl_init")) {
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $target,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30
    ]);

    if ($body !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    }

    $response = curl_exec($curl);
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $content_type = curl_getinfo($curl, CURLINFO_CONTENT_TYPE);

    if ($response === false) {
        http_response_code(502);
        echo json_encode(["error" => "Backend unavailable: " . curl_error($curl)]);
        curl_close($curl);
        exit;
    }
    curl_close($curl);
} else {
    // Fallback to file_get_contents if curl not available
    $opts = [
        "http" => [
            "method" => $method,
            "header" => implode("\r\n", $headers),
            "timeout" => 30
        ]
    ];

    if ($body !== null) {
        $opts["http"]["content"] = $body;
    }

    $response = @file_get_contents($target, false, stream_context_create($opts));
    if ($response === false) {
        http_response_code(502);
        echo json_encode(["error" => "Backend unavailable"]);
        exit;
    }
    $http_code = 200;
    $content_type = "application/json";
}

// Send response
http_response_code($http_code);
header("Content-Type: " . ($content_type ?: "application/json"));
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

echo $response;
?>
