<?php
/**
 * ZKTeco Attendance Receiver
 * --------------------------
 * Lives on your free web host. Accepts attendance records pushed
 * by zkteco-pull.php running on the local LAN PC, and saves them
 * into att_punches.
 *
 * Security: shared secret key checked on every request.
 * Set the same value here AND in zkteco-pull.php → RECEIVER_KEY.
 */
define('RECEIVER_KEY', 'fch-zkteco-2026');  // must match zkteco-sync.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

header('Content-Type: application/json');

// ── Accept JSON POST only ─────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);

if (!$body || !isset($body['key'], $body['records'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid payload']);
    exit;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
if (!hash_equals(RECEIVER_KEY, $body['key'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$records = $body['records'];
if (!is_array($records) || empty($records)) {
    echo json_encode(['success' => true, 'inserted' => 0, 'message' => 'No records']);
    exit;
}

$pdo = getDB();

// ── Insert records ────────────────────────────────────────────────────────────
$inserted = 0;
$skipped  = 0;

$checkStmt = $pdo->prepare("
    SELECT COUNT(*) FROM att_punches
    WHERE employee_id = ? AND punch_time = ?
");

$insertStmt = $pdo->prepare("
    INSERT INTO att_punches
        (employee_id, punch_time, workstate, verifycode, workcode, punch_type, terminal_id, processed)
    VALUES
        (?, ?, ?, ?, ?, 'device', 'zkteco', 0)
");

$empCache = [];

foreach ($records as $rec) {
    $pin = (int)($rec['pin'] ?? 0);
    $time = $rec['time'] ?? '';

    if ($pin === 0 || !$time) { $skipped++; continue; }

    // Validate employee (cache to avoid repeated queries)
    if (!isset($empCache[$pin])) {
        $empStmt = $pdo->prepare("SELECT employee_id FROM fch_employees WHERE employee_id = ? LIMIT 1");
        $empStmt->execute([$pin]);
        $empCache[$pin] = $empStmt->fetchColumn() ?: false;
    }

    if ($empCache[$pin] === false) { $skipped++; continue; }

    // Deduplicate
    $checkStmt->execute([$pin, $time]);
    if ($checkStmt->fetchColumn() > 0) { $skipped++; continue; }

    $insertStmt->execute([
        $pin,
        $time,
        (int)($rec['status']   ?? 0),
        (int)($rec['verify']   ?? 0),
        (int)($rec['worktype'] ?? 0),
    ]);
    $inserted++;
}

echo json_encode([
    'success'  => true,
    'inserted' => $inserted,
    'skipped'  => $skipped,
]);
exit;
