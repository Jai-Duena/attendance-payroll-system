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

// Accept both JSON and multipart/form-data
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'multipart/form-data') !== false || strpos($contentType, 'application/x-www-form-urlencoded') !== false) {
    $data = $_POST;
} else {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
}

// Helper: save uploaded file
function saveUpload(string $field, string $subfolder, string $prefix): ?string {
    if (!isset($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) return null;
    $dir  = __DIR__ . '/../../../uploads/' . $subfolder . '/';
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    $ext  = pathinfo($_FILES[$field]['name'], PATHINFO_EXTENSION);
    $name = $prefix . '_' . uniqid('', true) . '.' . $ext;
    if (move_uploaded_file($_FILES[$field]['tmp_name'], $dir . $name)) {
        return 'uploads/' . $subfolder . '/' . $name;
    }
    return null;
}

// Helper: save base64 canvas drawing
function saveBase64(string $b64, string $subfolder, string $prefix): ?string {
    $b64  = preg_replace('/^data:image\/[a-z]+;base64,/', '', $b64);
    $decoded = base64_decode(str_replace(' ', '+', $b64));
    if (!$decoded) return null;
    $dir  = __DIR__ . '/../../../uploads/' . $subfolder . '/';
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    $name = $prefix . '_' . uniqid('', true) . '.png';
    file_put_contents($dir . $name, $decoded);
    return 'uploads/' . $subfolder . '/' . $name;
}

$pdo    = getDB();
$role   = $_SESSION['role'] ?? 'employee';
$myId   = (int)$_SESSION['user_id'];
$uniqId = (int)($data['uniq_id']       ?? 0);
$empId  = (int)($data['employee_id']   ?? 0);  // may be the new ID if admin is changing it

// Resolve the current employee_id using uniq_id (true PK) so we can handle ID changes
$origEmpId = $empId;
if ($uniqId > 0) {
    $lu = $pdo->prepare("SELECT employee_id FROM fch_employees WHERE uniq_id = ? LIMIT 1");
    $lu->execute([$uniqId]);
    $luRow = $lu->fetch(PDO::FETCH_ASSOC);
    if (!$luRow) {
        http_response_code(404);
        echo json_encode(['error' => 'Employee not found']);
        exit;
    }
    $origEmpId = (int)$luRow['employee_id'];
}

if (!$uniqId && !$origEmpId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing employee_id']);
    exit;
}

// Employees can only update their own profile
if ($role === 'employee' && $origEmpId !== $myId) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// Fetch the target employee's current acc_type for privilege protection
$targetAccType = '';
if ($origEmpId > 0) {
    $tStmt = $pdo->prepare("SELECT emp_acc_type FROM fch_employees WHERE employee_id = ? LIMIT 1");
    $tStmt->execute([$origEmpId]);
    $tRow = $tStmt->fetch(PDO::FETCH_ASSOC);
    $targetAccType = strtolower($tRow['emp_acc_type'] ?? '');
}

// Superadmin-only protection: only superadmin can edit superadmin accounts or assign that role
$myAccType  = strtolower($_SESSION['acc_type'] ?? $role);
$newAccType = strtolower($data['emp_acc_type'] ?? '');
if ($myAccType !== 'superadmin') {
    if ($targetAccType === 'superadmin') {
        http_response_code(403);
        echo json_encode(['error' => 'Only Super Admins can modify Super Admin accounts']);
        exit;
    }
    if ($newAccType === 'superadmin') {
        http_response_code(403);
        echo json_encode(['error' => 'Only Super Admins can assign the Super Admin account type']);
        exit;
    }
}

// ── Hard-delete action (Resigned/Terminated only — removes all data) ────
if (($data['action'] ?? '') === 'hard_delete') {
    if (!in_array($role, ['admin', 'management', 'superadmin'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Only admins can permanently delete employees']);
        exit;
    }
    if ($origEmpId === $myId) {
        http_response_code(400);
        echo json_encode(['error' => 'You cannot delete your own account']);
        exit;
    }
    // Safety: only allow hard-delete for Resigned/Terminated
    $typeRow = $pdo->prepare("SELECT emp_emptype FROM fch_employees WHERE employee_id = ? LIMIT 1");
    $typeRow->execute([$origEmpId]);
    $empRow = $typeRow->fetch(PDO::FETCH_ASSOC);
    if (!$empRow || !in_array($empRow['emp_emptype'], ['Resigned', 'Terminated'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Permanent delete is only allowed for Resigned or Terminated employees']);
        exit;
    }
    try {
        // Delete all related records, then the employee
        $pdo->prepare("DELETE FROM fch_requests    WHERE employee_id = ?")->execute([$origEmpId]);
        $pdo->prepare("DELETE FROM fch_attendance  WHERE employee_id = ?")->execute([$origEmpId]);
        // Payroll rows — table name may vary; attempt both common names
        foreach (['fch_payroll', 'fch_payroll_results', 'fch_payslip'] as $tbl) {
            try { $pdo->prepare("DELETE FROM $tbl WHERE employee_id = ?")->execute([$origEmpId]); } catch (\Exception $e) {}
        }
        // Finally delete the employee record itself
        if ($uniqId > 0) {
            $pdo->prepare("DELETE FROM fch_employees WHERE uniq_id = ?")->execute([$uniqId]);
        } else {
            $pdo->prepare("DELETE FROM fch_employees WHERE employee_id = ?")->execute([$origEmpId]);
        }
        echo json_encode(['success' => true, 'message' => 'Employee and all associated data permanently deleted']);
    } catch (Exception $e) {
        error_log('[fch-employees] hard-delete error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Permanent delete failed: ' . $e->getMessage()]);
    }
    exit;
}

// ── Soft-delete action ──────────────────────────────────────────────────
if (($data['action'] ?? '') === 'delete') {
    if (!in_array($role, ['admin', 'management'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Only admins can delete employees']);
        exit;
    }
    if ($origEmpId === $myId) {
        http_response_code(400);
        echo json_encode(['error' => 'You cannot delete your own account']);
        exit;
    }
    try {
        if ($uniqId > 0) {
            $pdo->prepare("UPDATE fch_employees SET emp_deleted_at = NOW() WHERE uniq_id = ?")
                ->execute([$uniqId]);
        } else {
            $pdo->prepare("UPDATE fch_employees SET emp_deleted_at = NOW() WHERE employee_id = ?")
                ->execute([$origEmpId]);
        }
        echo json_encode(['success' => true, 'message' => 'Employee removed']);
    } catch (Exception $e) {
        error_log('[fch-employees] soft-delete error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Delete failed']);
    }
    exit;
}

try {
    // Ensure emp_emptype ENUM contains all current allowed values
    try {
        $pdo->exec("SET sql_mode = ''");
        $pdo->exec("ALTER TABLE fch_employees MODIFY COLUMN emp_emptype
            ENUM('Regular','Probationary','Trainee','Part-Time','Contractual','Project-based','Resigned','Terminated')
            DEFAULT 'Regular'");
    } catch (\Exception $e) { /* ignore — column already has these values */ }

    $fname  = trim(preg_replace('/[^a-zA-Z\s]/', '', $data['emp_fname']  ?? ''));
    $mname  = trim(preg_replace('/[^a-zA-Z\s]/', '', $data['emp_mname']  ?? ''));
    $lname  = trim(preg_replace('/[^a-zA-Z\s]/', '', $data['emp_lname']  ?? ''));
    $m_init = '';
    if ($mname) {
        foreach (explode(' ', $mname) as $p) {
            if ($p) $m_init .= strtoupper($p[0]) . '.';
        }
    }
    $fullname = $lname . ', ' . $fname . ($m_init ? ' ' . $m_init : '');

    // Check username uniqueness
    $newUsername = trim($data['emp_username'] ?? '');
    if ($newUsername) {
        $chk = $pdo->prepare("SELECT employee_id FROM fch_employees WHERE emp_username = ? AND employee_id != ?");
        $chk->execute([$newUsername, $origEmpId]);
        if ($chk->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Username already taken']);
            exit;
        }
    }

    // Handle photo upload
    $newPhoto = saveUpload('emp_photo', 'photos', 'photo_' . $origEmpId);

    // Handle signature: file takes priority over canvas
    $newSign = saveUpload('signature_file', 'signatures', 'sign_' . $origEmpId);
    if (!$newSign && !empty($data['signature_data'])) {
        $newSign = saveBase64($data['signature_data'], 'signatures', 'sign_' . $origEmpId);
    }

    $sets   = [];
    $params = [];

    // Fields any user can update for own profile
    $sets[] = 'emp_fname = ?';    $params[] = $fname;
    $sets[] = 'emp_mname = ?';    $params[] = $mname;
    // emp_minit is a generated column — MySQL computes it automatically, do NOT write to it
    $sets[] = 'emp_lname = ?';    $params[] = $lname;
    $sets[] = 'emp_fullname = ?'; $params[] = $fullname;
    if ($newUsername) {
        $sets[] = 'emp_username = ?'; $params[] = $newUsername;
    }
    if ($newPhoto) {
        $sets[] = 'emp_photo = ?'; $params[] = $newPhoto;
    }
    if ($newSign) {
        $sets[] = 'emp_sign = ?'; $params[] = $newSign;
    }
    // Sex — any user can update their own
    $genderAllowed = ['Male', 'Female', ''];
    $genderVal = $data['emp_gender'] ?? null;
    if (isset($data['emp_gender'])) {
        try {
            $pdo->exec("ALTER TABLE fch_employees ADD COLUMN IF NOT EXISTS `emp_gender` ENUM('Male','Female') DEFAULT NULL");
            $pdo->exec("ALTER TABLE fch_employees MODIFY COLUMN `emp_gender` ENUM('Male','Female') DEFAULT NULL");
        } catch (\Exception $e) {}
        $sets[] = 'emp_gender = ?'; $params[] = in_array($genderVal, $genderAllowed) ? ($genderVal ?: null) : null;
    }

    // Admin-only fields (dept, position, gov IDs, rate, shift, etc.)
    if (in_array($role, ['admin', 'management', 'superadmin'])) {
        $sets[] = 'emp_dept = ?';       $params[] = $data['emp_dept']      ?? '';
        $sets[] = 'emp_position = ?';   $params[] = $data['emp_position']  ?? '';
        $sets[] = 'emp_acc_type = ?';   $params[] = $data['emp_acc_type']  ?? '';
        $sets[] = 'emp_shift = ?';      $params[] = $data['emp_shift']     ?? '';
        $sets[] = 'emp_dailyrate = ?';  $params[] = $data['emp_dailyrate'] ?? 0;
        // Nullable date/gov ID fields
        $dateHire = trim($data['emp_datehire'] ?? '') ?: null;
        $sssVal   = trim($data['emp_sss']       ?? '') ?: null;
        $pagibig  = trim($data['emp_pagibig']   ?? '') ?: null;
        $philH    = trim($data['emp_philhealth'] ?? '') ?: null;
        $sets[] = 'emp_datehire = ?';   $params[] = $dateHire;
        $sets[] = 'emp_sss = ?';        $params[] = $sssVal;
        $sets[] = 'emp_pagibig = ?';    $params[] = $pagibig;
        $sets[] = 'emp_philhealth = ?'; $params[] = $philH;
        $tinVal = trim($data['emp_tin'] ?? '');
        $sets[] = 'emp_tin = ?';        $params[] = $tinVal ?: null;

        // Employment type: apply immediately or schedule
        $emptypeNew     = $data['emp_emptype']            ?? '';
        $effectiveDateV = trim($data['emptype_effective_date'] ?? '');
        if ($emptypeNew) {
            if (!$effectiveDateV || $effectiveDateV === 'immediate') {
                // Apply now
                $sets[] = 'emp_emptype = ?'; $params[] = $emptypeNew;
            } else {
                // Store as scheduled change — log to fch_employees_shift area or a simple notes field
                // For now: set emp_emptype if the date is today or past, otherwise queue it
                $effectiveDateObj = date_create($effectiveDateV);
                $today = date_create(date('Y-m-d'));
                if ($effectiveDateObj && $effectiveDateObj <= $today) {
                    $sets[] = 'emp_emptype = ?'; $params[] = $emptypeNew;
                } else {
                    // Store pending change in emp_emptype_pending (auto-migrate)
                    $pdo->exec("ALTER TABLE fch_employees ADD COLUMN IF NOT EXISTS emp_emptype_pending VARCHAR(50) NULL");
                    $pdo->exec("ALTER TABLE fch_employees ADD COLUMN IF NOT EXISTS emp_emptype_effective_date DATE NULL");
                    $sets[] = 'emp_emptype_pending = ?';        $params[] = $emptypeNew;
                    $sets[] = 'emp_emptype_effective_date = ?'; $params[] = $effectiveDateV;
                }
            }
        } else {
            $sets[] = 'emp_emptype = ?'; $params[] = $emptypeNew;
        }

        // Password update (admin can reset)
        if (!empty($data['emp_pass'])) {
            $sets[] = 'emp_pass = ?'; $params[] = $data['emp_pass'];
        }

        // Admin can change employee_id (only admins, ID change checked for uniqueness)
        if (in_array($role, ['admin', 'management', 'superadmin']) && $uniqId > 0 && $empId && $empId !== $origEmpId) {
            $chkId = $pdo->prepare("SELECT uniq_id FROM fch_employees WHERE employee_id = ? AND uniq_id != ?");
            $chkId->execute([$empId, $uniqId]);
            if ($chkId->fetch()) {
                http_response_code(409);
                echo json_encode(['error' => 'Employee ID ' . $empId . ' is already in use by another employee']);
                exit;
            }
            $sets[] = 'employee_id = ?'; $params[] = $empId;
        }
    }

    if ($uniqId > 0) {
        $params[] = $uniqId;
        $sql = "UPDATE fch_employees SET " . implode(', ', $sets) . " WHERE uniq_id = ?";
    } else {
        $params[] = $origEmpId;
        $sql = "UPDATE fch_employees SET " . implode(', ', $sets) . " WHERE employee_id = ?";
    }
    $pdo->prepare($sql)->execute($params);

    // Sync shift if admin updated it
    if (in_array($role, ['admin', 'supervisor', 'management'])) {
        $shift = $data['emp_shift'] ?? '';
        $parsed = false;
        // Try HH:MM to HH:MM format (from time pickers)
        if ($shift && preg_match('/^(\d{2}:\d{2})\s+to\s+(\d{2}:\d{2})$/', $shift, $tm)) {
            $ss = $tm[1] . ':00';
            $se = $tm[2] . ':00';
            $parsed = true;
        }
        // Try "H AM to H PM" format
        if (!$parsed && $shift && preg_match('/([\d]{1,2}):?([\d]{2})?\s*(AM|PM)\s+to\s+([\d]{1,2}):?([\d]{2})?\s*(AM|PM)/i', $shift, $m)) {
            $sH = (int)$m[1]; $sMin = $m[2] ? (int)$m[2] : 0; $sAP = strtoupper($m[3]);
            $eH = (int)$m[4]; $eMin = $m[5] ? (int)$m[5] : 0; $eAP = strtoupper($m[6]);
            if ($sAP === 'PM' && $sH !== 12) $sH += 12; elseif ($sAP === 'AM' && $sH === 12) $sH = 0;
            if ($eAP === 'PM' && $eH !== 12) $eH += 12; elseif ($eAP === 'AM' && $eH === 12) $eH = 0;
            $ss = sprintf('%02d:%02d:00', $sH, $sMin);
            $se = sprintf('%02d:%02d:00', $eH, $eMin);
            $parsed = true;
        }
        if ($parsed) {
            $pdo->prepare("DELETE FROM fch_employees_shift WHERE employee_id = ?")->execute([$empId]);
            $pdo->prepare("INSERT INTO fch_employees_shift (employee_id, shift_start, shift_end, date) VALUES (?,?,?,NULL)")->execute([$empId, $ss, $se]);
        }
    }

    echo json_encode(['success' => true, 'message' => 'Employee updated successfully']);
} catch (Exception $e) {
    error_log('[fch-employees] update error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Update failed']);
}
exit;
