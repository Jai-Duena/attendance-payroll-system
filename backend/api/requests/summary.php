<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$db   = getDB();
$role   = $_SESSION['role'];
$dept   = $_SESSION['department'];
$userId = (int)$_SESSION['user_id'];

// ── Department Summary ─────────────────────────────────────────────────────
// JOIN fch_employees to get emp_dept; group by that dept

// Determine which status column to aggregate by
$statusCol = ($role === 'supervisor') ? 'r.sup_status' : 'r.admin_status';

if ($role === 'supervisor') {
    $deptStmt = $db->prepare(
        "SELECT
            e.emp_dept                                              AS department,
            COUNT(DISTINCT e.employee_id)                           AS employees,
            SUM(CASE WHEN {$statusCol} = 'Pending'   THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN {$statusCol} = 'Approved'  THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN {$statusCol} = 'Rejected'  THEN 1 ELSE 0 END) AS rejected,
            SUM(CASE WHEN {$statusCol} = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
            COUNT(r.uniq_id)                                        AS total_requests,
            MIN(CASE WHEN {$statusCol}='Pending' THEN r.encode_date END) AS nearest_pending_date
         FROM fch_requests r
         JOIN fch_employees e ON e.employee_id = r.employee_id
         WHERE e.emp_dept = ?
           AND e.employee_id != ?
         GROUP BY e.emp_dept
         ORDER BY pending DESC"
    );
    $deptStmt->execute([$dept, $userId]);
} else {
    $deptStmt = $db->query(
        "SELECT
            e.emp_dept                                              AS department,
            COUNT(DISTINCT e.employee_id)                           AS employees,
            SUM(CASE WHEN {$statusCol} = 'Pending'   THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN {$statusCol} = 'Approved'  THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN {$statusCol} = 'Rejected'  THEN 1 ELSE 0 END) AS rejected,
            SUM(CASE WHEN {$statusCol} = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
            COUNT(r.uniq_id)                                        AS total_requests,
            MIN(CASE WHEN {$statusCol}='Pending' THEN r.encode_date END) AS nearest_pending_date
         FROM fch_requests r
         JOIN fch_employees e ON e.employee_id = r.employee_id
         GROUP BY e.emp_dept
         ORDER BY pending DESC"
    );
}

$deptSummary = $deptStmt->fetchAll();

// ── Employee Summary ───────────────────────────────────────────────────────
// JOIN fch_employees to get emp_fullname and emp_dept
// Ordered by pending DESC, then nearest date ASC

if ($role === 'supervisor') {
    $empStmt = $db->prepare(
        "SELECT
            r.employee_id,
            e.emp_fullname                                          AS employee_name,
            e.emp_dept                                              AS department,
            SUM(CASE WHEN {$statusCol} = 'Pending'  THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN {$statusCol} = 'Approved' THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN {$statusCol} = 'Rejected' THEN 1 ELSE 0 END) AS rejected,
            SUM(CASE WHEN {$statusCol} = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
            COUNT(r.uniq_id)                                        AS total_requests,
            MIN(CASE WHEN {$statusCol}='Pending' THEN r.encode_date END) AS nearest_pending_date
         FROM fch_requests r
         JOIN fch_employees e ON e.employee_id = r.employee_id
         WHERE e.emp_dept = ?
           AND e.employee_id != ?
         GROUP BY r.employee_id, e.emp_fullname, e.emp_dept
         ORDER BY pending DESC, nearest_pending_date ASC"
    );
    $empStmt->execute([$dept, $userId]);
} else {
    $empStmt = $db->query(
        "SELECT
            r.employee_id,
            e.emp_fullname                                          AS employee_name,
            e.emp_dept                                              AS department,
            SUM(CASE WHEN {$statusCol} = 'Pending'  THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN {$statusCol} = 'Approved' THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN {$statusCol} = 'Rejected' THEN 1 ELSE 0 END) AS rejected,
            SUM(CASE WHEN {$statusCol} = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
            COUNT(r.uniq_id)                                        AS total_requests,
            MIN(CASE WHEN {$statusCol}='Pending' THEN r.encode_date END) AS nearest_pending_date
         FROM fch_requests r
         JOIN fch_employees e ON e.employee_id = r.employee_id
         GROUP BY r.employee_id, e.emp_fullname, e.emp_dept
         ORDER BY pending DESC, nearest_pending_date ASC"
    );
}

$empSummary = $empStmt->fetchAll();

echo json_encode([
    'departments' => $deptSummary,
    'employees'   => $empSummary,
]);
exit;
