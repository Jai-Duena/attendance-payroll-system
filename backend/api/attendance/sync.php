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

date_default_timezone_set('Asia/Manila');

// ─── Helper functions ────────────────────────────────────────

function spansMidnight_pdo($start, $end) {
    return strtotime($end) < strtotime($start);
}

function getEmployeeShift_pdo(PDO $pdo, $employee_id, $date) {
    // Specific date override
    $stmt = $pdo->prepare("SELECT shift_start, shift_end FROM fch_employees_shift WHERE employee_id = ? AND date = ?");
    $stmt->execute([$employee_id, $date]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) return ['start' => $row['shift_start'], 'end' => $row['shift_end']];

    // Default shift (no date)
    $stmt = $pdo->prepare("SELECT shift_start, shift_end FROM fch_employees_shift WHERE employee_id = ? AND date IS NULL");
    $stmt->execute([$employee_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) return ['start' => $row['shift_start'], 'end' => $row['shift_end']];

    return null;
}

function getEmployeeOT_pdo(PDO $pdo, $employee_id, $date) {
    $stmt = $pdo->prepare("SELECT ot_start, ot_end FROM fch_ot WHERE employee_id = ? AND ot_date = ?");
    $stmt->execute([$employee_id, $date]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function processDayPunches_pdo(PDO $pdo, $employee_id, $date, $punches, $allPunches) {
    $empStmt = $pdo->prepare("SELECT emp_fname, emp_lname, emp_dept FROM fch_employees WHERE employee_id = ?");
    $empStmt->execute([$employee_id]);
    $empData = $empStmt->fetch(PDO::FETCH_ASSOC);
    if (!$empData) return;

    $fullname = $empData['emp_fname'] . ' ' . $empData['emp_lname'];
    $dept     = $empData['emp_dept'];

    $shift = getEmployeeShift_pdo($pdo, $employee_id, $date);

    $shiftSpansMidnight    = false;
    $effectiveEndIsDatetime = false;
    $effectiveEndTargetDate = $date;

    if ($shift) {
        $shiftStart         = $shift['start'];
        $shiftEnd           = $shift['end'];
        $shiftSpansMidnight = spansMidnight_pdo($shiftStart, $shiftEnd);

        $ot = getEmployeeOT_pdo($pdo, $employee_id, $date);

        $effectiveEnd = $shiftEnd;
        if ($ot && !empty($ot['ot_end'])) {
            $effectiveEnd = $ot['ot_end'];
            if (preg_match('/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/', $effectiveEnd)) {
                $effectiveEndIsDatetime = true;
                $effectiveEndTargetDate = date('Y-m-d', strtotime($effectiveEnd));
            }
        }
    }

    // ── Select punch pools based on overnight shift and punch_type ───────────
    // $punches / $allPunches are structured as ['in' => [...], 'out' => [...], 'all' => [...]]
    // 'in'  → punch_type 'Time In'
    // 'out' → punch_type 'Time Out' or 'OT Out'
    // 'all' → every punch (fallback for legacy/manual uploads without punch_type)
    if ($shiftSpansMidnight) {
        $prevDate    = date('Y-m-d', strtotime($date . ' -1 day'));
        $inPool      = $allPunches[$prevDate]['in']  ?? [];
        $outPool     = $punches['out'] ?? [];
        $inFallback  = $allPunches[$prevDate]['all'] ?? [];
        $outFallback = $punches['all'] ?? [];
    } else {
        $inPool      = $punches['in']  ?? [];
        $outPool     = $punches['out'] ?? [];
        $inFallback  = $punches['all'] ?? [];
        $outFallback = $punches['all'] ?? [];
    }

    if ($effectiveEndIsDatetime) {
        $outPool     = array_merge($outPool,     $allPunches[$effectiveEndTargetDate]['out'] ?? []);
        $outFallback = array_merge($outFallback, $allPunches[$effectiveEndTargetDate]['all'] ?? []);
    }

    // ── Time In: earliest punch in the 'Time In' pool; fallback to earliest of all ──
    $timeIn = !empty($inPool)
        ? min($inPool)
        : (!empty($inFallback) ? min($inFallback) : null);

    // ── Time Out: latest punch in the 'Time Out' pool (after time-in) ──────────
    if (!empty($outPool)) {
        // Use out-punches that come after time-in; if all are before, use the latest anyway
        $validOut = $timeIn
            ? array_values(array_filter($outPool, fn($t) => strtotime($t) > strtotime($timeIn)))
            : $outPool;
        $timeOut = !empty($validOut) ? max($validOut) : max($outPool);
    } elseif (!empty($inPool) && count($inPool) > 1) {
        // Multiple Time In punches, no Time Out: leave time-out blank
        $timeOut = null;
    } else {
        // Fallback for manual uploads (no punch_type): earliest = time-in, latest = time-out
        if ($timeIn && !empty($outFallback)) {
            $outCandidates = array_values(array_filter($outFallback, fn($p) => strtotime($p) > strtotime($timeIn)));
            $timeOut = !empty($outCandidates) ? max($outCandidates) : null;
        } elseif (!empty($outFallback)) {
            $timeOut = max($outFallback);
        } else {
            $timeOut = null;
        }
    }

    if (!$timeIn && !$timeOut) return;

    $recordDate = $date;
    if ($timeIn)       $recordDate = date('Y-m-d', strtotime($timeIn));
    elseif ($timeOut)  $recordDate = date('Y-m-d', strtotime($timeOut));

    // shift_time_in / shift_time_out are only computable when a shift is defined
    $shiftTimeIn  = null;
    $shiftTimeOut = null;
    if ($shift) {
        $shiftInDate  = $timeIn  ? date('Y-m-d', strtotime($timeIn))  : $recordDate;
        $shiftOutDate = $timeOut ? date('Y-m-d', strtotime($timeOut)) : $recordDate;
        $shiftTimeIn  = date('Y-m-d H:i:s', strtotime($shiftInDate  . ' ' . $shiftStart));
        $shiftTimeOut = date('Y-m-d H:i:s', strtotime($shiftOutDate . ' ' . $shiftEnd));
    }

    $totalHrs = 0.0;
    if ($timeIn && $timeOut) {
        $startDT = new DateTime($timeIn);
        $endDT   = new DateTime($timeOut);
        if ($endDT < $startDT) $endDT->modify('+1 day');
        $iv       = $startDT->diff($endDT);
        $totalHrs = $iv->h + ($iv->i / 60) + ($iv->s / 3600);
    }

    $ins = $pdo->prepare(
        "INSERT INTO fch_attendance
         (employee_id, emp_fullname, emp_dept, date, time_in, time_out, shift_time_in, shift_time_out, total_hrs)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $ins->execute([$employee_id, $fullname, $dept, $recordDate, $timeIn, $timeOut, $shiftTimeIn, $shiftTimeOut, $totalHrs]);
}

function processEmployeePunches_pdo(PDO $pdo, $employee_id, $employeePunches) {
    ksort($employeePunches);
    foreach ($employeePunches as $date => $punches) {
        processDayPunches_pdo($pdo, $employee_id, $date, $punches, $employeePunches);
    }
}

// ─── Main sync logic ─────────────────────────────────────────

try {
    $pdo = getDB();
    $pdo->beginTransaction();

    // ── Snapshot all manually-set overrides before wiping the table ──────
    // adj_* columns are set by: manual punch approval, assign_punch, and
    // admin edits. They must survive a full resync.
    $adjRows = $pdo->query(
        "SELECT employee_id, date,
                adj_date, adj_time_in, adj_time_out,
                adj_shift_time_in, adj_shift_time_out
         FROM fch_attendance
         WHERE adj_time_in        IS NOT NULL
            OR adj_time_out       IS NOT NULL
            OR adj_date           IS NOT NULL
            OR adj_shift_time_in  IS NOT NULL
            OR adj_shift_time_out IS NOT NULL"
    )->fetchAll(PDO::FETCH_ASSOC);

    // Build a lookup: $adjLookup[$employee_id][$date] = adj row
    $adjLookup = [];
    foreach ($adjRows as $ar) {
        $adjLookup[(int)$ar['employee_id']][$ar['date']] = $ar;
    }

    // Use DELETE not TRUNCATE — TRUNCATE is DDL and causes implicit commit in MySQL/MariaDB
    $pdo->exec("DELETE FROM fch_attendance");

    $stmt = $pdo->query(
        "SELECT employee_id, punch_time, punch_type FROM fch_punches WHERE employee_id IS NOT NULL ORDER BY employee_id, DATE(punch_time), punch_time"
    );

    $currentEmployee  = null;
    $employeePunches  = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $empId     = $row['employee_id'];
        $punchTime = $row['punch_time'];
        $punchType = $row['punch_type'] ?? '';
        $punchDate = date('Y-m-d', strtotime($punchTime));

        if ($currentEmployee !== $empId) {
            if ($currentEmployee !== null && !empty($employeePunches)) {
                processEmployeePunches_pdo($pdo, $currentEmployee, $employeePunches);
            }
            $currentEmployee = $empId;
            $employeePunches = [];
        }

        if (!isset($employeePunches[$punchDate])) {
            $employeePunches[$punchDate] = ['in' => [], 'out' => [], 'all' => []];
        }
        if ($punchType === 'Time In') {
            $employeePunches[$punchDate]['in'][] = $punchTime;
        } elseif ($punchType === 'Time Out' || $punchType === 'OT Out') {
            $employeePunches[$punchDate]['out'][] = $punchTime;
        }
        $employeePunches[$punchDate]['all'][] = $punchTime;
    }

    // Process the last employee
    if ($currentEmployee !== null && !empty($employeePunches)) {
        processEmployeePunches_pdo($pdo, $currentEmployee, $employeePunches);
    }

    // ── Restore all adj_* overrides that existed before the wipe ─────────
    foreach ($adjLookup as $empId => $dates) {
        foreach ($dates as $date => $adj) {
            $aStmt = $pdo->prepare(
                "SELECT uniq_id, time_in, time_out FROM fch_attendance
                 WHERE employee_id = ? AND date = ? LIMIT 1"
            );
            $aStmt->execute([$empId, $date]);
            $att = $aStmt->fetch(PDO::FETCH_ASSOC);

            if ($att) {
                // Row was rebuilt by sync — layer adj overrides on top
                $pdo->prepare(
                    "UPDATE fch_attendance
                     SET adj_date          = ?,
                         adj_time_in       = ?,
                         adj_time_out      = ?,
                         adj_shift_time_in = ?,
                         adj_shift_time_out = ?
                     WHERE uniq_id = ?"
                )->execute([
                    $adj['adj_date'],
                    $adj['adj_time_in'],
                    $adj['adj_time_out'],
                    $adj['adj_shift_time_in'],
                    $adj['adj_shift_time_out'],
                    $att['uniq_id'],
                ]);

                // Recalculate total_hrs using effective (adj takes priority) values
                $effIn  = $adj['adj_time_in']  ?: $att['time_in'];
                $effOut = $adj['adj_time_out'] ?: $att['time_out'];
                if ($effIn && $effOut) {
                    $s = new DateTime($effIn);
                    $e = new DateTime($effOut);
                    if ($e <= $s) $e->modify('+1 day');
                    $iv    = $s->diff($e);
                    $total = $iv->h + ($iv->i / 60) + ($iv->s / 3600) + ($iv->days * 24);
                    $pdo->prepare("UPDATE fch_attendance SET total_hrs = ? WHERE uniq_id = ?")
                        ->execute([round($total, 2), $att['uniq_id']]);
                }
            } else {
                // No ZKTeco punches for this day — rebuild a row from adj values so
                // manual punch approvals / assign_punch entries are never lost
                $eiStmt = $pdo->prepare(
                    "SELECT emp_fullname, emp_dept FROM fch_employees WHERE employee_id = ? LIMIT 1"
                );
                $eiStmt->execute([$empId]);
                $ei = $eiStmt->fetch(PDO::FETCH_ASSOC);

                $effIn  = $adj['adj_time_in'];
                $effOut = $adj['adj_time_out'];
                $totalHrs = 0.0;
                if ($effIn && $effOut) {
                    $s = new DateTime($effIn);
                    $e = new DateTime($effOut);
                    if ($e <= $s) $e->modify('+1 day');
                    $iv       = $s->diff($e);
                    $totalHrs = round($iv->h + ($iv->i / 60) + ($iv->s / 3600) + ($iv->days * 24), 2);
                }

                $pdo->prepare(
                    "INSERT INTO fch_attendance
                     (employee_id, emp_fullname, emp_dept, date,
                      adj_date, adj_time_in, adj_time_out,
                      adj_shift_time_in, adj_shift_time_out, total_hrs)
                     VALUES (?,?,?,?,?,?,?,?,?,?)"
                )->execute([
                    $empId,
                    $ei['emp_fullname'] ?? '',
                    $ei['emp_dept']     ?? '',
                    $date,
                    $adj['adj_date'],
                    $adj['adj_time_in'],
                    $adj['adj_time_out'],
                    $adj['adj_shift_time_in'],
                    $adj['adj_shift_time_out'],
                    $totalHrs,
                ]);
            }
        }
    }

    $pdo->commit();

    $total = (int)$pdo->query("SELECT COUNT(*) FROM fch_attendance")->fetchColumn();
    echo json_encode([
        'success' => true,
        'message' => "Sync complete. Processed $total attendance records.",
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
