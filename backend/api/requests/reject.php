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
$loggedInUser = $_SESSION['username'] ?? 'UnknownUser';

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
        $db->prepare("UPDATE fch_requests SET admin_status = 'Rejected', admin_name = ? WHERE uniq_id = ?")
           ->execute([$loggedInUser, $uniq_id]);
    } else {
        $db->prepare("UPDATE fch_requests SET sup_status = 'Rejected', sup_name = ? WHERE uniq_id = ?")
           ->execute([$loggedInUser, $uniq_id]);
    }

    // Re-fetch statuses
    $checkStmt = $db->prepare(
        "SELECT sup_status, admin_status, rqst_type, employee_id
         FROM fch_requests WHERE uniq_id = ?"
    );
    $checkStmt->execute([$uniq_id]);
    $row = $checkStmt->fetch();

    $sup_status   = $row['sup_status']   ?? 'Pending';
    $admin_status = $row['admin_status'] ?? 'Pending';
    $rqst_type    = $row['rqst_type']    ?? 'Request';
    $emp_id       = (int)($row['employee_id'] ?? 0);

    $finalStatus = null;
    if ($sup_status === 'Rejected' || $admin_status === 'Rejected') {
        $finalStatus = 'Rejected';
    } elseif ($sup_status === 'Approved' && $admin_status === 'Approved') {
        $finalStatus = 'Approved';
    }

    if ($finalStatus) {
        $db->prepare("UPDATE fch_requests SET status = ? WHERE uniq_id = ?")
           ->execute([$finalStatus, $uniq_id]);
    }

    $db->commit();

    // Notifications
    try {
        $eStmt = $db->prepare("SELECT emp_fullname, emp_dept FROM fch_employees WHERE employee_id = ? LIMIT 1");
        $eStmt->execute([$emp_id]);
        $eRow    = $eStmt->fetch();
        $empName = $eRow['emp_fullname'] ?? "Employee #{$emp_id}";
        $empDept = $eRow['emp_dept']     ?? '';

        $actorLabel = in_array($loggedInAccType, ['Admin', 'Management']) ? 'Admin' : 'Supervisor';

        if ($emp_id) {
            $empMsg = "{$actorLabel} has rejected your {$rqst_type} request.";
            $db->prepare("INSERT INTO fch_notifications (employee_id,type,title,message,reference_id) VALUES (?,?,?,?,?)")
               ->execute([$emp_id, 'request_update', 'Request Rejected', $empMsg, $uniq_id]);
        }

        if ($loggedInAccType === 'Supervisor') {
            $adminMsg = "Supervisor rejected {$empName}'s {$rqst_type} request (Dept: {$empDept}).";
            $aStmt    = $db->query("SELECT employee_id FROM fch_employees WHERE emp_acc_type IN ('Admin','Management') AND emp_emptype NOT IN ('Resigned','Terminated')");
            foreach ($aStmt->fetchAll() as $aRow) {
                $db->prepare("INSERT INTO fch_notifications (employee_id,type,title,message,reference_id) VALUES (?,?,?,?,?)")
                   ->execute([(int)$aRow['employee_id'], 'request_update', 'Request Rejected by Supervisor', $adminMsg, $uniq_id]);
            }
        } elseif (in_array($loggedInAccType, ['Admin', 'Management'])) {
            $supMsg = "Admin rejected {$empName}'s {$rqst_type} request.";
            $sStmt  = $db->prepare("SELECT employee_id FROM fch_employees WHERE emp_acc_type='Supervisor' AND emp_dept=? AND emp_emptype NOT IN ('Resigned','Terminated')");
            $sStmt->execute([$empDept]);
            foreach ($sStmt->fetchAll() as $sRow) {
                $db->prepare("INSERT INTO fch_notifications (employee_id,type,title,message,reference_id) VALUES (?,?,?,?,?)")
                   ->execute([(int)$sRow['employee_id'], 'request_update', 'Request Reviewed by Admin', $supMsg, $uniq_id]);
            }
        }
    } catch (Exception $ne) {
        error_log("Notification error in reject.php: " . $ne->getMessage());
    }

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $db->rollBack();
    error_log("Error in reject.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
