<?php
/**
 * Notification helper – ensures the fch_notifications table exists, then
 * inserts one or more notification rows, and optionally sends an email
 * to the recipient if they have email notifications enabled.
 *
 * Usage (include this file AFTER a valid PDO $pdo is available):
 *
 *   require_once __DIR__ . '/../notifications/helper.php';
 *   notifyEmployee($pdo, $employeeId, 'request_update', 'Request Approved', 'Your leave request was approved.');
 *   notifyRole($pdo, 'admin', 'request_submitted', 'New Request', 'John submitted a leave request.', $refId);
 */

// ── Ensure the table exists (auto-migration) ────────────────────────────────
function _ensureNotifTable(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `fch_notifications` (
          `id`           INT          NOT NULL AUTO_INCREMENT,
          `employee_id`  INT          NOT NULL,
          `type`         VARCHAR(60)  NOT NULL DEFAULT 'general',
          `title`        VARCHAR(255) NOT NULL,
          `message`      TEXT         NOT NULL,
          `reference_id` VARCHAR(100) NULL DEFAULT NULL,
          `is_read`      TINYINT(1)   NOT NULL DEFAULT 0,
          `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `idx_notif_employee` (`employee_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");
    // Ensure email-notifications preference column exists
    try {
        $pdo->exec("ALTER TABLE `fch_employees` ADD COLUMN IF NOT EXISTS `emp_email_notifications` TINYINT(1) NOT NULL DEFAULT 0");
    } catch (Exception $e) { /* already exists */ }
    $done = true;
}

// ── Send an email notification to one recipient (internal) ──────────────────
function _maybeSendEmailNotif(PDO $pdo, int $employeeId, string $title, string $message): void {
    try {
        $stmt = $pdo->prepare(
            "SELECT emp_email, emp_fname, emp_lname, emp_email_notifications FROM fch_employees WHERE employee_id = ?"
        );
        $stmt->execute([$employeeId]);
        $emp = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$emp || empty($emp['emp_email']) || empty($emp['emp_email_notifications'])) return;

        $to        = $emp['emp_email'];
        $firstName = htmlspecialchars($emp['emp_fname']);
        $lastName  = htmlspecialchars($emp['emp_lname']);
        $safeTitle = htmlspecialchars($title);
        $safeMsg   = nl2br(htmlspecialchars($message));

        require_once __DIR__ . '/../../config/mail.php';
        $mail = getMailer();
        $mail->addAddress($to, "{$firstName} {$lastName}");
        $mail->Subject = $safeTitle . ' – FamilyCare System';
        $mail->Body    = "
            <div style='font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px'>
                <h2 style='color:#2563eb;margin-bottom:8px'>FamilyCare System Notification</h2>
                <p>Hello {$firstName},</p>
                <div style='background:#f0f4ff;border-left:4px solid #2563eb;border-radius:6px;padding:16px;margin:16px 0'>
                    <strong style='color:#1d4ed8;font-size:15px'>{$safeTitle}</strong>
                    <p style='margin:8px 0 0;color:#374151'>{$safeMsg}</p>
                </div>
                <p style='color:#6b7280;font-size:12px;margin-top:24px'>
                    You received this email because you have email notifications enabled.<br>
                    You can turn them off any time from your profile page.
                </p>
            </div>
        ";
        $mail->send();
    } catch (Exception $e) {
        error_log("_maybeSendEmailNotif error (emp {$employeeId}): " . $e->getMessage());
    }
}

// ── Notify a single employee by employee_id ─────────────────────────────────
function notifyEmployee(PDO $pdo, int $employeeId, string $type, string $title, string $message, ?string $refId = null): void {
    try {
        _ensureNotifTable($pdo);
        $stmt = $pdo->prepare(
            "INSERT INTO fch_notifications (employee_id, type, title, message, reference_id)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([$employeeId, $type, $title, $message, $refId]);
    } catch (Exception $e) {
        error_log("notifyEmployee error: " . $e->getMessage());
    }
    _maybeSendEmailNotif($pdo, $employeeId, $title, $message);
}

// ── Notify all employees of a given role ────────────────────────────────────
// $role: 'Admin', 'Supervisor', 'Employee' (matches emp_acc_type values)
function notifyRole(PDO $pdo, string $role, string $type, string $title, string $message, ?string $refId = null): void {
    try {
        _ensureNotifTable($pdo);
        $stmt = $pdo->prepare(
            "SELECT employee_id FROM fch_employees WHERE emp_acc_type = ? AND emp_emptype NOT IN ('Resigned','Terminated')"
        );
        $stmt->execute([$role]);
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $ins = $pdo->prepare(
            "INSERT INTO fch_notifications (employee_id, type, title, message, reference_id)
             VALUES (?, ?, ?, ?, ?)"
        );
        foreach ($ids as $id) {
            $ins->execute([(int)$id, $type, $title, $message, $refId]);
            _maybeSendEmailNotif($pdo, (int)$id, $title, $message);
        }
    } catch (Exception $e) {
        error_log("notifyRole error: " . $e->getMessage());
    }
}

// ── Notify all supervisors of a specific department ─────────────────────────
function notifyDeptSupervisors(PDO $pdo, string $dept, string $type, string $title, string $message, ?string $refId = null): void {
    try {
        _ensureNotifTable($pdo);
        $stmt = $pdo->prepare(
            "SELECT employee_id FROM fch_employees
             WHERE emp_acc_type = 'Supervisor' AND emp_dept = ?
               AND emp_emptype NOT IN ('Resigned','Terminated')"
        );
        $stmt->execute([$dept]);
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $ins = $pdo->prepare(
            "INSERT INTO fch_notifications (employee_id, type, title, message, reference_id)
             VALUES (?, ?, ?, ?, ?)"
        );
        foreach ($ids as $id) {
            $ins->execute([(int)$id, $type, $title, $message, $refId]);
            _maybeSendEmailNotif($pdo, (int)$id, $title, $message);
        }
    } catch (Exception $e) {
        error_log("notifyDeptSupervisors error: " . $e->getMessage());
    }
}

// ── Notify all admins ────────────────────────────────────────────────────────
function notifyAllAdmins(PDO $pdo, string $type, string $title, string $message, ?string $refId = null): void {
    notifyRole($pdo, 'Admin', $type, $title, $message, $refId);
    notifyRole($pdo, 'Management', $type, $title, $message, $refId);
}

// ── Notify all active employees (all roles) ──────────────────────────────────
function notifyAllActive(PDO $pdo, string $type, string $title, string $message, ?string $refId = null): void {
    try {
        _ensureNotifTable($pdo);
        $stmt = $pdo->prepare(
            "SELECT employee_id FROM fch_employees
             WHERE emp_emptype NOT IN ('Resigned','Terminated')
               AND emp_deleted_at IS NULL"
        );
        $stmt->execute();
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $ins = $pdo->prepare(
            "INSERT INTO fch_notifications (employee_id, type, title, message, reference_id)
             VALUES (?, ?, ?, ?, ?)"
        );
        foreach ($ids as $id) {
            $ins->execute([(int)$id, $type, $title, $message, $refId]);
            _maybeSendEmailNotif($pdo, (int)$id, $title, $message);
        }
    } catch (Exception $e) {
        error_log("notifyAllActive error: " . $e->getMessage());
    }
}
