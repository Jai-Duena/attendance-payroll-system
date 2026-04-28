<?php
ini_set('display_errors', '0');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

// Must be authenticated and the login_must_change flag must be set
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

$data        = json_decode(file_get_contents('php://input'), true) ?? [];
$newPassword = trim($data['new_password'] ?? '');
$myId        = (int)$_SESSION['user_id'];

if (!$newPassword) {
    http_response_code(400);
    echo json_encode(['error' => 'new_password is required']);
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
    // Verify this account actually requires a forced change
    $stmt = $pdo->prepare("SELECT login_must_change, emp_pass FROM fch_employees WHERE employee_id = ?");
    $stmt->execute([$myId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Account not found']);
        exit;
    }

    $hasDefaultPassword = password_verify('Family Care', $user['emp_pass'])
        || $user['emp_pass'] === 'Family Care';

    if (empty($user['login_must_change']) && !$hasDefaultPassword) {
        http_response_code(403);
        echo json_encode(['error' => 'No forced password change is required for this account']);
        exit;
    }

    $hashed = password_hash($newPassword, PASSWORD_BCRYPT);
    $pdo->prepare("UPDATE fch_employees SET emp_pass = ?, login_must_change = 0, login_fail_count = 0 WHERE employee_id = ?")
        ->execute([$hashed, $myId]);

    // Destroy session so user must re-login with new password
    $_SESSION = [];
    session_destroy();

    echo json_encode(['success' => true, 'message' => 'Password changed. Please log in with your new password.']);
} catch (Exception $e) {
    error_log('[fch-auth] force-change-password error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An internal error occurred']);
}
exit;
