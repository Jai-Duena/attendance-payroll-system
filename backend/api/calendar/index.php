<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$db           = getDB();
$sessionEmpId = (int)$_SESSION['user_id'];
$role         = strtolower($_SESSION['role'] ?? 'employee');
$dept         = $_SESSION['department'] ?? '';
$method       = $_SERVER['REQUEST_METHOD'];

// ── Auto-migrate: create fch_calendar_events if absent ───────────────────────
$db->exec("CREATE TABLE IF NOT EXISTS fch_calendar_events (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    description         TEXT NULL,
    event_date          DATE NOT NULL,
    end_date            DATE NULL,
    color               VARCHAR(30) NOT NULL DEFAULT 'blue',
    target_type         ENUM('all','dept','employee') NOT NULL DEFAULT 'all',
    target_dept         VARCHAR(100) NULL,
    target_employee_id  INT NULL,
    created_by          INT NOT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8");

// ─────────────────────────────────────────────────────────────────────────────
// GET — fetch all calendar events for a given month
// ─────────────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $monthParam = $_GET['month'] ?? date('Y-m');
    if (!preg_match('/^\d{4}-\d{2}$/', $monthParam)) $monthParam = date('Y-m');

    [$year, $mon] = explode('-', $monthParam);
    $dateFrom = "$year-$mon-01";
    $dateTo   = date('Y-m-t', strtotime($dateFrom));

    $events = [];

    // ── 1. Auto-seed PH legal holidays from Nager.Date API ───────────────────
    // Check if we already have holidays for this year; if not, fetch and store.
    $countStmt = $db->prepare("SELECT COUNT(*) FROM fch_holidays WHERE YEAR(holiday_date) = ?");
    $countStmt->execute([$year]);
    if ((int)$countStmt->fetchColumn() === 0) {
        $apiUrl = "https://date.nager.at/api/v3/publicholidays/{$year}/PH";
        $ctx    = stream_context_create(['http' => [
            'timeout'       => 10,
            'ignore_errors' => true,
            'header'        => "Accept: application/json\r\n",
        ]]);
        $raw = @file_get_contents($apiUrl, false, $ctx);
        if ($raw !== false) {
            $phHolidays = json_decode($raw, true);
            if (is_array($phHolidays)) {
                $insHol = $db->prepare(
                    "INSERT IGNORE INTO fch_holidays (holiday_date, holiday_type, holiday_name)
                     VALUES (?, ?, ?)"
                );
                foreach ($phHolidays as $h) {
                    $hDate  = $h['date']  ?? null;
                    $hName  = $h['name']  ?? ($h['localName'] ?? 'Holiday');
                    $types  = $h['types'] ?? [];
                    // Nager uses "Public" for Regular national holidays;
                    // everything else (Optional, School, etc.) = Special Non-Working.
                    $hType  = in_array('Public', $types) ? 'Regular' : 'Special';
                    if ($hDate) $insHol->execute([$hDate, $hType, $hName]);
                }
            }
        }
    }

    // ── 2. Holidays ──────────────────────────────────────────────────────────
    $stmt = $db->prepare(
        "SELECT holiday_date, holiday_type, holiday_name
         FROM fch_holidays
         WHERE holiday_date BETWEEN ? AND ?"
    );
    $stmt->execute([$dateFrom, $dateTo]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $h) {
        $events[] = [
            'id'          => 'holiday-' . $h['holiday_date'],
            'date'        => $h['holiday_date'],
            'end_date'    => null,
            'type'        => 'holiday',
            'title'       => $h['holiday_name'],
            'subtitle'    => $h['holiday_type'] . ' Holiday',
            'color'       => $h['holiday_type'] === 'Regular' ? 'red' : 'orange',
            'editable'    => false,
            'employee_id' => null,
        ];
    }

    // ── 3. Approved requests: Leave, Overtime, Change Shift ──────────────────
    $dateBinds = array_fill(0, 3, [$dateFrom, $dateTo]); // 3 type pairs
    $flat      = array_merge(...$dateBinds);

    $typeFilter = "(
        (r.rqst_type = 'Leave'        AND r.leave_from BETWEEN ? AND ?)
     OR (r.rqst_type = 'Overtime'     AND r.ot_date    BETWEEN ? AND ?)
     OR (r.rqst_type = 'Change Shift' AND r.cs_date    BETWEEN ? AND ?)
    )";

    if ($role === 'admin') {
        $reqStmt = $db->prepare(
            "SELECT r.uniq_id, r.employee_id, r.rqst_type,
                    r.leave_type, r.leave_from, r.leave_to, r.leave_total,
                    r.ot_date, r.ot_from, r.ot_to,
                    r.cs_date, r.cs_new_shift,
                    e.emp_fullname
             FROM fch_requests r
             JOIN fch_employees e ON e.employee_id = r.employee_id
             WHERE r.status = 'Approved' AND $typeFilter"
        );
        $reqStmt->execute($flat);
    } elseif ($role === 'supervisor') {
        $reqStmt = $db->prepare(
            "SELECT r.uniq_id, r.employee_id, r.rqst_type,
                    r.leave_type, r.leave_from, r.leave_to, r.leave_total,
                    r.ot_date, r.ot_from, r.ot_to,
                    r.cs_date, r.cs_new_shift,
                    e.emp_fullname
             FROM fch_requests r
             JOIN fch_employees e ON e.employee_id = r.employee_id
             WHERE r.status = 'Approved' AND e.emp_dept = ? AND $typeFilter"
        );
        $reqStmt->execute(array_merge([$dept], $flat));
    } else {
        $reqStmt = $db->prepare(
            "SELECT r.uniq_id, r.employee_id, r.rqst_type,
                    r.leave_type, r.leave_from, r.leave_to, r.leave_total,
                    r.ot_date, r.ot_from, r.ot_to,
                    r.cs_date, r.cs_new_shift,
                    e.emp_fullname
             FROM fch_requests r
             JOIN fch_employees e ON e.employee_id = r.employee_id
             WHERE r.status = 'Approved' AND r.employee_id = ? AND $typeFilter"
        );
        $reqStmt->execute(array_merge([$sessionEmpId], $flat));
    }

    // Helper: format a date string as "Mon D" (e.g. "Jun 1")
    function fmtShortDate(string $d): string {
        $ts = strtotime($d);
        return $ts ? date('M j', $ts) : $d;
    }

    $isEmployee = ($role === 'employee');
    foreach ($reqStmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $who = $isEmployee ? '' : (($r['emp_fullname'] ?? '') . ': ');

        if ($r['rqst_type'] === 'Leave' && $r['leave_from']) {
            $fromFmt = fmtShortDate($r['leave_from']);
            $toFmt   = $r['leave_to'] ? fmtShortDate($r['leave_to']) : '';
            $span    = ($toFmt && $toFmt !== $fromFmt) ? "$fromFmt – $toFmt" : $fromFmt;
            $days    = $r['leave_total'] ? ' · ' . $r['leave_total'] . ' day(s)' : '';
            $events[] = [
                'id'          => 'leave-' . $r['uniq_id'],
                'date'        => $r['leave_from'],
                'end_date'    => $r['leave_to'],
                'type'        => 'leave',
                'title'       => $who . ($r['leave_type'] ?? 'Leave'),
                'subtitle'    => $span . $days,
                'color'       => 'green',
                'editable'    => false,
                'employee_id' => (int)$r['employee_id'],
            ];
        }
        if ($r['rqst_type'] === 'Overtime' && $r['ot_date']) {
            $dateFmt = fmtShortDate($r['ot_date']);
            $from    = $r['ot_from'] ? substr($r['ot_from'], 0, 5) : '';
            $to      = $r['ot_to']   ? substr($r['ot_to'],   0, 5) : '';
            $time    = ($from && $to) ? " · $from – $to" : '';
            $events[] = [
                'id'          => 'ot-' . $r['uniq_id'],
                'date'        => $r['ot_date'],
                'end_date'    => null,
                'type'        => 'overtime',
                'title'       => $who . 'Overtime',
                'subtitle'    => $dateFmt . $time,
                'color'       => 'yellow',
                'editable'    => false,
                'employee_id' => (int)$r['employee_id'],
            ];
        }
        if ($r['rqst_type'] === 'Change Shift' && $r['cs_date']) {
            $dateFmt = fmtShortDate($r['cs_date']);
            $shift   = $r['cs_new_shift'] ? ' · ' . $r['cs_new_shift'] : '';
            $events[] = [
                'id'          => 'cs-' . $r['uniq_id'],
                'date'        => $r['cs_date'],
                'end_date'    => null,
                'type'        => 'change_shift',
                'title'       => $who . 'Shift Change',
                'subtitle'    => $dateFmt . $shift,
                'color'       => 'indigo',
                'editable'    => false,
                'employee_id' => (int)$r['employee_id'],
            ];
        }
    }

    // ── 4. Released payroll periods ───────────────────────────────────────────
    // Only show payroll batches that have been released (status = 'Released').
    $payStmt = $db->prepare(
        "SELECT DISTINCT pr.payroll_start, pr.payroll_end
         FROM fch_payroll_results pr
         WHERE pr.status = 'Released'
           AND pr.payroll_start BETWEEN ? AND ?
         ORDER BY pr.payroll_start"
    );
    $payStmt->execute([$dateFrom, $dateTo]);

    foreach ($payStmt->fetchAll(PDO::FETCH_ASSOC) as $p) {
        $startDate = $p['payroll_start'];
        $endDate   = $p['payroll_end'];
        $span      = fmtShortDate($startDate) . ' – ' . fmtShortDate($endDate);
        $events[] = [
            'id'          => 'payroll-' . $startDate . '-' . $endDate,
            'date'        => $startDate,
            'end_date'    => $endDate,
            'type'        => 'payroll',
            'title'       => 'Released Payroll',
            'subtitle'    => $span,
            'color'       => 'purple',
            'editable'    => false,
            'employee_id' => null,
        ];
    }

    // ── 4. Custom calendar events ─────────────────────────────────────────────
    $overlapClause = "(
        ce.event_date BETWEEN ? AND ?
     OR (ce.end_date IS NOT NULL AND ce.end_date BETWEEN ? AND ?)
     OR (ce.event_date <= ? AND ce.end_date IS NOT NULL AND ce.end_date >= ?)
    )";
    $overlapVals = [$dateFrom, $dateTo, $dateFrom, $dateTo, $dateFrom, $dateTo];

    if ($role === 'admin') {
        $evtStmt = $db->prepare(
            "SELECT ce.*, e.emp_fullname AS creator_name
             FROM fch_calendar_events ce
             LEFT JOIN fch_employees e ON e.employee_id = ce.created_by
             WHERE (
                 ce.target_type != 'employee'
              OR ce.created_by = ?
             ) AND $overlapClause"
        );
        $evtStmt->execute(array_merge([$sessionEmpId], $overlapVals));
    } elseif ($role === 'supervisor') {
        $evtStmt = $db->prepare(
            "SELECT ce.*, e.emp_fullname AS creator_name
             FROM fch_calendar_events ce
             LEFT JOIN fch_employees e ON e.employee_id = ce.created_by
             WHERE (
                 ce.target_type = 'all'
              OR (ce.target_type = 'dept' AND ce.target_dept = ?)
              OR ce.created_by = ?
             ) AND $overlapClause"
        );
        $evtStmt->execute(array_merge([$dept, $sessionEmpId], $overlapVals));
    } else {
        $evtStmt = $db->prepare(
            "SELECT ce.*, e.emp_fullname AS creator_name
             FROM fch_calendar_events ce
             LEFT JOIN fch_employees e ON e.employee_id = ce.created_by
             WHERE (
                 ce.target_type = 'all'
              OR (ce.target_type = 'dept' AND ce.target_dept = ?)
              OR (ce.target_type = 'employee' AND ce.target_employee_id = ?)
             ) AND $overlapClause"
        );
        $evtStmt->execute(array_merge([$dept, $sessionEmpId], $overlapVals));
    }

    foreach ($evtStmt->fetchAll(PDO::FETCH_ASSOC) as $evt) {
        $canEdit = ($role === 'admin') || (in_array($role, ['supervisor', 'employee']) && (int)$evt['created_by'] === $sessionEmpId);
        $events[] = [
            'id'          => (int)$evt['id'],
            'date'        => $evt['event_date'],
            'end_date'    => $evt['end_date'],
            'type'        => 'custom',
            'title'       => $evt['title'],
            'subtitle'    => $evt['description'] ?? '',
            'color'       => $evt['color'] ?? 'blue',
            'editable'    => $canEdit,
            'target_type' => $evt['target_type'],
            'target_dept' => $evt['target_dept'],
            'created_by'  => $evt['creator_name'] ?? '',
        ];
    }

    echo json_encode(['success' => true, 'events' => $events]);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — create a custom event (admin / supervisor only)
