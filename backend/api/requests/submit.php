<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$db = getDB();

$employee_id      = (int)$_SESSION['user_id'];
$loggedInUser     = $_SESSION['username']   ?? 'UnknownUser';
$loggedInUserDept = $_SESSION['department'] ?? '';
$encode_date      = date('Y-m-d H:i:s');

// Fetch account type from DB
$accStmt = $db->prepare("SELECT emp_acc_type FROM fch_employees WHERE employee_id = ? LIMIT 1");
$accStmt->execute([$employee_id]);
$accRow = $accStmt->fetch();
$loggedInAccType = $accRow['emp_acc_type'] ?? 'Employee';

// Auto-approval logic
$status        = 'Pending';
$sup_status    = 'Pending';
$sup_name      = null;
$admin_status  = 'Pending';
$admin_name    = null;
$manage_status = null;
$manage_name   = null;

if ($loggedInAccType === 'Supervisor') {
    $sup_status = 'Approved';
    $sup_name   = $loggedInUser;
} elseif (in_array($loggedInAccType, ['Admin', 'Management'])) {
    $sup_status    = 'Approved';
    $sup_name      = $loggedInUser;
    $admin_status  = 'Approved';
    $admin_name    = $loggedInUser;
    $manage_status = 'Approved';
    $manage_name   = $loggedInUser;
    $status        = 'Approved';
}

// Determine input source
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (str_contains($contentType, 'multipart/form-data') || str_contains($contentType, 'application/x-www-form-urlencoded')) {
    $body = $_POST;
} else {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
}

$rqst_type = trim($body['rqst_type'] ?? '');
if (!$rqst_type) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing rqst_type']);
    exit;
}

