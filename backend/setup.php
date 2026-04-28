<?php
/**
 * ============================================================
 * family_care — Auto Database Setup
 * ============================================================
 * Automatically creates the database and all tables in the
 * correct order. Safe to re-run — uses IF NOT EXISTS.
 *
 * Usage (browser or cURL after deploying to hosting):
 *   https://yourdomain.com/backend/setup.php
 *   https://yourdomain.com/backend/setup.php?seed=true
 *
 * IMPORTANT: Delete or restrict this file after first run!
 * ============================================================
 */

// ── Security: simple token check (optional but recommended) ─
// Uncomment and set a token to protect this endpoint:
// define('SETUP_TOKEN', 'change-me-before-deploying');
// if (!isset($_GET['token']) || $_GET['token'] !== SETUP_TOKEN) {
//     http_response_code(403);
//     die(json_encode(['error' => 'Forbidden']));
// }

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ── Load DB constants ────────────────────────────────────────
require_once __DIR__ . '/config/db.php';

// ── Connect DIRECTLY to the existing database ────────────────
// InfinityFree pre-creates the database — we cannot CREATE DATABASE
try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Cannot connect to MySQL: ' . $e->getMessage()]);
    exit;
}

// ── SQL files in correct creation order ─────────────────────
$sqlFiles = [
    'fch_date_settings.sql',
    'fch_rate_multipliers.sql',
    'fch_holidays.sql',
    'fch_reg_holiday.sql',
    'fch_special_holiday.sql',
    'fch_sss_contributions.sql',
    'fch_pagibig_contributions.sql',
    'fch_philhealth_contributions.sql',
    'fch_withholding_tax_table.sql',
    'fch_tax_deduction.sql',
    'fch_employees.sql',
    'fch_employees_shift.sql',
    'att_punches.sql',
    'fch_attendance.sql',
    'fch_attendance_summary.sql',
    'fch_reg_hrs.sql',
    'fch_late.sql',
    'fch_ot.sql',
    'fch_nd.sql',
    'fch_restday.sql',
    'fch_deductions_computation.sql',
    'fch_earnings_computation.sql',
    'fch_payroll_results.sql',
    'fch_payroll_summary.sql',
    'fch_requests.sql',
    'fch_bulletin_board.sql',
    'fch_user_notes.sql',
];

$results  = [];
$hasError = false;

// ── Helper: run a SQL file ───────────────────────────────────
function runSqlFile(PDO $pdo, string $path, string $label, array &$results, bool &$hasError): void
{
    if (!file_exists($path)) {
        $results[] = ['file' => $label, 'status' => 'skipped', 'message' => 'File not found'];
        return;
    }

    $sql = file_get_contents($path);
    $sql = preg_replace('/\/\*![\s\S]*?\*\//', '', $sql);

    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        fn($s) => !empty($s) && !preg_match('/^\s*(--|#)/', $s)
    );

    foreach ($statements as $statement) {
        if (empty(trim($statement))) continue;
        try {
            $pdo->exec($statement);
        } catch (PDOException $e) {
            if (in_array($e->getCode(), ['42S01', '42000', '23000'])) continue;
            $results[] = [
                'file'    => $label,
                'status'  => 'error',
                'code'    => $e->getCode(),
                'message' => $e->getMessage(),
                'query'   => substr(trim($statement), 0, 120),
            ];
            $hasError = true;
            return;
        }
    }

    $results[] = ['file' => $label, 'status' => 'success'];
}

// ── Run all SQL table files ──────────────────────────────────
foreach ($sqlFiles as $file) {
    runSqlFile($pdo, __DIR__ . '/sql/' . $file, $file, $results, $hasError);
}

// ── Run setup.sql (chat table + bulletin board alterations) ──
runSqlFile($pdo, __DIR__ . '/setup.sql', 'setup.sql', $results, $hasError);
runSqlFile($pdo, __DIR__ . '/sql/indexes.sql', 'indexes.sql', $results, $hasError);

// ── Optionally seed data ─────────────────────────────────────
if (isset($_GET['seed']) && $_GET['seed'] === 'true') {
    $seedPath = __DIR__ . '/seed.php';
    if (file_exists($seedPath)) {
        try {
            include $seedPath;
            $results[] = ['file' => 'seed.php', 'status' => 'success'];
        } catch (Throwable $e) {
            $results[] = ['file' => 'seed.php', 'status' => 'error', 'message' => $e->getMessage()];
            $hasError = true;
        }
    } else {
        $results[] = ['file' => 'seed.php', 'status' => 'skipped', 'message' => 'seed.php not found'];
    }
}

// ── Summary ──────────────────────────────────────────────────
$successCount = count(array_filter($results, fn($r) => $r['status'] === 'success'));
$errorCount   = count(array_filter($results, fn($r) => $r['status'] === 'error'));
$skippedCount = count(array_filter($results, fn($r) => $r['status'] === 'skipped'));

http_response_code($hasError ? 500 : 200);
echo json_encode([
    'success'  => !$hasError,
    'database' => DB_NAME,
    'message'  => $hasError
        ? "Setup completed with {$errorCount} error(s)."
        : "Database set up successfully! ({$successCount} files run, {$skippedCount} skipped)",
    'summary'  => [
        'success' => $successCount,
        'errors'  => $errorCount,
        'skipped' => $skippedCount,
    ],
    'results'  => $results,
], JSON_PRETTY_PRINT);
