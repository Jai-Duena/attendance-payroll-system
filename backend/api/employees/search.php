<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$q = trim($_GET['q'] ?? '');
if (strlen($q) < 1) {
    echo json_encode(['employees' => []]);
    exit;
}

$pdo     = getDB();
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
$myId    = (int)$_SESSION['user_id'];

$stmt = $pdo->prepare(
    "SELECT employee_id AS id,
            emp_fullname AS name,
            emp_dept AS department,
            emp_acc_type AS role,
            emp_photo
     FROM fch_employees
     WHERE emp_fullname LIKE ?
       AND employee_id != ?
       AND emp_emptype NOT IN ('Resigned', 'Terminated')
     LIMIT 15"
);
$stmt->execute(["%$q%", $myId]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$employees = array_map(function ($row) use ($baseUrl) {
    return [
        'id'         => (int)$row['id'],
        'name'       => $row['name'],
        'department' => $row['department'],
        'role'       => $row['role'],
        'photo_url'  => !empty($row['emp_photo'])
                        ? $baseUrl . '/' . ltrim($row['emp_photo'], '/')
                        : null,
    ];
}, $rows);

echo json_encode(['employees' => $employees]);
exit;
