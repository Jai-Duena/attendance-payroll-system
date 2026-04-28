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
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'GET required']);
    exit;
}

$batchId = isset($_GET['batch_id'])   ? (int)$_GET['batch_id']   : null;
$empId   = isset($_GET['employee_id']) ? (int)$_GET['employee_id'] : null;
$page    = max(1, (int)($_GET['page']  ?? 1));
$limit   = min(200, max(1, (int)($_GET['limit'] ?? 50)));
$offset  = ($page - 1) * $limit;

if (!$batchId) {
    http_response_code(400);
    echo json_encode(['error' => 'batch_id is required']);
    exit;
}

$pdo = getDB();

$params = [$batchId];
$where  = 'WHERE batch_id = ?';

if ($empId) {
    $where   .= ' AND employee_id = ?';
    $params[] = $empId;
}

// Employees can only see their own audit entries
if ($role === 'employee') {
    $where   .= ' AND employee_id = ?';
    $params[] = $loggedInUserId;
}

// Total count
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM fch_payroll_audit $where");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

// Fetch records with changer info (join to employees if available)
$dataStmt = $pdo->prepare("
    SELECT a.*,
           COALESCE(e.emp_fname,' ') AS changer_firstname,
           COALESCE(e.emp_lname, ' ')  AS changer_lastname
    FROM fch_payroll_audit a
    LEFT JOIN fch_employees e ON e.employee_id = a.changed_by_user_id
    $where
    ORDER BY a.changed_at DESC
    LIMIT $limit OFFSET $offset
");
$dataStmt->execute($params);
$data = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'success'    => true,
    'data'       => $data,
    'total'      => $total,
    'page'       => $page,
    'limit'      => $limit,
    'totalPages' => $total > 0 ? (int)ceil($total / $limit) : 1,
]);
exit;
