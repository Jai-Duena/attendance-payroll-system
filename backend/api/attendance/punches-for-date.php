<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$role       = $_SESSION['role']    ?? 'employee';
$sessionId  = (int)$_SESSION['user_id'];

$employeeId = isset($_GET['employee_id']) ? (int)$_GET['employee_id'] : 0;
$date       = trim($_GET['date'] ?? '');

// Employees may only fetch their own punches
if ($role === 'employee') {
    $employeeId = $sessionId;
}

if (!$employeeId || !$date) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing employee_id or date']);
    exit;
}

$pdo = getDB();

// Include punches from the day before as well to handle overnight shifts
$stmt = $pdo->prepare(
    "SELECT id, punch_time, punch_type, verifycode
     FROM fch_punches
     WHERE employee_id = ?
       AND DATE(punch_time) BETWEEN DATE_SUB(?, INTERVAL 1 DAY) AND DATE_ADD(?, INTERVAL 1 DAY)
     ORDER BY punch_time ASC"
);
$stmt->execute([$employeeId, $date, $date]);
$punches = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['data' => $punches]);
?>
exit;
