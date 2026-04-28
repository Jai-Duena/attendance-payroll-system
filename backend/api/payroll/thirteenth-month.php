<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$role = $_SESSION['role'] ?? '';
if (!in_array($role, ['admin', 'supervisor', 'management'], true)) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ─── GET: Compute 13th Month for a year ─────────────────────────────────────
if ($method === 'GET') {
    $year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');

    /*
     * Sum each employee's regular pay (basic only, no OT / ND / holiday extras)
     * across all completed payroll batches whose payroll_start falls in the year.
     * We use COALESCE(adj_reg_pay, reg_pay) to respect any admin adjustments.
     */
    $stmt = $pdo->prepare("
        SELECT
            e.employee_id,
            e.emp_fullname,
            e.emp_dept,
            SUM(COALESCE(ec.adj_reg_pay, ec.reg_pay, 0)) AS total_basic_pay
        FROM fch_employees e
        JOIN fch_earnings_computation ec
               ON ec.employee_id = e.employee_id
              AND ec.is_archived  = 0
        JOIN fch_attendance_summary att
               ON att.batch_id    = ec.batch_id
              AND att.employee_id = ec.employee_id
              AND YEAR(att.payroll_start) = ?
        GROUP BY e.employee_id, e.emp_fullname, e.emp_dept
        HAVING total_basic_pay > 0
        ORDER BY e.emp_fullname
    ");
    $stmt->execute([$year]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Merge with any saved entries for this year
    $savedStmt = $pdo->prepare("
        SELECT employee_id, thirteenth_month_pay, is_released, released_at
        FROM fch_13th_month
        WHERE year = ?
    ");
    $savedStmt->execute([$year]);
    $saved = [];
    foreach ($savedStmt->fetchAll(PDO::FETCH_ASSOC) as $s) {
        $saved[(int)$s['employee_id']] = $s;
    }

    $result = [];
    foreach ($rows as $row) {
        $empId      = (int)$row['employee_id'];
        $totalBasic = round((float)$row['total_basic_pay'], 2);
        $pay        = round($totalBasic / 12.0, 2);
        $s          = $saved[$empId] ?? null;

        $result[] = [
            'employee_id'          => $empId,
            'emp_fullname'         => $row['emp_fullname'],
            'emp_dept'             => $row['emp_dept'],
            'total_basic_pay'      => $totalBasic,
            'thirteenth_month_pay' => $pay,
            'is_saved'             => $s !== null,
            'saved_amount'         => $s ? (float)$s['thirteenth_month_pay'] : null,
            'is_released'          => $s ? (int)$s['is_released']            : 0,
            'released_at'          => $s ? $s['released_at']                 : null,
        ];
    }

    echo json_encode(['success' => true, 'year' => $year, 'data' => $result]);
    exit;
}

// ─── POST: Save / Upsert 13th month entries ──────────────────────────────────
if ($method === 'POST') {
    if ($role !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin only']);
        exit;
    }

    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $year    = isset($body['year'])    ? (int)$body['year']  : (int)date('Y');
    $entries = $body['entries']        ?? [];

    if (empty($entries)) {
        http_response_code(400);
        echo json_encode(['error' => 'No entries provided']);
        exit;
    }

    $pdo->beginTransaction();
    try {
        $upsert = $pdo->prepare("
            INSERT INTO fch_13th_month
                (employee_id, emp_fullname, emp_dept, year, total_basic_pay, thirteenth_month_pay)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                emp_fullname          = VALUES(emp_fullname),
                emp_dept              = VALUES(emp_dept),
                total_basic_pay       = VALUES(total_basic_pay),
                thirteenth_month_pay  = VALUES(thirteenth_month_pay),
                updated_at            = NOW()
        ");

        foreach ($entries as $entry) {
            $upsert->execute([
                (int)$entry['employee_id'],
                $entry['emp_fullname'],
                $entry['emp_dept'] ?? null,
                $year,
                (float)$entry['total_basic_pay'],
                (float)$entry['thirteenth_month_pay'],
            ]);
        }
        $pdo->commit();
        echo json_encode([
            'success' => true,
            'message' => '13th month data saved for ' . count($entries) . ' employee(s)',
        ]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ─── PUT: Mark entries as released ──────────────────────────────────────────
if ($method === 'PUT') {
    if ($role !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin only']);
        exit;
    }

    $body         = json_decode(file_get_contents('php://input'), true) ?? [];
    $year         = isset($body['year'])         ? (int)$body['year']           : null;
    $employee_ids = $body['employee_ids']         ?? [];

    if (!$year || empty($employee_ids)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing year or employee_ids']);
        exit;
    }

    $phs    = implode(',', array_fill(0, count($employee_ids), '?'));
    $params = array_merge([$year], array_map('intval', $employee_ids));
    $stmt   = $pdo->prepare("
        UPDATE fch_13th_month
        SET is_released = 1, released_at = NOW()
        WHERE year = ? AND employee_id IN ($phs) AND is_released = 0
    ");
    $stmt->execute($params);

    echo json_encode([
        'success'  => true,
        'message'  => 'Marked as released',
        'affected' => $stmt->rowCount(),
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
