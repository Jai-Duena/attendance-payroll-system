<?php
ini_set('display_errors', '0');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$pdo    = getDB();
$myId   = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// Auto-add column if not yet present
try {
    $pdo->exec("ALTER TABLE `fch_employees` ADD COLUMN IF NOT EXISTS `emp_email_notifications` TINYINT(1) NOT NULL DEFAULT 0");
} catch (Exception $e) { /* already exists or no privilege */ }

// GET — return current preference
if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT emp_email_notifications, emp_email FROM fch_employees WHERE employee_id = ?");
    $stmt->execute([$myId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode([
        'email_notifications' => (bool)($row['emp_email_notifications'] ?? false),
        'has_email'           => !empty($row['emp_email']),
    ]);
    exit;
}

// POST — update preference
if ($method === 'POST') {
    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $enabled = isset($body['enabled']) ? (bool)$body['enabled'] : false;

    // Cannot enable if no verified email
    if ($enabled) {
        $check = $pdo->prepare("SELECT emp_email FROM fch_employees WHERE employee_id = ?");
        $check->execute([$myId]);
        $email = $check->fetchColumn();
        if (empty($email)) {
            http_response_code(400);
            echo json_encode(['error' => 'You must add a verified email address before enabling email notifications.']);
            exit;
        }
    }

    $pdo->prepare("UPDATE fch_employees SET emp_email_notifications = ? WHERE employee_id = ?")
        ->execute([$enabled ? 1 : 0, $myId]);

    echo json_encode(['success' => true, 'email_notifications' => $enabled]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
