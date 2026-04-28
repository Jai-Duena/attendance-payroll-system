<?php
/**
 * GET /api/attendance/export.php
 * Streams an attendance or summary CSV download.
 *
 * Query params:
 *  type        attendance | summary | punches   (default: attendance)
 *  month       YYYY-MM                     (used for attendance type)
 *  year        YYYY                        (used for summary type; defaults to current year)
 *  date_from   YYYY-MM-DD                  (optional override)
 *  date_to     YYYY-MM-DD                  (optional override)
 *  dept        department name filter      (optional)
 *  employee_id single employee filter      (optional)
 *  employee_ids comma-separated ids        (optional, for multi-employee filter)
 */
ini_set('display_errors', '0');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();
if (empty($_SESSION['user_id'])) {
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

$type    = $_GET['type']         ?? 'attendance';
$dept    = trim($_GET['dept']    ?? '');
$empId   = !empty($_GET['employee_id']) ? (int)$_GET['employee_id'] : null;
// Multi-employee filter: comma-separated IDs
$empIds  = [];
if (!empty($_GET['employee_ids'])) {
    $empIds = array_filter(array_map('intval', explode(',', $_GET['employee_ids'])));
}
// Single employee_id also feeds into empIds
if ($empId && !in_array($empId, $empIds)) {
    $empIds[] = $empId;
}
$pdo     = getDB();

// ── Date range resolution ───────────────────────────────────────────────────
if (!empty($_GET['date_from']) && !empty($_GET['date_to'])) {
    $dateFrom = $_GET['date_from'];
    $dateTo   = $_GET['date_to'];
} elseif ($type === 'summary') {
    $year     = !empty($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
    $dateFrom = "{$year}-01-01";
    $dateTo   = "{$year}-12-31";
} else {
    // attendance type — default to current month
    $month    = !empty($_GET['month']) ? $_GET['month'] : date('Y-m');
    $dateFrom = $month . '-01';
    $dateTo   = date('Y-m-t', strtotime($dateFrom));
}

// Basic date sanity — no injection possible via parameterised query but validate format
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid date format']);
    exit;
}

// ── Build query & filename per type ────────────────────────────────────────
if ($type === 'summary') {
    $sql    = "
        SELECT
            s.payroll_start,
            s.payroll_end,
            s.emp_fullname,
            s.emp_dept,
            s.reg_hrs,
            s.ot_hrs,
            s.nd_hrs,
            s.late_mins,
            s.leave_days
        FROM fch_attendance_summary s
        WHERE s.payroll_start BETWEEN :df AND :dt
    ";
    $params = [':df' => $dateFrom, ':dt' => $dateTo];
    if ($dept !== '') {
        $sql .= " AND s.emp_dept = :dept";
        $params[':dept'] = $dept;
    }
    if (!empty($empIds)) {
        $inPlaceholders = implode(',', array_fill(0, count($empIds), '?'));
        // PDO named params don't mix well with positional — rebuild as positional
        $sql = str_replace(':df', '?', str_replace(':dt', '?', $sql));
        $params = [$dateFrom, $dateTo];
        if ($dept !== '') { $params[] = $dept; }
        $sql .= " AND s.employee_id IN ($inPlaceholders)";
        foreach ($empIds as $eid) $params[] = $eid;
        // switch to positional param execution below
        $usePositional = true;
    } else {
        if (count($empIds) === 0 && isset($params[':eid'])) {} // no-op
    }
    $sql .= " ORDER BY s.payroll_start DESC, s.emp_fullname ASC";

    $headers  = ['Payroll Start', 'Payroll End', 'Employee Name', 'Department',
                 'Regular Hrs', 'OT Hrs', 'ND Hrs', 'Late (mins)', 'Leave Days'];
    $filename = "attendance_summary_{$dateFrom}_{$dateTo}.csv";
    $rowKeys  = ['payroll_start','payroll_end','emp_fullname','emp_dept',
                 'reg_hrs','ot_hrs','nd_hrs','late_mins','leave_days'];
} elseif ($type === 'punches') {
    // ── Raw punches ──────────────────────────────────────────────────────────
    $sql    = "
        SELECT
            DATE(p.punch_time)      AS punch_date,
            p.punch_time,
            e.emp_fullname,
            e.emp_dept,
            p.punch_type,
            p.verifycode
        FROM fch_punches p
        LEFT JOIN fch_employees e ON e.employee_id = p.employee_id
        WHERE DATE(p.punch_time) BETWEEN :df AND :dt
    ";
    $params = [':df' => $dateFrom, ':dt' => $dateTo];
    if ($dept !== '') {
        $sql .= " AND e.emp_dept = :dept";
        $params[':dept'] = $dept;
    }
    if (!empty($empIds)) {
        $inPlaceholders = implode(',', array_fill(0, count($empIds), '?'));
        $sql = str_replace([':df',':dt'], '?', $sql);
        $params = [$dateFrom, $dateTo];
        if ($dept !== '') { $params[] = $dept; }
        $sql .= " AND p.employee_id IN ($inPlaceholders)";
        foreach ($empIds as $eid) $params[] = $eid;
        $usePositional = true;
    }
    $sql .= " ORDER BY p.punch_time DESC";

    $headers  = ['Date', 'Punch Date & Time', 'Employee Name', 'Department', 'Punch Type', 'Verify Code'];
    $filename = "raw_punches_{$dateFrom}_{$dateTo}.csv";
    $rowKeys  = ['punch_date','punch_time','emp_fullname','emp_dept','punch_type','verifycode'];
} else {
    // default: attendance
    $sql    = "
        SELECT
            COALESCE(a.adj_date,    a.date)           AS record_date,
            a.emp_fullname,
            a.emp_dept,
            COALESCE(a.adj_time_in,  a.time_in)       AS eff_time_in,
            COALESCE(a.adj_time_out, a.time_out)      AS eff_time_out,
            COALESCE(a.adj_shift_time_in,  a.shift_time_in)  AS shift_in,
            COALESCE(a.adj_shift_time_out, a.shift_time_out) AS shift_out,
            a.total_hrs
        FROM fch_attendance a
        WHERE (a.adj_date BETWEEN :df AND :dt
               OR (a.adj_date IS NULL AND a.date BETWEEN :df2 AND :dt2))
    ";
    $params = [':df' => $dateFrom, ':dt' => $dateTo, ':df2' => $dateFrom, ':dt2' => $dateTo];
    if ($dept !== '') {
        $sql .= " AND a.emp_dept = :dept";
        $params[':dept'] = $dept;
    }
    if (!empty($empIds)) {
        $inPlaceholders = implode(',', array_fill(0, count($empIds), '?'));
        $sql = str_replace([':df',':dt',':df2',':dt2'], '?', $sql);
        $params = [$dateFrom, $dateTo, $dateFrom, $dateTo];
        if ($dept !== '') { $params[] = $dept; }
        $sql .= " AND a.employee_id IN ($inPlaceholders)";
        foreach ($empIds as $eid) $params[] = $eid;
        $usePositional = true;
    }
    $sql .= " ORDER BY record_date DESC, a.emp_fullname ASC";

    $headers  = ['Date', 'Employee Name', 'Department',
                 'Time In', 'Time Out', 'Shift Time In', 'Shift Time Out', 'Total Hrs'];
    $filename = "attendance_{$dateFrom}_{$dateTo}.csv";
    $rowKeys  = ['record_date','emp_fullname','emp_dept',
                 'eff_time_in','eff_time_out','shift_in','shift_out','total_hrs'];
}

$usePositional = $usePositional ?? false;
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// ── Stream CSV ──────────────────────────────────────────────────────────────
header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Pragma: no-cache');
header('Expires: 0');

$out = fopen('php://output', 'w');
// UTF-8 BOM so Excel opens it correctly
fwrite($out, "\xEF\xBB\xBF");

fputcsv($out, $headers);
foreach ($rows as $row) {
    $line = [];
    foreach ($rowKeys as $k) {
        $line[] = $row[$k] ?? '';
    }
    fputcsv($out, $line);
}
fclose($out);
