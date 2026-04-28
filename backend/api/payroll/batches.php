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

$pdo = getDB();

// For non-admin roles (employee/supervisor/management), only return batches
// where the logged-in user actually has payroll data.
$isAdmin = ($role === 'admin');

if ($isAdmin) {
    $stmt = $pdo->prepare("
        SELECT
            pr.id         AS result_id,
            pr.batch_id,
            pr.payroll_start,
            pr.payroll_end,
            pr.num_employees,
            pr.status,
            pr.created_at,
            pr.updated_at
        FROM fch_payroll_results pr
        ORDER BY pr.batch_id DESC
    ");
    $stmt->execute();
} else {
    $stmt = $pdo->prepare("
        SELECT
            pr.id         AS result_id,
            pr.batch_id,
            pr.payroll_start,
            pr.payroll_end,
            pr.num_employees,
            pr.status,
            pr.created_at,
            pr.updated_at
        FROM fch_payroll_results pr
        WHERE EXISTS (
            SELECT 1 FROM fch_payroll_summary ps
            WHERE ps.batch_id = pr.batch_id
              AND ps.employee_id = ?
        )
        ORDER BY pr.batch_id DESC
    ");
    $stmt->execute([$loggedInUserId]);
}

$batches = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'data' => $batches]);
exit;
