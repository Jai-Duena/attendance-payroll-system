<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
$role          = $_SESSION['role'] ?? '';
$loggedInUserId = (int)($_SESSION['user_id'] ?? 0);
$allowedRoles  = ['admin', 'supervisor', 'management', 'employee'];
if (!in_array($role, $allowedRoles) || !$loggedInUserId) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$pdo     = getDB();
$type    = $_GET['type']     ?? 'results';
$batchId = isset($_GET['batch_id']) ? (int)$_GET['batch_id'] : null;
$page    = max(1, (int)($_GET['page']  ?? 1));
$limit   = min(100, max(1, (int)($_GET['limit'] ?? 25)));
$offset  = ($page - 1) * $limit;
$archived = (int)($_GET['archived'] ?? 0); // 0 = active, 1 = archived rows

// Name / dept filter
$name   = $_GET['name']   ?? '';
$dept   = $_GET['dept']   ?? '';

$tableMap = [
    'results'          => 'fch_payroll_results',
    'summary'          => 'fch_payroll_summary',
    'earnings'         => 'fch_earnings_computation',
    'deductions'       => 'fch_deductions_computation',
    'tax'              => 'fch_tax_deduction',
    'attendance_summary' => 'fch_attendance_summary',
];

// Tables that have the is_archived column
$archivableTables = ['earnings','deductions','tax','attendance_summary','summary'];

if (!isset($tableMap[$type])) {
    http_response_code(400);
    echo json_encode(['error' => "Unknown table type: $type"]);
    exit;
}

$table  = $tableMap[$type];
$params = [];
$whereClauses = [];

if ($batchId) {
    $whereClauses[] = 'batch_id = ?';
    $params[]       = $batchId;
}

// Filter by archive status for tables that support it
if (in_array($type, $archivableTables)) {
    $whereClauses[] = 'is_archived = ?';
    $params[]       = $archived;
}

if ($name && $type !== 'results') {
    $whereClauses[] = 'emp_fullname LIKE ?';
    $params[]       = "%$name%";
}
if ($dept && $type !== 'results') {
    $whereClauses[] = 'emp_dept = ?';
    $params[]       = $dept;
}

// Scope by role: employees and supervisors see only their own data
if ($role === 'employee' || $role === 'supervisor') {
    $whereClauses[] = 'employee_id = ?';
    $params[]       = $loggedInUserId;
} elseif (isset($_GET['employee_id']) && (int)$_GET['employee_id'] > 0 && $type !== 'results') {
    // Admin viewing a specific employee (e.g. employee-view mode on frontend)
    $whereClauses[] = 'employee_id = ?';
    $params[]       = (int)$_GET['employee_id'];
}

$where = $whereClauses ? 'WHERE ' . implode(' AND ', $whereClauses) : '';

// ── List departments shortcut ────────────────────────────────────────────────
if ((int)($_GET['list_depts'] ?? 0) === 1 && $batchId && $type !== 'results') {
    $deptStmt = $pdo->prepare("SELECT DISTINCT emp_dept FROM $table WHERE batch_id=? AND emp_dept IS NOT NULL AND emp_dept != '' ORDER BY emp_dept");
    $deptStmt->execute([$batchId]);
    echo json_encode(['success' => true, 'data' => $deptStmt->fetchAll(PDO::FETCH_COLUMN)]);
    exit;
}

// ── Sort params ──────────────────────────────────────────────────────────────
$sortableColumns = ['id','emp_fullname','emp_dept','batch_id','payroll_start','payroll_end',
    'num_employees','status','created_at','gross_pay','net_pay','days_worked','total_pay',
    'reg_pay','ot_pay','nd_pay','total_deduct','taxable_income','tax_deduct','total',
    'reg_hrs','ot_hrs','nd_hrs','late_mins','leave_days','reg_holiday_days'];
$sortCol = $_GET['sort_col'] ?? 'id';
$sortDir = strtoupper($_GET['sort_dir'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
if (!in_array($sortCol, $sortableColumns, true)) { $sortCol = 'id'; }

// Count
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM $table $where");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

// Data
$dataStmt = $pdo->prepare("SELECT * FROM $table $where ORDER BY `$sortCol` $sortDir LIMIT $limit OFFSET $offset");
$dataStmt->execute($params);
$data = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'success'    => true,
    'data'       => $data,
    'total'      => $total,
    'page'       => $page,
    'limit'      => $limit,
    'totalPages' => $total > 0 ? (int)ceil($total / $limit) : 1,
    'archived'   => $archived,
]);
exit;
