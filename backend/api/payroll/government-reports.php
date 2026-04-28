<?php
/**
 * GET /api/payroll/government-reports.php
 * Streams government-formatted CSV reports.
 *
 * Query params:
 *  type        sss_r3 | philhealth_rf1 | pagibig_mcr   (per-batch contribution reports)
 *  batch_id    required for sss_r3 / philhealth_rf1 / pagibig_mcr
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
if ($_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$type    = trim($_GET['type']     ?? '');
$batchId = !empty($_GET['batch_id']) ? (int)$_GET['batch_id'] : null;
$pdo     = getDB();

$allowed = ['sss_r3', 'philhealth_rf1', 'pagibig_mcr'];
if (!in_array($type, $allowed)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid report type. Allowed: ' . implode(', ', $allowed)]);
    exit;
}

if (!$batchId) {
    http_response_code(400);
    echo json_encode(['error' => 'batch_id is required']);
    exit;
}

// ── Load batch info ──────────────────────────────────────────────────────────
$batchStmt = $pdo->prepare(
    'SELECT batch_id, payroll_start, payroll_end FROM fch_payroll_results WHERE batch_id = ? LIMIT 1'
);
$batchStmt->execute([$batchId]);
$batch = $batchStmt->fetch(PDO::FETCH_ASSOC);
if (!$batch) {
    http_response_code(404);
    echo json_encode(['error' => 'Batch not found']);
    exit;
}

// ── Load company info ────────────────────────────────────────────────────────
$company = $pdo->query(
    'SELECT company_name, address FROM fch_company_profile WHERE id = 1 LIMIT 1'
)->fetch(PDO::FETCH_ASSOC);
$companyName    = $company['company_name'] ?? 'Family Care Hospital';
$companyAddress = $company['address']      ?? '';

$monthLabel = date('F Y', strtotime($batch['payroll_start']));
$period     = $batch['payroll_start'] . ' to ' . $batch['payroll_end'];

// ── Fetch contribution data ──────────────────────────────────────────────────
$rows = $pdo->prepare("
    SELECT
        d.employee_id,
        d.emp_fullname,
        d.emp_dept,
        e.emp_sss,
        e.emp_philhealth,
        e.emp_pagibig,
        COALESCE(d.adj_employee_sss,        d.employee_sss)        AS employee_sss,
        COALESCE(d.adj_employer_sss,        d.employer_sss)        AS employer_sss,
        COALESCE(d.adj_employee_philhealth, d.employee_philhealth) AS employee_philhealth,
        COALESCE(d.adj_employer_philhealth, d.employer_philhealth) AS employer_philhealth,
        COALESCE(d.adj_employee_pagibig,    d.employee_pagibig)    AS employee_pagibig,
        COALESCE(d.adj_employer_pagibig,    d.employer_pagibig)    AS employer_pagibig
    FROM fch_deductions_computation d
    JOIN fch_employees e ON e.employee_id = d.employee_id
    WHERE d.batch_id = ?
    ORDER BY d.emp_fullname ASC
");
$rows->execute([$batchId]);
$data = $rows->fetchAll(PDO::FETCH_ASSOC);

// ── Stream CSV ───────────────────────────────────────────────────────────────
$out = fopen('php://output', 'w');

switch ($type) {
    // ─────────────────────────────────────────────────────────────────────────
    case 'sss_r3':
        $filename = "SSS_R3_Batch{$batchId}_{$batch['payroll_start']}.csv";
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache'); header('Expires: 0');
        fwrite($out, "\xEF\xBB\xBF");

        // Report header block
        fputcsv($out, ['SSS CONTRIBUTION REPORT (R3 FORMAT)']);
        fputcsv($out, ['Employer / Company Name:', $companyName]);
        fputcsv($out, ['Address:', $companyAddress]);
        fputcsv($out, ['Applicable Month:', $monthLabel]);
        fputcsv($out, ['Payroll Period:', $period]);
        fputcsv($out, ['Batch ID:', $batchId]);
        fputcsv($out, []);

        // Column headers
        fputcsv($out, [
            'No.',
            'Employee Name',
            'Department',
            'SSS Number',
            'Employee Share (₱)',
            'Employer Share (₱)',
            'Total Contribution (₱)',
        ]);

        $totalEmpShare = 0;
        $totalEmpyrShare = 0;
        $totalTotal = 0;
        $i = 1;
        foreach ($data as $r) {
            $empShare  = (float)$r['employee_sss'];
            $emprShare = (float)$r['employer_sss'];
            $tot       = $empShare + $emprShare;
            $totalEmpShare  += $empShare;
            $totalEmpyrShare += $emprShare;
            $totalTotal     += $tot;
            fputcsv($out, [
                $i++,
                $r['emp_fullname'],
                $r['emp_dept'],
                $r['emp_sss'] ?: 'N/A',
                number_format($empShare,  2, '.', ''),
                number_format($emprShare, 2, '.', ''),
                number_format($tot,       2, '.', ''),
            ]);
        }

        // Totals row
        fputcsv($out, []);
        fputcsv($out, [
            '', 'TOTAL', '', '',
            number_format($totalEmpShare,  2, '.', ''),
            number_format($totalEmpyrShare, 2, '.', ''),
            number_format($totalTotal,      2, '.', ''),
        ]);
        fputcsv($out, ['Total Employees:', count($data)]);
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'philhealth_rf1':
        $filename = "PhilHealth_RF1_Batch{$batchId}_{$batch['payroll_start']}.csv";
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache'); header('Expires: 0');
        fwrite($out, "\xEF\xBB\xBF");

        fputcsv($out, ['PHILHEALTH REMITTANCE FORM (RF-1 FORMAT)']);
        fputcsv($out, ['Employer / Company Name:', $companyName]);
        fputcsv($out, ['Address:', $companyAddress]);
        fputcsv($out, ['Applicable Month:', $monthLabel]);
        fputcsv($out, ['Payroll Period:', $period]);
        fputcsv($out, ['Batch ID:', $batchId]);
        fputcsv($out, []);

        fputcsv($out, [
            'No.',
            'Employee Name',
            'Department',
            'PhilHealth Number',
            'Employee Share (₱)',
            'Employer Share (₱)',
            'Total Premium (₱)',
        ]);

        $totalEmpShare = 0; $totalEmpyrShare = 0; $totalTotal = 0; $i = 1;
        foreach ($data as $r) {
            $empShare  = (float)$r['employee_philhealth'];
            $emprShare = (float)$r['employer_philhealth'];
            $tot       = $empShare + $emprShare;
            $totalEmpShare   += $empShare;
            $totalEmpyrShare += $emprShare;
            $totalTotal      += $tot;
            fputcsv($out, [
                $i++,
                $r['emp_fullname'],
                $r['emp_dept'],
                $r['emp_philhealth'] ?: 'N/A',
                number_format($empShare,  2, '.', ''),
                number_format($emprShare, 2, '.', ''),
                number_format($tot,       2, '.', ''),
            ]);
        }

        fputcsv($out, []);
        fputcsv($out, [
            '', 'TOTAL', '', '',
            number_format($totalEmpShare,   2, '.', ''),
            number_format($totalEmpyrShare, 2, '.', ''),
            number_format($totalTotal,      2, '.', ''),
        ]);
        fputcsv($out, ['Total Employees:', count($data)]);
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'pagibig_mcr':
        $filename = "PagIBIG_MCR_Batch{$batchId}_{$batch['payroll_start']}.csv";
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache'); header('Expires: 0');
        fwrite($out, "\xEF\xBB\xBF");

        fputcsv($out, ['PAG-IBIG MONTHLY COLLECTION REPORT (MCR FORMAT)']);
        fputcsv($out, ['Employer / Company Name:', $companyName]);
        fputcsv($out, ['Address:', $companyAddress]);
        fputcsv($out, ['Applicable Month:', $monthLabel]);
        fputcsv($out, ['Payroll Period:', $period]);
        fputcsv($out, ['Batch ID:', $batchId]);
        fputcsv($out, []);

        fputcsv($out, [
            'No.',
            'Employee Name',
            'Department',
            'Pag-IBIG Number',
            'Employee Share (₱)',
            'Employer Share (₱)',
            'Total Contribution (₱)',
        ]);

        $totalEmpShare = 0; $totalEmpyrShare = 0; $totalTotal = 0; $i = 1;
        foreach ($data as $r) {
            $empShare  = (float)$r['employee_pagibig'];
            $emprShare = (float)$r['employer_pagibig'];
            $tot       = $empShare + $emprShare;
            $totalEmpShare   += $empShare;
            $totalEmpyrShare += $emprShare;
            $totalTotal      += $tot;
            fputcsv($out, [
                $i++,
                $r['emp_fullname'],
                $r['emp_dept'],
                $r['emp_pagibig'] ?: 'N/A',
                number_format($empShare,  2, '.', ''),
                number_format($emprShare, 2, '.', ''),
                number_format($tot,       2, '.', ''),
            ]);
        }

        fputcsv($out, []);
        fputcsv($out, [
            '', 'TOTAL', '', '',
            number_format($totalEmpShare,   2, '.', ''),
            number_format($totalEmpyrShare, 2, '.', ''),
            number_format($totalTotal,      2, '.', ''),
        ]);
        fputcsv($out, ['Total Employees:', count($data)]);
        break;
}

fclose($out);
