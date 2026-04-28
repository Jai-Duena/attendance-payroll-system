<?php
ini_set('display_errors', '0');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

$pdo   = getDB();
$token = trim($_GET['token'] ?? '');

if (!$token) {
    die('<h2 style="color:red;text-align:center;margin-top:80px">Invalid verification link.</h2>');
}

try {
    $now  = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("SELECT employee_id, emp_email_pending FROM fch_employees WHERE emp_email_token = ? AND emp_email_token_expiry > ?");
    $stmt->execute([$token, $now]);
    $emp = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$emp) {
        die('<div style="text-align:center;margin-top:80px;font-family:sans-serif"><h2 style="color:red">Link expired or invalid.</h2><p><a href="http://localhost:5173">Return to App</a></p></div>');
    }

    $newEmail = $emp['emp_email_pending'];
    $userId   = $emp['employee_id'];

    $pdo->prepare("UPDATE fch_employees SET emp_email = ?, emp_email_pending = NULL, emp_email_token = NULL, emp_email_token_expiry = NULL WHERE employee_id = ?")
        ->execute([$newEmail, $userId]);

    // Redirect to the SPA with a success param
    header('Location: http://localhost:5173/?email_verified=1');
    exit;
} catch (Exception $e) {
    die('<h2 style="color:red;text-align:center;margin-top:80px">Verification failed: ' . htmlspecialchars($e->getMessage()) . '</h2>');
}
