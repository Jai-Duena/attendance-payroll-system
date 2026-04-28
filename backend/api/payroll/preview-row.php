<?php
/**
 * Dry-run preview of saving adj_ changes.
 * Applies changes + cascade inside a rolled-back transaction and
 * returns the before/after diff so the frontend can show a confirmation.
 */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

define('PAYROLL_FUNCTIONS_ONLY', true);
require_once __DIR__ . '/generate.php';

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

$body      = json_decode(file_get_contents('php://input'), true) ?? [];
$tableType = $body['table']   ?? null;
$id        = isset($body['id']) ? (int)$body['id'] : null;
$changes   = $body['changes'] ?? [];

if (!$tableType || !$id || empty($changes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing table, id, or changes']);
    exit;
}

// ── Config ───────────────────────────────────────────────────────────────────

$allowedFields = [
    'earnings' => [
        'adj_reg_pay','adj_ot_pay','adj_nd_pay','adj_ot_nd_pay',
        'adj_reg_holiday_pay','adj_spec_holiday_pay',
        'adj_rd_pay','adj_leave_pay','adj_total_pay',
    ],
    'deductions' => [
        'adj_employee_sss','adj_employer_sss',
        'adj_employee_philhealth','adj_employer_philhealth',
        'adj_employee_pagibig','adj_employer_pagibig',
        'adj_late_deduct','adj_other_deduct',
        'other_deduct',
    ],
    'tax' => [
        'adj_taxable_income','adj_tax_deduct','adj_total',
    ],
    'attendance_summary' => [
        'adj_reg_hrs','adj_ot_hrs','adj_nd_hrs','adj_ot_nd_hrs',
        'adj_reg_holiday_days','adj_late_mins','adj_leave_days',
    ],
];

$tableMap = [
    'earnings'           => 'fch_earnings_computation',
    'deductions'         => 'fch_deductions_computation',
    'tax'                => 'fch_tax_deduction',
    'attendance_summary' => 'fch_attendance_summary',
];

$archiveCascade = [
    'attendance_summary' => ['earnings','deductions','tax'],
    'earnings'           => ['deductions','tax'],
    'deductions'         => ['tax'],
    'tax'                => [],
];

$stepCascade = [
    'attendance_summary' => ['earnings','late','sss','philhealth','pagibig','tax','summary'],
    'earnings'           => ['late','sss','philhealth','pagibig','tax','summary'],
    'deductions'         => ['tax','summary'],
    'tax'                => ['summary'],
];

// Friendly labels for indirect/cascade columns
$fieldLabels = [
    // earnings
    'adj_total_pay'          => 'Adjusted Total Pay',
    'total_pay'              => 'Total Pay',
    // deductions
    'employee_sss'           => 'Employee SSS',
    'employer_sss'           => 'Employer SSS',
    'employee_pagibig'       => 'Employee Pag-IBIG',
    'employer_pagibig'       => 'Employer Pag-IBIG',
    'employee_philhealth'    => 'Employee PhilHealth',
    'employer_philhealth'    => 'Employer PhilHealth',
    'late_deduct'            => 'Late Deduction',
    'total_deduct'           => 'Total Deductions',
    'total_deductions'       => 'Total Deductions',
    // tax
    'taxable_income'         => 'Taxable Income',
    'tax_deduct'             => 'Tax Deduction',
    'total'                  => 'Net After Tax',
    // summary / results
    'gross_pay'              => 'Gross Pay',
    'net_pay'                => 'Net Pay',
    // Adjusted field labels
    'adj_reg_hrs'            => 'Adjusted Regular Hours',
    'adj_ot_hrs'             => 'Adjusted OT Hours',
    'adj_nd_hrs'             => 'Adjusted Night Diff Hours',
    'adj_ot_nd_hrs'          => 'Adjusted OT ND Hours',
    'adj_reg_holiday_days'   => 'Adjusted Holiday Days',
    'adj_late_mins'          => 'Adjusted Late Minutes',
    'adj_leave_days'         => 'Adjusted Leave Days',
    'adj_reg_pay'            => 'Adjusted Regular Pay',
    'adj_ot_pay'             => 'Adjusted OT Pay',
    'adj_nd_pay'             => 'Adjusted Night Diff Pay',
    'adj_ot_nd_pay'          => 'Adjusted OT ND Pay',
    'adj_reg_holiday_pay'    => 'Adjusted Reg Holiday Pay',
    'adj_spec_holiday_pay'   => 'Adjusted Spec Holiday Pay',
    'adj_rd_pay'             => 'Adjusted Rest Day Pay',
    'adj_leave_pay'          => 'Adjusted Leave Pay',
    'adj_employee_sss'       => 'Adjusted Employee SSS',
    'adj_employer_sss'       => 'Adjusted Employer SSS',
    'adj_employee_philhealth'=> 'Adjusted Employee PhilHealth',
    'adj_employer_philhealth'=> 'Adjusted Employer PhilHealth',
    'adj_employee_pagibig'   => 'Adjusted Employee Pag-IBIG',
    'adj_employer_pagibig'   => 'Adjusted Employer Pag-IBIG',
    'adj_late_deduct'        => 'Adjusted Late Deduction',
    'adj_other_deduct'       => 'Adjusted Other Deduction',
    'other_deduct'           => 'Other Deduction',
    'adj_taxable_income'     => 'Adjusted Taxable Income',
    'adj_tax_deduct'         => 'Adjusted Tax Deduction',
    'adj_total'              => 'Adjusted Net After Tax',
];

// Columns to capture per downstream table for the diff
$captureColumns = [
    'fch_earnings_computation'   => ['adj_total_pay','total_pay'],
    'fch_deductions_computation' => [
        'employee_sss','employer_sss','employee_pagibig','employer_pagibig',
        'employee_philhealth','employer_philhealth','late_deduct','total_deduct',
    ],
    'fch_tax_deduction'          => ['taxable_income','tax_deduct','total'],
    'fch_payroll_summary'        => ['gross_pay','total_deductions','tax_deduct','net_pay'],
];

// Table human names
$tableLabels = [
    'fch_earnings_computation'   => 'Earnings',
    'fch_deductions_computation' => 'Deductions',
    'fch_tax_deduction'          => 'Tax',
    'fch_payroll_summary'        => 'Payroll Summary',
];

// ── Validate ─────────────────────────────────────────────────────────────────

if (!isset($tableMap[$tableType])) {
    http_response_code(400);
    echo json_encode(['error' => "Unknown table type: $tableType"]);
    exit;
}
$allowed = $allowedFields[$tableType] ?? [];
foreach ($changes as $chg) {
    if (!in_array($chg['field'] ?? '', $allowed, true)) {
        http_response_code(400);
        echo json_encode(['error' => "Field '{$chg['field']}' not allowed for table '$tableType'"]);
        exit;
    }
}

$pdo = getDB();

// ── Fetch source row ──────────────────────────────────────────────────────────

$tbl = $tableMap[$tableType];
$rowStmt = $pdo->prepare("SELECT * FROM $tbl WHERE id=?");
$rowStmt->execute([$id]);
$existing = $rowStmt->fetch(PDO::FETCH_ASSOC);
if (!$existing) {
    http_response_code(404);
    echo json_encode(['error' => 'Row not found']);
    exit;
}

$batchId = (int)$existing['batch_id'];
$empId   = (int)$existing['employee_id'];
$empName = $existing['emp_fullname'] ?? '';

// ── Helper: capture current values of downstream tables ──────────────────────

// Tables that have an is_archived column
$archivedTables = [
    'fch_earnings_computation',
    'fch_deductions_computation',
    'fch_tax_deduction',
    'fch_attendance_summary',
];

function captureState(PDO $pdo, array $tablesToCapture, int $batchId, int $empId, array $archivedTbls): array {
    $state = [];
    foreach ($tablesToCapture as $t => $cols) {
        $colList    = implode(',', array_map(fn($c) => "`$c`", $cols));
        $archFilter = in_array($t, $archivedTbls, true) ? ' AND is_archived=0' : '';
        $s = $pdo->prepare("SELECT $colList FROM $t WHERE batch_id=? AND employee_id=?$archFilter LIMIT 1");
        $s->execute([$batchId, $empId]);
        $row = $s->fetch(PDO::FETCH_ASSOC);
        $state[$t] = $row ?: [];
    }
    return $state;
}

// Decide which downstream tables are relevant for this tableType
$downstreamTables = [];
foreach ($archiveCascade[$tableType] as $dt) {
    $dtTbl = $tableMap[$dt];
    if (isset($captureColumns[$dtTbl])) {
        $downstreamTables[$dtTbl] = $captureColumns[$dtTbl];
    }
}
// Always include payroll summary (net pay, gross pay)
$downstreamTables['fch_payroll_summary'] = $captureColumns['fch_payroll_summary'];

// ── Before state ──────────────────────────────────────────────────────────────

$before = captureState($pdo, $downstreamTables, $batchId, $empId, $archivedTables);

// Also capture the source table's current values for "direct" diff
$directBefore = [];
foreach ($changes as $chg) {
        $f        = $chg['field'];
        $adjVal   = array_key_exists($f, $existing) ? $existing[$f] : null;
        $baseKey  = preg_replace('/^adj_/', '', $f);
        $baseVal  = array_key_exists($baseKey, $existing) ? $existing[$baseKey] : null;
        // Use adj_ if it has a real value, otherwise fall back to the computed base.
        // Both checks guard against NULL and empty-string (DB may return either).
        $effectiveAdj  = ($adjVal  !== null && $adjVal  !== '') ? (float)$adjVal  : null;
        $effectiveBase = ($baseVal !== null && $baseVal !== '') ? (float)$baseVal : 0.0;
        $directBefore[$f] = $effectiveAdj !== null ? $effectiveAdj : $effectiveBase;
}

try {
    $pdo->beginTransaction();

    // Downstream rows are updated in-place by the step functions (no archiving needed
    // inside this rolled-back preview transaction).

    // Apply each change to source table
    $earningsComponentFields = [
        'adj_reg_pay','adj_ot_pay','adj_nd_pay','adj_ot_nd_pay',
        'adj_reg_holiday_pay','adj_spec_holiday_pay','adj_rd_pay','adj_leave_pay',
    ];

    foreach ($changes as $chg) {
        $f = $chg['field'];
        $v = $chg['value'];
        $upd = $pdo->prepare("UPDATE $tbl SET `$f`=? WHERE id=?");
        $upd->execute([$v, $id]);
    }

    // Earnings component: auto-recalculate adj_total_pay
    $changedFields = array_column($changes, 'field');
    if ($tableType === 'earnings' && array_intersect($changedFields, $earningsComponentFields)) {
        $reRow = $pdo->prepare("SELECT * FROM fch_earnings_computation WHERE id=?");
        $reRow->execute([$id]);
        $er = $reRow->fetch(PDO::FETCH_ASSOC) ?? [];

        $adjPairs = [
            'reg_pay'          => 'adj_reg_pay',
            'ot_pay'           => 'adj_ot_pay',
            'nd_pay'           => 'adj_nd_pay',
            'ot_nd_pay'        => 'adj_ot_nd_pay',
            'reg_holiday_pay'  => 'adj_reg_holiday_pay',
            'spec_holiday_pay' => 'adj_spec_holiday_pay',
            'rd_pay'           => 'adj_rd_pay',
            'leave_pay'        => 'adj_leave_pay',
        ];
        $baseCols = [
            'reg_holiday_days',
            'reg_holiday_ot_pay','reg_holiday_nd_pay','reg_holiday_ot_nd_pay',
            'reg_holiday_rd_pay','reg_holiday_rd_ot_pay','reg_holiday_rd_nd_pay','reg_holiday_rd_ot_nd_pay',
            'spec_holiday_ot_pay','spec_holiday_nd_pay','spec_holiday_ot_nd_pay',
            'spec_holiday_rd_pay','spec_holiday_rd_ot_pay','spec_holiday_rd_nd_pay','spec_holiday_rd_ot_nd_pay',
            'rd_ot_pay','rd_nd_pay','rd_ot_nd_pay',
        ];
        $newAdjTotal = 0.0;
        foreach ($adjPairs as $base => $adj) {
            $adjV  = (isset($er[$adj]) && $er[$adj] !== null) ? (float)$er[$adj] : null;
            $baseV = (float)($er[$base] ?? 0);
            $newAdjTotal += ($adjV !== null) ? $adjV : $baseV;
        }
        foreach ($baseCols as $col) {
            $newAdjTotal += (float)($er[$col] ?? 0);
        }
        $newAdjTotal = round($newAdjTotal, 2);
        $pdo->prepare("UPDATE fch_earnings_computation SET adj_total_pay=? WHERE id=?")->execute([$newAdjTotal, $id]);
    }

    // Run cascade step functions
    $stepFns = [
        'earnings'   => fn() => stepEarnings($pdo, $batchId, $empId),
        'late'       => fn() => stepLate($pdo, $batchId, $empId),
        'sss'        => fn() => stepSSS($pdo, $batchId, $empId),
        'philhealth' => fn() => stepPhilHealth($pdo, $batchId, $empId),
        'pagibig'    => fn() => stepPagIBIG($pdo, $batchId, $empId),
        'tax'        => fn() => stepTax($pdo, $batchId, $empId),
        'summary'    => fn() => stepPayrollSummary($pdo, $batchId, $empId),
    ];
    foreach ($stepCascade[$tableType] as $s) {
        if (isset($stepFns[$s])) $stepFns[$s]();
    }

    // Capture after state
    $after = captureState($pdo, $downstreamTables, $batchId, $empId, $archivedTables);

    // Also get updated source row for direct diff (adj_total_pay may have been auto-set)
    $reSource = $pdo->prepare("SELECT * FROM $tbl WHERE id=?");
    $reSource->execute([$id]);
    $updatedSource = $reSource->fetch(PDO::FETCH_ASSOC) ?? [];

    $pdo->rollBack(); // ← DO NOT COMMIT – this is a preview only

} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

// ── Build diff ────────────────────────────────────────────────────────────────

// Direct changes (fields the user explicitly edited + auto-derived adj_total_pay)
$direct = [];
foreach ($changes as $chg) {
    $f      = $chg['field'];
    $oldVal = $directBefore[$f];
    $newVal = (float)$chg['value'];
    $direct[] = [
        'field' => $f,
        'label' => $fieldLabels[$f] ?? $f,
        'old'   => $oldVal,
        'new'   => $newVal,
    ];
}
// If adj_total_pay was auto-derived (earnings component edit), include it
if ($tableType === 'earnings' && array_intersect($changedFields, $earningsComponentFields)) {
    $autoAdj = isset($updatedSource['adj_total_pay']) ? (float)$updatedSource['adj_total_pay'] : null;
    $prevAdj = $directBefore['adj_total_pay'] ?? (isset($existing['adj_total_pay']) ? (float)$existing['adj_total_pay'] : null);
    if ($autoAdj !== null && ($prevAdj === null || abs($prevAdj - $autoAdj) >= 0.001)) {
        $direct[] = [
            'field'  => 'adj_total_pay',
            'label'  => 'Adjusted Total Pay (auto)',
            'old'    => $prevAdj,
            'new'    => $autoAdj,
        ];
    }
}

// Indirect changes (cascade effects on downstream tables)
$indirect = [];
foreach ($downstreamTables as $dtTbl => $cols) {
    foreach ($cols as $col) {
        $oldVal = isset($before[$dtTbl][$col]) && $before[$dtTbl][$col] !== null
                    ? (float)$before[$dtTbl][$col] : null;
        $newVal = isset($after[$dtTbl][$col]) && $after[$dtTbl][$col] !== null
                    ? (float)$after[$dtTbl][$col] : null;
        if ($newVal === null) continue;
        if ($oldVal !== null && abs($oldVal - $newVal) < 0.001) continue; // unchanged
        $indirect[] = [
            'table'       => $dtTbl,
            'table_label' => $tableLabels[$dtTbl] ?? $dtTbl,
            'field'       => $col,
            'label'       => $fieldLabels[$col] ?? $col,
            'old'         => $oldVal,
            'new'         => $newVal,
        ];
    }
}

echo json_encode([
    'success'  => true,
    'employee' => $empName,
    'direct'   => $direct,
    'indirect' => $indirect,
]);
exit;