// ─────────────────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body        = json_decode(file_get_contents('php://input'), true) ?? [];
    $title       = trim($body['title'] ?? '');
    $description = trim($body['description'] ?? '');
    $eventDate   = $body['event_date'] ?? '';
    $endDate     = (isset($body['end_date']) && $body['end_date'] !== '') ? $body['end_date'] : null;
    $color       = $body['color'] ?? 'blue';
    $targetType  = $body['target_type'] ?? 'all';
    $targetDept  = $body['target_dept'] ?? null;
    $targetEmpId = isset($body['target_employee_id']) ? (int)$body['target_employee_id'] : null;

    if (!$title || !$eventDate) {
        http_response_code(400);
        echo json_encode(['error' => 'Title and start date are required.']);
        exit;
    }

    // Supervisors always post to their own dept
    if ($role === 'supervisor') {
        $targetType  = 'dept';
        $targetDept  = $dept;
        $targetEmpId = null;
    }

    // Employees always post to themselves only
    if ($role === 'employee') {
        $targetType  = 'employee';
        $targetDept  = null;
        $targetEmpId = $sessionEmpId;
    }

    $stmt = $db->prepare(
        "INSERT INTO fch_calendar_events
             (title, description, event_date, end_date, color, target_type, target_dept, target_employee_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$title, $description ?: null, $eventDate, $endDate, $color, $targetType, $targetDept, $targetEmpId, $sessionEmpId]);

    echo json_encode(['success' => true, 'id' => (int)$db->lastInsertId()]);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT — update a custom event
