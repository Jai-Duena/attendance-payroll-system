<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
$sessionRole = $_SESSION['role'] ?? '';
$sessionDept = $_SESSION['department'] ?? '';

if (!in_array($sessionRole, ['admin', 'supervisor'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$pdo = getDB();

// Optionally filter employees who have attendance in a given period
$start = $_GET['start'] ?? null;
$end   = $_GET['end']   ?? null;

// Supervisors only see their own department
$deptFilter     = ($sessionRole === 'supervisor' && $sessionDept !== '') ? $sessionDept : null;

if ($start && $end) {
    $params = [$start, $end];
    $deptSQL = $deptFilter ? 'AND e.emp_dept = ?' : '';
    if ($deptFilter) $params[] = $deptFilter;
    $stmt = $pdo->prepare("
        SELECT DISTINCT e.employee_id, e.emp_fullname, e.emp_dept, e.emp_position, e.emp_emptype
        FROM fch_employees e
        INNER JOIN fch_attendance a ON a.employee_id = e.employee_id
        WHERE a.date BETWEEN ? AND ?
          AND e.emp_acc_type != 'Resigned'
          AND e.emp_acc_type != 'Terminated'
          $deptSQL
        ORDER BY e.emp_fullname ASC
    ");
    $stmt->execute($params);
} else {
    $params = [];
    $deptSQL = $deptFilter ? 'AND emp_dept = ?' : '';
    if ($deptFilter) $params[] = $deptFilter;
    $stmt = $pdo->prepare("
        SELECT employee_id, emp_fullname, emp_dept, emp_position, emp_emptype
        FROM fch_employees
        WHERE emp_acc_type != 'Resigned'
          AND emp_acc_type != 'Terminated'
          $deptSQL
        ORDER BY emp_fullname ASC
    ");
    $stmt->execute($params);
}

$employees = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'data' => $employees]);
exit;
