<?php
// Suppress PHP error/warning output so they never corrupt a JSON response.
// Errors are still logged to the PHP error_log on disk.
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

// --- Output guard against hosting-layer HTML injection ---
// Shared hosts (e.g. InfinityFree) use auto_prepend_file / auto_append_file to
// inject ad HTML into every response, targeting mobile User-Agents.
// Strategy:
//   1. Clean any outer buffers already open (captures content written by
//      auto_prepend_file before this script ran).
//   2. Start our own buffer with a filter callback that strips any HTML/text
//      that appears before the opening { or [ of the JSON response body.
//      This handles cases where the host outputs at buffer level 0 (unfilterable
//      by ob_end_clean alone) or appends HTML after exit.
while (ob_get_level() > 0) {
    ob_end_clean();
}
ob_start(function (string $buf): string {
    // All our API responses are JSON: they must start with { or [
    // Strip anything prepended by the hosting layer before the first { or [
    $trimmed = ltrim($buf);
    if ($trimmed === '') return '';

    if ($trimmed[0] !== '{' && $trimmed[0] !== '[') {
        $posObj = strpos($trimmed, '{');
        $posArr = strpos($trimmed, '[');
        $candidates = [];
        if ($posObj !== false) $candidates[] = $posObj;
        if ($posArr !== false) $candidates[] = $posArr;
        if (empty($candidates)) return $buf;   // no JSON at all — pass raw through
        $trimmed = substr($trimmed, min($candidates));
    }

    // Fast path: buffer is already clean JSON (most requests in production)
    if (json_decode($trimmed) !== null || json_last_error() === JSON_ERROR_NONE) {
        return $trimmed;
    }

    // Hosting layer appended junk after the JSON (ad <script>/<style> tags, etc.).
    // Walk backwards through every occurrence of the closing brace/bracket until
    // json_decode accepts the candidate. This is reliable even when the injected
    // HTML itself contains } or ] characters (common in inline CSS/JS).
    $closer = ($trimmed[0] === '{') ? '}' : ']';
    $search = $trimmed;
    $pos    = strrpos($search, $closer);
    while ($pos !== false && $pos > 0) {
        $candidate = substr($trimmed, 0, $pos + 1);
        if (json_decode($candidate) !== null || json_last_error() === JSON_ERROR_NONE) {
            return $candidate;
        }
        $search = substr($trimmed, 0, $pos);
        $pos    = strrpos($search, $closer);
    }

    return $trimmed; // fallback: return whatever we have
});

require_once __DIR__ . '/env.php';

// Allowed origins — configured in .env (CORS_ORIGINS, comma-separated)
// Falls back to the three known dev/prod origins if not set.
$_envOrigins = $_ENV['CORS_ORIGINS'] ?? 'http://localhost:5173,http://localhost:3000,https://familycarehospital.ct.ws';
$allowedOrigins = array_map('trim', explode(',', $_envOrigins));

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin === '') {
    // Same-origin request (production, no Origin header) — allow silently
} elseif (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
