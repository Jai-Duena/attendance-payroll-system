<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// ── Idle session timeout ─────────────────────────────────────────────────────
$idleTimeout = (int)($_ENV['SESSION_LIFETIME'] ?? 1800); // default 30 min
if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > $idleTimeout) {
    $_SESSION = [];
    session_destroy();
    http_response_code(401);
    echo json_encode(['error' => 'Session expired due to inactivity. Please log in again.']);
    exit;
}
$_SESSION['last_activity'] = time();

$pdo    = getDB();
$userId = (int)$_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("SELECT emp_pass, emp_email, emp_photo, emp_fname, login_must_change,
                                  emp_acc_type, emp_dept, emp_emptype
                           FROM fch_employees WHERE employee_id = ?");
    $stmt->execute([$userId]);
    $emp  = $stmt->fetch(PDO::FETCH_ASSOC);

    // ── Stale-session detection ──────────────────────────────────────────────
    // If an admin changed this user's role or department since they logged in,
    // their session is stale. Force re-login so the new permissions take effect.
    if ($emp) {
        $dbAccType = strtolower($emp['emp_acc_type'] ?? '');
        $dbDept    = $emp['emp_dept'] ?? '';
        $sessAccType = strtolower($_SESSION['acc_type'] ?? $_SESSION['role'] ?? '');
        $sessDept    = $_SESSION['department'] ?? '';

        // Normalise: both 'superadmin' and 'management' are stored as-is in acc_type
        if ($dbAccType !== $sessAccType || $dbDept !== $sessDept) {
            $_SESSION = [];
            session_destroy();
            http_response_code(401);
            echo json_encode(['error' => 'Your account details were updated by an administrator. Please log in again.']);
            exit;
        }

        // Also force re-login if the account was resigned/terminated/deleted
        if (in_array($emp['emp_emptype'], ['Resigned', 'Terminated'])) {
            $_SESSION = [];
            session_destroy();
            http_response_code(401);
            echo json_encode(['error' => 'Account is inactive']);
            exit;
        }
    }

    $needsPasswordChange = $emp && (
        $emp['emp_pass'] === 'Family Care'
        || password_verify('Family Care', $emp['emp_pass'] ?? '')
        || !empty($emp['login_must_change'])
    );
    $hasEmail            = $emp && !empty($emp['emp_email']);
    $isReadOnly          = !empty($_SESSION['is_read_only']);
    // Return the original acc_type as role (e.g. 'management' instead of the
    // session 'admin') so the frontend can route to the correct view.
    $displayRole = strtolower($emp['emp_acc_type'] ?? '') ?: $_SESSION['role'];

    $photoBaseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
    // emp_photo is stored as 'uploads/photos/filename.ext' — matches the pattern used by the frontend profile page
    $photoUrl     = ($emp && !empty($emp['emp_photo']))
        ? $photoBaseUrl . '/' . ltrim($emp['emp_photo'], '/')
        : null;

    echo json_encode([
        'user' => [
            'id'                    => $_SESSION['user_id'],
            'username'              => $_SESSION['username'],
            'full_name'             => $_SESSION['full_name'],
            'first_name'            => $emp['emp_fname'] ?? '',
            'role'                  => $displayRole,
            'department'            => $_SESSION['department'],
            'needs_password_change' => $needsPasswordChange,
            'has_email'             => $hasEmail,
            'email'                 => $emp['emp_email'] ?? null,
            'photo_url'             => $photoUrl,
            'is_read_only'          => $isReadOnly,
        ]
    ]);
} catch (Exception $e) {
    error_log('[fch-auth] me.php error: ' . $e->getMessage());
    echo json_encode([
        'user' => [
            'id'                    => $_SESSION['user_id'],
            'username'              => $_SESSION['username'],
            'full_name'             => $_SESSION['full_name'],
            'first_name'            => $_SESSION['first_name'] ?? '',
            'role'                  => $_SESSION['role'],
            'department'            => $_SESSION['department'],
            'needs_password_change' => false,
            'has_email'             => false,
            'email'                 => null,
            'photo_url'             => null,
        ]
    ]);
}
