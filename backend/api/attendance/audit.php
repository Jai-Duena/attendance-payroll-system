<?php
/**
 * GET /api/attendance/audit.php
 * Returns the attendance edit/delete history from fch_attendance_audit
 * with optional filtering + pagination.
 *
 * Query params:
 *  employee_id  filter by employee     (optional)
 *  date_from    YYYY-MM-DD             (optional)
 *  date_to      YYYY-MM-DD             (optional)
 *  action       edit|delete            (optional)
 *  page         int, default 1
 *  limit        int, default 20
 */
ini_set('display_errors', '0');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
$role           = $_SESSION['role'] ?? 'employee';
$loggedInUserId = (int)$_SESSION['user_id'];
$sessionDept    = $_SESSION['department'] ?? '';

// All roles can access the audit log; scope depends on view mode passed from frontend
// employee view: forced to own data; supervisor view: dept; admin: unrestricted
// The frontend passes employee_id or dept as appropriate for the current view

$empId    = !empty($_GET['employee_id']) ? (int)$_GET['employee_id'] : null;
$deptFilter = trim($_GET['dept'] ?? '');
$dateFrom = $_GET['date_from'] ?? null;
$dateTo   = $_GET['date_to']   ?? null;
$action   = $_GET['action']    ?? null;
$page     = max(1, (int)($_GET['page']  ?? 1));
$limit    = min(100, max(1, (int)($_GET['limit'] ?? 20)));
$offset   = ($page - 1) * $limit;

// Session-level safety guards
// employee session role: always scoped to own data
if ($role === 'employee') {
    $empId = $loggedInUserId;
    $deptFilter = '';
}
// supervisor session role: always scoped to their department
if ($role === 'supervisor') {
    $empId = null;
    $deptFilter = $sessionDept;
}

$pdo    = getDB();
$where  = [];
$params = [];

if ($empId) {
    $where[]           = 'a.employee_id = :eid';
    $params[':eid']    = $empId;
}
if ($deptFilter !== '') {
    // Join to employees to filter by dept
    $where[]           = 'e.emp_dept = :dept';
    $params[':dept']   = $deptFilter;
}
if ($dateFrom && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
    $where[]              = 'DATE(a.changed_at) >= :df';
    $params[':df']        = $dateFrom;
}
if ($dateTo && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
    $where[]              = 'DATE(a.changed_at) <= :dt';
    $params[':dt']        = $dateTo;
}
if ($action && in_array($action, ['edit', 'delete'])) {
    $where[]              = 'a.action = :act';
    $params[':act']       = $action;
}

$whereSQL = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
$joinSQL  = ($deptFilter !== '') ? 'LEFT JOIN fch_employees e ON e.employee_id = a.employee_id' : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM fch_attendance_audit a {$joinSQL} {$whereSQL}");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

$dataStmt = $pdo->prepare("
    SELECT
        a.id,
        a.attendance_uniq_id,
        a.employee_id,
        a.emp_fullname,
        a.action,
        a.field_changed,
        a.old_value,
        a.new_value,
        a.changed_by_user_id,
        a.changed_by_name,
        a.changed_at
    FROM fch_attendance_audit a
    {$joinSQL}
    {$whereSQL}
    ORDER BY a.changed_at DESC
    LIMIT :lim OFFSET :off
");
$dataStmt->execute(array_merge($params, [':lim' => $limit, ':off' => $offset]));
$rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'data'        => $rows,
    'total'       => $total,
    'page'        => $page,
    'limit'       => $limit,
    'totalPages'  => (int)ceil($total / $limit),
]);
exit;
