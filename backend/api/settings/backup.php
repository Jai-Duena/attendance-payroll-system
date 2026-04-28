<?php
ini_set('display_errors', '0');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Only admins can download backups
$role = $_SESSION['role'] ?? 'employee';
if (!in_array($role, ['admin', 'management'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden — admin access required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Generate SQL dump via PDO ─────────────────────────────────────────────────
try {
    $pdo = getDB();

    $dbName   = DB_NAME;
    $filename = $dbName . '_backup_' . date('Y-m-d_H-i-s') . '.sql';

    // Stream the file directly — avoids holding the whole dump in RAM
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: no-cache');

    // Turn off output buffering
    while (ob_get_level()) ob_end_clean();

    $out = fopen('php://output', 'w');

    fwrite($out, "-- ============================================================\n");
    fwrite($out, "-- Database backup: {$dbName}\n");
    fwrite($out, "-- Generated: " . date('Y-m-d H:i:s') . "\n");
    fwrite($out, "-- ============================================================\n\n");
    fwrite($out, "SET FOREIGN_KEY_CHECKS = 0;\n");
    fwrite($out, "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n");
    fwrite($out, "SET NAMES utf8mb4;\n\n");

    // Get all table names
    $tables = $pdo->query("SHOW FULL TABLES FROM `{$dbName}` WHERE Table_type = 'BASE TABLE'")->fetchAll(PDO::FETCH_NUM);

    foreach ($tables as [$table]) {
        fwrite($out, "-- ── Table: `{$table}` ─────────────────────────────────────\n");

        // DROP + CREATE DDL
        $ddlRow = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(PDO::FETCH_NUM);
        fwrite($out, "DROP TABLE IF EXISTS `{$table}`;\n");
        fwrite($out, $ddlRow[1] . ";\n\n");

        // Row data in batches of 500
        $countRow = $pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
        if ($countRow > 0) {
            $batchSize = 500;
            $offset    = 0;

            while ($offset < $countRow) {
                $rows = $pdo->query("SELECT * FROM `{$table}` LIMIT {$batchSize} OFFSET {$offset}")->fetchAll(PDO::FETCH_NUM);
                if (empty($rows)) break;

                // Get column names
                $cols = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = '{$dbName}' AND TABLE_NAME = '{$table}'
                    ORDER BY ORDINAL_POSITION")->fetchAll(PDO::FETCH_COLUMN);
                $colList = implode(', ', array_map(fn($c) => "`{$c}`", $cols));

                $valueGroups = [];
                foreach ($rows as $row) {
                    $vals = array_map(function ($v) use ($pdo) {
                        if ($v === null) return 'NULL';
                        return "'" . addslashes($v) . "'";
                    }, $row);
                    $valueGroups[] = '(' . implode(', ', $vals) . ')';
                }

                fwrite($out, "INSERT INTO `{$table}` ({$colList}) VALUES\n");
                fwrite($out, implode(",\n", $valueGroups) . ";\n");

                $offset += $batchSize;
            }
        }
        fwrite($out, "\n");
    }

    fwrite($out, "SET FOREIGN_KEY_CHECKS = 1;\n");
    fwrite($out, "-- ── End of backup ───────────────────────────────────────────\n");
    fclose($out);
    exit;

} catch (Exception $e) {
    error_log('[fch-backup] ' . $e->getMessage());
    // If headers not sent yet, return JSON error
    if (!headers_sent()) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Backup failed']);
    }
    exit;
}
