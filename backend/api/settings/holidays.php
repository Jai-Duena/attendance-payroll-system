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

// Only admin may mutate; all authenticated roles can view
$canWrite = in_array($role, ['admin', 'superadmin', 'management']) && empty($_SESSION['is_read_only']);

$method = $_SERVER['REQUEST_METHOD'];
$pdo    = getDB();

// ── Ensure table exists ───────────────────────────────────────────────────────
$pdo->exec("
    CREATE TABLE IF NOT EXISTS `fch_holidays` (
      `holiday_date` date NOT NULL,
      `holiday_type` varchar(20) NOT NULL DEFAULT 'Regular',
      `holiday_name` varchar(100) NOT NULL,
      PRIMARY KEY (`holiday_date`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
");

// ── GET: list holidays ────────────────────────────────────────────────────────
if ($method === 'GET') {
    $year = isset($_GET['year']) ? (int)$_GET['year'] : null;

    if ($year) {
        $stmt = $pdo->prepare(
            "SELECT holiday_date, holiday_type, holiday_name
             FROM fch_holidays
             WHERE YEAR(holiday_date) = ?
             ORDER BY holiday_date ASC"
        );
        $stmt->execute([$year]);
    } else {
        $stmt = $pdo->query(
            "SELECT holiday_date, holiday_type, holiday_name
             FROM fch_holidays
             ORDER BY holiday_date ASC"
        );
    }

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $rows]);
    exit;
}

// ── Write operations require admin ────────────────────────────────────────────
if (!$canWrite) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: write access requires admin role']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];

// ── POST: create holiday ──────────────────────────────────────────────────────
if ($method === 'POST') {
    $date = trim($body['holiday_date'] ?? '');
    $type = trim($body['holiday_type'] ?? '');
    $name = trim($body['holiday_name'] ?? '');

    if (!$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        http_response_code(400);
        echo json_encode(['error' => 'holiday_date is required (YYYY-MM-DD)']);
        exit;
    }
    if (!in_array($type, ['Regular', 'Special Non-working', 'Special Working'], true)) {
        http_response_code(400);
        echo json_encode(['error' => 'holiday_type must be Regular, Special Non-working, or Special Working']);
        exit;
    }
    if ($name === '') {
        http_response_code(400);
        echo json_encode(['error' => 'holiday_name is required']);
        exit;
    }

    $stmt = $pdo->prepare(
        "INSERT INTO fch_holidays (holiday_date, holiday_type, holiday_name)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE holiday_type = VALUES(holiday_type), holiday_name = VALUES(holiday_name)"
    );
    $stmt->execute([$date, $type, $name]);
    echo json_encode(['success' => true, 'message' => 'Holiday saved.']);
    exit;
}

// ── PUT: update holiday ───────────────────────────────────────────────────────
if ($method === 'PUT') {
    $date = trim($body['holiday_date'] ?? '');
    $type = trim($body['holiday_type'] ?? '');
    $name = trim($body['holiday_name'] ?? '');

    if (!$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        http_response_code(400);
        echo json_encode(['error' => 'holiday_date is required (YYYY-MM-DD)']);
        exit;
    }
    if (!in_array($type, ['Regular', 'Special Non-working', 'Special Working'], true)) {
        http_response_code(400);
        echo json_encode(['error' => 'holiday_type must be Regular, Special Non-working, or Special Working']);
        exit;
    }
    if ($name === '') {
        http_response_code(400);
        echo json_encode(['error' => 'holiday_name is required']);
        exit;
    }

    // Check if the holiday_date (PK) is being changed via old_date param
    $oldDate = trim($body['old_holiday_date'] ?? $date);
    if ($oldDate !== $date) {
        // PK is changing — delete old, insert new
        $pdo->prepare("DELETE FROM fch_holidays WHERE holiday_date = ?")->execute([$oldDate]);
        $stmt = $pdo->prepare(
            "INSERT INTO fch_holidays (holiday_date, holiday_type, holiday_name) VALUES (?, ?, ?)"
        );
        $stmt->execute([$date, $type, $name]);
    } else {
        $stmt = $pdo->prepare(
            "UPDATE fch_holidays SET holiday_type = ?, holiday_name = ? WHERE holiday_date = ?"
        );
        $stmt->execute([$type, $name, $date]);
    }

    echo json_encode(['success' => true, 'message' => 'Holiday updated.']);
    exit;
}

// ── DELETE: remove holiday ────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $date = trim($body['holiday_date'] ?? '');
    if (!$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        http_response_code(400);
        echo json_encode(['error' => 'holiday_date is required (YYYY-MM-DD)']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM fch_holidays WHERE holiday_date = ?");
    $stmt->execute([$date]);
    echo json_encode(['success' => true, 'message' => 'Holiday deleted.']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
