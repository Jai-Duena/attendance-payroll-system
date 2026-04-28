<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

// Import step functions without running the route
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

$body = json_decode(file_get_contents('php://input'), true) ?? [];

$tableType = $body['table']   ?? null;
$id        = isset($body['id']) ? (int)$body['id'] : null;
// Accept either batch changes array or legacy single field/value
if (!empty($body['changes']) && is_array($body['changes'])) {
    $changes = $body['changes'];
} elseif (isset($body['field'])) {
    $changes = [['field' => $body['field'], 'value' => $body['value']]];
} else {
    $changes = [];
}

if (!$tableType || !$id || empty($changes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing table, id, or changes']);
    exit;
}
$notes = isset($body['notes']) && $body['notes'] !== '' ? trim($body['notes']) : null;

// Allowed adj_ fields per table
$allowedFields = [
    'earnings' => [
        'adj_reg_pay','adj_ot_pay','adj_nd_pay','adj_ot_nd_pay',
        'adj_reg_holiday_pay','adj_reg_holiday_ot_pay','adj_reg_holiday_nd_pay','adj_reg_holiday_ot_nd_pay',
        'adj_reg_holiday_rd_pay','adj_reg_holiday_rd_ot_pay','adj_reg_holiday_rd_nd_pay','adj_reg_holiday_rd_ot_nd_pay',
        'adj_spec_holiday_pay','adj_spec_holiday_ot_pay','adj_spec_holiday_nd_pay','adj_spec_holiday_ot_nd_pay',
        'adj_spec_holiday_rd_pay','adj_spec_holiday_rd_ot_pay','adj_spec_holiday_rd_nd_pay','adj_spec_holiday_rd_ot_nd_pay',
        'adj_rd_pay','adj_rd_ot_pay','adj_rd_nd_pay','adj_rd_ot_nd_pay',
        'adj_leave_pay','adj_total_pay',
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
        'adj_reg_holiday_days',
        'adj_reg_holiday_hrs','adj_reg_holiday_ot_hrs','adj_reg_holiday_nd_hrs','adj_reg_holiday_ot_nd_hrs',
        'adj_reg_holiday_rd_hrs','adj_reg_holiday_rd_ot_hrs','adj_reg_holiday_rd_nd_hrs','adj_reg_holiday_rd_ot_nd_hrs',
        'adj_spec_holiday_hrs','adj_spec_holiday_ot_hrs','adj_spec_holiday_nd_hrs','adj_spec_holiday_ot_nd_hrs',
        'adj_spec_holiday_rd_hrs','adj_spec_holiday_rd_ot_hrs','adj_spec_holiday_rd_nd_hrs','adj_spec_holiday_rd_ot_nd_hrs',
        'adj_rd_hrs','adj_rd_ot_hrs','adj_rd_nd_hrs','adj_rd_ot_nd_hrs',
        'adj_late_mins','adj_leave_days',
    ],
];

$tableMap = [
    'earnings'           => 'fch_earnings_computation',
    'deductions'         => 'fch_deductions_computation',
    'tax'                => 'fch_tax_deduction',
    'attendance_summary' => 'fch_attendance_summary',
];

// Tables to archive (downstream from edited table)
$archiveCascade = [
    'attendance_summary' => ['earnings','deductions','tax'],
    'earnings'           => ['deductions','tax'],
    'deductions'         => ['tax'],
    'tax'                => [],
];

// Step functions to re-run after edit
$stepCascade = [
    'attendance_summary' => ['earnings','late','sss','philhealth','pagibig','tax','summary'],
    'earnings'           => ['late','sss','philhealth','pagibig','tax','summary'],
    'deductions'         => ['tax','summary'],
    'tax'                => ['summary'],
];

if (!isset($tableMap[$tableType])) {
    http_response_code(400);
    echo json_encode(['error' => "Unknown table type: $tableType"]);
    exit;
}
// Validate all fields in the batch
$allowed = $allowedFields[$tableType] ?? [];
foreach ($changes as $chg) {
    if (!in_array($chg['field'] ?? '', $allowed, true)) {
        http_response_code(400);
        echo json_encode(['error' => "Field '{$chg['field']}' not allowed for table '$tableType'"]);
        exit;
    }
}

$pdo = getDB();

// Fetch the target row
$tbl     = $tableMap[$tableType];
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

// Lock check
$statusStmt = $pdo->prepare("SELECT status FROM fch_payroll_results WHERE batch_id=?");
$statusStmt->execute([$batchId]);
$statusVal = $statusStmt->fetchColumn();
if (in_array($statusVal, ['Approved','Released'], true)) {
    http_response_code(403);
    echo json_encode(['error' => "Cannot edit a payroll batch with status '$statusVal'"]);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Archive the source row itself before applying changes
    //    (creates the "Previous Values" snapshot for the edited table only;
    //     downstream rows are updated in-place by the cascade step functions)
    archiveRow($pdo, $tbl, $batchId, $empId);

    $adjBy   = $_SESSION['user_id'];
    $empName = $existing['emp_fullname'] ?? '';
    $audit   = $pdo->prepare("
        INSERT INTO fch_payroll_audit
              (batch_id, employee_id, emp_fullname, table_name, field_name,
               old_value, new_value, action, changed_by_user_id, notes, changed_at)
        VALUES (?,?,?,?,?,?,?,'adj_edit',?,?,NOW())
    ");

    foreach ($changes as $chg) {
        $field    = $chg['field'];
        $newValue = $chg['value'];
        $oldValue = isset($existing[$field]) ? (float)$existing[$field] : null;

        // 2. Set adj_ field + audit stamp on the source row
        $upd = $pdo->prepare("UPDATE $tbl SET `$field`=?, adj_by=?, adj_at=NOW() WHERE id=?");
        $upd->execute([$newValue, $adjBy, $id]);

        // 3. Log to audit trail — skip if value did not actually change
        $newNum = (float)$newValue;
        if ($oldValue === null || abs($oldValue - $newNum) >= 0.000001) {
            $audit->execute([$batchId, $empId, $empName, $tbl, $field, $oldValue, $newValue, $adjBy, $notes]);
        }

        // Refresh $existing so the next field comparison is accurate
        $existing[$field] = $newValue;
    }

    $pdo->commit();

    // 4a. When any component adj_ field on earnings changes, auto-recompute adj_total_pay
    //     so cascade steps (SSS/tax/summary) use the updated effective total.
    $earningsComponentFields = [
        'adj_reg_pay','adj_ot_pay','adj_nd_pay','adj_ot_nd_pay',
        'adj_reg_holiday_pay','adj_reg_holiday_ot_pay','adj_reg_holiday_nd_pay','adj_reg_holiday_ot_nd_pay',
        'adj_reg_holiday_rd_pay','adj_reg_holiday_rd_ot_pay','adj_reg_holiday_rd_nd_pay','adj_reg_holiday_rd_ot_nd_pay',
        'adj_spec_holiday_pay','adj_spec_holiday_ot_pay','adj_spec_holiday_nd_pay','adj_spec_holiday_ot_nd_pay',
        'adj_spec_holiday_rd_pay','adj_spec_holiday_rd_ot_pay','adj_spec_holiday_rd_nd_pay','adj_spec_holiday_rd_ot_nd_pay',
        'adj_rd_pay','adj_rd_ot_pay','adj_rd_nd_pay','adj_rd_ot_nd_pay',
        'adj_leave_pay',
    ];
    $changedFields = array_column($changes, 'field');
    if ($tableType === 'earnings' && array_intersect($changedFields, $earningsComponentFields)) {
        $reRow = $pdo->prepare("SELECT * FROM fch_earnings_computation WHERE id=?");
        $reRow->execute([$id]);
        $er = $reRow->fetch(PDO::FETCH_ASSOC) ?? [];

        // All pay columns: use adj_ if set, else base
        $adjPairs = [
            'reg_pay'                    => 'adj_reg_pay',
            'ot_pay'                     => 'adj_ot_pay',
            'nd_pay'                     => 'adj_nd_pay',
            'ot_nd_pay'                  => 'adj_ot_nd_pay',
            'reg_holiday_pay'            => 'adj_reg_holiday_pay',
            'reg_holiday_ot_pay'         => 'adj_reg_holiday_ot_pay',
            'reg_holiday_nd_pay'         => 'adj_reg_holiday_nd_pay',
            'reg_holiday_ot_nd_pay'      => 'adj_reg_holiday_ot_nd_pay',
            'reg_holiday_rd_pay'         => 'adj_reg_holiday_rd_pay',
            'reg_holiday_rd_ot_pay'      => 'adj_reg_holiday_rd_ot_pay',
            'reg_holiday_rd_nd_pay'      => 'adj_reg_holiday_rd_nd_pay',
            'reg_holiday_rd_ot_nd_pay'   => 'adj_reg_holiday_rd_ot_nd_pay',
            'spec_holiday_pay'           => 'adj_spec_holiday_pay',
            'spec_holiday_ot_pay'        => 'adj_spec_holiday_ot_pay',
            'spec_holiday_nd_pay'        => 'adj_spec_holiday_nd_pay',
            'spec_holiday_ot_nd_pay'     => 'adj_spec_holiday_ot_nd_pay',
            'spec_holiday_rd_pay'        => 'adj_spec_holiday_rd_pay',
            'spec_holiday_rd_ot_pay'     => 'adj_spec_holiday_rd_ot_pay',
            'spec_holiday_rd_nd_pay'     => 'adj_spec_holiday_rd_nd_pay',
            'spec_holiday_rd_ot_nd_pay'  => 'adj_spec_holiday_rd_ot_nd_pay',
            'rd_pay'                     => 'adj_rd_pay',
            'rd_ot_pay'                  => 'adj_rd_ot_pay',
            'rd_nd_pay'                  => 'adj_rd_nd_pay',
            'rd_ot_nd_pay'               => 'adj_rd_ot_nd_pay',
            'leave_pay'                  => 'adj_leave_pay',
        ];

        $newAdjTotal = 0.0;
        foreach ($adjPairs as $base => $adj) {
            $adjV  = (isset($er[$adj]) && $er[$adj] !== null) ? (float)$er[$adj] : null;
            $baseV = (float)($er[$base] ?? 0);
            $newAdjTotal += ($adjV !== null) ? $adjV : $baseV;
        }
        $newAdjTotal = round($newAdjTotal, 2);

        $updAdj = $pdo->prepare("UPDATE fch_earnings_computation SET adj_total_pay=? WHERE id=?");
        $updAdj->execute([$newAdjTotal, $id]);
    }

    // 4b. Snapshot downstream tables BEFORE cascade — only insert archive if values
    //     actually change (compare before vs after to avoid phantom archived rows).
    $cascadeSnapshotTables = [
        'attendance_summary' => [
            'fch_earnings_computation',
            'fch_deductions_computation',
            'fch_tax_deduction',
            'fch_payroll_summary',
        ],
        'earnings' => [
            'fch_deductions_computation',
            'fch_tax_deduction',
            'fch_payroll_summary',
        ],
        'deductions' => [
            'fch_tax_deduction',
            'fch_payroll_summary',
        ],
        'tax' => [
            'fch_payroll_summary',
        ],
    ];
    $preSnapshots = [];
    $archSkipCols = ['id', 'is_archived', 'archived_at', 'archived_from_id', 'adj_by', 'adj_at'];
    foreach ($cascadeSnapshotTables[$tableType] ?? [] as $cascTbl) {
        $s = $pdo->prepare("SELECT * FROM `$cascTbl` WHERE batch_id=? AND employee_id=? AND is_archived=0 LIMIT 1");
        $s->execute([$batchId, $empId]);
        $preSnapshots[$cascTbl] = $s->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    // 4c. Re-run downstream step functions (each manages its own transaction)
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

    // 4d. For each downstream table, compare pre-cascade snapshot vs live row.
    //     Only archive if values actually changed — no phantom archived rows.
    foreach ($preSnapshots as $cascTbl => $snapRow) {
        if (!$snapRow) continue;
        $cur = $pdo->prepare("SELECT * FROM `$cascTbl` WHERE batch_id=? AND employee_id=? AND is_archived=0 LIMIT 1");
        $cur->execute([$batchId, $empId]);
        $currentRow = $cur->fetch(PDO::FETCH_ASSOC);
        if (!$currentRow) continue;

        $changed = false;
        foreach ($snapRow as $col => $val) {
            if (in_array($col, $archSkipCols, true)) continue;
            if ((string)($val ?? '') !== (string)($currentRow[$col] ?? '')) {
                $changed = true;
                break;
            }
        }
        if (!$changed) continue;

        // Insert the pre-cascade snapshot as the archived (previous) row
        $archRow = $snapRow;
        $origId  = (int)$archRow['id'];
        unset($archRow['id']);
        $archRow['is_archived']      = 1;
        $archRow['archived_at']      = date('Y-m-d H:i:s');
        $archRow['archived_from_id'] = $origId;
        $cols = implode(',', array_map(fn($c) => "`$c`", array_keys($archRow)));
        $phs  = implode(',', array_fill(0, count($archRow), '?'));
        $pdo->prepare("INSERT INTO `$cascTbl` ($cols) VALUES ($phs)")->execute(array_values($archRow));
    }

    echo json_encode([
        'success'      => true,
        'message'      => 'Saved and recomputed downstream steps',
        'batch_id'     => $batchId,
        'employee_id'  => $empId,
        'steps_rerun'  => $stepCascade[$tableType],
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("update-row.php error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