try {
    $db->beginTransaction();

    if ($rqst_type === 'Leave') {
        $leave_type      = $body['leave_type']      ?? '';
        $leave_from      = $body['leave_from']      ?? '';
        $leave_to        = $body['leave_to']        ?? '';
        $leave_total     = is_numeric($body['leave_total'] ?? '') ? (float)$body['leave_total'] : 1;
        $lwop_type       = $body['lwop_type']       ?? '';
        $leave_period    = $body['leave_period']    ?? '';
        $lwop_time_from  = !empty($body['lwop_time_from']) ? $body['lwop_time_from'] : null;
        $lwop_time_to    = !empty($body['lwop_time_to'])   ? $body['lwop_time_to']   : null;
        $emergency_type  = $body['emergency_type']  ?? '';
        $leave_sub_type        = $body['leave_sub_type']        ?? '';
        $leave_solo_parent     = !empty($body['leave_solo_parent'])     ? 1 : 0;
        $leave_unpaid_extension = !empty($body['leave_unpaid_extension']) ? 1 : 0;
        $leave_days_allocated  = min(7, max(0, (int)($body['leave_days_allocated'] ?? 0)));
        $reason                = $body['reason']                ?? '';

        if (!$leave_type || !$leave_from || !$leave_to) {
            throw new Exception("Missing leave fields");
        }

        // Handle optional attachment
        $attachment = null;
        if (!empty($_FILES['attachment']['tmp_name'])) {
            $uploadDir = __DIR__ . '/../../uploads/attachments/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            $ext     = strtolower(pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
            if (in_array($ext, $allowed)) {
                $filename = 'leave_' . $employee_id . '_' . time() . '.' . $ext;
                if (move_uploaded_file($_FILES['attachment']['tmp_name'], $uploadDir . $filename)) {
                    $attachment = 'uploads/attachments/' . $filename;
                }
            }
        }

        $db->prepare(
            "INSERT INTO fch_requests
             (employee_id, encode_date, rqst_type, leave_type, leave_from, leave_to, leave_total,
              lwop_type, leave_period, lwop_time_from, lwop_time_to, emergency_type,
              leave_sub_type, leave_solo_parent, leave_unpaid_extension, leave_days_allocated,
              reason, attachment,
              status, sup_status, sup_name, admin_status, admin_name,
              manage_status, manage_name, user, dept)
             VALUES (?, ?, 'Leave', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )->execute([
            $employee_id, $encode_date, $leave_type, $leave_from, $leave_to, $leave_total,
            $lwop_type, $leave_period, $lwop_time_from, $lwop_time_to, $emergency_type ?: null,
            $leave_sub_type ?: null, $leave_solo_parent, $leave_unpaid_extension, $leave_days_allocated,
            $reason, $attachment,
            $status, $sup_status, $sup_name, $admin_status, $admin_name,
            $manage_status, $manage_name, $loggedInUser, $loggedInUserDept,
        ]);

    } elseif ($rqst_type === 'Overtime') {
        $ot_date      = $body['ot_date']      ?? '';
        $ot_work_done = $body['ot_work_done'] ?? '';
        $ot_from      = $body['ot_from']      ?? '';
        $ot_to        = $body['ot_to']        ?? '';

        if (!$ot_date || !$ot_from || !$ot_to) {
            throw new Exception("Missing overtime fields");
        }

        $start    = new DateTime($ot_from);
        $end      = new DateTime($ot_to);
        if ($end < $start) $end->modify('+1 day');
        $interval = $start->diff($end);
        $ot_total = $interval->h + ($interval->i / 60);

        // Handle optional attachment
        $attachment = null;
        if (!empty($_FILES['attachment']['tmp_name'])) {
            $uploadDir = __DIR__ . '/../../uploads/attachments/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            $ext     = strtolower(pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
            if (in_array($ext, $allowed)) {
                $filename = 'ot_' . $employee_id . '_' . time() . '.' . $ext;
                if (move_uploaded_file($_FILES['attachment']['tmp_name'], $uploadDir . $filename)) {
                    $attachment = 'uploads/attachments/' . $filename;
                }
            }
        }

        $db->prepare(
            "INSERT INTO fch_requests
             (employee_id, encode_date, rqst_type, ot_date, ot_work_done, ot_from, ot_to, ot_total,
              attachment, status, sup_status, sup_name, admin_status, admin_name,
              manage_status, manage_name, user, dept)
             VALUES (?, ?, 'Overtime', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )->execute([
            $employee_id, $encode_date, $ot_date, $ot_work_done, $ot_from, $ot_to, $ot_total,
            $attachment, $status, $sup_status, $sup_name, $admin_status, $admin_name,
            $manage_status, $manage_name, $loggedInUser, $loggedInUserDept,
        ]);

    } elseif ($rqst_type === 'Change Shift') {
        $cs_date      = $body['cs_date']      ?? '';
        $cs_new_shift = $body['cs_new_shift'] ?? '';
        $reason       = $body['reason']       ?? '';

        if (!$cs_date || !$cs_new_shift) {
            throw new Exception("Missing change shift fields");
        }

        $empRow = $db->prepare("SELECT emp_shift FROM fch_employees WHERE employee_id = ?");
        $empRow->execute([$employee_id]);
        $cs_old_shift = $empRow->fetchColumn() ?? '';

        // Handle optional attachment
        $attachment = null;
        if (!empty($_FILES['attachment']['tmp_name'])) {
            $uploadDir = __DIR__ . '/../../uploads/attachments/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            $ext     = strtolower(pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
            if (in_array($ext, $allowed)) {
                $filename = 'cs_' . $employee_id . '_' . time() . '.' . $ext;
                if (move_uploaded_file($_FILES['attachment']['tmp_name'], $uploadDir . $filename)) {
                    $attachment = 'uploads/attachments/' . $filename;
                }
            }
        }

        $db->prepare(
            "INSERT INTO fch_requests
             (employee_id, encode_date, rqst_type, cs_old_shift, cs_new_shift, cs_date, reason,
              attachment, status, sup_status, sup_name, admin_status, admin_name,
              manage_status, manage_name, user, dept)
             VALUES (?, ?, 'Change Shift', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )->execute([
            $employee_id, $encode_date, $cs_old_shift, $cs_new_shift, $cs_date, $reason,
            $attachment, $status, $sup_status, $sup_name, $admin_status, $admin_name,
            $manage_status, $manage_name, $loggedInUser, $loggedInUserDept,
        ]);

    } elseif ($rqst_type === 'Manual Punch') {
        $mp_date   = $body['mp_date']  ?? '';
        $mp_type   = $body['mp_type']  ?? '';
        $mp_time   = $body['mp_time']  ?? '';
        $mp_reason = $body['reason']   ?? '';

        $mp_proof = null;
        if (!empty($_FILES['mp_proof']['tmp_name'])) {
            $uploadDir = __DIR__ . '/../../uploads/mp_proofs/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            $ext      = pathinfo($_FILES['mp_proof']['name'], PATHINFO_EXTENSION);
            $filename = 'mp_' . $employee_id . '_' . time() . '.' . $ext;
            if (move_uploaded_file($_FILES['mp_proof']['tmp_name'], $uploadDir . $filename)) {
                $mp_proof = 'uploads/mp_proofs/' . $filename;
            }
        }

        if (!$mp_date || !$mp_type || !$mp_time || !$mp_reason) {
            throw new Exception("Missing manual punch fields");
        }

        $db->prepare(
            "INSERT INTO fch_requests
             (employee_id, encode_date, rqst_type, mp_date, mp_type, mp_time, reason, mp_proof,
              status, sup_status, sup_name, admin_status, admin_name,
              manage_status, manage_name, user, dept)
             VALUES (?, ?, 'Manual Punch', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )->execute([
            $employee_id, $encode_date, $mp_date, $mp_type, $mp_time, $mp_reason, $mp_proof,
            $status, $sup_status, $sup_name, $admin_status, $admin_name,
            $manage_status, $manage_name, $loggedInUser, $loggedInUserDept,
        ]);

        // ── Admin auto-approved: reflect immediately in fch_punches + fch_attendance ──
        if ($status === 'Approved') {
            $mp_datetime = $mp_date . ' ' . $mp_time;

            // 1. Insert into fch_punches so it feeds raw punches table and future syncs
            $db->prepare(
                "INSERT INTO fch_punches
                 (employee_id, punch_time, punch_type, operator, operator_reason, operator_time, annotation, processed)
                 VALUES (?, ?, ?, ?, 'Manual Punch Request', NOW(), 'Approved manual punch request', 1)"
            )->execute([$employee_id, $mp_datetime, $mp_type, $loggedInUser]);

            // 2. Reflect in fch_attendance for that date
            $attStmt = $db->prepare(
                "SELECT uniq_id, time_in, time_out, adj_time_in, adj_time_out
                 FROM fch_attendance WHERE employee_id = ? AND date = ? LIMIT 1"
            );
            $attStmt->execute([$employee_id, $mp_date]);
            $att = $attStmt->fetch();

            if ($att) {
                // Row exists — apply as adj_ override and recalculate total_hrs
                $adjCol = ($mp_type === 'Time In') ? 'adj_time_in' : 'adj_time_out';
                $db->prepare("UPDATE fch_attendance SET `$adjCol` = ? WHERE uniq_id = ?")
                   ->execute([$mp_datetime, $att['uniq_id']]);

                $effIn  = ($adjCol === 'adj_time_in')  ? $mp_datetime : ($att['adj_time_in']  ?: $att['time_in']);
                $effOut = ($adjCol === 'adj_time_out') ? $mp_datetime : ($att['adj_time_out'] ?: $att['time_out']);
                if ($effIn && $effOut) {
                    $s = new DateTime($effIn);
                    $e = new DateTime($effOut);
                    if ($e <= $s) $e->modify('+1 day');
                    $iv    = $s->diff($e);
                    $total = $iv->h + ($iv->i / 60) + ($iv->s / 3600) + ($iv->days * 24);
                    $db->prepare("UPDATE fch_attendance SET total_hrs = ? WHERE uniq_id = ?")
                       ->execute([round($total, 2), $att['uniq_id']]);
                }
            } else {
                // No attendance row — create one using adj columns (preserved through syncs)
                $eiStmt = $db->prepare("SELECT emp_fullname, emp_dept FROM fch_employees WHERE employee_id = ? LIMIT 1");
                $eiStmt->execute([$employee_id]);
                $ei = $eiStmt->fetch();
                // Fetch the employee's shift for this date
                $shiftStmt = $db->prepare(
                    "SELECT shift_start, shift_end FROM fch_employees_shift
                      WHERE employee_id = ? AND date = ?
                     UNION ALL
                     SELECT shift_start, shift_end FROM fch_employees_shift
                      WHERE employee_id = ? AND date IS NULL
                     LIMIT 1"
                );
                $shiftStmt->execute([$employee_id, $mp_date, $employee_id]);
                $mpShift      = $shiftStmt->fetch(PDO::FETCH_ASSOC);
                $shiftTimeIn  = $mpShift ? ($mp_date . ' ' . $mpShift['shift_start']) : null;
                $shiftTimeOut = $mpShift ? ($mp_date . ' ' . $mpShift['shift_end'])   : null;
                $adjIn  = ($mp_type === 'Time In')  ? $mp_datetime : null;
                $adjOut = ($mp_type === 'Time Out') ? $mp_datetime : null;
                $db->prepare(
                    "INSERT INTO fch_attendance
                     (employee_id, emp_fullname, emp_dept, date, shift_time_in, shift_time_out, adj_time_in, adj_time_out, total_hrs)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)"
                )->execute([$employee_id, $ei['emp_fullname'] ?? '', $ei['emp_dept'] ?? '', $mp_date, $shiftTimeIn, $shiftTimeOut, $adjIn, $adjOut]);
            }
        }

        // ── Optional paired punch (Time In + Time Out in one submission) ─────────
        $mp_type2 = trim($body['mp_type2'] ?? '');
        $mp_time2 = trim($body['mp_time2'] ?? '');
        if ($mp_type2 && $mp_time2 && in_array($mp_type2, ['Time In', 'Time Out'])) {
            $db->prepare(
                "INSERT INTO fch_requests
                 (employee_id, encode_date, rqst_type, mp_date, mp_type, mp_time, reason, mp_proof,
                  status, sup_status, sup_name, admin_status, admin_name,
                  manage_status, manage_name, user, dept)
                 VALUES (?, ?, 'Manual Punch', ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            )->execute([
                $employee_id, $encode_date, $mp_date, $mp_type2, $mp_time2, $mp_reason,
                $status, $sup_status, $sup_name, $admin_status, $admin_name,
                $manage_status, $manage_name, $loggedInUser, $loggedInUserDept,
            ]);

            if ($status === 'Approved') {
                $mp_datetime2 = $mp_date . ' ' . $mp_time2;

                $db->prepare(
                    "INSERT INTO fch_punches
                     (employee_id, punch_time, punch_type, operator, operator_reason, operator_time, annotation, processed)
                     VALUES (?, ?, ?, ?, 'Manual Punch Request', NOW(), 'Approved manual punch request', 1)"
                )->execute([$employee_id, $mp_datetime2, $mp_type2, $loggedInUser]);

                $att2Stmt = $db->prepare(
                    "SELECT uniq_id, time_in, time_out, adj_time_in, adj_time_out
                     FROM fch_attendance WHERE employee_id = ? AND date = ? LIMIT 1"
                );
                $att2Stmt->execute([$employee_id, $mp_date]);
                $att2 = $att2Stmt->fetch();

                if ($att2) {
                    $adjCol2 = ($mp_type2 === 'Time In') ? 'adj_time_in' : 'adj_time_out';
                    $db->prepare("UPDATE fch_attendance SET `$adjCol2` = ? WHERE uniq_id = ?")
                       ->execute([$mp_datetime2, $att2['uniq_id']]);

                    $effIn2  = ($adjCol2 === 'adj_time_in')  ? $mp_datetime2 : ($att2['adj_time_in']  ?: $att2['time_in']);
                    $effOut2 = ($adjCol2 === 'adj_time_out') ? $mp_datetime2 : ($att2['adj_time_out'] ?: $att2['time_out']);
                    if ($effIn2 && $effOut2) {
                        $s2 = new DateTime($effIn2);
                        $e2 = new DateTime($effOut2);
                        if ($e2 <= $s2) $e2->modify('+1 day');
                        $iv2    = $s2->diff($e2);
                        $total2 = $iv2->h + ($iv2->i / 60) + ($iv2->s / 3600) + ($iv2->days * 24);
                        $db->prepare("UPDATE fch_attendance SET total_hrs = ? WHERE uniq_id = ?")
                           ->execute([round($total2, 2), $att2['uniq_id']]);
                    }
                } else {
                    $ei2Stmt = $db->prepare("SELECT emp_fullname, emp_dept FROM fch_employees WHERE employee_id = ? LIMIT 1");
                    $ei2Stmt->execute([$employee_id]);
                    $ei2    = $ei2Stmt->fetch();
                    // Fetch the employee's shift for this date (reuse $mpShift if already loaded)
                    if (!isset($mpShift)) {
                        $shiftStmt2 = $db->prepare(
                            "SELECT shift_start, shift_end FROM fch_employees_shift
                              WHERE employee_id = ? AND date = ?
                             UNION ALL
                             SELECT shift_start, shift_end FROM fch_employees_shift
                              WHERE employee_id = ? AND date IS NULL
                             LIMIT 1"
                        );
                        $shiftStmt2->execute([$employee_id, $mp_date, $employee_id]);
                        $mpShift = $shiftStmt2->fetch(PDO::FETCH_ASSOC);
                    }
                    $shiftTimeIn2  = $mpShift ? ($mp_date . ' ' . $mpShift['shift_start']) : null;
                    $shiftTimeOut2 = $mpShift ? ($mp_date . ' ' . $mpShift['shift_end'])   : null;
                    $adjIn2  = ($mp_type2 === 'Time In')  ? $mp_datetime2 : null;
                    $adjOut2 = ($mp_type2 === 'Time Out') ? $mp_datetime2 : null;
                    $db->prepare(
                        "INSERT INTO fch_attendance
                         (employee_id, emp_fullname, emp_dept, date, shift_time_in, shift_time_out, adj_time_in, adj_time_out, total_hrs)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)"
                    )->execute([$employee_id, $ei2['emp_fullname'] ?? '', $ei2['emp_dept'] ?? '', $mp_date, $shiftTimeIn2, $shiftTimeOut2, $adjIn2, $adjOut2]);
                }
            }
        }

    } else {
        throw new Exception("Unsupported request type: $rqst_type");
    }

    $db->commit();

    // Notifications
    try {
        $eName = $db->prepare("SELECT emp_fullname FROM fch_employees WHERE employee_id = ? LIMIT 1");
        $eName->execute([$employee_id]);
        $empName = $eName->fetchColumn() ?? "Employee #{$employee_id}";

        $supMsg = "{$empName} submitted a {$rqst_type} request.";
        $sStmt  = $db->prepare("SELECT employee_id FROM fch_employees WHERE emp_acc_type='Supervisor' AND emp_dept=? AND emp_emptype NOT IN ('Resigned','Terminated')");
        $sStmt->execute([$loggedInUserDept]);
        foreach ($sStmt->fetchAll() as $sRow) {
            $db->prepare("INSERT INTO fch_notifications (employee_id,type,title,message) VALUES (?,?,?,?)")
               ->execute([(int)$sRow['employee_id'], 'request_submitted', 'New Request Submitted', $supMsg]);
        }

        $adminMsg = "{$empName} (Dept: {$loggedInUserDept}) submitted a {$rqst_type} request.";
        $aStmt = $db->query("SELECT employee_id FROM fch_employees WHERE emp_acc_type IN ('Admin','Management') AND emp_emptype NOT IN ('Resigned','Terminated')");
        foreach ($aStmt->fetchAll() as $aRow) {
            $db->prepare("INSERT INTO fch_notifications (employee_id,type,title,message) VALUES (?,?,?,?)")
               ->execute([(int)$aRow['employee_id'], 'request_submitted', 'New Request Submitted', $adminMsg]);
        }
    } catch (Exception $ne) {
        error_log("Notification error in submit.php: " . $ne->getMessage());
    }

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $db->rollBack();
    error_log("Error in submit.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
