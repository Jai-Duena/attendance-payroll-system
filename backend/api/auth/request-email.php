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

$data  = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim($data['email'] ?? '');
$myId  = (int)$_SESSION['user_id'];

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit;
}

$pdo = getDB();

try {
    // Check email not already taken by someone else
    $chk = $pdo->prepare("SELECT employee_id FROM fch_employees WHERE emp_email = ? AND employee_id != ?");
    $chk->execute([$email, $myId]);
    if ($chk->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Email is already in use by another account']);
        exit;
    }

    // Rate limit: prevent resend if a code was sent less than 1 minute ago
    $cur = $pdo->prepare("SELECT emp_email_token, emp_email_token_expiry, emp_email_pending FROM fch_employees WHERE employee_id = ?");
    $cur->execute([$myId]);
    $row = $cur->fetch(PDO::FETCH_ASSOC);
    // Only honour the rate limit if the stored token is a valid 6-digit OTP.
    // Old SHA-256 link-based tokens (64 hex chars) must be ignored and cleared.
    $tokenIsValid = $row
        && !empty($row['emp_email_token'])
        && preg_match('/^\d{6}$/', $row['emp_email_token'])
        && !empty($row['emp_email_token_expiry']);

    if (!$tokenIsValid && $row && !empty($row['emp_email_token'])) {
        // Stale / legacy token — wipe it so the user can proceed immediately
        $pdo->prepare("UPDATE fch_employees SET emp_email_pending = NULL, emp_email_token = NULL, emp_email_token_expiry = NULL WHERE employee_id = ?")
            ->execute([$myId]);
        $row['emp_email_token']        = null;
        $row['emp_email_token_expiry'] = null;
        $row['emp_email_pending']      = null;
    }

    if ($tokenIsValid) {
        $expiryTs = strtotime($row['emp_email_token_expiry']);
        if ($expiryTs > (time() + 9 * 60)) {
            // Same email already pending — let user proceed to code entry
            if ($row['emp_email_pending'] === $email) {
                echo json_encode([
                    'success' => true,
                    'pending' => true,
                    'message' => 'A code was already sent to ' . $email . '. Please check your inbox.',
                ]);
            } else {
                // Different email requested — enforce rate limit
                http_response_code(429);
                echo json_encode(['error' => 'RATE_LIMIT: A code was recently sent. Please wait 1 minute before requesting a new one.']);
            }
            exit;
        }
    }

    // Get user details
    $user = $pdo->prepare("SELECT emp_fname, emp_lname FROM fch_employees WHERE employee_id = ?");
    $user->execute([$myId]);
    $emp = $user->fetch(PDO::FETCH_ASSOC);

    // Generate 6-digit OTP code
    $code   = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    // Save token BEFORE sending email
    $pdo->prepare("UPDATE fch_employees SET emp_email_pending = ?, emp_email_token = ?, emp_email_token_expiry = ? WHERE employee_id = ?")
        ->execute([$email, $code, $expiry, $myId]);

    // Send verification email — on failure, roll back the token so user can retry immediately
    require_once __DIR__ . '/../../config/mail.php';
    $mail = getMailer();
    try {
        $mail->addAddress($email);
        $mail->Subject = 'Your Email Verification Code – FamilyCare System';
        $mail->Body    = "
            <div style='font-family:sans-serif;max-width:460px;margin:0 auto;padding:24px'>
                <h2 style='color:#2563eb;margin-bottom:8px'>Email Verification</h2>
                <p>Hello {$emp['emp_fname']} {$emp['emp_lname']},</p>
                <p>Enter the code below in the app to verify your email address. It expires in <strong>10 minutes</strong>.</p>
                <div style='font-size:40px;font-weight:bold;letter-spacing:12px;text-align:center;background:#f0f4ff;border-radius:10px;padding:24px 0;margin:24px 0;color:#1d4ed8'>
                    {$code}
                </div>
                <p style='color:#6b7280;font-size:13px'>If you did not request this, you can safely ignore this email.</p>
            </div>
        ";
        $mail->send();
    } catch (Exception $mailEx) {
        // Roll back token so the user is not rate-limited on retry
        $pdo->prepare("UPDATE fch_employees SET emp_email_pending = NULL, emp_email_token = NULL, emp_email_token_expiry = NULL WHERE employee_id = ?")
            ->execute([$myId]);
        http_response_code(500);
        echo json_encode(['error' => 'Could not send the email. Check your address and try again. (' . $mail->ErrorInfo . ')']);
        exit;
    }

    echo json_encode(['success' => true, 'message' => 'A 6-digit verification code has been sent to ' . $email . '. It expires in 10 minutes.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
