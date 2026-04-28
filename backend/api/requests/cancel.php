<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$db = getDB();
$employeeId = (int)$_SESSION['user_id'];

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$uniq_id = trim($body['uniq_id'] ?? '');

if (!$uniq_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing uniq_id']);
    exit;
}

// Fetch the request — must belong to this employee
$stmt = $db->prepare(
    "SELECT uniq_id, employee_id, status,
            COALESCE(leave_from, ot_date, cs_date, mp_date, wfh_date, other_from_date) AS effective_date
     FROM fch_requests
     WHERE uniq_id = ? AND employee_id = ?
     LIMIT 1"
);
$stmt->execute([$uniq_id, $employeeId]);
$req = $stmt->fetch();

if (!$req) {
    http_response_code(404);
    echo json_encode(['error' => 'Request not found or not yours']);
    exit;
}

// Already cancelled
if ($req['status'] === 'Cancelled') {
    http_response_code(409);
    echo json_encode(['error' => 'Request is already cancelled']);
    exit;
}

// Do not allow cancellation if effective date has already passed
if (!empty($req['effective_date'])) {
    $effectiveDT = new DateTime($req['effective_date']);
    $now = new DateTime();
    // Compare by date only (midnight of effective date)
    $effectiveDT->setTime(0, 0, 0);
    $todayMidnight = (new DateTime())->setTime(0, 0, 0);
    if ($effectiveDT < $todayMidnight) {
        http_response_code(409);
        echo json_encode(['error' => 'Cannot cancel a request whose date has already passed']);
        exit;
    }
}

$update = $db->prepare(
    "UPDATE fch_requests SET status = 'Cancelled', sup_status = 'Cancelled', admin_status = 'Cancelled'
     WHERE uniq_id = ? AND employee_id = ?"
);
$update->execute([$uniq_id, $employeeId]);

echo json_encode(['success' => true]);
?>
exit;
