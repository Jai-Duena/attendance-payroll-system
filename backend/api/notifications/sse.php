<?php
/**
 * Server-Sent Events endpoint for real-time notifications.
 * Client connects with ?last_id=N; server loops and pushes any
 * fch_notifications rows with id > last_id as they appear.
 *
 * The connection is closed after ~55 s to prevent resource buildup.
 * The browser's EventSource API auto-reconnects, passing the updated last_id
 * back via ?last_id= on reconnect.
 */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/helper.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo "event: error\ndata: unauthenticated\n\n";
    exit;
}

$userId = (int)$_SESSION['user_id'];
$lastId = (int)($_GET['last_id'] ?? 0);

// Release session file lock so other requests aren't blocked during the long-poll
session_write_close();

$pdo = getDB();
_ensureNotifTable($pdo);

// ── SSE headers ──────────────────────────────────────────────────────────────
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');   // disable nginx / Apache mod_proxy buffering

if (ob_get_level()) ob_end_clean();
set_time_limit(0);
ignore_user_abort(false);

// ── Helpers ──────────────────────────────────────────────────────────────────
function sseEvent(string $event, $data): void {
    echo "event: {$event}\n";
    echo "data: " . json_encode($data) . "\n\n";
    if (ob_get_level()) ob_flush();
    flush();
}

// ── Initial state: send current unread count so the badge is correct on connect
$unreadStmt = $pdo->prepare("SELECT COUNT(*) FROM fch_notifications WHERE employee_id = ? AND is_read = 0");
$unreadStmt->execute([$userId]);
$unread = (int)$unreadStmt->fetchColumn();

// Also get the latest id so we know where to start streaming from
$latestStmt = $pdo->prepare("SELECT COALESCE(MAX(id), 0) FROM fch_notifications WHERE employee_id = ?");
$latestStmt->execute([$userId]);
$dbMax = (int)$latestStmt->fetchColumn();

// If client passes last_id=0 (first connect), start from the current max so we
// don't replay history — only future notifications will be streamed.
if ($lastId === 0) {
    $lastId = $dbMax;
}

sseEvent('init', ['unread' => $unread, 'last_id' => $lastId]);

// ── Poll loop ────────────────────────────────────────────────────────────────
$pollInterval = 3;  // seconds between DB checks
$maxDuration  = 55; // server closes after this many seconds; EventSource reconnects
$startTime    = time();

while (true) {
    if (connection_aborted()) break;

    if ((time() - $startTime) >= $maxDuration) {
        // Tell the client the last_id to resume from on reconnect
        sseEvent('reconnect', ['last_id' => $lastId]);
        break;
    }

    // Fetch new notifications
    $stmt = $pdo->prepare(
        "SELECT id, type, title, message, reference_id, is_read, created_at
         FROM fch_notifications
         WHERE employee_id = ? AND id > ?
         ORDER BY id ASC
         LIMIT 20"
    );
    $stmt->execute([$userId, $lastId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($rows)) {
        foreach ($rows as $row) {
            if ((int)$row['id'] > $lastId) {
                $lastId = (int)$row['id'];
            }
        }
        sseEvent('notification', ['notifications' => $rows, 'last_id' => $lastId]);
    } else {
        // Keep-alive heartbeat
        sseEvent('ping', time());
    }

    sleep($pollInterval);
}
