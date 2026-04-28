<?php
/**
 * POST /api/biometric/trigger.php
 * Admin-only. Runs bio_sync.py immediately and returns the output.
 */

require_once __DIR__ . '/../../config/cors.php';
session_start();

// Read required session data then immediately release the session lock.
// Without this, any other open requests holding the same session (e.g. SSE)
// would block this script until they finish.
$sessionUserId = $_SESSION['user_id'] ?? null;
$sessionRole   = $_SESSION['role']    ?? '';
session_write_close();

if (empty($sessionUserId) || $sessionRole !== 'admin') {
    http_response_code(403);
    while (ob_get_level()) ob_end_clean();
    echo json_encode(['error' => 'Admin access required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    while (ob_get_level()) ob_end_clean();
    echo json_encode(['error' => 'POST required']);
    exit;
}

$pythonExe  = 'C:\\Python314\\python.exe';
$scriptPath = realpath(__DIR__ . '/../../sync/bio_sync.py');

if (!$scriptPath || !file_exists($scriptPath)) {
    http_response_code(500);
    while (ob_get_level()) ob_end_clean();
    echo json_encode(['error' => 'bio_sync.py not found']);
    exit;
}

try {
    set_time_limit(120);

    $cmd         = 'cmd /c ""' . $pythonExe . '" -X utf8 "' . $scriptPath . '" 2>&1"';
    $outputLines = [];
    $exitCode    = -1;

    exec($cmd, $outputLines, $exitCode);

    $output = implode("\n", $outputLines);

    while (ob_get_level()) ob_end_clean();
    $json = json_encode([
        'success'   => $exitCode === 0,
        'exit_code' => $exitCode,
        'output'    => $output ?: '(no output captured)',
    ], JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    echo $json !== false ? $json : json_encode(['success' => $exitCode === 0, 'exit_code' => $exitCode, 'output' => '(output contained invalid characters)']);

} catch (Throwable $e) {
    while (ob_get_level()) ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
