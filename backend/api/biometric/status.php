<?php
/**
 * GET /api/biometric/status.php
 * Admin-only. Returns biometric sync monitoring data:
 *   - last_sync:      most recent fch_bio_sync_log row
 *   - recent_logs:    last 20 log rows
 *   - stats:          totals for punches, bio users, unmapped users
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

try {
$pdo = getDB();

// ── Last sync entry ───────────────────────────────────────────────────────────
$lastSync = $pdo->query(
    "SELECT id, status, message, users_synced, punches_synced, created_at
     FROM fch_bio_sync_log
     ORDER BY id DESC LIMIT 1"
)->fetch(PDO::FETCH_ASSOC);

// ── Recent logs ───────────────────────────────────────────────────────────────
$recentLogs = $pdo->query(
    "SELECT id, status, message, users_synced, punches_synced, created_at
     FROM fch_bio_sync_log
     ORDER BY id DESC LIMIT 20"
)->fetchAll(PDO::FETCH_ASSOC);

// ── Stats ─────────────────────────────────────────────────────────────────────
$totalPunches   = (int)$pdo->query("SELECT COUNT(*) FROM fch_punches")->fetchColumn();
$totalBioUsers  = (int)$pdo->query("SELECT COUNT(*) FROM fch_bio_users")->fetchColumn();
$unmappedUsers  = (int)$pdo->query(
    "SELECT COUNT(*) FROM fch_bio_users WHERE employee_id IS NULL"
)->fetchColumn();

// ── Device settings (for display) ─────────────────────────────────────────────
$settingsRows = $pdo->query(
    "SELECT setting_key, setting_value FROM fch_bio_settings"
)->fetchAll(PDO::FETCH_KEY_PAIR);

echo json_encode([
    'last_sync'     => $lastSync ?: null,
    'recent_logs'   => $recentLogs,
    'stats' => [
        'total_punches'  => $totalPunches,
        'total_bio_users'=> $totalBioUsers,
        'unmapped_users' => $unmappedUsers,
    ],
    'settings'      => $settingsRows,
]);

} catch (Throwable $e) {
    while (ob_get_level()) ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
