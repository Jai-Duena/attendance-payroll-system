<?php
// PUT /api/requests/update.php
// Supervisor or admin approves / denies a request

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

if (!in_array($_SESSION['role'], ['supervisor', 'admin'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data   = json_decode(file_get_contents('php://input'), true);
$id     = (int)($data['id']     ?? 0);
$status = $data['status'] ?? '';

if (!$id || !in_array($status, ['approved', 'denied'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid request id and status (approved|denied) are required']);
    exit;
}

$db   = getDB();
$stmt = $db->prepare(
    'UPDATE fch_requests
     SET status = ?,
         sup_status = IF(? IN ("supervisor"), ?, sup_status),
         sup_name   = IF(? IN ("supervisor"), ?, sup_name),
         admin_status = IF(? IN ("admin"), ?, admin_status),
         admin_name   = IF(? IN ("admin"), ?, admin_name)
     WHERE uniq_id = ?'
);
$r = $_SESSION['role'];
$n = $_SESSION['full_name'];
$stmt->execute([$status, $r, $status, $r, $n, $r, $status, $r, $n, $id]);

if ($stmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'Request not found']);
    exit;
}

echo json_encode(['success' => true]);
