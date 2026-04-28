<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// GET  /api/chat  → latest 50 messages
// POST /api/chat  → send a message
if ($method === 'GET') {
    $stmt = $db->query(
        'SELECT id, employee_id, emp_fullname AS user, emp_acc_type AS role,
                message, created_at
         FROM fch_chat_messages
         ORDER BY created_at DESC
         LIMIT 50'
    );
    $rows = array_reverse($stmt->fetchAll());
    echo json_encode($rows);

} elseif ($method === 'POST') {
    $data    = json_decode(file_get_contents('php://input'), true);
    $message = trim($data['message'] ?? '');

    if (!$message) {
        http_response_code(400);
        echo json_encode(['error' => 'Message cannot be empty']);
        exit;
    }

    $stmt = $db->prepare(
        'INSERT INTO fch_chat_messages (employee_id, emp_fullname, emp_acc_type, message)
         VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([
        $_SESSION['user_id'],
        $_SESSION['full_name'],
        ucfirst($_SESSION['role']),
        $message
    ]);

    echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
exit;
