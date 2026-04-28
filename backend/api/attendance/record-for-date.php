<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$role      = $_SESSION['role']    ?? 'employee';
$sessionId = (int)$_SESSION['user_id'];

$date = trim($_GET['date'] ?? '');

// Employees may only fetch their own record
if ($role === 'employee') {
    $employeeId = $sessionId;
} else {
    $employeeId = isset($_GET['employee_id']) ? (int)$_GET['employee_id'] : $sessionId;
}

if (!$date || !$employeeId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing date']);
    exit;
}

$pdo = getDB();

// Look up by the raw date OR the adjusted date so records corrected via adj_date
// are still found when the employee enters the effective date.
$stmt = $pdo->prepare(
    "SELECT
         a.uniq_id, a.employee_id, a.emp_fullname, a.emp_dept,
         a.date,
         a.time_in,    a.time_out,
         a.adj_date,   a.adj_time_in,  a.adj_time_out,
         a.adj_shift_time_in, a.adj_shift_time_out,
         COALESCE(a.shift_time_in,
             CONCAT(a.date, ' ', COALESCE(es_d.shift_start, es_def.shift_start))) AS shift_time_in,
         COALESCE(a.shift_time_out,
             CONCAT(a.date, ' ', COALESCE(es_d.shift_end,   es_def.shift_end)))   AS shift_time_out,
         a.total_hrs
     FROM fch_attendance a
     LEFT JOIN fch_employees_shift es_d
            ON es_d.employee_id = a.employee_id AND es_d.date = a.date
     LEFT JOIN fch_employees_shift es_def
            ON es_def.employee_id = a.employee_id AND es_def.date IS NULL
     WHERE a.employee_id = ?
       AND (a.date = ? OR a.adj_date = ?)
     LIMIT 1"
);
$stmt->execute([$employeeId, $date, $date]);
$record = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode(['data' => $record ?: null]);
?>
exit;
