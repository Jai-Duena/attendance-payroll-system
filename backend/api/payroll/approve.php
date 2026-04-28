<?php
/**
 * GET  /api/payroll/approve.php?batch_id=N  — check approval status for logged-in user
 * POST /api/payroll/approve.php             — approve a batch (employee e-signature acknowledgment)
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();
$sessionUserId = $_SESSION['user_id'] ?? null;
session_write_close();

if (!$sessionUserId) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];

// ── GET — check if this employee already approved ─────────────────────────────
if ($method === 'GET') {
    $batchId = (int)($_GET['batch_id'] ?? 0);

    if (!$batchId) {
        echo json_encode(['approved' => false, 'approved_at' => null]);
        exit;
    }

    $stmt = $db->prepare(
        "SELECT id, approved_at
         FROM fch_payroll_employee_approvals
         WHERE batch_id = ? AND employee_id = ?"
    );
    $stmt->execute([$batchId, $sessionUserId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'approved'    => (bool)$row,
        'approved_at' => $row ? $row['approved_at'] : null,
    ]);
    exit;
}

// ── POST — record approval ────────────────────────────────────────────────────
if ($method === 'POST') {
    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $batchId = (int)($body['batch_id'] ?? 0);

    if (!$batchId) {
        http_response_code(400);
        echo json_encode(['error' => 'batch_id is required']);
        exit;
    }

    // Use REMOTE_ADDR only — HTTP_X_FORWARDED_FOR is client-controlled on a
    // shared host with no trusted reverse proxy, so it must not be trusted.
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;

    try {
        $stmt = $db->prepare(
            "INSERT IGNORE INTO fch_payroll_employee_approvals
             (batch_id, employee_id, ip_address)
             VALUES (?, ?, ?)"
        );
        $stmt->execute([$batchId, (int)$sessionUserId, $ip]);

        // Return the timestamp (either existing or newly inserted)
        $check = $db->prepare(
            "SELECT approved_at FROM fch_payroll_employee_approvals
             WHERE batch_id = ? AND employee_id = ?"
        );
        $check->execute([$batchId, (int)$sessionUserId]);
        $row = $check->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success'     => true,
            'message'     => 'Payroll batch acknowledged.',
            'approved_at' => $row ? $row['approved_at'] : null,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
