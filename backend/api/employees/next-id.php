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

$role = $_SESSION['role'] ?? 'employee';
if (!in_array($role, ['admin', 'supervisor'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$pdo  = getDB();

// Find the smallest positive integer not currently in use as employee_id
$stmt   = $pdo->query("SELECT CAST(employee_id AS UNSIGNED) FROM fch_employees WHERE employee_id REGEXP '^[0-9]+$' ORDER BY CAST(employee_id AS UNSIGNED) ASC");
$usedIds = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
$usedSet = array_flip(array_map('intval', $usedIds));

$nextId = 1;
while (isset($usedSet[$nextId])) {
    $nextId++;
}

echo json_encode(['next_id' => $nextId]);
exit;
