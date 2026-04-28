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

$role      = $_SESSION['role']    ?? 'employee';
$userId    = (int)$_SESSION['user_id'];
$pdo       = getDB();

// ── Helper: recalculate total_hrs from effective time_in / time_out ───────
function _recalcTotalHrs(PDO $pdo, int $uniq_id): void {
    $stmt = $pdo->prepare(
        "SELECT time_in, time_out, adj_time_in, adj_time_out FROM fch_attendance WHERE uniq_id = ?"
    );
    $stmt->execute([$uniq_id]);
    $r = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$r) return;
    $effIn  = $r['adj_time_in']  ?: $r['time_in'];
    $effOut = $r['adj_time_out'] ?: $r['time_out'];
    if (!$effIn || !$effOut) return;
    $start = new DateTime($effIn);
    $end   = new DateTime($effOut);
    if ($end <= $start) $end->modify('+1 day');
    $diff  = $start->diff($end);
    $total = $diff->h + ($diff->i / 60) + ($diff->s / 3600) + ($diff->days * 24);
    $pdo->prepare("UPDATE fch_attendance SET total_hrs = ? WHERE uniq_id = ?")
        ->execute([round($total, 2), $uniq_id]);
}

// ── Auto-create table if missing ──────────────────────────────────────────
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `fch_attendance_flags` (
          `id`                  int(11)       NOT NULL AUTO_INCREMENT,
          `attendance_id`       int(11)       NOT NULL,
          `employee_id`         int(11)       NOT NULL,
          `emp_fullname`        varchar(150)  DEFAULT NULL,
          `date`                date          DEFAULT NULL,
          `flag_column`         varchar(50)   NOT NULL,
          `current_value`       datetime      DEFAULT NULL,
          `suggested_punch_id`  int(11)       DEFAULT NULL,
          `suggested_value`     datetime      NOT NULL,
          `reason`              text          DEFAULT NULL,
          `status`              enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
          `admin_notes`         varchar(255)  DEFAULT NULL,
          `reviewed_by`         int(11)       DEFAULT NULL,
          `reviewed_at`         datetime      DEFAULT NULL,
          `attachment`          varchar(255)  DEFAULT NULL,
          `created_at`          timestamp     NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
    ");
} catch (\Exception $e) {
    // Table already exists or no CREATE privilege — attempt to continue anyway
}
// Migrate existing tables: add attachment column if missing
try {
    $pdo->exec("ALTER TABLE `fch_attendance_flags` ADD COLUMN IF NOT EXISTS `attachment` varchar(255) DEFAULT NULL COMMENT 'Optional proof file'");
} catch (\Exception $e) { /* ignore */ }

