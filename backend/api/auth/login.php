<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data     = json_decode(file_get_contents('php://input'), true);
$login    = trim($data['username'] ?? '');  // username or email
$password = $data['password'] ?? '';

if (!$login || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Username/email and password are required']);
    exit;
}

$db = getDB();

// ── Lookup account ────────────────────────────────────────────────────────────
$stmt = $db->prepare('SELECT * FROM fch_employees WHERE emp_username = ? LIMIT 1');
$stmt->execute([$login]);
$user = $stmt->fetch();

if (!$user && filter_var($login, FILTER_VALIDATE_EMAIL)) {
    $stmt = $db->prepare('SELECT * FROM fch_employees WHERE emp_email = ? LIMIT 1');
    $stmt->execute([$login]);
    $user = $stmt->fetch();
}

// If the account does not exist at all, return a clear message with no lockout tracking
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Account does not exist.']);
    exit;
}

// ── Check if account is permanently locked ────────────────────────────────────
if (!empty($user['login_locked'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Your account has been locked due to too many failed login attempts. Please contact the administrator to unlock it.']);
    exit;
}

// ── Check temporary timeout ───────────────────────────────────────────────────
if (!empty($user['login_locked_until'])) {
    $lockedUntil = new DateTime($user['login_locked_until']);
    $now         = new DateTime();
    if ($now < $lockedUntil) {
        $waitSec  = $lockedUntil->getTimestamp() - $now->getTimestamp();
        $waitMins = ceil($waitSec / 60);
        http_response_code(429);
        echo json_encode(['error' => "Too many failed login attempts. Please wait {$waitMins} minute(s) before trying again."]);
        exit;
    }
    // Timeout expired — clear it but keep fail count (so 3 more wrong = lock)
    $db->prepare("UPDATE fch_employees SET login_locked_until = NULL WHERE employee_id = ?")
       ->execute([$user['employee_id']]);
    $user['login_locked_until'] = null;
}

// ── Password check: support both bcrypt and legacy plain-text ────────────────
$stored     = $user['emp_pass'];
$passwordOk = false;
if (str_starts_with($stored, '$2y$')) {
    $passwordOk = password_verify($password, $stored);
} else {
    $passwordOk = ($stored === $password);
    if ($passwordOk) {
        // Silently upgrade to bcrypt
        $newHash = password_hash($password, PASSWORD_BCRYPT);
        $db->prepare("UPDATE fch_employees SET emp_pass = ? WHERE employee_id = ?")
           ->execute([$newHash, $user['employee_id']]);
    }
}

if (!$passwordOk) {
    // Increment per-account fail counter
    $newFails = (int)($user['login_fail_count'] ?? 0) + 1;

    if ($newFails >= 6) {
        // Permanently lock the account
        $db->prepare("UPDATE fch_employees SET login_fail_count = ?, login_locked = 1 WHERE employee_id = ?")
           ->execute([$newFails, $user['employee_id']]);
        http_response_code(403);
        echo json_encode(['error' => 'Your account has been permanently locked due to too many failed login attempts. Please contact the administrator.']);

    } elseif ($newFails === 3) {
        // First threshold — apply 5-minute timeout (only at exactly 3 fails, not repeatedly)
        $lockedUntil = (new DateTime())->modify('+5 minutes')->format('Y-m-d H:i:s');
        $db->prepare("UPDATE fch_employees SET login_fail_count = ?, login_locked_until = ? WHERE employee_id = ?")
           ->execute([$newFails, $lockedUntil, $user['employee_id']]);
        http_response_code(429);
        echo json_encode(['error' => 'Incorrect password. Too many failed attempts — your account is temporarily locked for 5 minutes. After the timeout, 3 more wrong attempts will permanently lock your account.']);

    } else {
        // 1, 2, 4, or 5 fails — track and warn; no new timeout after the first one
        $db->prepare("UPDATE fch_employees SET login_fail_count = ? WHERE employee_id = ?")
           ->execute([$newFails, $user['employee_id']]);
        http_response_code(401);
        if ($newFails < 3) {
            $remaining = 3 - $newFails;
            echo json_encode(['error' => "Incorrect password. {$remaining} attempt(s) remaining before a 5-minute lockout."]);
        } else {
            // 4 or 5 fails (after timeout has expired)
            $remaining = 6 - $newFails;
            echo json_encode(['error' => "Incorrect password. {$remaining} more wrong attempt(s) will permanently lock your account."]);
        }
    }
    exit;
}

// ── Successful login — reset lockout counters ─────────────────────────────────
$db->prepare("UPDATE fch_employees SET login_fail_count = 0, login_locked_until = NULL WHERE employee_id = ?")
   ->execute([$user['employee_id']]);

// Block resigned/terminated accounts
if (in_array($user['emp_emptype'], ['Resigned', 'Terminated'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Account is inactive']);
    exit;
}

// Block soft-deleted accounts
if (!empty($user['emp_deleted_at'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Account has been removed']);
    exit;
}

$role = strtolower($user['emp_acc_type']);
$displayRole = $role; // role returned to frontend ('management'/'superadmin' stays as-is)
if ($role === 'management' || $role === 'superadmin') $role = 'admin'; // session uses 'admin' so backend API auth checks work

$needsPasswordChange = password_verify('Family Care', $user['emp_pass'])
    || $user['emp_pass'] === 'Family Care'          // covers un-hashed default
    || !empty($user['login_must_change']);           // set after admin-approved password reset
$hasEmail            = !empty($user['emp_email']);

$photoBaseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
$photoUrl     = !empty($user['emp_photo'])
    ? $photoBaseUrl . '/' . ltrim($user['emp_photo'], '/')
    : null;

$isReadOnly = strtolower($user['emp_acc_type'] ?? '') === 'management'; // only management is read-only; superadmin has full write access

$_SESSION['user_id']       = $user['employee_id'];
$_SESSION['username']      = $user['emp_username'];
$_SESSION['full_name']     = $user['emp_fullname'];
$_SESSION['first_name']    = $user['emp_fname'];
$_SESSION['role']          = $role;
$_SESSION['department']    = $user['emp_dept'];
$_SESSION['acc_type']      = $displayRole; // original acc_type for backend privilege distinctions
$_SESSION['is_read_only']  = $isReadOnly ? 1 : 0;
$_SESSION['last_activity'] = time();

echo json_encode([
    'success' => true,
    'user' => [
        'id'                    => $user['employee_id'],
        'username'              => $user['emp_username'],
        'full_name'             => $user['emp_fullname'],
        'first_name'            => $user['emp_fname'],
        'role'                  => $displayRole,
        'department'            => $user['emp_dept'],
        'needs_password_change' => $needsPasswordChange,
        'has_email'             => $hasEmail,
        'email'                 => $user['emp_email'] ?? null,
        'photo_url'             => $photoUrl,
        'is_read_only'          => $isReadOnly,
    ]
]);
