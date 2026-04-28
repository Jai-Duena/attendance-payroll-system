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

$role = $_SESSION['role'] ?? 'employee';
if ($role !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}
if (!empty($_SESSION['is_read_only'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: your account has read-only access']);
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

// Helper: save uploaded file (photo or signature)
function saveUpload(string $field, string $subfolder, string $prefix): ?string {
    if (!isset($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) return null;
    $dir = __DIR__ . '/../../../uploads/' . $subfolder . '/';
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
    $data = base64_decode(str_replace(' ', '+', $b64));
    if (!$data) return null;
    $dir  = __DIR__ . '/../../../uploads/' . $subfolder . '/';
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    $name = $prefix . '_' . uniqid('', true) . '.png';
    file_put_contents($dir . $name, $data);
    return 'uploads/' . $subfolder . '/' . $name;
}

$required = ['emp_fname', 'emp_lname', 'emp_username', 'emp_acc_type', 'employee_id'];
foreach ($required as $f) {
    if (empty($data[$f])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $f"]);
        exit;
    }
}
if (!isset($data['emp_dailyrate']) || $data['emp_dailyrate'] === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Daily rate is required.']);
    exit;
}

$pdo = getDB();

try {
    $empId = $data['employee_id'];

    // Check duplicate employee_id
    $chk = $pdo->prepare("SELECT employee_id FROM fch_employees WHERE employee_id = ?");
    $chk->execute([$empId]);
    if ($chk->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Employee ID already exists']);
        exit;
    }

    // Check duplicate username
    $chk2 = $pdo->prepare("SELECT employee_id FROM fch_employees WHERE emp_username = ?");
    $chk2->execute([$data['emp_username']]);
    if ($chk2->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Username already taken']);
        exit;
    }

    // Sanitize names (letters + spaces only)
    $fname  = trim(preg_replace('/[^a-zA-Z\s]/', '', $data['emp_fname']  ?? ''));
    $mname  = trim(preg_replace('/[^a-zA-Z\s]/', '', $data['emp_mname']  ?? ''));
    $lname  = trim(preg_replace('/[^a-zA-Z\s]/', '', $data['emp_lname']  ?? ''));

    // Auto-generate middle initial
    $m_init = '';
    if ($mname) {
        foreach (explode(' ', $mname) as $p) {
            if ($p) $m_init .= strtoupper($p[0]) . '.';
        }
    }
    $fullname = $lname . ', ' . $fname . ($m_init ? ' ' . $m_init : '');

    // max uniq_id
    $maxStmt = $pdo->query("SELECT MAX(uniq_id) FROM fch_employees");
    $uniqId  = (int)$maxStmt->fetchColumn() + 1;

    // Handle profile photo upload
    $photoPath = saveUpload('emp_photo', 'photos', 'photo_' . $empId);

    // Handle signature: uploaded file takes priority over canvas data
    $signPath = saveUpload('signature_file', 'signatures', 'sign_' . $empId);
    if (!$signPath && !empty($data['signature_data'])) {
        $signPath = saveBase64($data['signature_data'], 'signatures', 'sign_' . $empId);
    }

    $tinVal         = trim($data['emp_tin']        ?? '') ?: null;
    $datehireVal    = trim($data['emp_datehire']    ?? '') ?: null;
    $sssVal         = trim($data['emp_sss']         ?? '') ?: null;
    $pagibigVal     = trim($data['emp_pagibig']     ?? '') ?: null;
    $philhealthVal  = trim($data['emp_philhealth']  ?? '') ?: null;
    // Use default password if none provided
    $passVal        = !empty($data['emp_pass']) ? $data['emp_pass'] : 'Family Care';
    $emptypeVal     = trim($data['emp_emptype']     ?? '') ?: 'Regular';

    // emp_minit is a STORED generated column — MariaDB computes it from emp_mname automatically
    // Migrate gender column if needed
    try {
        $pdo->exec("ALTER TABLE fch_employees ADD COLUMN IF NOT EXISTS `emp_gender` ENUM('Male','Female') DEFAULT NULL");
        $pdo->exec("ALTER TABLE fch_employees MODIFY COLUMN `emp_gender` ENUM('Male','Female') DEFAULT NULL");
    } catch (\Exception $e) {}
    $genderVal = trim($data['emp_gender'] ?? '');
    $genderAllowed = ['Male', 'Female'];
    $genderVal = in_array($genderVal, $genderAllowed) ? $genderVal : null;

    $stmt = $pdo->prepare(
        "INSERT INTO fch_employees
            (uniq_id, emp_fname, emp_mname, emp_lname, emp_fullname,
             emp_dept, emp_position, emp_datehire, emp_sss, emp_pagibig,
             emp_philhealth, emp_tin, emp_username, emp_pass, emp_acc_type,
             emp_emptype, employee_id, emp_dailyrate, emp_shift, emp_sign, emp_photo, emp_gender)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    );
    $stmt->execute([
        $uniqId, $fname, $mname, $lname, $fullname,
        $data['emp_dept']     ?? '',
        $data['emp_position'] ?? '',
        $datehireVal,
        $sssVal,
        $pagibigVal,
        $philhealthVal,
        $tinVal,
        $data['emp_username'],
        $passVal,
        $data['emp_acc_type'],
        $emptypeVal,
        $empId,
        $data['emp_dailyrate'] ?? 0,
        $data['emp_shift']     ?? '',
        $signPath,
        $photoPath,
        $genderVal,
    ]);

    // Sync shift to fch_employees_shift
    $shift = $data['emp_shift'] ?? '';
    if ($shift && preg_match('/(\d{1,2}):?(\d{2})?\s*(AM|PM)\s+to\s+(\d{1,2}):?(\d{2})?\s*(AM|PM)/i', $shift, $m)) {
        $sH = (int)$m[1]; $sMin = $m[2] ? (int)$m[2] : 0; $sAP = strtoupper($m[3]);
        $eH = (int)$m[4]; $eMin = $m[5] ? (int)$m[5] : 0; $eAP = strtoupper($m[6]);
        if ($sAP === 'PM' && $sH !== 12) $sH += 12; elseif ($sAP === 'AM' && $sH === 12) $sH = 0;
        if ($eAP === 'PM' && $eH !== 12) $eH += 12; elseif ($eAP === 'AM' && $eH === 12) $eH = 0;
        $ss = sprintf('%02d:%02d:00', $sH, $sMin);
        $se = sprintf('%02d:%02d:00', $eH, $eMin);
        $pdo->prepare("DELETE FROM fch_employees_shift WHERE employee_id = ?")->execute([$empId]);
        $pdo->prepare("INSERT INTO fch_employees_shift (employee_id, shift_start, shift_end, date) VALUES (?,?,?,NULL)")->execute([$empId, $ss, $se]);
    }

    echo json_encode(['success' => true, 'message' => 'Employee created successfully', 'employee_id' => $empId]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
