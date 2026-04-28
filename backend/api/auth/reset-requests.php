<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

if ($_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Admin access required']);
    exit;
}

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Ensure table exists (mirrors reset-ticket.php)
$db->exec("
    CREATE TABLE IF NOT EXISTS fch_password_reset_requests (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        employee_id     INT NULL,
        identifier      VARCHAR(255) NOT NULL,
        message         TEXT NULL,
        status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        temp_password   VARCHAR(255) NULL,
        requested_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at     DATETIME NULL,
        resolved_by_id  INT NULL,
        resolved_by     VARCHAR(255) NULL,
        INDEX idx_status (status),
        INDEX idx_employee (employee_id)
    )
");

// Ensure lockout columns exist
$cols = $db->query("SHOW COLUMNS FROM fch_employees LIKE 'login_must_change'")->fetchAll();
if (empty($cols)) {
    $db->exec("ALTER TABLE fch_employees
        ADD COLUMN login_fail_count INT NOT NULL DEFAULT 0,
        ADD COLUMN login_locked_until DATETIME NULL,
        ADD COLUMN login_locked TINYINT(1) NOT NULL DEFAULT 0,
        ADD COLUMN login_must_change TINYINT(1) NOT NULL DEFAULT 0");
}

// GET — list pending requests
if ($method === 'GET') {
    $status = $_GET['status'] ?? 'pending';
    $allowed = ['pending', 'approved', 'rejected', 'all'];
    if (!in_array($status, $allowed)) $status = 'pending';

    if ($status === 'all') {
        $stmt = $db->query("SELECT r.*, e.emp_fullname, e.emp_dept FROM fch_password_reset_requests r LEFT JOIN fch_employees e ON r.employee_id = e.employee_id ORDER BY r.requested_at DESC");
    } else {
        $stmt = $db->prepare("SELECT r.*, e.emp_fullname, e.emp_dept FROM fch_password_reset_requests r LEFT JOIN fch_employees e ON r.employee_id = e.employee_id WHERE r.status = ? ORDER BY r.requested_at DESC");
        $stmt->execute([$status]);
    }
    $rows = $stmt->fetchAll();
    echo json_encode($rows);

// POST — approve or reject a request
} elseif ($method === 'POST') {
    $data   = json_decode(file_get_contents('php://input'), true);
    $id     = (int)($data['id']     ?? 0);
    $action = $data['action'] ?? ''; // 'approve' | 'reject'

    if (!$id || !in_array($action, ['approve', 'reject'])) {
        http_response_code(400);
        echo json_encode(['error' => 'id and action (approve|reject) are required']);
        exit;
    }

    // Load the request
    $stmt = $db->prepare("SELECT * FROM fch_password_reset_requests WHERE id = ?");
    $stmt->execute([$id]);
    $req = $stmt->fetch();

    if (!$req || $req['status'] !== 'pending') {
        http_response_code(404);
        echo json_encode(['error' => 'Request not found or already resolved']);
        exit;
    }

    $adminName = $_SESSION['full_name'] ?? $_SESSION['username'];

    if ($action === 'reject') {
        $db->prepare("UPDATE fch_password_reset_requests SET status='rejected', resolved_at=NOW(), resolved_by_id=?, resolved_by=? WHERE id=?")
           ->execute([$_SESSION['user_id'], $adminName, $id]);
        echo json_encode(['success' => true]);
        exit;
    }

    // Approve — find the employee
    $empId = $req['employee_id'];
    if (!$empId) {
        // Employee not found (invalid identifier submitted by user)
        $db->prepare("UPDATE fch_password_reset_requests SET status='rejected', resolved_at=NOW(), resolved_by_id=?, resolved_by=? WHERE id=?")
           ->execute([$_SESSION['user_id'], $adminName, $id]);
        http_response_code(422);
        echo json_encode(['error' => 'No matching employee account found for this request']);
        exit;
    }

    // Generate a random 12-char temp password
    $chars    = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$';
    $tempPass = '';
    for ($i = 0; $i < 12; $i++) {
        $tempPass .= $chars[random_int(0, strlen($chars) - 1)];
    }

    $hashed = password_hash($tempPass, PASSWORD_BCRYPT);

    // Update employee: set new password + force change on next login + unlock
    $db->prepare("UPDATE fch_employees SET emp_pass=?, login_must_change=1, login_fail_count=0, login_locked=0, login_locked_until=NULL WHERE employee_id=?")
       ->execute([$hashed, $empId]);

    // Mark request as approved
    $db->prepare("UPDATE fch_password_reset_requests SET status='approved', resolved_at=NOW(), resolved_by_id=?, resolved_by=?, temp_password=? WHERE id=?")
       ->execute([$_SESSION['user_id'], $adminName, '[shown to admin]', $id]);

    // Return the plaintext password — one-time, never retrievable again
    echo json_encode([
        'success'      => true,
        'temp_password'=> $tempPass,
        'employee_id'  => $empId,
    ]);

// DELETE — clear resolved requests
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = (int)($data['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id is required']);
        exit;
    }
    $db->prepare("DELETE FROM fch_password_reset_requests WHERE id = ?")
       ->execute([$id]);
    echo json_encode(['success' => true]);

// PUT — unlock a locked account from the admin panel
} elseif ($method === 'PUT') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $empId = (int)($data['employee_id'] ?? 0);
    if (!$empId) {
        http_response_code(400);
        echo json_encode(['error' => 'employee_id is required']);
        exit;
    }
    $db->prepare("UPDATE fch_employees SET login_locked=0, login_fail_count=0, login_locked_until=NULL WHERE employee_id=?")
       ->execute([$empId]);
    echo json_encode(['success' => true, 'message' => 'Account unlocked successfully']);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
