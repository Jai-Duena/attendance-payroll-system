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
if (!in_array($role, ['admin', 'supervisor'])) {
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

if (empty($_FILES['dtr_file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded. Use field name "dtr_file".']);
    exit;
}

$file = $_FILES['dtr_file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'File upload error code: ' . $file['error']]);
    exit;
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, ['txt', 'dat'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Only .txt and .dat files are accepted.']);
    exit;
}

$lines    = file($file['tmp_name'], FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if ($lines === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not read uploaded file.']);
    exit;
}

$pdo      = getDB();
$inserted = 0;
$skipped  = 0;
$errors   = [];

try {
    // Use INSERT IGNORE to silently skip exact duplicates (same employee_id + punch_time)
    $stmt = $pdo->prepare(
        "INSERT IGNORE INTO fch_punches (employee_id, punch_time, processed)
         VALUES (?, ?, 0)"
    );

    foreach ($lines as $lineNum => $rawLine) {
        // Normalize whitespace — biometric files may use tabs or multiple spaces
        $line = trim(preg_replace('/\s+/', ' ', $rawLine));
        if ($line === '') continue;

        // Format (matches FCH upload_dtr.php):
        //   col[0] = employee_id
        //   col[1] = YYYY-MM-DD
        //   col[2] = HH:MM:SS
        $cols = explode(' ', $line);

        if (count($cols) < 3) {
            $errors[] = 'Line ' . ($lineNum + 1) . ': expected 3 columns, got ' . count($cols);
            $skipped++;
            continue;
        }

        $employeeId = intval($cols[0]);
        $punchTime  = $cols[1] . ' ' . $cols[2]; // YYYY-MM-DD HH:MM:SS

        if (!$employeeId || !strtotime($punchTime)) {
            $errors[] = 'Line ' . ($lineNum + 1) . ": invalid data '" . $line . "'";
            $skipped++;
            continue;
        }

        $stmt->execute([$employeeId, $punchTime]);
        if ($stmt->rowCount() > 0) {
            $inserted++;
        } else {
            $skipped++; // duplicate ignored
        }
    }

    $response = [
        'success'  => true,
        'inserted' => $inserted,
        'skipped'  => $skipped,
        'message'  => "Upload complete. {$inserted} record(s) inserted, {$skipped} skipped.",
    ];

    if (!empty($errors)) {
        $response['parse_errors'] = array_slice($errors, 0, 20); // cap at 20
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