// ─────────────────────────────────────────────────────────────────────────
// GET requests
// ─────────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list';

    // ── Pending count (admin badge) ──────────────────────────────────────
    if ($action === 'pending_count') {
        if ($role === 'employee') {
            echo json_encode(['count' => 0]);
            exit;
        }
        $dept = $_SESSION['department'] ?? '';
        if ($role === 'supervisor' && $dept !== '') {
            // Supervisors can only see non time_in/time_out flags for their dept
            $stmt = $pdo->prepare(
                "SELECT COUNT(*) FROM fch_attendance_flags f
                 JOIN fch_employees e ON e.employee_id = f.employee_id
                 WHERE f.status = 'Pending'
                   AND f.flag_column NOT IN ('time_in','time_out')
                   AND e.emp_dept = ?"
            );
            $stmt->execute([$dept]);
        } else {
            $stmt = $pdo->query("SELECT COUNT(*) FROM fch_attendance_flags WHERE status = 'Pending'");
        }
        echo json_encode(['count' => (int)$stmt->fetchColumn()]);
        exit;
    }

    // ── List flags ───────────────────────────────────────────────────────
    if ($action === 'list') {
        $statusFilter = $_GET['status'] ?? '';
        $page  = max(1, (int)($_GET['page']  ?? 1));
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;

        $where  = [];
        $params = [];

        if ($role === 'employee') {
            $where[]  = 'f.employee_id = ?';
            $params[] = $userId;
        } elseif ($role === 'supervisor') {
            $dept = $_SESSION['department'] ?? '';
            $where[]  = 'e.emp_dept = ?';
            $params[] = $dept;
            // Supervisors cannot see or review time_in / time_out correction requests
            $where[] = "f.flag_column NOT IN ('time_in','time_out')";
        }

        if ($statusFilter === 'history') {
            $where[] = "f.status IN ('Approved','Rejected')";
        } elseif ($statusFilter !== '') {
            $where[]  = 'f.status = ?';
            $params[] = $statusFilter;
        }

        $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $pdo->prepare(
            "SELECT COUNT(*) FROM fch_attendance_flags f
             LEFT JOIN fch_employees e ON e.employee_id = f.employee_id
             $whereSQL"
        );
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare(
            "SELECT f.id, f.attendance_id, f.employee_id, f.emp_fullname,
                    f.date, f.flag_column, f.current_value, f.suggested_punch_id,
                    f.suggested_value, f.reason, f.status, f.admin_notes,
                    f.reviewed_by, f.reviewed_at, f.created_at,
                    f.attachment,
                    e.emp_dept,
                    CONCAT(rv.emp_fname, ' ', rv.emp_lname) AS reviewed_by_name,
                    a.shift_time_in, a.shift_time_out,
                    COALESCE(a.adj_shift_time_in, a.shift_time_in) AS eff_shift_time_in,
                    COALESCE(a.adj_shift_time_out, a.shift_time_out) AS eff_shift_time_out,
                    a.time_in AS att_time_in, a.time_out AS att_time_out,
                    a.total_hrs AS att_total_hrs
             FROM fch_attendance_flags f
             LEFT JOIN fch_employees e  ON e.employee_id  = f.employee_id
             LEFT JOIN fch_employees rv ON rv.employee_id = f.reviewed_by
             LEFT JOIN fch_attendance a ON a.uniq_id = f.attendance_id
             $whereSQL
             ORDER BY f.status ASC, f.created_at DESC
             LIMIT $limit OFFSET $offset"
        );
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'data'  => $rows,
            'total' => $total,
        ]);
        exit;
    }
}

