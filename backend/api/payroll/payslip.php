<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
$role          = $_SESSION['role'] ?? '';
$loggedInUserId = (int)($_SESSION['user_id'] ?? 0);
$allowedRoles  = ['admin', 'supervisor', 'management', 'employee'];
if (!in_array($role, $allowedRoles) || !$loggedInUserId) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$batchId    = isset($_GET['batch_id'])    ? (int)$_GET['batch_id']    : null;
$employeeId = isset($_GET['employee_id']) ? (int)$_GET['employee_id'] : null;

// Employees can only view their own payslip
if ($role === 'employee') {
    $employeeId = $loggedInUserId;
}

if (!$batchId || !$employeeId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing batch_id or employee_id']);
    exit;
}

$pdo = getDB();

// Employee info
$empStmt = $pdo->prepare("SELECT employee_id, emp_fullname, emp_dept, emp_position, emp_emptype, emp_dailyrate,
    emp_sss, emp_pagibig, emp_philhealth, emp_tin, emp_photo, emp_sign
    FROM fch_employees WHERE employee_id=?");
$empStmt->execute([$employeeId]);
$employee = $empStmt->fetch(PDO::FETCH_ASSOC);
if (!$employee) {
    http_response_code(404);
    echo json_encode(['error' => 'Employee not found']);
    exit;
}

// Batch period info
$batchStmt = $pdo->prepare("SELECT payroll_start, payroll_end FROM fch_payroll_results WHERE batch_id=? LIMIT 1");
$batchStmt->execute([$batchId]);
$batch = $batchStmt->fetch(PDO::FETCH_ASSOC);

// Payroll summary
$sumStmt = $pdo->prepare("SELECT * FROM fch_payroll_summary WHERE batch_id=? AND employee_id=?");
$sumStmt->execute([$batchId, $employeeId]);
$summary = $sumStmt->fetch(PDO::FETCH_ASSOC);

// Attendance summary
$attStmt = $pdo->prepare("SELECT * FROM fch_attendance_summary WHERE batch_id=? AND employee_id=?");
$attStmt->execute([$batchId, $employeeId]);
$attendance = $attStmt->fetch(PDO::FETCH_ASSOC);

// Earnings
$earStmt = $pdo->prepare("SELECT * FROM fch_earnings_computation WHERE batch_id=? AND employee_id=?");
$earStmt->execute([$batchId, $employeeId]);
$earnings = $earStmt->fetch(PDO::FETCH_ASSOC);

// Deductions
$dedStmt = $pdo->prepare("SELECT * FROM fch_deductions_computation WHERE batch_id=? AND employee_id=?");
$dedStmt->execute([$batchId, $employeeId]);
$deductions = $dedStmt->fetch(PDO::FETCH_ASSOC);

// Tax
$taxStmt = $pdo->prepare("SELECT * FROM fch_tax_deduction WHERE batch_id=? AND employee_id=?");
$taxStmt->execute([$batchId, $employeeId]);
$tax = $taxStmt->fetch(PDO::FETCH_ASSOC);

// Payroll result status + approver id
$resStmt = $pdo->prepare("SELECT status, approved_by_id FROM fch_payroll_results WHERE batch_id=? LIMIT 1");
$resStmt->execute([$batchId]);
$resRow = $resStmt->fetch(PDO::FETCH_ASSOC) ?: [];
$resultStatus = $resRow['status'] ?? 'Draft';
$approvedById = $resRow['approved_by_id'] ?? null;

// Fetch approver info when batch is Approved or Released
$approver = null;
if ($approvedById) {
    $apprStmt = $pdo->prepare(
        "SELECT e.employee_id, e.emp_fullname, e.emp_position, e.emp_sign
         FROM fch_employees e WHERE e.employee_id = ? LIMIT 1"
    );
    $apprStmt->execute([(int)$approvedById]);
    $approver = $apprStmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

echo json_encode([
    'success'       => true,
    'employee'      => $employee,
    'batch'         => $batch,
    'summary'       => $summary,
    'attendance'    => $attendance,
    'earnings'      => $earnings,
    'deductions'    => $deductions,
    'tax'           => $tax,
    'result_status' => $resultStatus,
    'approver'      => $approver,
]);
