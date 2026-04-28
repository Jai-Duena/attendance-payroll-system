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

$role   = $_SESSION['role']       ?? 'employee';
$userId = (int)$_SESSION['user_id'];
$dept   = $_SESSION['department'] ?? '';

$pdo = getDB();

// ── Auto-migrate: add shift_label column if not present ──────────────────────
try {
    $col = $pdo->query("SHOW COLUMNS FROM `fch_employees_shift` LIKE 'shift_label'")->fetchColumn();
    if (!$col) {
        $pdo->exec("ALTER TABLE `fch_employees_shift` ADD COLUMN `shift_label` VARCHAR(100) DEFAULT NULL");
    }
} catch (Exception $e) { /* non-fatal */ }

$method = $_SERVER['REQUEST_METHOD'];

// ── GET ─────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $from  = trim($_GET['from']        ?? '');
    $to    = trim($_GET['to']          ?? '');
    $empId = isset($_GET['employee_id']) ? (int)$_GET['employee_id'] : null;
    $deptQ = trim($_GET['dept']         ?? '');

    if (!$from || !$to) {
        http_response_code(400);
        echo json_encode(['error' => 'from and to dates are required']);
        exit;
    }

    // Validate date format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid date format']);
        exit;
    }

    // Employee can only see their own schedule
    if ($role === 'employee') {
        // Resolve to the logged-in employee's ID
        $stmt = $pdo->prepare("SELECT employee_id FROM fch_employees WHERE employee_id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $empId = (int)($stmt->fetchColumn() ?: $userId);
    }

    // Supervisor: enforce own dept
    if ($role === 'supervisor') {
        if ($deptQ && $deptQ !== $dept) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
        if (!$empId) $deptQ = $dept;
    }

    $where  = ['s.date BETWEEN ? AND ?'];
    $params = [$from, $to];

    if ($empId !== null) {
        $where[]  = 's.employee_id = ?';
        $params[] = $empId;
    } elseif ($deptQ !== '') {
        $where[]  = 'e.emp_dept = ?';
        $params[] = $deptQ;
    }

    $whereSQL = 'WHERE ' . implode(' AND ', $where);

    $stmt = $pdo->prepare(
        "SELECT s.id, s.employee_id, e.emp_fullname, e.emp_dept,
                s.shift_start, s.shift_end, s.shift_label, s.date
         FROM fch_employees_shift s
         JOIN fch_employees e ON e.employee_id = s.employee_id
         $whereSQL
           AND e.emp_deleted_at IS NULL
         ORDER BY e.emp_fullname ASC, s.date ASC"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Normalize time strings to HH:MM
    foreach ($rows as &$row) {
        $row['shift_start'] = substr($row['shift_start'], 0, 5);
        $row['shift_end']   = substr($row['shift_end'],   0, 5);
    }
    unset($row);

    echo json_encode(['data' => $rows]);
    exit;
}

// Write operations require privileged role
if (!in_array($role, ['admin', 'supervisor', 'management', 'superadmin'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// ── POST: upsert entries ─────────────────────────────────────────────────────
if ($method === 'POST') {
    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $entries = $body['entries'] ?? [];

    if (empty($entries) || !is_array($entries)) {
        http_response_code(400);
        echo json_encode(['error' => 'entries array is required']);
        exit;
    }

    $findStmt   = $pdo->prepare("SELECT id FROM fch_employees_shift WHERE employee_id = ? AND date = ?");
    $updateStmt = $pdo->prepare("UPDATE fch_employees_shift SET shift_start = ?, shift_end = ?, shift_label = ? WHERE id = ?");
    $insertStmt = $pdo->prepare("INSERT INTO fch_employees_shift (employee_id, shift_start, shift_end, shift_label, date) VALUES (?, ?, ?, ?, ?)");

    // Supervisor dept lookup cache (avoid repeated queries)
    $deptCache = [];
    $getDept = function(int $id) use ($pdo, &$deptCache): string {
        if (!isset($deptCache[$id])) {
            $s = $pdo->prepare("SELECT emp_dept FROM fch_employees WHERE employee_id = ? LIMIT 1");
            $s->execute([$id]);
            $deptCache[$id] = (string)($s->fetchColumn() ?: '');
        }
        return $deptCache[$id];
    };

    $processed = 0;
    foreach ($entries as $entry) {
        $empId      = isset($entry['employee_id']) ? (int)$entry['employee_id'] : 0;
        $date       = trim($entry['date']        ?? '');
        $shiftStart = trim($entry['shift_start'] ?? '');
        $shiftEnd   = trim($entry['shift_end']   ?? '');
        $shiftLabel = isset($entry['shift_label']) ? (string)$entry['shift_label'] : null;

        if (!$empId || !$date || !$shiftStart || !$shiftEnd) continue;

        // Validate date + time formats
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date))        continue;
        if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $shiftStart)) continue;
        if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $shiftEnd))   continue;

        // Normalize to HH:MM:SS
        $shiftStart = strlen($shiftStart) === 5 ? $shiftStart . ':00' : $shiftStart;
        $shiftEnd   = strlen($shiftEnd)   === 5 ? $shiftEnd   . ':00' : $shiftEnd;

        // Supervisor: only allow own dept
        if ($role === 'supervisor' && $getDept($empId) !== $dept) continue;

        $findStmt->execute([$empId, $date]);
        $existing = $findStmt->fetchColumn();

        if ($existing) {
            $updateStmt->execute([$shiftStart, $shiftEnd, $shiftLabel, (int)$existing]);
        } else {
            $insertStmt->execute([$empId, $shiftStart, $shiftEnd, $shiftLabel, $date]);
        }
        $processed++;
    }

    echo json_encode(['success' => true, 'processed' => $processed]);
    exit;
}

// ── DELETE: remove a specific date override ──────────────────────────────────
if ($method === 'DELETE') {
    $body  = json_decode(file_get_contents('php://input'), true) ?? [];
    $empId = isset($body['employee_id']) ? (int)$body['employee_id'] : 0;
    $date  = trim($body['date'] ?? '');

    if (!$empId || !$date) {
        http_response_code(400);
        echo json_encode(['error' => 'employee_id and date are required']);
        exit;
    }

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid date format']);
        exit;
    }

    // Supervisor: only allow own dept
    if ($role === 'supervisor') {
        $s = $pdo->prepare("SELECT emp_dept FROM fch_employees WHERE employee_id = ? LIMIT 1");
        $s->execute([$empId]);
        $empDept = (string)($s->fetchColumn() ?: '');
        if ($empDept !== $dept) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
    }

    $stmt = $pdo->prepare("DELETE FROM fch_employees_shift WHERE employee_id = ? AND date = ?");
    $stmt->execute([$empId, $date]);

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
