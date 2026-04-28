<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/mail.php';

// No session required — public endpoint
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data       = json_decode(file_get_contents('php://input'), true);
$identifier = trim($data['identifier'] ?? $data['email'] ?? '');

if (!$identifier) {
    http_response_code(400);
    echo json_encode(['error' => 'Username or email is required']);
    exit;
}

$db = getDB();

// Look up employee by username or email
$stmt = $db->prepare('SELECT employee_id, emp_fullname, emp_email FROM fch_employees WHERE emp_username = ? OR emp_email = ? LIMIT 1');
$stmt->execute([$identifier, $identifier]);
$user = $stmt->fetch();

if (!$user || empty($user['emp_email'])) {
    http_response_code(404);
    echo json_encode(['error' => 'No account with a registered email was found.']);
    exit;
}

// Ensure login_must_change column exists
$cols = $db->query("SHOW COLUMNS FROM fch_employees LIKE 'login_must_change'")->fetchAll();
if (empty($cols)) {
    $db->exec("ALTER TABLE fch_employees ADD COLUMN login_must_change TINYINT(1) NOT NULL DEFAULT 0");
}

// Generate a random 12-character password
$chars    = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$';
$tempPass = '';
for ($i = 0; $i < 12; $i++) {
    $tempPass .= $chars[random_int(0, strlen($chars) - 1)];
}

$hashed = password_hash($tempPass, PASSWORD_BCRYPT);

$db->prepare("UPDATE fch_employees SET emp_pass = ?, login_must_change = 1, login_fail_count = 0, login_locked = 0, login_locked_until = NULL WHERE employee_id = ?")
   ->execute([$hashed, $user['employee_id']]);

// Send email
try {
    $mail = getMailer();
    $mail->addAddress($user['emp_email'], $user['emp_fullname']);
    $mail->Subject = 'Your Temporary Password — Attendance & Payroll System';
    $mail->Body = "
        <div style='font-family:sans-serif;max-width:480px;margin:auto;'>
            <h2 style='color:#2563eb;'>Password Reset</h2>
            <p>Hello, <strong>{$user['emp_fullname']}</strong>,</p>
            <p>A temporary password has been generated for your account. Please use it to log in, then change your password immediately.</p>
            <div style='background:#f1f5f9;border-left:4px solid #2563eb;padding:16px;margin:20px 0;border-radius:6px;'>
                <p style='margin:0;font-size:18px;letter-spacing:2px;font-weight:bold;color:#1e293b;'>{$tempPass}</p>
            </div>
            <p style='color:#ef4444;font-size:13px;'><strong>Important:</strong> You will be required to change this password on your next login. Do not share this password with anyone.</p>
            <p style='color:#64748b;font-size:12px;'>If you did not request this, please contact your administrator immediately.</p>
        </div>
    ";
    $mail->AltBody = "Your temporary password is: {$tempPass}\n\nYou must change it on next login.";
    $mail->send();
} catch (\Exception $e) {
    // Log but don't expose to user
    error_log('[fch-auth] forgot-password email error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email. Please try again or contact your administrator.']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'A temporary password has been sent to your email address. Please check your inbox.']);