// ─────────────────────────────────────────────────────────────────────────────
if ($method === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing event id.']); exit; }

    $check = $db->prepare("SELECT created_by FROM fch_calendar_events WHERE id = ?");
    $check->execute([$id]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);
    if (!$existing) { http_response_code(404); echo json_encode(['error' => 'Event not found.']); exit; }
    if (in_array($role, ['supervisor', 'employee']) && (int)$existing['created_by'] !== $sessionEmpId) {
        http_response_code(403); echo json_encode(['error' => 'Not allowed.']); exit;
    }

    $body        = json_decode(file_get_contents('php://input'), true) ?? [];
    $title       = trim($body['title'] ?? '');
    $description = trim($body['description'] ?? '');
    $eventDate   = $body['event_date'] ?? '';
    $endDate     = (isset($body['end_date']) && $body['end_date'] !== '') ? $body['end_date'] : null;
    $color       = $body['color'] ?? 'blue';
    $targetType  = $body['target_type'] ?? 'all';
    $targetDept  = $body['target_dept'] ?? null;
    $targetEmpId = isset($body['target_employee_id']) && $body['target_employee_id'] ? (int)$body['target_employee_id'] : null;

    if ($role === 'supervisor') {
        $targetType  = 'dept';
        $targetDept  = $dept;
        $targetEmpId = null;
    }
    if ($role === 'employee') {
        $targetType  = 'employee';
        $targetDept  = null;
        $targetEmpId = $sessionEmpId;
    }

    $stmt = $db->prepare(
        "UPDATE fch_calendar_events
         SET title=?, description=?, event_date=?, end_date=?, color=?,
             target_type=?, target_dept=?, target_employee_id=?
         WHERE id=?"
    );
    $stmt->execute([$title, $description ?: null, $eventDate, $endDate, $color, $targetType, $targetDept, $targetEmpId, $id]);

    echo json_encode(['success' => true]);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — remove a custom event
// ─────────────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing event id.']); exit; }

    $check = $db->prepare("SELECT created_by FROM fch_calendar_events WHERE id = ?");
    $check->execute([$id]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);
    if (!$existing) { http_response_code(404); echo json_encode(['error' => 'Event not found.']); exit; }
    if (in_array($role, ['supervisor', 'employee']) && (int)$existing['created_by'] !== $sessionEmpId) {
        http_response_code(403); echo json_encode(['error' => 'Not allowed.']); exit;
    }

    $db->prepare("DELETE FROM fch_calendar_events WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
