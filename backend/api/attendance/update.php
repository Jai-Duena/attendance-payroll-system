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

$role   = $_SESSION['role'] ?? 'employee';
$userId = (int)$_SESSION['user_id'];

if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'DELETE'])) {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$pdo    = getDB();
$action = strtolower($_SERVER['REQUEST_METHOD']) === 'delete' ? 'delete' : ($body['action'] ?? 'edit');

// Employees may only use assign_punch (for their own punches).
// All other actions (edit, delete) require admin or supervisor.
if ($role === 'employee' && $action !== 'assign_punch') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: insufficient role']);
    exit;
}
if (!in_array($role, ['admin', 'supervisor', 'employee'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: insufficient role']);
    exit;
}

// Resolve changer name
$nameStmt = $pdo->prepare('SELECT emp_fullname FROM fch_employees WHERE employee_id = ? LIMIT 1');
$nameStmt->execute([$userId]);
$changerName = $nameStmt->fetchColumn() ?: "User #{$userId}";

// ── Helper: insert audit row ─────────────────────────────────────────────────
function logAudit(
    PDO $pdo,
    int $uniqId,
    int $empId,
    string $empFullname,
    string $action,
    string $field,
    ?string $oldVal,
    ?string $newVal,
    int $changedBy,
    string $changerName
): void {
    $stmt = $pdo->prepare(
        "INSERT INTO fch_attendance_audit
            (attendance_uniq_id, employee_id, emp_fullname, action,
             field_changed, old_value, new_value, changed_by_user_id, changed_by_name, changed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
    );
    $stmt->execute([$uniqId, $empId, $empFullname, $action, $field, $oldVal, $newVal, $changedBy, $changerName]);
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE
// ────────────────────────────────────────────────────────────────────────────
if ($action === 'delete') {
    $uniqId = (int)($body['uniq_id'] ?? 0);
    if (!$uniqId) {
        http_response_code(400);
        echo json_encode(['error' => 'uniq_id is required']);
        exit;
    }

    // Fetch the record first for audit
    $row = $pdo->prepare('SELECT * FROM fch_attendance WHERE uniq_id = ? LIMIT 1');
    $row->execute([$uniqId]);
    $record = $row->fetch(PDO::FETCH_ASSOC);

    if (!$record) {
        http_response_code(404);
        echo json_encode(['error' => 'Record not found']);
        exit;
    }

    $pdo->beginTransaction();
    try {
        // Log audit for each stored value
        $fields = ['date', 'time_in', 'time_out', 'shift_time_in', 'shift_time_out'];
        foreach ($fields as $f) {
            logAudit(
                $pdo, $uniqId, (int)$record['employee_id'], $record['emp_fullname'],
                'delete', $f, $record[$f], null, $userId, $changerName
            );
        }

        $del = $pdo->prepare('DELETE FROM fch_attendance WHERE uniq_id = ?');
        $del->execute([$uniqId]);

        $pdo->commit();

        // ── Notifications for DELETE ──────────────────────────────────────
        try {
            require_once __DIR__ . '/../notifications/helper.php';
            $empIdNotif = (int)$record['employee_id'];
            $dateLabel  = $record['date'] ?? '';
            $notifMsg   = "Your attendance record for {$dateLabel} has been deleted by {$changerName}.";
            notifyEmployee($pdo, $empIdNotif, 'attendance_edit', 'Attendance Record Deleted', $notifMsg, (string)$uniqId);
        } catch (Exception $ne) {
            error_log("Notification error in attendance/update.php delete: " . $ne->getMessage());
        }
        // ── End Notifications ─────────────────────────────────────────────

        echo json_encode(['success' => true, 'message' => 'Attendance record deleted.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// ────────────────────────────────────────────────────────────────────────────
// ASSIGN PUNCH  (admin/supervisor manually sets a raw punch as time_in/time_out)
// ────────────────────────────────────────────────────────────────────────────
if ($action === 'assign_punch') {
    $punchId   = (int)($body['punch_id']   ?? 0);
    $punchRole = trim($body['punch_role']  ?? ''); // 'time_in' or 'time_out'

    if (!$punchId || !in_array($punchRole, ['time_in', 'time_out'])) {
        http_response_code(400);
        echo json_encode(['error' => 'punch_id and punch_role (time_in or time_out) are required']);
        exit;
    }

    // Fetch the punch row
    $pStmt = $pdo->prepare('SELECT id, employee_id, punch_time FROM fch_punches WHERE id = ? LIMIT 1');
    $pStmt->execute([$punchId]);
    $punch = $pStmt->fetch(PDO::FETCH_ASSOC);
    if (!$punch) {
        http_response_code(404);
        echo json_encode(['error' => 'Punch record not found']);
        exit;
    }

    $empId = (int)$punch['employee_id'];

    // Employees may only assign their own punches
    if ($role === 'employee' && $empId !== $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: you can only assign your own punches']);
        exit;
    }
    $punchDT   = $punch['punch_time'];             // e.g. "2026-03-12 06:30:00"
    $punchDate = substr($punchDT, 0, 10);          // "2026-03-12"
    $adjCol    = ($punchRole === 'time_in') ? 'adj_time_in' : 'adj_time_out';

    // ── Overnight shift handling ─────────────────────────────────────────
    // For time_out: check whether the employee's shift on the *previous* date
    // is an overnight shift (shift_end < shift_start, e.g. 22:00→06:00).
    // If it is, and there is an open attendance row for that previous date
    // (time_in set, time_out still NULL), attach this punch there instead.
    $targetDate = $punchDate;
    if ($punchRole === 'time_out') {
        $prevDate = date('Y-m-d', strtotime($punchDate . ' -1 day'));

        // Fetch the shift for prevDate — date-specific first, then default
        $shiftStmt = $pdo->prepare(
            "SELECT shift_start, shift_end FROM fch_employees_shift
              WHERE employee_id = ? AND date = ?
             UNION ALL
             SELECT shift_start, shift_end FROM fch_employees_shift
              WHERE employee_id = ? AND date IS NULL
             LIMIT 1"
        );
        $shiftStmt->execute([$empId, $prevDate, $empId]);
        $prevShift = $shiftStmt->fetch(PDO::FETCH_ASSOC);

        $isOvernight = $prevShift && ($prevShift['shift_end'] < $prevShift['shift_start']);

        if ($isOvernight) {
            // Only reassign if prev-day actually has an open time-in with no time-out
            $openStmt = $pdo->prepare(
                "SELECT uniq_id FROM fch_attendance
                  WHERE employee_id = ? AND date = ?
                    AND (adj_time_in IS NOT NULL OR time_in IS NOT NULL)
                    AND (adj_time_out IS NULL AND time_out IS NULL)
                  LIMIT 1"
            );
            $openStmt->execute([$empId, $prevDate]);
            if ($openStmt->fetchColumn()) {
                $targetDate = $prevDate;
            }
        }
    }

    $pdo->beginTransaction();
    try {
        // Find or create the attendance row for targetDate
        $aStmt = $pdo->prepare('SELECT * FROM fch_attendance WHERE employee_id = ? AND date = ? LIMIT 1');
        $aStmt->execute([$empId, $targetDate]);
        $att = $aStmt->fetch(PDO::FETCH_ASSOC);

        if (!$att) {
            $eiStmt = $pdo->prepare('SELECT emp_fullname, emp_dept FROM fch_employees WHERE employee_id = ? LIMIT 1');
            $eiStmt->execute([$empId]);
            $ei = $eiStmt->fetch(PDO::FETCH_ASSOC);

            // Fetch the employee's shift for targetDate (date-specific override first, then default)
            $shiftStmt = $pdo->prepare(
                "SELECT shift_start, shift_end FROM fch_employees_shift
                  WHERE employee_id = ? AND date = ?
                 UNION ALL
                 SELECT shift_start, shift_end FROM fch_employees_shift
                  WHERE employee_id = ? AND date IS NULL
                 LIMIT 1"
            );
            $shiftStmt->execute([$empId, $targetDate, $empId]);
            $empShift = $shiftStmt->fetch(PDO::FETCH_ASSOC);

            $shiftTimeIn  = $empShift ? ($targetDate . ' ' . $empShift['shift_start']) : null;
            $shiftTimeOut = $empShift ? ($targetDate . ' ' . $empShift['shift_end'])   : null;

            $pdo->prepare(
                'INSERT INTO fch_attendance (employee_id, emp_fullname, emp_dept, date, shift_time_in, shift_time_out, total_hrs) VALUES (?,?,?,?,?,?,0)'
            )->execute([$empId, $ei['emp_fullname'] ?? '', $ei['emp_dept'] ?? '', $targetDate, $shiftTimeIn, $shiftTimeOut]);
            $aStmt->execute([$empId, $targetDate]);
            $att = $aStmt->fetch(PDO::FETCH_ASSOC);
        }

        $uniqIdA = (int)$att['uniq_id'];
        $oldVal  = $att[$adjCol];

        // ── Chronological guard ───────────────────────────────────────────
        // Prevent time_in from being set later than an existing time_out,
        // and time_out from being set earlier than an existing time_in.
        // Overnight shifts are handled naturally because punch_time includes
        // the full date — e.g. time_in 2026-03-14 22:00 < time_out 2026-03-15 06:00.
        if ($punchRole === 'time_in') {
            $effOut = $att['adj_time_out'] ?: $att['time_out'];
            if ($effOut && (new DateTime($punchDT)) > (new DateTime($effOut))) {
                $pdo->rollBack();
                http_response_code(422);
                echo json_encode(['error' =>
                    'Time In (' . date('M d, Y h:i A', strtotime($punchDT)) . ') ' .
                    'cannot be later than the existing Time Out (' .
                    date('M d, Y h:i A', strtotime($effOut)) . ').'
                ]);
                exit;
            }
        } else { // time_out
            $effIn = $att['adj_time_in'] ?: $att['time_in'];
            if ($effIn && (new DateTime($punchDT)) < (new DateTime($effIn))) {
                $pdo->rollBack();
                http_response_code(422);
                echo json_encode(['error' =>
                    'Time Out (' . date('M d, Y h:i A', strtotime($punchDT)) . ') ' .
                    'cannot be earlier than the existing Time In (' .
                    date('M d, Y h:i A', strtotime($effIn)) . ').'
                ]);
                exit;
            }
        }

        // Apply the override
        $pdo->prepare("UPDATE fch_attendance SET `$adjCol` = ? WHERE uniq_id = ?")
            ->execute([$punchDT, $uniqIdA]);

        // Recalculate total_hrs
        $r2 = $pdo->prepare('SELECT time_in, time_out, adj_time_in, adj_time_out FROM fch_attendance WHERE uniq_id = ?');
        $r2->execute([$uniqIdA]);
        $r2row  = $r2->fetch(PDO::FETCH_ASSOC);
        $effIn  = $r2row['adj_time_in']  ?: $r2row['time_in'];
        $effOut = $r2row['adj_time_out'] ?: $r2row['time_out'];
        if ($effIn && $effOut) {
            $start = new DateTime($effIn);
            $end   = new DateTime($effOut);
            if ($end <= $start) $end->modify('+1 day'); // overnight
            $diff  = $start->diff($end);
            $total = $diff->h + ($diff->i / 60) + ($diff->s / 3600) + ($diff->days * 24);
            $pdo->prepare('UPDATE fch_attendance SET total_hrs = ? WHERE uniq_id = ?')
                ->execute([round($total, 2), $uniqIdA]);
        }

        // Audit
        logAudit($pdo, $uniqIdA, $empId, $att['emp_fullname'] ?? '', 'edit', $adjCol, $oldVal, $punchDT, $userId, $changerName);

        $pdo->commit();

        // Notify employee
        try {
            require_once __DIR__ . '/../notifications/helper.php';
            $label   = ($punchRole === 'time_in') ? 'Time In' : 'Time Out';
            $timeStr = date('h:i A', strtotime($punchDT));
            $msg     = "Your {$label} for {$targetDate} has been manually assigned to {$timeStr} by {$changerName}.";
            notifyEmployee($pdo, $empId, 'attendance_edit', 'Attendance Updated', $msg, (string)$uniqIdA);
        } catch (Exception $ne) {
            error_log('Notification error in assign_punch: ' . $ne->getMessage());
        }

        $label = ($punchRole === 'time_in') ? 'Time In' : 'Time Out';
        echo json_encode([
            'success'     => true,
            'message'     => "{$label} assigned for {$targetDate}.",
            'target_date' => $targetDate,
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// ────────────────────────────────────────────────────────────────────────────
// EDIT
// ────────────────────────────────────────────────────────────────────────────
$uniqId = (int)($body['uniq_id'] ?? 0);
if (!$uniqId) {
    http_response_code(400);
    echo json_encode(['error' => 'uniq_id is required']);
    exit;
}

// Allowed adj fields and their DB column → input key map
$adjFields = [
    'adj_date'           => 'adj_date',
    'adj_time_in'        => 'adj_time_in',
    'adj_time_out'       => 'adj_time_out',
    'adj_shift_time_in'  => 'adj_shift_time_in',
    'adj_shift_time_out' => 'adj_shift_time_out',
];

// Fetch existing record
$rowStmt = $pdo->prepare('SELECT * FROM fch_attendance WHERE uniq_id = ? LIMIT 1');
$rowStmt->execute([$uniqId]);
$record = $rowStmt->fetch(PDO::FETCH_ASSOC);

if (!$record) {
    http_response_code(404);
    echo json_encode(['error' => 'Record not found']);
    exit;
}

// Build SET clause from provided fields only
$setClauses = [];
$setParams  = [];
$auditPairs = []; // [field, old, new]

foreach ($adjFields as $col => $inputKey) {
    if (!array_key_exists($inputKey, $body)) continue;

    $newVal = $body[$inputKey] === '' ? null : $body[$inputKey];
    $oldVal = $record[$col];

    // Validate date formats
    if ($newVal !== null) {
        if ($col === 'adj_date') {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $newVal)) {
                http_response_code(400);
                echo json_encode(['error' => "Invalid date format for {$col}. Expected YYYY-MM-DD."]);
                exit;
            }
        } else {
            // datetime: accept YYYY-MM-DD HH:MM or HH:MM (will prefix with the adj_date or base date)
            if (!preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/', $newVal) &&
                !preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $newVal)) {
                http_response_code(400);
                echo json_encode(['error' => "Invalid datetime format for {$col}."]);
                exit;
            }
            // If only HH:MM supplied, combine with the adjusted (or original) date
            if (preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $newVal)) {
                $baseDate = $body['adj_date'] ?? $record['adj_date'] ?? $record['date'];
                $newVal   = $baseDate . ' ' . $newVal . (strlen($newVal) === 5 ? ':00' : '');
            }
        }
    }

    if ($newVal !== $oldVal) {
        $setClauses[]    = "{$col} = ?";
        $setParams[]     = $newVal;
        $auditPairs[]    = [$col, $oldVal, $newVal];
    }
}

if (empty($setClauses)) {
    echo json_encode(['success' => true, 'message' => 'No changes detected.']);
    exit;
}

$setParams[] = $uniqId;

$pdo->beginTransaction();
try {
    $sql = 'UPDATE fch_attendance SET ' . implode(', ', $setClauses) . ' WHERE uniq_id = ?';
    $pdo->prepare($sql)->execute($setParams);

    foreach ($auditPairs as [$field, $old, $new]) {
        logAudit(
            $pdo, $uniqId, (int)$record['employee_id'], $record['emp_fullname'],
            'edit', $field, $old, $new, $userId, $changerName
        );
    }

    $pdo->commit();

    // ── Notifications for EDIT ────────────────────────────────────────────
    try {
        require_once __DIR__ . '/../notifications/helper.php';
        $empIdNotif = (int)$record['employee_id'];
        $empNm      = $record['emp_fullname'] ?? "Employee #{$empIdNotif}";
        $dateLabel  = $record['date'] ?? '';
        $notifMsg   = "Your attendance record for {$dateLabel} has been edited by {$changerName}.";
        notifyEmployee($pdo, $empIdNotif, 'attendance_edit', 'Attendance Record Edited', $notifMsg, (string)$uniqId);
    } catch (Exception $ne) {
        error_log("Notification error in attendance/update.php edit: " . $ne->getMessage());
    }
    // ── End Notifications ─────────────────────────────────────────────────

    echo json_encode(['success' => true, 'message' => 'Attendance record updated.']);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
