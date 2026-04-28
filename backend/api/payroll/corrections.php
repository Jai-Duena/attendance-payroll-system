<?php
/**
 * POST /api/payroll/corrections.php  — submit a correction request
 * GET  /api/payroll/corrections.php  — list corrections
 *      admin : all corrections (optionally filtered by batch_id)
 *      others: own corrections only
 * PUT  /api/payroll/corrections.php  — update status (admin only)
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();
$sessionUserId = $_SESSION['user_id'] ?? null;
$sessionRole   = strtolower($_SESSION['role'] ?? '');
session_write_close();

if (!$sessionUserId) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$db = getDB();

// ── Auto-migrate ──────────────────────────────────────────────────────────────
$db->exec("CREATE TABLE IF NOT EXISTS fch_payroll_corrections (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    batch_id     INT          NOT NULL,
    employee_id  INT          NOT NULL,
    fields_json  TEXT         NOT NULL,
    reason       TEXT         NOT NULL,
    attachments  TEXT         NULL,
    status       ENUM('Pending','Reviewing','Reviewed','Corrected','Rejected')
                 NOT NULL DEFAULT 'Pending',
    admin_notes  TEXT         NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_batch   (batch_id),
    INDEX idx_emp     (employee_id),
    INDEX idx_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $batchId    = (int)($_GET['batch_id'] ?? 0);
    $statusFilter = trim($_GET['status'] ?? '');

    if ($sessionRole === 'admin') {
        $where  = [];
        $params = [];
        if ($batchId)      { $where[] = 'c.batch_id = ?';  $params[] = $batchId; }
        if ($statusFilter) { $where[] = 'c.status = ?';    $params[] = $statusFilter; }
        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $stmt = $db->prepare(
            "SELECT c.*, e.emp_fullname
             FROM fch_payroll_corrections c
             LEFT JOIN fch_employees e ON e.employee_id = c.employee_id
             {$whereClause}
             ORDER BY c.created_at DESC"
        );
        $stmt->execute($params);
    } else {
        // Employee / supervisor — own corrections only
        if ($batchId) {
            $stmt = $db->prepare(
                "SELECT c.*, e.emp_fullname
                 FROM fch_payroll_corrections c
                 LEFT JOIN fch_employees e ON e.employee_id = c.employee_id
                 WHERE c.batch_id = ? AND c.employee_id = ?
                 ORDER BY c.created_at DESC"
            );
            $stmt->execute([$batchId, $sessionUserId]);
        } else {
            $stmt = $db->prepare(
                "SELECT c.*, e.emp_fullname
                 FROM fch_payroll_corrections c
                 LEFT JOIN fch_employees e ON e.employee_id = c.employee_id
                 WHERE c.employee_id = ?
                 ORDER BY c.created_at DESC"
            );
            $stmt->execute([$sessionUserId]);
        }
    }

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$row) {
        $row['fields']          = json_decode($row['fields_json']  ?? '[]', true) ?? [];
        $row['attachment_list'] = json_decode($row['attachments']  ?? '[]', true) ?? [];
    }

    echo json_encode(['success' => true, 'data' => $rows, 'total' => count($rows)]);
    exit;
}

// ── POST — submit correction ──────────────────────────────────────────────────
if ($method === 'POST') {
    // Support both JSON and multipart/form-data (file upload)
    $isMultipart = str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data');

    if ($isMultipart) {
        $batchId    = (int)($_POST['batch_id']    ?? 0);
        $fieldsJson = $_POST['fields_json'] ?? '[]';
        $reason     = trim($_POST['reason'] ?? '');
    } else {
        $body       = json_decode(file_get_contents('php://input'), true) ?? [];
        $batchId    = (int)($body['batch_id']    ?? 0);
        $fieldsJson = $body['fields_json'] ?? '[]';
        $reason     = trim($body['reason'] ?? '');
    }

    if (!$batchId || !$reason) {
        http_response_code(400);
        echo json_encode(['error' => 'batch_id and reason are required']);
        exit;
    }

    // Validate fields_json is valid JSON
    $fields = json_decode($fieldsJson, true);
    if (!is_array($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'fields_json must be a valid JSON array']);
        exit;
    }

    // ── Handle file uploads ───────────────────────────────────────────────────
    $attachmentNames = [];
    if (!empty($_FILES)) {
        $uploadDir = realpath(__DIR__ . '/../../../uploads') . '/payroll-corrections/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Support single file (attachments) or multiple (attachments[])
        $fileSlot = $_FILES['attachments'] ?? null;
        if ($fileSlot) {
            $names    = is_array($fileSlot['name'])     ? $fileSlot['name']     : [$fileSlot['name']];
            $tmpNames = is_array($fileSlot['tmp_name']) ? $fileSlot['tmp_name'] : [$fileSlot['tmp_name']];
            $errors   = is_array($fileSlot['error'])    ? $fileSlot['error']    : [$fileSlot['error']];

            $allowedExt = ['pdf','jpg','jpeg','png','gif','doc','docx','xls','xlsx','txt','csv'];
            for ($i = 0; $i < count($names); $i++) {
                if ($errors[$i] !== UPLOAD_ERR_OK) continue;
                $ext = strtolower(pathinfo($names[$i], PATHINFO_EXTENSION));
                if (!in_array($ext, $allowedExt)) continue;
                // Sanitize filename
                $safe = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', basename($names[$i]));
                $dest = $uploadDir . time() . '_' . $i . '_' . $safe;
                if (move_uploaded_file($tmpNames[$i], $dest)) {
                    $attachmentNames[] = 'uploads/payroll-corrections/' . basename($dest);
                }
            }
        }
    }

    try {
        $stmt = $db->prepare(
            "INSERT INTO fch_payroll_corrections
             (batch_id, employee_id, fields_json, reason, attachments)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $batchId,
            (int)$sessionUserId,
            $fieldsJson,
            $reason,
            json_encode($attachmentNames),
        ]);
        $id = (int)$db->lastInsertId();

        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Correction request submitted successfully.']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// ── PUT — update status (admin only) ─────────────────────────────────────────
if ($method === 'PUT') {
    if ($sessionRole !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }

    $body       = json_decode(file_get_contents('php://input'), true) ?? [];
    $id         = (int)($body['id']          ?? 0);
    $status     = $body['status']            ?? '';
    $adminNotes = trim($body['admin_notes'] ?? '');

    $allowed = ['Pending', 'Reviewing', 'Reviewed', 'Corrected', 'Rejected'];
    if (!$id || !in_array($status, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid id and status are required']);
        exit;
    }

    try {
        $stmt = $db->prepare(
            "UPDATE fch_payroll_corrections
             SET status = ?, admin_notes = ?, updated_at = NOW()
             WHERE id = ?"
        );
        $stmt->execute([$status, $adminNotes ?: null, $id]);

        echo json_encode(['success' => true, 'message' => "Status updated to {$status}"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
