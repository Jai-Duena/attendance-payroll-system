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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$code = trim($data['code'] ?? '');
$myId = (int)$_SESSION['user_id'];

if (!$code || !preg_match('/^\d{6}$/', $code)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter a valid 6-digit code.']);
    exit;
}

$pdo = getDB();

try {
    $now  = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("SELECT emp_email_pending, emp_email_token, emp_email_token_expiry FROM fch_employees WHERE employee_id = ?");
    $stmt->execute([$myId]);
    $emp = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$emp || !$emp['emp_email_token']) {
        http_response_code(400);
        echo json_encode(['error' => 'No verification code found. Please request a new one.']);
        exit;
    }

    if ($emp['emp_email_token_expiry'] < $now) {
        http_response_code(410);
        echo json_encode(['error' => 'Code has expired. Please request a new one.']);
        exit;
    }

    if (!hash_equals($emp['emp_email_token'], $code)) {
        http_response_code(422);
        echo json_encode(['error' => 'Incorrect code. Please try again.']);
        exit;
    }

    $newEmail = $emp['emp_email_pending'];
    $pdo->prepare("UPDATE fch_employees SET emp_email = ?, emp_email_pending = NULL, emp_email_token = NULL, emp_email_token_expiry = NULL WHERE employee_id = ?")
        ->execute([$newEmail, $myId]);

    echo json_encode(['success' => true, 'message' => 'Email address verified successfully!', 'email' => $newEmail]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Verification failed: ' . $e->getMessage()]);
}
exit;
