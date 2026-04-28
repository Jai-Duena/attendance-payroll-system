<?php
/**
 * GET  /api/biometric/settings.php         — fetch all settings
 * PUT  /api/biometric/settings.php         — update settings (JSON body)
 * GET  /api/biometric/settings.php?action=users  — list fch_bio_users with employee info
 * PUT  /api/biometric/settings.php?action=map    — set employee_id for a bio user
 *
 * Admin-only.
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

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {

    // List bio users with mapping info
    if ($action === 'users') {
        $rows = $pdo->query(
            "SELECT bu.id, bu.uid, bu.device_user_id, bu.name, bu.privilege,
                    bu.card, bu.employee_id, bu.last_synced_at,
                    e.emp_fullname
             FROM fch_bio_users bu
             LEFT JOIN fch_employees e ON e.employee_id = bu.employee_id
             ORDER BY bu.uid ASC"
        )->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['data' => $rows]);
        exit;
    }

    // Default: return all settings as key→value map
    $rows = $pdo->query(
        "SELECT setting_key, setting_value FROM fch_bio_settings"
    )->fetchAll(PDO::FETCH_KEY_PAIR);

    echo json_encode(['settings' => $rows]);
    exit;
}

// ── PUT ───────────────────────────────────────────────────────────────────────
if ($method === 'PUT' || $method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    // Map a bio user to an employee
    if ($action === 'map') {
        $bioUserId  = (int)($body['bio_user_id'] ?? 0);
        $employeeId = isset($body['employee_id']) && $body['employee_id'] !== ''
                      ? (int)$body['employee_id']
                      : null;

        if (!$bioUserId) {
            http_response_code(400);
            echo json_encode(['error' => 'bio_user_id is required']);
            exit;
        }

        $pdo->prepare(
            "UPDATE fch_bio_users SET employee_id = ? WHERE id = ?"
        )->execute([$employeeId, $bioUserId]);

        // Backfill any punches that were inserted before this mapping existed
        if ($employeeId !== null) {
            $devUser = $pdo->prepare(
                "SELECT device_user_id FROM fch_bio_users WHERE id = ?"
            );
            $devUser->execute([$bioUserId]);
            $deviceUserId = $devUser->fetchColumn();

            if ($deviceUserId !== false) {
                $pdo->prepare(
                    "UPDATE fch_punches SET employee_id = ? WHERE device_user_id = ? AND employee_id IS NULL"
                )->execute([$employeeId, $deviceUserId]);
            }
        }

        echo json_encode(['success' => true]);
        exit;
    }

    // Update device settings
    $allowed = ['device_ip', 'device_port', 'device_timeout', 'sync_interval_minutes', 'chain_web_sync'];
    $stmt    = $pdo->prepare(
        "INSERT INTO fch_bio_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
    );

    foreach ($allowed as $key) {
        if (array_key_exists($key, $body)) {
            $val = trim((string)($body[$key] ?? ''));

            // Basic validation
            if ($key === 'device_ip'   && !filter_var($val, FILTER_VALIDATE_IP)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid IP address']);
                exit;
            }
            if (in_array($key, ['device_port', 'device_timeout', 'sync_interval_minutes'], true)) {
                $int = (int)$val;
                if ($int <= 0) {
                    http_response_code(400);
                    echo json_encode(['error' => "$key must be a positive integer"]);
                    exit;
                }
                $val = (string)$int;
            }
            if ($key === 'chain_web_sync') {
                $val = $val === '1' || $val === 'true' ? '1' : '0';
            }

            $stmt->execute([$key, $val]);
        }
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
