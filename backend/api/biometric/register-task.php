<?php
/**
 * GET  /api/biometric/register-task.php  — query FCH-Bio-Sync task status
 * POST /api/biometric/register-task.php  — register/update the scheduled task
 *
 * Admin-only. Uses schtasks.exe to create a Windows Task Scheduler entry that
 * runs bio_sync.py every N minutes as SYSTEM — so syncing works even when
 * no browser is open.
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
session_start();
$_uid  = $_SESSION['user_id'] ?? null;
$_role = $_SESSION['role']    ?? '';
session_write_close();

if (empty($_uid) || $_role !== 'admin') {
    http_response_code(403);
    while (ob_get_level()) ob_end_clean();
    echo json_encode(['error' => 'Admin access required']);
    exit;
}

// ── Constants ─────────────────────────────────────────────────────────────────
define('TASK_NAME',   'FCH-Bio-Sync');
define('PYTHON_EXE',  'C:\\Python314\\python.exe');
define('SCRIPT_PATH', 'C:\\xampp\\htdocs\\backend\\sync\\bio_sync.py');

/**
 * Query Windows Task Scheduler for the FCH-Bio-Sync task.
 * Returns an array with 'registered' bool plus detail fields.
 */
function queryTask(): array {
    $output   = [];
    $exitCode = -1;
    exec('schtasks /Query /TN "' . TASK_NAME . '" /FO LIST 2>&1', $output, $exitCode);

    if ($exitCode !== 0) {
        return ['registered' => false];
    }

    $flat    = implode("\n", $output);
    $status  = '';
    $nextRun = '';
    $lastRun = '';

    if (preg_match('/Status:\s*(.+)/i', $flat, $m))        $status  = trim($m[1]);
    if (preg_match('/Next Run Time:\s*(.+)/i', $flat, $m)) $nextRun = trim($m[1]);
    if (preg_match('/Last Run Time:\s*(.+)/i', $flat, $m)) $lastRun = trim($m[1]);

    return [
        'registered' => true,
        'status'     => $status,
        'next_run'   => $nextRun,
        'last_run'   => $lastRun,
    ];
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET — return task status ───────────────────────────────────────────────────
if ($method === 'GET') {
    while (ob_get_level()) ob_end_clean();
    echo json_encode(queryTask());
    exit;
}

// ── POST — register / update the task ─────────────────────────────────────────
if ($method === 'POST') {
    $pdo = getDB();

    // Read sync interval from DB (default 2 min)
    $row         = $pdo->query("SELECT setting_value FROM fch_bio_settings WHERE setting_key='sync_interval_minutes' LIMIT 1")->fetchColumn();
    $intervalMin = max(1, (int)($row ?: 2));

    // Delete existing task (ignore error if not found)
    exec('schtasks /Delete /TN "' . TASK_NAME . '" /F 2>&1');

    // Build the task command — properly quoted for schtasks /TR
    // schtasks expects the /TR value itself quoted, with inner quotes escaped via backslash
    $tr  = '\\"' . PYTHON_EXE . '\\" \\"' . SCRIPT_PATH . '\\"';
    $cmd = 'schtasks /Create'
         . ' /TN "'  . TASK_NAME . '"'
         . ' /TR "'  . $tr . '"'
         . ' /SC MINUTE /MO ' . $intervalMin
         . ' /RU SYSTEM /RL HIGHEST /F 2>&1';

    $output   = [];
    $exitCode = -1;
    exec($cmd, $output, $exitCode);

    if ($exitCode !== 0) {
        while (ob_get_level()) ob_end_clean();
        http_response_code(500);
        echo json_encode([
            'error'  => 'Registration failed. The web server process may not have Administrator privileges. Run register-bio-sync-task.ps1 manually as Administrator instead.',
            'detail' => implode("\n", $output),
        ]);
        exit;
    }

    // Kick off an immediate first run
    exec('schtasks /Run /TN "' . TASK_NAME . '" 2>&1');

    while (ob_get_level()) ob_end_clean();
    echo json_encode([
        'success'      => true,
        'interval_min' => $intervalMin,
        'task'         => queryTask(),
    ]);
    exit;
}

http_response_code(405);
while (ob_get_level()) ob_end_clean();
echo json_encode(['error' => 'Method not allowed']);
