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

$pdo    = getDB();
$role   = $_SESSION['role']    ?? 'employee';
$myId   = (int)$_SESSION['user_id'];
$empId  = (int)($_GET['id']    ?? 0);

if (!$empId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing employee id']);
    exit;
}

// Employee can only view own profile
if ($role === 'employee' && $empId !== $myId) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "SELECT employee_id, uniq_id, emp_fname, emp_mname, emp_minit, emp_lname, emp_fullname,
                emp_dept, emp_position, emp_emptype, emp_acc_type, emp_shift,
                emp_datehire, emp_dailyrate, emp_sss, emp_pagibig, emp_philhealth,
                emp_tin, emp_username, emp_email, emp_sign, emp_photo, emp_gender
         FROM fch_employees WHERE employee_id = ?"
    );
    $stmt->execute([$empId]);
    $emp = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$emp) {
        http_response_code(404);
        echo json_encode(['error' => 'Employee not found']);
        exit;
    }

    echo json_encode($emp);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
