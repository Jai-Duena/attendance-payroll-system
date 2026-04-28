<?php
/**
 * GET /api/payroll/remittance.php
 * Returns per-employee SSS / PhilHealth / Pag-IBIG contribution data for a
 * payroll batch and optionally streams a CSV download.
 *
 * Query params:
 *  batch_id    int  required
 *  type        sss | philhealth | pagibig | all    (default: all)
 *  download    1   → stream CSV instead of JSON    (optional)
 */
ini_set('display_errors', '0');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
$role           = $_SESSION['role'] ?? 'employee';
$loggedInUserId = (int)$_SESSION['user_id'];
if (!in_array($role, ['admin', 'supervisor', 'employee'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$batchId  = !empty($_GET['batch_id']) ? (int)$_GET['batch_id'] : null;
$type     = $_GET['type']     ?? 'all';
$download = !empty($_GET['download']);

if (!$batchId) {
    http_response_code(400);
    echo json_encode(['error' => 'batch_id is required']);
    exit;
}
if (!in_array($type, ['sss', 'philhealth', 'pagibig', 'all'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type']);
    exit;
}

$pdo = getDB();

// Fetch batch date range for filename/title
$batchStmt = $pdo->prepare("SELECT payroll_start, payroll_end FROM fch_payroll_results WHERE batch_id = ? LIMIT 1");
$batchStmt->execute([$batchId]);
$batch = $batchStmt->fetch(PDO::FETCH_ASSOC);
if (!$batch) {
    http_response_code(404);
    echo json_encode(['error' => 'Batch not found']);
    exit;
}

// Optional employee_id scope: frontend passes this when in employee/supervisor view
// For 'employee' session role, always force to own ID regardless of param
$scopeEmpId = null;
if ($role === 'employee') {
    $scopeEmpId = $loggedInUserId;
} elseif (!empty($_GET['employee_id'])) {
    $scopeEmpId = (int)$_GET['employee_id'];
}

$rows = $pdo->prepare("
    SELECT
        d.employee_id,
        d.emp_fullname,
        d.emp_dept,
        e.emp_sss,
        e.emp_philhealth,
        e.emp_pagibig,
        COALESCE(d.adj_employee_sss,     d.employee_sss)     AS employee_sss,
        COALESCE(d.adj_employer_sss,     d.employer_sss)     AS employer_sss,
        COALESCE(d.adj_employee_philhealth, d.employee_philhealth) AS employee_philhealth,
        COALESCE(d.adj_employer_philhealth, d.employer_philhealth) AS employer_philhealth,
        COALESCE(d.adj_employee_pagibig, d.employee_pagibig) AS employee_pagibig,
        COALESCE(d.adj_employer_pagibig, d.employer_pagibig) AS employer_pagibig
    FROM fch_deductions_computation d
    JOIN (
        SELECT MAX(id) AS latest_id
        FROM fch_deductions_computation
        WHERE batch_id = ?
        GROUP BY employee_id
    ) latest ON latest.latest_id = d.id
    JOIN fch_employees e ON e.employee_id = d.employee_id
    WHERE e.emp_deleted_at IS NULL
" . ($scopeEmpId !== null ? ' AND d.employee_id = ?' : '') . "
    ORDER BY d.emp_dept ASC, d.emp_fullname ASC
");
$execParams = ($scopeEmpId !== null) ? [$batchId, $scopeEmpId] : [$batchId];
$rows->execute($execParams);
$data = $rows->fetchAll(PDO::FETCH_ASSOC);

// Build output rows filtered by type
function buildOutputRows(array $data, string $type): array
{
    $out = [];
    foreach ($data as $r) {
        if ($type === 'sss' || $type === 'all') {
            $out[] = [
                'employee_id'    => $r['employee_id'],
                'emp_fullname'   => $r['emp_fullname'],
                'emp_dept'       => $r['emp_dept'],
                'type'           => 'SSS',
                'id_number'      => $r['emp_sss']              ?? '',
                'employee_share' => $r['employee_sss']         ?? 0,
                'employer_share' => $r['employer_sss']         ?? 0,
                'total'          => ($r['employee_sss'] ?? 0) + ($r['employer_sss'] ?? 0),
            ];
        }
        if ($type === 'philhealth' || $type === 'all') {
            $out[] = [
                'employee_id'    => $r['employee_id'],
                'emp_fullname'   => $r['emp_fullname'],
                'emp_dept'       => $r['emp_dept'],
                'type'           => 'PhilHealth',
                'id_number'      => $r['emp_philhealth']       ?? '',
                'employee_share' => $r['employee_philhealth']  ?? 0,
                'employer_share' => $r['employer_philhealth']  ?? 0,
                'total'          => ($r['employee_philhealth'] ?? 0) + ($r['employer_philhealth'] ?? 0),
            ];
        }
        if ($type === 'pagibig' || $type === 'all') {
            $out[] = [
                'employee_id'    => $r['employee_id'],
                'emp_fullname'   => $r['emp_fullname'],
                'emp_dept'       => $r['emp_dept'],
                'type'           => 'Pag-IBIG',
                'id_number'      => $r['emp_pagibig']          ?? '',
                'employee_share' => $r['employee_pagibig']     ?? 0,
                'employer_share' => $r['employer_pagibig']     ?? 0,
                'total'          => ($r['employee_pagibig'] ?? 0) + ($r['employer_pagibig'] ?? 0),
            ];
        }
    }
    return $out;
}

$output = buildOutputRows($data, $type);

if ($download) {
    $typeLabel = strtoupper($type);
    $filename  = "remittance_{$typeLabel}_{$batch['payroll_start']}_{$batch['payroll_end']}.csv";

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, ['Employee ID', 'Name', 'Department', 'Contribution Type',
                    'ID Number', 'Employee Share', 'Employer Share', 'Total']);
    foreach ($output as $row) {
        fputcsv($out, [
            $row['employee_id'],
            $row['emp_fullname'],
            $row['emp_dept'],
            $row['type'],
            $row['id_number'],
            number_format($row['employee_share'], 2, '.', ''),
            number_format($row['employer_share'], 2, '.', ''),
            number_format($row['total'],          2, '.', ''),
        ]);
    }
    fclose($out);
    exit;
}

echo json_encode([
    'batch'   => $batch,
    'type'    => $type,
    'data'    => $output,
]);
