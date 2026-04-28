<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

// Public — no session required
$method = $_SERVER['REQUEST_METHOD'];

$db = getDB();

// Ensure table exists
$db->exec("
    CREATE TABLE IF NOT EXISTS fch_password_reset_requests (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        employee_id     INT NULL,
        identifier      VARCHAR(255) NOT NULL,
        message         TEXT NULL,
        status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        temp_password   VARCHAR(255) NULL,
        requested_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at     DATETIME NULL,
        resolved_by_id  INT NULL,
        resolved_by     VARCHAR(255) NULL,
        INDEX idx_status (status),
        INDEX idx_employee (employee_id)
    )
");

// POST — submit a reset ticket (by the user)
if ($method === 'POST') {
    $data       = json_decode(file_get_contents('php://input'), true);
    $identifier = trim($data['identifier'] ?? '');
    $message    = trim($data['message']    ?? '');

    if (!$identifier) {
        http_response_code(400);
        echo json_encode(['error' => 'Username or email is required']);
        exit;
    }

    // Look up employee
    $stmt = $db->prepare('SELECT employee_id FROM fch_employees WHERE emp_username = ? OR emp_email = ? LIMIT 1');
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();

    // Don't reveal whether account exists — insert either way (to prevent enumeration)
    $empId = $user ? $user['employee_id'] : null;

    // Check for existing pending request (rate limit: 1 per hour per identifier)
    $check = $db->prepare("SELECT id FROM fch_password_reset_requests WHERE identifier = ? AND status = 'pending' AND requested_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
    $check->execute([$identifier]);
    if ($check->fetch()) {
        echo json_encode(['success' => true, 'message' => 'A reset request has already been submitted. Please wait for the admin to process it.']);
        exit;
    }

    $db->prepare("INSERT INTO fch_password_reset_requests (employee_id, identifier, message) VALUES (?, ?, ?)")
       ->execute([$empId, $identifier, $message]);

    echo json_encode(['success' => true, 'message' => 'Your password reset request has been submitted. The administrator will review and respond to it shortly.']);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
exit;
