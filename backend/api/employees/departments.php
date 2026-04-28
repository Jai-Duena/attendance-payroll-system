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
$stmt = $db->query('SELECT DISTINCT emp_dept FROM fch_employees ORDER BY emp_dept ASC');
$depts = array_column($stmt->fetchAll(), 'emp_dept');

echo json_encode($depts);
