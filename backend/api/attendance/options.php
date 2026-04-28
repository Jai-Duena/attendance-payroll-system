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

$pdo  = getDB();
$type = $_GET['type'] ?? '';

try {
    if ($type === 'batch_ids') {
        $stmt = $pdo->query(
            "SELECT DISTINCT batch_id
             FROM fch_attendance_summary
             WHERE batch_id IS NOT NULL
             ORDER BY batch_id DESC"
        );
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo json_encode($rows);

    } elseif ($type === 'payroll_periods') {
        $stmt = $pdo->query(
            "SELECT DISTINCT payroll_start, payroll_end
             FROM fch_attendance_summary
             WHERE payroll_start IS NOT NULL
             ORDER BY payroll_start DESC"
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($rows);

    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or missing type parameter']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
