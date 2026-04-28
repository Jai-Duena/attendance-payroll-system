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

$pdo    = getDB();
$role   = $_SESSION['role'] ?? 'employee';

// Only admin and supervisor can list employees
if ($role === 'employee') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$page   = max(1, (int)($_GET['page']  ?? 1));
$limit  = in_array((int)($_GET['limit'] ?? 20), [10, 20, 50, 100]) ? (int)$_GET['limit'] : 20;
$offset = ($page - 1) * $limit;
$name   = trim($_GET['name']   ?? '');
$dept   = trim($_GET['dept']   ?? '');
$status = trim($_GET['status'] ?? 'active'); // active | all

$where  = [];
$params = [];

// Always exclude hard-deleted employees; show all emp types (Resigned/Terminated go to bottom)
$where[] = "e.emp_deleted_at IS NULL";

// Filter active-only employees (status=active excludes Resigned/Terminated)
if ($status === 'active') {
    $where[] = "e.emp_emptype NOT IN ('Resigned', 'Terminated')";
}

if ($name !== '') {
    $where[]  = "e.emp_fullname LIKE ?";
    $params[] = "%{$name}%";
}
if ($dept !== '') {
    $where[]  = "e.emp_dept = ?";
    $params[] = $dept;
}

$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

try {
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM fch_employees e $whereSQL");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $stmt = $pdo->prepare(
        "SELECT e.employee_id, e.uniq_id, e.emp_fname, e.emp_mname, e.emp_minit, e.emp_lname,
                e.emp_fullname, e.emp_dept, e.emp_position, e.emp_emptype,
                e.emp_acc_type, e.emp_shift, e.emp_datehire, e.emp_dailyrate,
                e.emp_sss, e.emp_pagibig, e.emp_philhealth, e.emp_tin,
                e.emp_username, e.emp_email, e.emp_sign, e.emp_photo, e.emp_gender,
                CASE WHEN e.emp_email IS NOT NULL AND e.emp_email != '' THEN 1 ELSE 0 END AS has_email
         FROM fch_employees e
         $whereSQL
         ORDER BY
           CASE WHEN e.emp_emptype IN ('Resigned','Terminated') THEN 1 ELSE 0 END ASC,
           CAST(e.employee_id AS UNSIGNED) ASC
         LIMIT $limit OFFSET $offset"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'data'       => $rows,
        'total'      => $total,
        'page'       => $page,
        'limit'      => $limit,
        'totalPages' => (int)ceil($total / $limit),
    ]);
} catch (Exception $e) {
    error_log('[fch-employees] list error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load employees']);
}
exit;