// ─────────────────────────────────────────────────────────────────────────
// POST requests
// ─────────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ct     = $_SERVER['CONTENT_TYPE'] ?? '';
    $body   = str_contains($ct, 'multipart/form-data')
        ? $_POST
        : (json_decode(file_get_contents('php://input'), true) ?? []);
    $action = $body['action'] ?? '';

    // ── Submit flag (employee) ───────────────────────────────────────────
    if ($action === 'submit') {
        $attendanceId     = (int)($body['attendance_id']      ?? 0);
        $flagColumn       = trim($body['flag_column']         ?? '');
        $suggestedPunchId = isset($body['suggested_punch_id']) ? (int)$body['suggested_punch_id'] : null;
        $suggestedValue   = trim($body['suggested_value']     ?? '');  // used for shift columns
        $reason           = trim($body['reason']              ?? '');

        $allowedColumns  = ['time_in', 'time_out', 'shift_time_in', 'shift_time_out'];
        $shiftColumns    = ['shift_time_in', 'shift_time_out'];
        $isPunchColumn   = !in_array($flagColumn, $shiftColumns);

        if (!$attendanceId || !in_array($flagColumn, $allowedColumns) || !$reason) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }
        // Punch columns require a punch ID; shift columns require a time value
        if ($isPunchColumn && !$suggestedPunchId) {
            http_response_code(400);
            echo json_encode(['error' => 'A raw punch selection is required for this field']);
            exit;
        }
        if (!$isPunchColumn && !$suggestedValue) {
            http_response_code(400);
            echo json_encode(['error' => 'A suggested time value is required for shift fields']);
            exit;
        }

        // Fetch current value of the flagged column
        $attStmt = $pdo->prepare(
            "SELECT `$flagColumn`, employee_id, emp_fullname, date FROM fch_attendance WHERE uniq_id = ?"
        );
        $attStmt->execute([$attendanceId]);
        $att = $attStmt->fetch();
        if (!$att) {
            http_response_code(404);
            echo json_encode(['error' => 'Attendance record not found']);
            exit;
        }

        // Employee can only flag their own records
        if ($role === 'employee' && (int)$att['employee_id'] !== $userId) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }

        // Resolve suggested_value
        if ($isPunchColumn) {
            // Look up by punch ID only — security already enforced above
            // (employee scoped to own records + own punch list)
            $punchStmt = $pdo->prepare("SELECT punch_time FROM fch_punches WHERE id = ?");
            $punchStmt->execute([$suggestedPunchId]);
            $punch = $punchStmt->fetch();
            if (!$punch) {
                http_response_code(404);
                echo json_encode(['error' => 'Punch record not found']);
                exit;
            }
            $finalSuggestedValue = $punch['punch_time'];
        } else {
            // Shift column: combine attendance date with supplied HH:MM time
            $attDate = $att['date'] ? date('Y-m-d', strtotime($att['date'])) : date('Y-m-d');
            // $suggestedValue may be "HH:MM" or a full datetime
            if (preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $suggestedValue)) {
                $finalSuggestedValue = $attDate . ' ' . $suggestedValue;
            } else {
                $finalSuggestedValue = $suggestedValue; // accept full datetime as-is
            }
            $suggestedPunchId = null;
        }

        // Check for existing pending flag on same column for same record
        $dupStmt = $pdo->prepare(
            "SELECT id FROM fch_attendance_flags
             WHERE attendance_id = ? AND flag_column = ? AND status = 'Pending'"
        );
        $dupStmt->execute([$attendanceId, $flagColumn]);
        if ($dupStmt->fetchColumn()) {
            http_response_code(409);
            echo json_encode(['error' => 'A pending flag for this column already exists']);
            exit;
        }

        // Handle optional attachment upload
        $attachmentPath = null;
        if (!empty($_FILES['attachment']['tmp_name'])) {
            $uploadDir = __DIR__ . '/../../uploads/flag_attachments/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            $ext     = strtolower(pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
            if (in_array($ext, $allowed)) {
                $filename = 'flag_' . $userId . '_' . time() . '.' . $ext;
                if (move_uploaded_file($_FILES['attachment']['tmp_name'], $uploadDir . $filename)) {
                    $attachmentPath = 'uploads/flag_attachments/' . $filename;
                }
            }
        }

        $ins = $pdo->prepare(
            "INSERT INTO fch_attendance_flags
             (attendance_id, employee_id, emp_fullname, date, flag_column,
              current_value, suggested_punch_id, suggested_value, reason, attachment)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $ins->execute([
            $attendanceId,
            (int)$att['employee_id'],
            $att['emp_fullname'],
            $att['date'],
            $flagColumn,
            $att[$flagColumn],
            $suggestedPunchId,
            $finalSuggestedValue,
            $reason,
            $attachmentPath,
        ]);

        echo json_encode(['success' => true, 'message' => 'Correction request submitted successfully']);
        exit;
    }

    // ── Review flag (admin only for time_in/time_out; admin+supervisor for others) ──
    if ($action === 'review') {
        if ($role === 'employee') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }

        $flagId     = (int)($body['flag_id']     ?? 0);
        $newStatus  = $body['status']             ?? '';
        $adminNotes = trim($body['admin_notes']   ?? '');

        if (!$flagId || !in_array($newStatus, ['Approved', 'Rejected'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing flag_id or status']);
            exit;
        }

        // Fetch the flag
        $flagStmt = $pdo->prepare(
            "SELECT * FROM fch_attendance_flags WHERE id = ? AND status = 'Pending'"
        );
        $flagStmt->execute([$flagId]);
        $flag = $flagStmt->fetch();
        if (!$flag) {
            http_response_code(404);
            echo json_encode(['error' => 'Pending flag not found']);
            exit;
        }

        // time_in / time_out corrections are admin-only
        if ($role !== 'admin' && in_array($flag['flag_column'], ['time_in', 'time_out'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Only admins can review time in/out corrections']);
            exit;
        }

        // Update flag status
        $updateFlag = $pdo->prepare(
            "UPDATE fch_attendance_flags
             SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW()
             WHERE id = ?"
        );
        $updateFlag->execute([$newStatus, $adminNotes ?: null, $userId, $flagId]);

        // If approved, apply the correction
        if ($newStatus === 'Approved') {
            $punchCols  = ['time_in', 'time_out'];
            $shiftCols  = ['shift_time_in', 'shift_time_out'];
            $attColMap  = [
                'time_in'        => 'time_in',
                'time_out'       => 'time_out',
                'shift_time_in'  => 'adj_shift_time_in',
                'shift_time_out' => 'adj_shift_time_out',
            ];

            if (isset($attColMap[$flag['flag_column']])) {
                // 1. For time_in / time_out: update punch_type in fch_punches
                if (in_array($flag['flag_column'], $punchCols) && !empty($flag['suggested_punch_id'])) {
                    $newPunchType = $flag['flag_column'] === 'time_in' ? 'Time In' : 'Time Out';
                    $pdo->prepare("UPDATE fch_punches SET punch_type = ? WHERE id = ?")
                        ->execute([$newPunchType, $flag['suggested_punch_id']]);
                }

                // 2. Resolve current attendance record by employee_id + date
                $resolveStmt = $pdo->prepare(
                    "SELECT uniq_id FROM fch_attendance
                     WHERE employee_id = ? AND (date = ? OR adj_date = ?)
                     LIMIT 1"
                );
                $resolveStmt->execute([$flag['employee_id'], $flag['date'], $flag['date']]);
                $resolved = $resolveStmt->fetch();
                $targetId = $resolved ? (int)$resolved['uniq_id'] : (int)$flag['attendance_id'];

                // 3. For time_in/time_out: re-derive from current punches (earliest/latest)
                if (in_array($flag['flag_column'], $punchCols)) {
                    $punchRows = $pdo->prepare(
                        "SELECT punch_time, punch_type FROM fch_punches
                         WHERE employee_id = ? AND DATE(punch_time) = ?
                         ORDER BY punch_time ASC"
                    );
                    $punchRows->execute([$flag['employee_id'], $flag['date']]);
                    $dayPunches = $punchRows->fetchAll(PDO::FETCH_ASSOC);

                    $inPool  = [];
                    $outPool = [];
                    foreach ($dayPunches as $p) {
                        if ($p['punch_type'] === 'Time In')  $inPool[]  = $p['punch_time'];
                        if ($p['punch_type'] === 'Time Out' || $p['punch_type'] === 'OT Out') $outPool[] = $p['punch_time'];
                    }

                    $newTimeIn  = !empty($inPool)  ? min($inPool)  : null;
                    $newTimeOut = !empty($outPool) ? max($outPool) : null;
                    // Multiple Time In but no Time Out: leave time-out blank

                    $pdo->prepare("UPDATE fch_attendance SET time_in = ?, time_out = ? WHERE uniq_id = ?")
                        ->execute([$newTimeIn, $newTimeOut, $targetId]);
                } else {
                    // Shift corrections write to adj_ columns directly
                    $col = $attColMap[$flag['flag_column']];
                    $pdo->prepare("UPDATE fch_attendance SET `$col` = ? WHERE uniq_id = ?")
                        ->execute([$flag['suggested_value'], $targetId]);
                }
                _recalcTotalHrs($pdo, $targetId);
            }
        }

        echo json_encode(['success' => true, 'message' => "Flag {$newStatus}"]);
        exit;
    }

    // ── Bulk review (admin only for time_in/time_out; admin+supervisor for others) ──
    if ($action === 'bulk_review') {
        if ($role === 'employee') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }

        $flagIds    = $body['flag_ids']   ?? [];
        $newStatus  = $body['status']     ?? '';
        $adminNotes = trim($body['admin_notes'] ?? '');

        if (empty($flagIds) || !is_array($flagIds) || !in_array($newStatus, ['Approved', 'Rejected'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing flag_ids or status']);
            exit;
        }

        $flagIds = array_map('intval', $flagIds);
        $placeholders = implode(',', array_fill(0, count($flagIds), '?'));

        // Fetch all pending flags in one query
        $flagStmt = $pdo->prepare(
            "SELECT * FROM fch_attendance_flags
             WHERE id IN ($placeholders) AND status = 'Pending'"
        );
        $flagStmt->execute($flagIds);
        $pendingFlags = $flagStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($pendingFlags)) {
            echo json_encode(['success' => true, 'processed' => 0]);
            exit;
        }

        $punchCols = ['time_in', 'time_out'];
        $attColMap = [
            'time_in'        => 'time_in',
            'time_out'       => 'time_out',
            'shift_time_in'  => 'adj_shift_time_in',
            'shift_time_out' => 'adj_shift_time_out',
        ];

        $pdo->beginTransaction();
        try {
            $updateFlag = $pdo->prepare(
                "UPDATE fch_attendance_flags
                 SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW()
                 WHERE id = ?"
            );

            foreach ($pendingFlags as $flag) {
                // time_in / time_out corrections are admin-only
                if ($role !== 'admin' && in_array($flag['flag_column'], ['time_in', 'time_out'])) {
                    continue; // skip silently — supervisor cannot approve these
                }
                $updateFlag->execute([$newStatus, $adminNotes ?: null, $userId, $flag['id']]);

                if ($newStatus === 'Approved' && isset($attColMap[$flag['flag_column']])) {
                    // For time_in / time_out: update punch_type in fch_punches
                    if (in_array($flag['flag_column'], $punchCols) && !empty($flag['suggested_punch_id'])) {
                        $newPunchType = $flag['flag_column'] === 'time_in' ? 'Time In' : 'Time Out';
                        $pdo->prepare("UPDATE fch_punches SET punch_type = ? WHERE id = ?")
                            ->execute([$newPunchType, $flag['suggested_punch_id']]);
                    }

                    // Resolve current uniq_id — may differ from stored attendance_id after resync
                    $resolveStmt = $pdo->prepare(
                        "SELECT uniq_id FROM fch_attendance
                         WHERE employee_id = ? AND (date = ? OR adj_date = ?)
                         LIMIT 1"
                    );
                    $resolveStmt->execute([$flag['employee_id'], $flag['date'], $flag['date']]);
                    $resolved = $resolveStmt->fetch();
                    $targetId = $resolved ? (int)$resolved['uniq_id'] : (int)$flag['attendance_id'];

                    // For time_in/time_out: re-derive from current punches (earliest/latest)
                    if (in_array($flag['flag_column'], $punchCols)) {
                        $punchRows = $pdo->prepare(
                            "SELECT punch_time, punch_type FROM fch_punches
                             WHERE employee_id = ? AND DATE(punch_time) = ?
                             ORDER BY punch_time ASC"
                        );
                        $punchRows->execute([$flag['employee_id'], $flag['date']]);
                        $dayPunches = $punchRows->fetchAll(PDO::FETCH_ASSOC);

                        $inPool  = [];
                        $outPool = [];
                        foreach ($dayPunches as $p) {
                            if ($p['punch_type'] === 'Time In')  $inPool[]  = $p['punch_time'];
                            if ($p['punch_type'] === 'Time Out' || $p['punch_type'] === 'OT Out') $outPool[] = $p['punch_time'];
                        }

                        $newTimeIn  = !empty($inPool)  ? min($inPool)  : null;
                        $newTimeOut = !empty($outPool) ? max($outPool) : null;
                        // Multiple Time In but no Time Out: leave time-out blank

                        $pdo->prepare("UPDATE fch_attendance SET time_in = ?, time_out = ? WHERE uniq_id = ?")
                            ->execute([$newTimeIn, $newTimeOut, $targetId]);
                    } else {
                        $col = $attColMap[$flag['flag_column']];
                        $pdo->prepare("UPDATE fch_attendance SET `$col` = ? WHERE uniq_id = ?")
                            ->execute([$flag['suggested_value'], $targetId]);
                    }
                    _recalcTotalHrs($pdo, $targetId);
                }
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'processed' => count($pendingFlags)]);
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log('[fch-flags] bulk_review error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Bulk review failed']);
        }
        exit;
    }
}

http_response_code(400);
echo json_encode(['error' => 'Invalid request']);
?>
