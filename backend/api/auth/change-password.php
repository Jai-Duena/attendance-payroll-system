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

$data            = json_decode(file_get_contents('php://input'), true) ?? [];
$currentPassword = $data['current_password'] ?? '';
$newPassword     = $data['new_password']     ?? '';
$myId            = (int)$_SESSION['user_id'];

if (!$currentPassword || !$newPassword) {
    http_response_code(400);
    echo json_encode(['error' => 'current_password and new_password are required']);
    exit;
}

if (strlen($newPassword) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'New password must be at least 6 characters']);
    exit;
}

if ($newPassword === 'Family Care') {
    http_response_code(400);
    echo json_encode(['error' => 'Cannot use the default password']);
    exit;
}

$pdo = getDB();

try {
    $stmt = $pdo->prepare("SELECT emp_pass FROM fch_employees WHERE employee_id = ?");
    $stmt->execute([$myId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Account not found']);
        exit;
    }

    // Verify current password — support both bcrypt and legacy plain-text
    $stored     = $user['emp_pass'];
    $currentOk  = str_starts_with($stored, '$2y$')
        ? password_verify($currentPassword, $stored)
        : ($stored === $currentPassword);

    if (!$currentOk) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect']);
        exit;
    }

    // Always store new password as bcrypt and clear any forced-change flags
    $hashed = password_hash($newPassword, PASSWORD_BCRYPT);
    $pdo->prepare("UPDATE fch_employees SET emp_pass = ?, login_must_change = 0 WHERE employee_id = ?")
        ->execute([$hashed, $myId]);

    // Destroy session so user must re-login
    $_SESSION = [];
    session_destroy();

    echo json_encode(['success' => true, 'message' => 'Password changed. Please log in with your new password.']);
} catch (Exception $e) {
    error_log('[fch-auth] change-password error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An internal error occurred']);
}
exit;
