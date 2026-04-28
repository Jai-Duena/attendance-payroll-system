<?php
/**
 * POST /api/attendance/check-tardiness.php
 * Scans today's attendance records (and optionally a specific date)
 * and sends in-app notifications to department supervisors for:
 *  - Late arrivals (time_in > shift_time_in + grace minutes)
 *  - Missing time-in (employee has a shift today but no attendance record)
 *
 * Designed to be called after every sync (fire-and-forget).
 * Skips employees/days that were already notified today to prevent spam.
 */
ini_set('display_errors', '0');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../notifications/helper.php';

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
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$body       = json_decode(file_get_contents('php://input'), true) ?? [];
$checkDate  = !empty($body['date']) ? $body['date'] : date('Y-m-d');
$graceMins  = max(0, (int)($body['grace_minutes'] ?? 5));

$pdo = getDB();

// Auto-create dedup table so we never notify twice for the same employee+date
$pdo->exec("
    CREATE TABLE IF NOT EXISTS `fch_tardiness_notified` (
      `id`          INT      NOT NULL AUTO_INCREMENT,
      `employee_id` INT      NOT NULL,
      `notif_date`  DATE     NOT NULL,
      `type`        ENUM('late','absent') NOT NULL,
      `notified_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `uq_emp_date_type` (`employee_id`, `notif_date`, `type`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
");

// ── 1. Late arrivals ─────────────────────────────────────────────────────────
// Find all attendance records for $checkDate where effective time_in is later
// than shift_time_in by more than the grace period.
$lateStmt = $pdo->prepare("
    SELECT
        a.employee_id, a.emp_fullname, a.emp_dept,
        COALESCE(a.adj_time_in,  a.time_in)  AS eff_time_in,
        COALESCE(a.adj_shift_time_in, a.shift_time_in) AS eff_shift_in
    FROM fch_attendance a
    WHERE (a.adj_date = ? OR (a.adj_date IS NULL AND a.date = ?))
      AND COALESCE(a.adj_time_in, a.time_in) IS NOT NULL
      AND COALESCE(a.adj_shift_time_in, a.shift_time_in) IS NOT NULL
");
$lateStmt->execute([$checkDate, $checkDate]);
$attRows = $lateStmt->fetchAll(PDO::FETCH_ASSOC);

$lateNotified = 0;
foreach ($attRows as $row) {
    $effIn    = new DateTime($row['eff_time_in']);
    $shiftIn  = new DateTime($row['eff_shift_in']);
    $shiftIn->modify("+{$graceMins} minutes");

    if ($effIn <= $shiftIn) continue; // on time

    $empId   = (int)$row['employee_id'];
    $lateMins = (int)round(($effIn->getTimestamp() - (new DateTime($row['eff_shift_in']))->getTimestamp()) / 60);

    // Dedup check
    $dup = $pdo->prepare("SELECT 1 FROM fch_tardiness_notified WHERE employee_id = ? AND notif_date = ? AND type = 'late'");
    $dup->execute([$empId, $checkDate]);
    if ($dup->fetchColumn()) continue;

    // Notify supervisor(s) of this employee's department
    $dept    = $row['emp_dept'];
    $name    = $row['emp_fullname'];
    $timeStr = $effIn->format('h:i A');
    notifyDeptSupervisors($pdo, $dept, 'tardiness',
        "Late Arrival: {$name}",
        "{$name} ({$dept}) was {$lateMins} minute(s) late on {$checkDate}. Arrived at {$timeStr}.",
        (string)$empId
    );
    // Also notify admins
    notifyAllAdmins($pdo, 'tardiness',
        "Late Arrival: {$name}",
        "{$name} ({$dept}) was {$lateMins} minute(s) late on {$checkDate}. Arrived at {$timeStr}.",
        (string)$empId
    );

    // Record dedup
    try {
        $pdo->prepare("INSERT IGNORE INTO fch_tardiness_notified (employee_id, notif_date, type) VALUES (?, ?, 'late')")
            ->execute([$empId, $checkDate]);
    } catch (Exception $e) {}
    $lateNotified++;
}

// ── 2. Absences ──────────────────────────────────────────────────────────────
// Find employees who have a shift for $checkDate but NO attendance record.
// Only check for past days (not the current day before shifts start).
$now  = new DateTime();
$cDT  = new DateTime($checkDate . ' 23:59:59');
// Only run absence check for completed days
if ($now >= $cDT) {
    $absentStmt = $pdo->prepare("
        SELECT DISTINCT s.employee_id, e.emp_fullname, e.emp_dept
        FROM fch_employees_shift s
        JOIN fch_employees e ON e.employee_id = s.employee_id
        WHERE (s.date = ? OR s.date IS NULL)
          AND e.emp_emptype NOT IN ('Resigned','Terminated')
          AND s.employee_id NOT IN (
              SELECT DISTINCT employee_id FROM fch_attendance
              WHERE date = ? OR adj_date = ?
          )
    ");
    $absentStmt->execute([$checkDate, $checkDate, $checkDate]);
    $absentRows = $absentStmt->fetchAll(PDO::FETCH_ASSOC);

    $absentNotified = 0;
    foreach ($absentRows as $row) {
        $empId = (int)$row['employee_id'];
        $dup = $pdo->prepare("SELECT 1 FROM fch_tardiness_notified WHERE employee_id = ? AND notif_date = ? AND type = 'absent'");
        $dup->execute([$empId, $checkDate]);
        if ($dup->fetchColumn()) continue;

        $dept = $row['emp_dept'];
        $name = $row['emp_fullname'];
        notifyDeptSupervisors($pdo, $dept, 'absence',
            "Absent: {$name}",
            "{$name} ({$dept}) has no attendance record for {$checkDate}.",
            (string)$empId
        );
        notifyAllAdmins($pdo, 'absence',
            "Absent: {$name}",
            "{$name} ({$dept}) has no attendance record for {$checkDate}.",
            (string)$empId
        );

        try {
            $pdo->prepare("INSERT IGNORE INTO fch_tardiness_notified (employee_id, notif_date, type) VALUES (?, ?, 'absent')")
                ->execute([$empId, $checkDate]);
        } catch (Exception $e) {}
        $absentNotified++;
    }
} else {
    $absentNotified = 0;
}

echo json_encode([
    'success'          => true,
    'date'             => $checkDate,
    'late_notified'    => $lateNotified,
    'absent_notified'  => $absentNotified ?? 0,
]);
exit;
