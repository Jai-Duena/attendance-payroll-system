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
$loggedInUser    = $_SESSION['username'] ?? 'UnknownUser';
$role            = $_SESSION['role']     ?? 'employee';

// Fetch acc type from DB for reliable role check
$accStmt = $db->prepare("SELECT emp_acc_type FROM fch_employees WHERE employee_id = ? LIMIT 1");
$accStmt->execute([(int)$_SESSION['user_id']]);
$loggedInAccType = $accStmt->fetchColumn() ?: 'Employee';

if (!in_array($loggedInAccType, ['Admin', 'Supervisor', 'Management'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$body    = json_decode(file_get_contents('php://input'), true) ?? [];
$uniq_id = $body['uniq_id'] ?? '';

if (!$uniq_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing uniq_id']);
    exit;
}

try {
    $db->beginTransaction();

    // Check if this actor's decision is already finalized (cannot change)
    $lockCheck = $db->prepare("SELECT sup_status, admin_status FROM fch_requests WHERE uniq_id = ?");
    $lockCheck->execute([$uniq_id]);
    $lockRow = $lockCheck->fetch();
    if ($lockRow) {
        if (in_array($loggedInAccType, ['Admin', 'Management']) && $lockRow['admin_status'] !== 'Pending') {
            $db->rollBack();
            http_response_code(409);
            echo json_encode(['error' => 'This request has already been ' . $lockRow['admin_status'] . ' and cannot be changed.']);
            exit;
        } elseif ($loggedInAccType === 'Supervisor' && $lockRow['sup_status'] !== 'Pending') {
            $db->rollBack();
            http_response_code(409);
            echo json_encode(['error' => 'This request has already been ' . $lockRow['sup_status'] . ' and cannot be changed.']);
            exit;
        }
    }

    if (in_array($loggedInAccType, ['Admin', 'Management'])) {
        $db->prepare("UPDATE fch_requests SET admin_status = 'Approved', admin_name = ? WHERE uniq_id = ?")
           ->execute([$loggedInUser, $uniq_id]);
    } else {
        $db->prepare("UPDATE fch_requests SET sup_status = 'Approved', sup_name = ? WHERE uniq_id = ?")
           ->execute([$loggedInUser, $uniq_id]);
    }

    // Re-fetch statuses
    $checkStmt = $db->prepare(
        "SELECT sup_status, admin_status, rqst_type, employee_id,
                leave_type, leave_from, leave_to,
                ot_date, ot_from, ot_to,
                mp_date, mp_type, mp_time
         FROM fch_requests WHERE uniq_id = ?"
    );
    $checkStmt->execute([$uniq_id]);
    $row = $checkStmt->fetch();

    $sup_status   = $row['sup_status']   ?? 'Pending';
    $admin_status = $row['admin_status'] ?? 'Pending';
    $rqst_type    = $row['rqst_type']    ?? '';
    $emp_id       = (int)($row['employee_id'] ?? 0);

    $finalStatus = null;
    if ($sup_status === 'Approved' && $admin_status === 'Approved') {
        $finalStatus = 'Approved';
    } elseif ($sup_status === 'Rejected' || $admin_status === 'Rejected') {
        $finalStatus = 'Rejected';
    }

    if ($finalStatus) {
        $db->prepare("UPDATE fch_requests SET status = ? WHERE uniq_id = ?")
           ->execute([$finalStatus, $uniq_id]);

        // ── Manual Punch: write to att_punches + reflect in fch_attendance ──
        if ($finalStatus === 'Approved' && $rqst_type === 'Manual Punch') {
            $mp_date = $row['mp_date'] ?? '';
            $mp_time = $row['mp_time'] ?? '';
            $mp_type = $row['mp_type'] ?? ''; // 'Time In' or 'Time Out'

            if ($emp_id && $mp_date && $mp_time && $mp_type) {
                $mp_datetime = $mp_date . ' ' . $mp_time;

                // 1. Insert the punch into fch_punches so it feeds future syncs
                $db->prepare(
                    "INSERT INTO fch_punches
                     (employee_id, punch_time, punch_type, operator, operator_reason, operator_time, annotation, processed)
                     VALUES (?, ?, ?, ?, 'Manual Punch Request', NOW(), 'Approved manual punch request', 1)"
                )->execute([$emp_id, $mp_datetime, $mp_type, $loggedInUser]);

                // 2. Reflect immediately in fch_attendance for that date
                $attStmt = $db->prepare(
                    "SELECT uniq_id, time_in, time_out, adj_time_in, adj_time_out
                     FROM fch_attendance WHERE employee_id = ? AND date = ? LIMIT 1"
                );
                $attStmt->execute([$emp_id, $mp_date]);
                $att = $attStmt->fetch();

                if ($att) {
                    // Row exists — apply as an adj_ override then recalculate total_hrs
                    $adjCol = ($mp_type === 'Time In') ? 'adj_time_in' : 'adj_time_out';
                    $db->prepare("UPDATE fch_attendance SET `$adjCol` = ? WHERE uniq_id = ?")
                       ->execute([$mp_datetime, $att['uniq_id']]);

                    // Recalculate total_hrs
                    $effIn  = ($adjCol === 'adj_time_in')  ? $mp_datetime : ($att['adj_time_in']  ?: $att['time_in']);
                    $effOut = ($adjCol === 'adj_time_out') ? $mp_datetime : ($att['adj_time_out'] ?: $att['time_out']);
                    if ($effIn && $effOut) {
                        $start = new DateTime($effIn);
                        $end   = new DateTime($effOut);
                        if ($end <= $start) $end->modify('+1 day');
                        $diff  = $start->diff($end);
                        $total = $diff->h + ($diff->i / 60) + ($diff->s / 3600) + ($diff->days * 24);
                        $db->prepare("UPDATE fch_attendance SET total_hrs = ? WHERE uniq_id = ?")
                           ->execute([round($total, 2), $att['uniq_id']]);
                    }
                } else {
                    // No attendance row yet — create one using adj columns so
                    // a future sync will preserve this manual entry and recalculate
                    $eiStmt = $db->prepare("SELECT emp_fullname, emp_dept FROM fch_employees WHERE employee_id = ? LIMIT 1");
                    $eiStmt->execute([$emp_id]);
                    $ei = $eiStmt->fetch();
                    $adjIn  = ($mp_type === 'Time In')  ? $mp_datetime : null;
                    $adjOut = ($mp_type === 'Time Out') ? $mp_datetime : null;
                    $db->prepare(
                        "INSERT INTO fch_attendance
                         (employee_id, emp_fullname, emp_dept, date, adj_time_in, adj_time_out, total_hrs)
                         VALUES (?, ?, ?, ?, ?, ?, 0)"
                    )->execute([$emp_id, $ei['emp_fullname'] ?? '', $ei['emp_dept'] ?? '', $mp_date, $adjIn, $adjOut]);
                }
            }
        }
    }

    $db->commit();

    // Notifications
    try {
        $eStmt = $db->prepare("SELECT emp_fullname, emp_dept FROM fch_employees WHERE employee_id = ? LIMIT 1");
        $eStmt->execute([$emp_id]);
        $eRow     = $eStmt->fetch();
        $empName  = $eRow['emp_fullname'] ?? "Employee #{$emp_id}";
        $empDept  = $eRow['emp_dept']     ?? '';

        $effectiveStatus = $finalStatus ?? 'Reviewed';
        $actorLabel      = in_array($loggedInAccType, ['Admin', 'Management']) ? 'Admin' : 'Supervisor';

        if ($effectiveStatus === 'Approved') {
            $empMsg = "Your {$rqst_type} request has been fully approved.";
        } else {
            $empMsg = "{$actorLabel} has approved your {$rqst_type} request (pending further review).";
        }

        if ($emp_id) {
            $db->prepare("INSERT INTO fch_notifications (employee_id,type,title,message,reference_id) VALUES (?,?,?,?,?)")
               ->execute([$emp_id, 'request_update', 'Request Update', $empMsg, $uniq_id]);
        }

        if ($loggedInAccType === 'Supervisor') {
            $adminMsg = "Supervisor approved {$empName}'s {$rqst_type} request (Dept: {$empDept}).";
            $aStmt = $db->query("SELECT employee_id FROM fch_employees WHERE emp_acc_type IN ('Admin','Management') AND emp_emptype NOT IN ('Resigned','Terminated')");
            foreach ($aStmt->fetchAll() as $aRow) {
                $db->prepare("INSERT INTO fch_notifications (employee_id,type,title,message,reference_id) VALUES (?,?,?,?,?)")
                   ->execute([(int)$aRow['employee_id'], 'request_update', 'Request Approved by Supervisor', $adminMsg, $uniq_id]);
            }
        } elseif (in_array($loggedInAccType, ['Admin', 'Management'])) {
            $supMsg = "Admin approved {$empName}'s {$rqst_type} request.";
            $sStmt  = $db->prepare("SELECT employee_id FROM fch_employees WHERE emp_acc_type='Supervisor' AND emp_dept=? AND emp_emptype NOT IN ('Resigned','Terminated')");
            $sStmt->execute([$empDept]);
            foreach ($sStmt->fetchAll() as $sRow) {
                $db->prepare("INSERT INTO fch_notifications (employee_id,type,title,message,reference_id) VALUES (?,?,?,?,?)")
                   ->execute([(int)$sRow['employee_id'], 'request_update', 'Request Reviewed by Admin', $supMsg, $uniq_id]);
            }
        }
    } catch (Exception $ne) {
        error_log("Notification error in approve.php: " . $ne->getMessage());
    }

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $db->rollBack();
    error_log("Error in approve.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
