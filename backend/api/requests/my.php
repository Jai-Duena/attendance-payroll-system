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

// Ensure columns added in newer versions exist before selecting them
try {
    $db->exec("ALTER TABLE fch_requests ADD COLUMN IF NOT EXISTS `lwop_type`      varchar(50)  DEFAULT NULL");
    $db->exec("ALTER TABLE fch_requests ADD COLUMN IF NOT EXISTS `leave_period`   varchar(20)  DEFAULT NULL");
    $db->exec("ALTER TABLE fch_requests ADD COLUMN IF NOT EXISTS `lwop_time_from` time         DEFAULT NULL");
    $db->exec("ALTER TABLE fch_requests ADD COLUMN IF NOT EXISTS `lwop_time_to`   time         DEFAULT NULL");
    $db->exec("ALTER TABLE fch_requests ADD COLUMN IF NOT EXISTS `emergency_type` varchar(100) DEFAULT NULL");
    $db->exec("ALTER TABLE fch_requests ADD COLUMN IF NOT EXISTS `mp_proof`       varchar(255) DEFAULT NULL");
    $db->exec("ALTER TABLE fch_requests ADD COLUMN IF NOT EXISTS `attachment`     varchar(255) DEFAULT NULL");
    $db->exec("ALTER TABLE fch_requests MODIFY `leave_total` decimal(5,2) DEFAULT NULL");
} catch (\Exception $e) { /* ignore */ }

$stmt = $db->prepare(
    "SELECT r.uniq_id AS id, r.employee_id,
            e.emp_fullname AS employee_name, e.emp_dept AS department,
            e.emp_position, e.emp_sign,
            r.rqst_type AS type, r.rqst_type, r.reason,
            r.status, r.sup_status, r.admin_status,
            r.sup_name, r.admin_name,
            sup.emp_fullname AS sup_fullname, sup.emp_position AS sup_position, sup.emp_sign AS sup_sign,
            adm.emp_fullname AS admin_fullname, adm.emp_position AS admin_position, adm.emp_sign AS admin_sign,
            r.encode_date AS created_at,
            r.mp_date, r.mp_time, r.mp_type, r.mp_reason, r.mp_proof,
            r.cs_date, r.cs_new_shift, r.cs_old_shift,
            r.leave_type, r.leave_from, r.leave_to, r.leave_total, r.emergency_type,
            r.lwop_type, r.leave_period, r.lwop_time_from, r.lwop_time_to,
            r.ot_date, r.ot_work_done, r.ot_from, r.ot_to, r.ot_total,
            r.wfh_date, r.wfh_start, r.wfh_end, r.wfh_activity, r.wfh_output,
            r.other_type, r.other_from_date, r.other_to_date, r.other_total_date,
            r.other_from_time, r.other_to_time, r.other_total_time,
            COALESCE(r.leave_from, r.ot_date, r.cs_date, r.mp_date,
                     r.wfh_date, r.other_from_date) AS effective_date
     FROM fch_requests r
     JOIN fch_employees e ON e.employee_id = r.employee_id
     LEFT JOIN fch_employees sup ON sup.emp_username = r.sup_name
     LEFT JOIN fch_employees adm ON adm.emp_username = r.admin_name
     WHERE r.employee_id = ?
     ORDER BY CASE WHEN r.status = 'Pending' THEN 0 ELSE 1 END ASC, r.encode_date DESC
     LIMIT 100"
);
$stmt->execute([$employeeId]);

echo json_encode($stmt->fetchAll());
?>
exit;
