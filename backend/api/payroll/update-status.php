<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
if (($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST required']);
    exit;
}

$body            = json_decode(file_get_contents('php://input'), true) ?? [];
$id              = isset($body['result_id']) ? (int)$body['result_id'] : null;
$status          = $body['status'] ?? null;
$reviewDuration  = isset($body['review_duration']) ? trim($body['review_duration']) : '';

$allowed = ['Draft', 'Under Review', 'Approved', 'Released', 'Dropped'];

if (!$id || !$status || !in_array($status, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['error' => "Missing or invalid result_id / status. Allowed: " . implode(', ', $allowed)]);
    exit;
}

$pdo = getDB();

// Verify the record exists AND check if already locked
$chk = $pdo->prepare("SELECT id, status FROM fch_payroll_results WHERE id=?");
$chk->execute([$id]);
$existingRow = $chk->fetch(PDO::FETCH_ASSOC);
if (!$existingRow) {
    http_response_code(404);
    echo json_encode(['error' => 'Payroll result not found']);
    exit;
}

// Once Approved, Released, or Dropped — the batch is locked and cannot be changed
$lockedStatuses = ['Approved', 'Released', 'Dropped'];
if (in_array($existingRow['status'], $lockedStatuses, true)) {
    http_response_code(409);
    echo json_encode(['error' => "This payroll batch has already been {$existingRow['status']} and cannot be changed."]);
    exit;
}

// Track who approved/released and when
$approvingStatuses = ['Approved', 'Released'];
if (in_array($status, $approvingStatuses, true)) {
    $upd = $pdo->prepare("UPDATE fch_payroll_results SET status=?, approved_by_id=?, approved_at=NOW(), updated_at=NOW() WHERE id=?");
    $upd->execute([$status, (int)$_SESSION['user_id'], $id]);
} else {
    $upd = $pdo->prepare("UPDATE fch_payroll_results SET status=?, updated_at=NOW() WHERE id=?");
    $upd->execute([$status, $id]);
}

// ── Notifications ─────────────────────────────────────────────────────────
try {
    require_once __DIR__ . '/../notifications/helper.php';

    // fch_payroll_results has ONE row per batch (no employee_id stored there).
    // Fetch the batch period directly from fch_payroll_results, then get ALL
    // employees in that batch from fch_payroll_summary.
    $batchStmt = $pdo->prepare(
        "SELECT batch_id, payroll_start, payroll_end FROM fch_payroll_results WHERE id = ?"
    );
    $batchStmt->execute([$id]);
    $bRow = $batchStmt->fetch(PDO::FETCH_ASSOC);

    $batchLabel = '';
    $batchId    = null;
    if ($bRow) {
        $batchId    = (int)$bRow['batch_id'];
        if ($bRow['payroll_start'] && $bRow['payroll_end']) {
            $batchLabel = " (" . $bRow['payroll_start'] . " – " . $bRow['payroll_end'] . ")";
        }
    }

    // All employees in this batch
    $empIds = [];
    if ($batchId) {
        $empStmt = $pdo->prepare("SELECT DISTINCT employee_id FROM fch_payroll_summary WHERE batch_id = ?");
        $empStmt->execute([$batchId]);
        $empIds  = $empStmt->fetchAll(PDO::FETCH_COLUMN, 0);
    }

    if ($status === 'Released' || $status === 'Approved') {
        // Notify every employee in the batch
        $empNotifMsg = "Your payroll{$batchLabel} has been {$status}.";
        foreach ($empIds as $empId) {
            notifyEmployee($pdo, (int)$empId, 'payroll_' . strtolower($status), "Payroll {$status}", $empNotifMsg, (string)$id);
        }
        // Notify all supervisors
        $notifyMsg = "Payroll batch{$batchLabel} status changed to {$status}.";
        notifyRole($pdo, 'Supervisor', 'payroll_status', "Payroll {$status}", $notifyMsg, (string)$id);
    } elseif ($status === 'Under Review') {
        // Notify all active employees about the review period
        $durationNote = $reviewDuration ? " It will be under review for {$reviewDuration}." : '';
        $empMsg = "Payroll Batch #{$batchId}{$batchLabel} is now Under Review.{$durationNote} Please check your payroll and report any inaccuracies or concerns before it is approved. Once approved, no further corrections can be made.";
        notifyAllActive($pdo, 'payroll_under_review', 'Payroll Under Review', $empMsg, (string)$id);
    } elseif ($status === 'Dropped') {
        $dropMsg = "A payroll batch{$batchLabel} has been dropped.";
        foreach ($empIds as $empId) {
            notifyEmployee($pdo, (int)$empId, 'payroll_dropped', 'Payroll Dropped', $dropMsg, (string)$id);
        }
        notifyRole($pdo, 'Supervisor', 'payroll_status', 'Payroll Dropped', "Payroll batch{$batchLabel} was dropped by Admin.", (string)$id);
    }
    // Draft: no notification needed
} catch (Exception $ne) {
    error_log("Notification error in update-status.php: " . $ne->getMessage());
}
// ── End Notifications ──────────────────────────────────────────────────────

echo json_encode(['success' => true, 'message' => "Status updated to '$status'"]);
exit;
