<?php
/**
 * Sync Trigger
 * ------------
 * Called by the local zkteco-sync.php via HTTP GET after FTP upload.
 * Reads punches.sql from this directory, imports rows into InfinityFree
 * MySQL via db.php, then deletes the file.
 *
 * URL: https://familycarehospital.ct.ws/backend/sync/trigger.php?key=FCHsync2026xK9mP
 */

define('SYNC_KEY', 'FCHsync2026xK9mP');
define('SQL_FILE', __DIR__ . '/punches.sql');

header('Content-Type: text/plain; charset=utf-8');

// ── Auth ─────────────────────────────────────────────────────
if (($_GET['key'] ?? '') !== SYNC_KEY) {
    http_response_code(403);
    echo "Forbidden.";
    exit;
}

// ── Nothing pending? ─────────────────────────────────────────
if (!file_exists(SQL_FILE)) {
    echo "OK: no pending sync file.";
    exit;
}

// ── Read SQL file ─────────────────────────────────────────────
$sql = file_get_contents(SQL_FILE);
if (empty(trim($sql))) {
    @unlink(SQL_FILE);
    echo "OK: empty file cleaned up.";
    exit;
}

// ── Connect ──────────────────────────────────────────────────
try {
    require_once __DIR__ . '/../config/db.php';
    $pdo = getDB();
} catch (Throwable $e) {
    @unlink(SQL_FILE);   // remove file so it doesn't block future syncs
    echo "ERROR (db connect): " . $e->getMessage();
    exit;
}

// ── Execute each INSERT ───────────────────────────────────────
$inserted = 0;
$skipped  = 0;
$errors   = 0;

foreach (array_filter(array_map('trim', explode("\n", $sql))) as $stmt) {
    if (empty($stmt)) continue;
    try {
        $affected = $pdo->exec($stmt);
        if ($affected > 0) $inserted++;
        else               $skipped++;   // INSERT IGNORE skipped duplicate
    } catch (PDOException $e) {
        $errors++;
        error_log('[fch-sync] ' . $e->getMessage() . ' | SQL: ' . substr($stmt, 0, 120));
    }
}

// ── Delete processed file ─────────────────────────────────────
@unlink(SQL_FILE);

echo "OK: inserted=$inserted skipped=$skipped errors=$errors";
