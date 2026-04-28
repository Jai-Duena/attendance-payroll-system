<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$employeeId = (int)$_SESSION['user_id'];
$db = getDB();

// Ensure emp_gender column exists with correct ENUM
try {
    $db->exec("ALTER TABLE fch_employees ADD COLUMN IF NOT EXISTS `emp_gender` ENUM('Male','Female') DEFAULT NULL");
    $db->exec("ALTER TABLE fch_employees MODIFY COLUMN `emp_gender` ENUM('Male','Female') DEFAULT NULL");
} catch (\Exception $e) {}

$stmt = $db->prepare(
    "SELECT employee_id, emp_fullname, emp_username, emp_dept, emp_acc_type, emp_shift, emp_emptype, emp_gender, emp_datehire
     FROM fch_employees WHERE employee_id = ?"
);
$stmt->execute([$employeeId]);
$emp = $stmt->fetch();

if (!$emp) {
    http_response_code(404);
    echo json_encode(['error' => 'Employee not found']);
    exit;
}

// ── Service duration & leave eligibility ────────────────────────────────────────
$hireDate = !empty($emp['emp_datehire']) ? $emp['emp_datehire'] : null;
$serviceMonths    = 0;
$vlEligibleDate   = null;
$gynoEligibleDate = null;

if ($hireDate) {
    $hire = new DateTime($hireDate);
    $now  = new DateTime();
    $diff = $hire->diff($now);
    $serviceMonths    = ($diff->y * 12) + $diff->m;
    $vlEligibleDate   = (clone $hire)->modify('+12 months')->format('Y-m-d');
    $gynoEligibleDate = (clone $hire)->modify('+6 months')->format('Y-m-d');
}

// Parse regular shift hours from "HH:MM to HH:MM"
// 12-hr hospital shifts = 8 hrs regular + 4 hrs OT → full entitlement; only pro-rate genuine <8 hr shifts
$shiftHours = 8.0;
$shift = $emp['emp_shift'] ?? '';
if ($shift && preg_match('/(\d{1,2}):(\d{2})\s+to\s+(\d{1,2}):(\d{2})/i', $shift, $sm)) {
    $startMins = (int)$sm[1] * 60 + (int)$sm[2];
    $endMins   = (int)$sm[3] * 60 + (int)$sm[4];
    $diffMins  = $endMins - $startMins;
    if ($diffMins < 0) $diffMins += 1440; // overnight shift
    $parsed = round($diffMins / 60, 2);
    if ($parsed > 0) $shiftHours = $parsed;
}
$proRate  = ($shiftHours < 8.0) ? ($shiftHours / 8.0) : 1.0;

$empTypeLower = strtolower($emp['emp_emptype'] ?? '');
$isTrainee    = ($empTypeLower === 'trainee');

// If no hire date, default to eligible (backward compatibility)
$vlSlEligible = !$isTrainee && ($hireDate ? $serviceMonths >= 12 : true);
$gynoEligible = !$isTrainee && ($hireDate ? $serviceMonths >= 6  : true);

$vlTotal   = $vlSlEligible ? round(7.0 * $proRate, 4) : 0.0;
$slTotal   = $vlSlEligible ? round(7.0 * $proRate, 4) : 0.0;
$gynoTotal = $gynoEligible ? 60 : 0;

// Sum approved leave days per type — current year only (resets every Jan 1)
$leaveStmt = $db->prepare(
    "SELECT leave_type, COALESCE(SUM(leave_total), 0) AS days_used
     FROM fch_requests
     WHERE employee_id = ? AND rqst_type = 'Leave' AND status = 'Approved'
       AND YEAR(leave_from) = YEAR(CURDATE())
     GROUP BY leave_type"
);
$leaveStmt->execute([$employeeId]);
$leaveRows = $leaveStmt->fetchAll();

$leaveCounts = [];
foreach ($leaveRows as $row) {
    $leaveCounts[$row['leave_type']] = (float)$row['days_used'];
}

$emp['vacation_leave_used']      = (float)($leaveCounts['Vacation Leave'] ?? 0);
$emp['sick_leave_used']          = (float)($leaveCounts['Sick Leave']     ?? 0);
$emp['vacation_leave_total']     = $vlTotal;
$emp['sick_leave_total']         = $slTotal;
$emp['vacation_leave_remaining'] = max(0, (float)$vlTotal - $emp['vacation_leave_used']);
$emp['sick_leave_remaining']     = max(0, (float)$slTotal - $emp['sick_leave_used']);

// New leave types (per year, reset Jan 1)
$maternity_used       = (float)($leaveCounts['Maternity Leave']      ?? 0);
$paternity_used       = (float)($leaveCounts['Paternity Leave']      ?? 0);
$solo_parent_used     = (float)($leaveCounts['Solo Parent Leave']    ?? 0);
$vawc_used            = (float)($leaveCounts['VAWC Leave']           ?? 0);
$gynecological_used   = (float)($leaveCounts['Gynecological Leave']  ?? 0);

$emp['maternity_leave_used']          = $maternity_used;
$emp['maternity_leave_total']         = 105;
$emp['maternity_leave_remaining']     = max(0, 105 - $maternity_used);

$emp['paternity_leave_used']          = $paternity_used;
$emp['paternity_leave_total']         = 7;
$emp['paternity_leave_remaining']     = max(0, 7 - $paternity_used);

$emp['solo_parent_leave_used']        = $solo_parent_used;
$emp['solo_parent_leave_total']       = 7;
$emp['solo_parent_leave_remaining']   = max(0, 7 - $solo_parent_used);

$emp['vawc_leave_used']               = $vawc_used;
$emp['vawc_leave_total']              = 10;
$emp['vawc_leave_remaining']          = max(0, 10 - $vawc_used);

$emp['gynecological_leave_used']      = $gynecological_used;
$emp['gynecological_leave_total']     = $gynoTotal;
$emp['gynecological_leave_remaining'] = max(0, $gynoTotal - $gynecological_used);

// Eligibility metadata for frontend
$emp['vl_sl_eligible']    = $vlSlEligible;
$emp['gyno_eligible']     = $gynoEligible;
$emp['is_trainee']        = $isTrainee;
$emp['vl_eligible_date']  = $vlEligibleDate;
$emp['gyno_eligible_date'] = $gynoEligibleDate;

echo json_encode($emp);
?>
exit;
