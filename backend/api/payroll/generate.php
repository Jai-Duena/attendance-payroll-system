<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

date_default_timezone_set('Asia/Manila');

// ─── Helpers ────────────────────────────────────────────────────────────────
/** Use adj_ override if set, else fall back to the base column (float) */
function adjVal(array $row, string $field): float {
    $adj = "adj_$field";
    if (array_key_exists($adj, $row) && $row[$adj] !== null && $row[$adj] !== '') {
        return (float)$row[$adj];
    }
    return (float)($row[$field] ?? 0.0);
}

/** Same but returns int */
function adjValInt(array $row, string $field): int {
    $adj = "adj_$field";
    if (array_key_exists($adj, $row) && $row[$adj] !== null && $row[$adj] !== '') {
        return (int)$row[$adj];
    }
    return (int)($row[$field] ?? 0);
}

// ─── Archive helper: copies an active row to is_archived=1 ──────────────────
function archiveRow(PDO $pdo, string $physTable, int $batchId, int $empId): void {
    $sel = $pdo->prepare("SELECT * FROM $physTable WHERE batch_id=? AND employee_id=? AND is_archived=0 LIMIT 1");
    $sel->execute([$batchId, $empId]);
    $row = $sel->fetch(PDO::FETCH_ASSOC);
    if (!$row) return;

    // Skip if most recent archived row already has identical data (prevents duplicates
    // when the same values are committed twice or no effective change occurred).
    $skipCols = ['id', 'is_archived', 'archived_at', 'archived_from_id'];
    $dupChk = $pdo->prepare(
        "SELECT * FROM $physTable WHERE batch_id=? AND employee_id=? AND is_archived=1 ORDER BY archived_at DESC LIMIT 1"
    );
    $dupChk->execute([$batchId, $empId]);
    $prevArch = $dupChk->fetch(PDO::FETCH_ASSOC);
    if ($prevArch) {
        $identical = true;
        foreach ($row as $col => $val) {
            if (in_array($col, $skipCols, true)) continue;
            if ((string)($val ?? '') !== (string)($prevArch[$col] ?? '')) {
                $identical = false;
                break;
            }
        }
        if ($identical) return;
    }

    $origId = (int)$row['id'];
    unset($row['id']);
    $row['is_archived']      = 1;
    $row['archived_at']      = date('Y-m-d H:i:s');
    $row['archived_from_id'] = $origId;

    $cols = implode(',', array_map(fn($c) => "`$c`", array_keys($row)));
    $phs  = implode(',', array_fill(0, count($row), '?'));
    $ins  = $pdo->prepare("INSERT INTO $physTable ($cols) VALUES ($phs)");
    $ins->execute(array_values($row));
}

// ─── Helper: cascade adj_ write + audit trail entry ────────────────────────
/**
 * Fetches old adj_ values, writes $cascadeAdj columns to $targetTable,
 * then logs each change as 'cascade' in fch_payroll_audit.
 */
function cascadeAndAudit(PDO $pdo, int $batchId, int $empId, string $targetTable, array $cascadeAdj, string $sourceField = ''): void {
    if (empty($cascadeAdj)) return;

    // Resolve emp_fullname from earnings (canonical source in payroll context)
    $nameStmt = $pdo->prepare("SELECT COALESCE(emp_fullname,'') FROM fch_earnings_computation WHERE batch_id=? AND employee_id=? AND is_archived=0 LIMIT 1");
    $nameStmt->execute([$batchId, $empId]);
    $empFullname = (string)($nameStmt->fetchColumn() ?: '');

    // Fetch old adj_ values from target table (before update)
    $colList  = implode(',', array_map(fn($c) => "`$c`", array_keys($cascadeAdj)));
    $selStmt  = $pdo->prepare("SELECT $colList FROM $targetTable WHERE batch_id=? AND employee_id=? AND is_archived=0 LIMIT 1");
    $selStmt->execute([$batchId, $empId]);
    $oldAdj   = $selStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    // Write cascade adj_ values
    $setCols = implode(',', array_map(fn($c) => "`$c`=?", array_keys($cascadeAdj)));
    $updStmt = $pdo->prepare("UPDATE $targetTable SET $setCols WHERE batch_id=? AND employee_id=? AND is_archived=0");
    $updStmt->execute([...array_values($cascadeAdj), $batchId, $empId]);

    // Use the currently logged-in user id (available from session in both generate.php and update-row.php)
    $changedBy = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    $notes     = $sourceField !== '' ? $sourceField : null;

    // Insert audit entries
    $audIns = $pdo->prepare("
        INSERT INTO fch_payroll_audit
              (batch_id, employee_id, emp_fullname, table_name, field_name,
               old_value, new_value, action, changed_by_user_id, changed_at, notes)
        VALUES (?,?,?,?,?,?,?,'cascade',?,NOW(),?)
    ");
    foreach ($cascadeAdj as $field => $newVal) {
        $oldVal = (array_key_exists($field, $oldAdj) && $oldAdj[$field] !== null && $oldAdj[$field] !== '')
                    ? (float)$oldAdj[$field] : null;
        // Skip audit when value did not actually change
        if ($oldVal !== null && abs($oldVal - (float)$newVal) < 0.000001) continue;
        $audIns->execute([$batchId, $empId, $empFullname, $targetTable, $field, $oldVal, (float)$newVal, $changedBy, $notes]);
    }
}

// ─── Helper: check if date is a holiday or employee rest/leave day ──────────
function isExcludedDate(PDO $pdo, string $date, int $employeeId): bool {
    $s = $pdo->prepare("SELECT 1 FROM fch_holidays WHERE holiday_date = ? LIMIT 1");
    $s->execute([$date]);
    if ($s->fetch()) return true;

    $s2 = $pdo->prepare("SELECT emp_restday, emp_leave FROM fch_date_settings WHERE date = ? AND employee_id = ? LIMIT 1");
    $s2->execute([$date, $employeeId]);
    $row = $s2->fetch(PDO::FETCH_ASSOC);
    if ($row && ($row['emp_restday'] == 1 || $row['emp_leave'] == 1)) return true;

    return false;
}

// ─── Step 1: Attendance Summary ──────────────────────────────────────────────
function stepAttendanceSummary(PDO $pdo, string $start, string $end, array $employeeIds): array {
    // Filter to employees with actual attendance
    $valid = [];
    foreach ($employeeIds as $empId) {
        $s = $pdo->prepare("SELECT COUNT(*) FROM fch_attendance WHERE employee_id = ? AND date BETWEEN ? AND ?");
        $s->execute([$empId, $start, $end]);
        if ((int)$s->fetchColumn() > 0) $valid[] = (int)$empId;
    }
    if (empty($valid)) {
        throw new Exception('No employees with attendance records found for the selected period');
    }

    // Next batch_id
    $r = $pdo->query("SELECT COALESCE(MAX(batch_id), 0) AS mb FROM fch_attendance_summary");
    $batchId = (int)$r->fetchColumn() + 1;

    $pdo->beginTransaction();
    try {
        foreach ($valid as $employeeId) {
            // Employee info
            $es = $pdo->prepare("SELECT emp_fullname, emp_dept FROM fch_employees WHERE employee_id = ?");
            $es->execute([$employeeId]);
            $emp = $es->fetch(PDO::FETCH_ASSOC);
            if (!$emp) continue;
            $empFullname = $emp['emp_fullname'];
            $empDept     = $emp['emp_dept'];

            // ── reg holidays (non-restday) ──
            $rh = $pdo->prepare("SELECT SUM(total_hrs) FROM fch_reg_holiday WHERE employee_id=? AND reg_holiday_date BETWEEN ? AND ? AND is_restday=0");
            $rh->execute([$employeeId,$start,$end]);
            $regHolidayHrs = (float)$rh->fetchColumn();

            $rhrd = $pdo->prepare("SELECT SUM(total_hrs) FROM fch_reg_holiday WHERE employee_id=? AND reg_holiday_date BETWEEN ? AND ? AND is_restday=1");
            $rhrd->execute([$employeeId,$start,$end]);
            $regHolidayRdHrs = (float)$rhrd->fetchColumn();

            // ── reg holiday ND ──
            $nd_rh = $pdo->prepare("SELECT SUM(n.total_hrs) FROM fch_nd n JOIN fch_holidays h ON n.nd_date=h.holiday_date WHERE n.employee_id=? AND h.holiday_type='Regular' AND n.nd_date BETWEEN ? AND ? AND n.ot_nd=0 AND n.is_restday=0");
            $nd_rh->execute([$employeeId,$start,$end]);
            $regHolidayNdHrs = (float)$nd_rh->fetchColumn();

            $nd_rhrd = $pdo->prepare("SELECT SUM(n.total_hrs) FROM fch_nd n JOIN fch_holidays h ON n.nd_date=h.holiday_date WHERE n.employee_id=? AND h.holiday_type='Regular' AND n.nd_date BETWEEN ? AND ? AND n.ot_nd=0 AND n.is_restday=1");
            $nd_rhrd->execute([$employeeId,$start,$end]);
            $regHolidayRdNdHrs = (float)$nd_rhrd->fetchColumn();

            // ── reg holiday OT ND ──
            $otnd_rh = $pdo->prepare("SELECT SUM(n.total_hrs) FROM fch_nd n JOIN fch_holidays h ON n.nd_date=h.holiday_date WHERE n.employee_id=? AND h.holiday_type='Regular' AND n.nd_date BETWEEN ? AND ? AND n.ot_nd=1 AND n.is_restday=0");
            $otnd_rh->execute([$employeeId,$start,$end]);
            $regHolidayOtNdHrs = (float)$otnd_rh->fetchColumn();

            $otnd_rhrd = $pdo->prepare("SELECT SUM(n.total_hrs) FROM fch_nd n JOIN fch_holidays h ON n.nd_date=h.holiday_date WHERE n.employee_id=? AND h.holiday_type='Regular' AND n.nd_date BETWEEN ? AND ? AND n.ot_nd=1 AND n.is_restday=1");
            $otnd_rhrd->execute([$employeeId,$start,$end]);
            $regHolidayRdOtNdHrs = (float)$otnd_rhrd->fetchColumn();

            // ── reg holiday OT ──
            $ot_rh = $pdo->prepare("SELECT SUM(o.total_hrs) FROM fch_ot o JOIN fch_holidays h ON o.ot_date=h.holiday_date WHERE o.employee_id=? AND h.holiday_type='Regular' AND o.ot_date BETWEEN ? AND ? AND o.is_restday=0");
            $ot_rh->execute([$employeeId,$start,$end]);
            $totalRhOt = (float)$ot_rh->fetchColumn();
            $regHolidayOtHrs = $totalRhOt - $regHolidayOtNdHrs;

            $ot_rhrd = $pdo->prepare("SELECT SUM(o.total_hrs) FROM fch_ot o JOIN fch_holidays h ON o.ot_date=h.holiday_date WHERE o.employee_id=? AND h.holiday_type='Regular' AND o.ot_date BETWEEN ? AND ? AND o.is_restday=1");
            $ot_rhrd->execute([$employeeId,$start,$end]);
            $totalRhRdOt = (float)$ot_rhrd->fetchColumn();
            $regHolidayRdOtHrs = $totalRhRdOt - $regHolidayRdOtNdHrs;

            // ── special holidays (non-restday) ──
            $sh = $pdo->prepare("SELECT SUM(total_hrs) FROM fch_special_holiday WHERE employee_id=? AND special_holiday_date BETWEEN ? AND ? AND is_restday=0");
            $sh->execute([$employeeId,$start,$end]);
            $specHolidayHrs = (float)$sh->fetchColumn();

            $shrd = $pdo->prepare("SELECT SUM(total_hrs) FROM fch_special_holiday WHERE employee_id=? AND special_holiday_date BETWEEN ? AND ? AND is_restday=1");
            $shrd->execute([$employeeId,$start,$end]);
            $specHolidayRdHrs = (float)$shrd->fetchColumn();

            // ── special holiday ND ──
            $nd_sh = $pdo->prepare("SELECT SUM(n.total_hrs) FROM fch_nd n JOIN fch_holidays h ON n.nd_date=h.holiday_date WHERE n.employee_id=? AND h.holiday_type LIKE 'Special%' AND n.nd_date BETWEEN ? AND ? AND n.ot_nd=0 AND n.is_restday=0");
            $nd_sh->execute([$employeeId,$start,$end]);
            $specHolidayNdHrs = (float)$nd_sh->fetchColumn();

            $nd_shrd = $pdo->prepare("SELECT SUM(n.total_hrs) FROM fch_nd n JOIN fch_holidays h ON n.nd_date=h.holiday_date WHERE n.employee_id=? AND h.holiday_type LIKE 'Special%' AND n.nd_date BETWEEN ? AND ? AND n.ot_nd=0 AND n.is_restday=1");
            $nd_shrd->execute([$employeeId,$start,$end]);
            $specHolidayRdNdHrs = (float)$nd_shrd->fetchColumn();

            // ── special holiday OT ND ──
            $otnd_sh = $pdo->prepare("SELECT SUM(n.total_hrs) FROM fch_nd n JOIN fch_holidays h ON n.nd_date=h.holiday_date WHERE n.employee_id=? AND h.holiday_type LIKE 'Special%' AND n.nd_date BETWEEN ? AND ? AND n.ot_nd=1 AND n.is_restday=0");
            $otnd_sh->execute([$employeeId,$start,$end]);
            $specHolidayOtNdHrs = (float)$otnd_sh->fetchColumn();

            $otnd_shrd = $pdo->prepare("SELECT SUM(n.total_hrs) FROM fch_nd n JOIN fch_holidays h ON n.nd_date=h.holiday_date WHERE n.employee_id=? AND h.holiday_type LIKE 'Special%' AND n.nd_date BETWEEN ? AND ? AND n.ot_nd=1 AND n.is_restday=1");
            $otnd_shrd->execute([$employeeId,$start,$end]);
            $specHolidayRdOtNdHrs = (float)$otnd_shrd->fetchColumn();

            // ── special holiday OT ──
            $ot_sh = $pdo->prepare("SELECT SUM(o.total_hrs) FROM fch_ot o JOIN fch_holidays h ON o.ot_date=h.holiday_date WHERE o.employee_id=? AND h.holiday_type LIKE 'Special%' AND o.ot_date BETWEEN ? AND ? AND o.is_restday=0");
            $ot_sh->execute([$employeeId,$start,$end]);
            $totalShOt = (float)$ot_sh->fetchColumn();
            $specHolidayOtHrs = $totalShOt - $specHolidayOtNdHrs;

            $ot_shrd = $pdo->prepare("SELECT SUM(o.total_hrs) FROM fch_ot o JOIN fch_holidays h ON o.ot_date=h.holiday_date WHERE o.employee_id=? AND h.holiday_type LIKE 'Special%' AND o.ot_date BETWEEN ? AND ? AND o.is_restday=1");
            $ot_shrd->execute([$employeeId,$start,$end]);
            $totalShRdOt = (float)$ot_shrd->fetchColumn();
            $specHolidayRdOtHrs = $totalShRdOt - $specHolidayRdOtNdHrs;

            // ── rest day hours ──
            $rd = $pdo->prepare("SELECT SUM(total_hrs) FROM fch_restday WHERE employee_id=? AND rest_date BETWEEN ? AND ?");
            $rd->execute([$employeeId,$start,$end]);
            $rdHrs = (float)$rd->fetchColumn();

            $nd_rd = $pdo->prepare("SELECT SUM(n.total_hrs) FROM fch_nd n JOIN fch_date_settings d ON n.nd_date=d.date WHERE n.employee_id=? AND d.employee_id=? AND d.emp_restday=1 AND n.nd_date BETWEEN ? AND ? AND n.ot_nd=0");
            $nd_rd->execute([$employeeId,$employeeId,$start,$end]);
            $rdNdHrs = (float)$nd_rd->fetchColumn();

            $otnd_rd = $pdo->prepare("SELECT SUM(n.total_hrs) FROM fch_nd n JOIN fch_date_settings d ON n.nd_date=d.date WHERE n.employee_id=? AND d.employee_id=? AND d.emp_restday=1 AND n.nd_date BETWEEN ? AND ? AND n.ot_nd=1");
            $otnd_rd->execute([$employeeId,$employeeId,$start,$end]);
            $rdOtNdHrs = (float)$otnd_rd->fetchColumn();

            $ot_rd = $pdo->prepare("SELECT SUM(o.total_hrs) FROM fch_ot o JOIN fch_date_settings d ON o.ot_date=d.date WHERE o.employee_id=? AND d.employee_id=? AND d.emp_restday=1 AND o.ot_date BETWEEN ? AND ?");
            $ot_rd->execute([$employeeId,$employeeId,$start,$end]);
            $totalRdOt = (float)$ot_rd->fetchColumn();
            $rdOtHrs = $totalRdOt - $rdOtNdHrs;

            // ── late minutes ──
            $lt = $pdo->prepare("SELECT COALESCE(SUM(late_mins),0) FROM fch_late WHERE employee_id=? AND late_date BETWEEN ? AND ?");
            $lt->execute([$employeeId,$start,$end]);
            $lateMins = (int)$lt->fetchColumn();

            // ── leave days ──
            $lv = $pdo->prepare("SELECT COUNT(*) FROM fch_date_settings WHERE employee_id=? AND date BETWEEN ? AND ? AND emp_leave=1");
            $lv->execute([$employeeId,$start,$end]);
            $leaveDays = (int)$lv->fetchColumn();

            // ── regular hours (filter excluded dates) ──
            $regD = $pdo->prepare("SELECT reg_date, total_hrs FROM fch_reg_hrs WHERE employee_id=? AND reg_date BETWEEN ? AND ?");
            $regD->execute([$employeeId,$start,$end]);
            $regHrs = 0.0;
            foreach ($regD->fetchAll(PDO::FETCH_ASSOC) as $rrow) {
                if (!isExcludedDate($pdo, $rrow['reg_date'], $employeeId)) {
                    $regHrs += (float)$rrow['total_hrs'];
                }
            }

            // ── ND hours (filter excluded dates) ──
            $ndD = $pdo->prepare("SELECT nd_date, total_hrs FROM fch_nd WHERE employee_id=? AND nd_date BETWEEN ? AND ? AND ot_nd=0");
            $ndD->execute([$employeeId,$start,$end]);
            $ndHrs = 0.0;
            foreach ($ndD->fetchAll(PDO::FETCH_ASSOC) as $rrow) {
                if (!isExcludedDate($pdo, $rrow['nd_date'], $employeeId)) {
                    $ndHrs += (float)$rrow['total_hrs'];
                }
            }

            // ── OT ND hours (filter excluded dates) ──
            $otNdD = $pdo->prepare("SELECT nd_date, total_hrs FROM fch_nd WHERE employee_id=? AND nd_date BETWEEN ? AND ? AND ot_nd=1");
            $otNdD->execute([$employeeId,$start,$end]);
            $otNdHrs = 0.0;
            foreach ($otNdD->fetchAll(PDO::FETCH_ASSOC) as $rrow) {
                if (!isExcludedDate($pdo, $rrow['nd_date'], $employeeId)) {
                    $otNdHrs += (float)$rrow['total_hrs'];
                }
            }

            // ── OT hours (filter excluded dates, subtract OT ND) ──
            $otD = $pdo->prepare("SELECT ot_date, total_hrs FROM fch_ot WHERE employee_id=? AND ot_date BETWEEN ? AND ?");
            $otD->execute([$employeeId,$start,$end]);
            $filteredOt = 0.0;
            foreach ($otD->fetchAll(PDO::FETCH_ASSOC) as $rrow) {
                if (!isExcludedDate($pdo, $rrow['ot_date'], $employeeId)) {
                    $filteredOt += (float)$rrow['total_hrs'];
                }
            }
            $otHrs = $filteredOt - $otNdHrs;

            // ── reg_holiday_days: Regular holidays in period where employee has no reg_holiday record ──
            $holS = $pdo->prepare("SELECT holiday_date FROM fch_holidays WHERE holiday_type='Regular' AND holiday_date BETWEEN ? AND ?");
            $holS->execute([$start,$end]);
            $regHolidayDays = 0;
            foreach ($holS->fetchAll(PDO::FETCH_ASSOC) as $h) {
                $hdate = $h['holiday_date'];
                $chk = $pdo->prepare("SELECT 1 FROM fch_reg_holiday WHERE employee_id=? AND reg_holiday_date=? LIMIT 1");
                $chk->execute([$employeeId,$hdate]);
                if (!$chk->fetch()) $regHolidayDays++;
            }

            // ── Insert into fch_attendance_summary ──
            $ins = $pdo->prepare("
                INSERT INTO fch_attendance_summary
                (batch_id, employee_id, emp_fullname, emp_dept, payroll_start, payroll_end,
                 reg_hrs, ot_hrs, nd_hrs, ot_nd_hrs,
                 reg_holiday_days,
                 reg_holiday_hrs, reg_holiday_ot_hrs, reg_holiday_nd_hrs, reg_holiday_ot_nd_hrs,
                 reg_holiday_rd_hrs, reg_holiday_rd_ot_hrs, reg_holiday_rd_nd_hrs, reg_holiday_rd_ot_nd_hrs,
                 spec_holiday_hrs, spec_holiday_ot_hrs, spec_holiday_nd_hrs, spec_holiday_ot_nd_hrs,
                 spec_holiday_rd_hrs, spec_holiday_rd_ot_hrs, spec_holiday_rd_nd_hrs, spec_holiday_rd_ot_nd_hrs,
                 rd_hrs, rd_ot_hrs, rd_nd_hrs, rd_ot_nd_hrs,
                 late_mins, leave_days)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ");
            $ins->execute([
                $batchId, $employeeId, $empFullname, $empDept, $start, $end,
                $regHrs, $otHrs, $ndHrs, $otNdHrs,
                $regHolidayDays,
                $regHolidayHrs, $regHolidayOtHrs, $regHolidayNdHrs, $regHolidayOtNdHrs,
                $regHolidayRdHrs, $regHolidayRdOtHrs, $regHolidayRdNdHrs, $regHolidayRdOtNdHrs,
                $specHolidayHrs, $specHolidayOtHrs, $specHolidayNdHrs, $specHolidayOtNdHrs,
                $specHolidayRdHrs, $specHolidayRdOtHrs, $specHolidayRdNdHrs, $specHolidayRdOtNdHrs,
                $rdHrs, $rdOtHrs, $rdNdHrs, $rdOtNdHrs,
                $lateMins, $leaveDays
            ]);

            // Fallback update for late_mins in case bind edge case
            $ul = $pdo->prepare("UPDATE fch_attendance_summary SET late_mins=? WHERE batch_id=? AND employee_id=?");
            $ul->execute([$lateMins, $batchId, $employeeId]);
        }
        $pdo->commit();
        return ['batch_id' => $batchId, 'count' => count($valid)];
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// ─── Step 2: Earnings Computation ────────────────────────────────────────────
function stepEarnings(PDO $pdo, int $batchId, ?int $empId = null): void {
    // Load rate multipliers
    $ms = $pdo->query("SELECT code, multiplier, description FROM fch_rate_multipliers");
    $rates = [];
    foreach ($ms->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $desc = $r['description'] ?? '';
        $isDaily = stripos($desc,'Daily') !== false;
        $rates[$r['code']] = ['mult' => (float)$r['multiplier'], 'is_daily' => $isDaily];
    }

    $map = [
        'reg_hrs'                    => ['reg_pay',                    'REG'],
        'ot_hrs'                     => ['ot_pay',                     'REG_OT'],
        'nd_hrs'                     => ['nd_pay',                     'REG_ND'],
        'ot_nd_hrs'                  => ['ot_nd_pay',                  'REG_OT_ND'],
        'reg_holiday_days'           => ['reg_holiday_days',           'RH_NO_WORK'],
        'reg_holiday_hrs'            => ['reg_holiday_pay',            'RH_REG'],
        'reg_holiday_ot_hrs'         => ['reg_holiday_ot_pay',         'RH_OT'],
        'reg_holiday_nd_hrs'         => ['reg_holiday_nd_pay',         'RH_ND'],
        'reg_holiday_ot_nd_hrs'      => ['reg_holiday_ot_nd_pay',      'RH_OT_ND'],
        'reg_holiday_rd_hrs'         => ['reg_holiday_rd_pay',         'RH_RD_REG'],
        'reg_holiday_rd_ot_hrs'      => ['reg_holiday_rd_ot_pay',      'RH_RD_OT'],
        'reg_holiday_rd_nd_hrs'      => ['reg_holiday_rd_nd_pay',      'RH_RD_ND'],
        'reg_holiday_rd_ot_nd_hrs'   => ['reg_holiday_rd_ot_nd_pay',   'RH_RD_OT_ND'],
        'spec_holiday_hrs'           => ['spec_holiday_pay',           'SH_REG'],
        'spec_holiday_ot_hrs'        => ['spec_holiday_ot_pay',        'SH_OT'],
        'spec_holiday_nd_hrs'        => ['spec_holiday_nd_pay',        'SH_ND'],
        'spec_holiday_ot_nd_hrs'     => ['spec_holiday_ot_nd_pay',     'SH_OT_ND'],
        'spec_holiday_rd_hrs'        => ['spec_holiday_rd_pay',        'SH_RD_REG'],
        'spec_holiday_rd_ot_hrs'     => ['spec_holiday_rd_ot_pay',     'SH_RD_OT'],
        'spec_holiday_rd_nd_hrs'     => ['spec_holiday_rd_nd_pay',     'SH_RD_ND'],
        'spec_holiday_rd_ot_nd_hrs'  => ['spec_holiday_rd_ot_nd_pay',  'SH_RD_OT_ND'],
        'rd_hrs'                     => ['rd_pay',                     'RD_REG'],
        'rd_ot_hrs'                  => ['rd_ot_pay',                  'RD_OT'],
        'rd_nd_hrs'                  => ['rd_nd_pay',                  'RD_ND'],
        'rd_ot_nd_hrs'               => ['rd_ot_nd_pay',               'RD_OT_ND'],
    ];

    $empSql = $empId ? ' AND employee_id=?' : '';
    $rows = $pdo->prepare("SELECT * FROM fch_attendance_summary WHERE batch_id=? AND is_archived=0$empSql");
    $rows->execute($empId ? [$batchId, $empId] : [$batchId]);
    $summaryRows = $rows->fetchAll(PDO::FETCH_ASSOC);
    if (empty($summaryRows)) throw new Exception("No attendance summary for batch $batchId");

    $ownTx = !$pdo->inTransaction(); if ($ownTx) $pdo->beginTransaction();
    try {
        foreach ($summaryRows as $row) {
            $empId = (int)$row['employee_id'];
            $es = $pdo->prepare("SELECT emp_dailyrate FROM fch_employees WHERE employee_id=?");
            $es->execute([$empId]);
            $dailyRate = (float)($es->fetchColumn() ?: 0.0);
            $hourlyRate = $dailyRate > 0 ? $dailyRate / 8.0 : 0.0;

            $payrollPeriod = ($row['payroll_start'] ?? '') . ' to ' . ($row['payroll_end'] ?? '');

            // Compute each pay type
            $pays = [
                'reg_pay'=>0,'ot_pay'=>0,'nd_pay'=>0,'ot_nd_pay'=>0,
                'reg_holiday_days'=>0,'reg_holiday_pay'=>0,'reg_holiday_ot_pay'=>0,'reg_holiday_nd_pay'=>0,'reg_holiday_ot_nd_pay'=>0,
                'reg_holiday_rd_pay'=>0,'reg_holiday_rd_ot_pay'=>0,'reg_holiday_rd_nd_pay'=>0,'reg_holiday_rd_ot_nd_pay'=>0,
                'spec_holiday_pay'=>0,'spec_holiday_ot_pay'=>0,'spec_holiday_nd_pay'=>0,'spec_holiday_ot_nd_pay'=>0,
                'spec_holiday_rd_pay'=>0,'spec_holiday_rd_ot_pay'=>0,'spec_holiday_rd_nd_pay'=>0,'spec_holiday_rd_ot_nd_pay'=>0,
                'rd_pay'=>0,'rd_ot_pay'=>0,'rd_nd_pay'=>0,'rd_ot_nd_pay'=>0,
                'leave_pay'=>0,'total_pay'=>0,
            ];

            $totalPay = 0.0;
            foreach ($map as $attCol => [$earnCol, $code]) {
                $qty   = adjVal($row, $attCol);
                $entry = $rates[$code] ?? ['mult'=>0.0,'is_daily'=>false];
                if ($entry['is_daily']) {
                    $days  = strpos($attCol,'days') !== false ? $qty : $qty / 8.0;
                    $value = round($days * $dailyRate * $entry['mult'], 2);
                } else {
                    $value = round($hourlyRate * $entry['mult'] * $qty, 2);
                }
                $pays[$earnCol] = $value;
                $totalPay += $value;
            }

            $leaveDays  = adjVal($row, 'leave_days');
            $leavePay   = round($leaveDays * $dailyRate, 2);
            $pays['leave_pay'] = $leavePay;
            $totalPay += $leavePay;
            $pays['total_pay'] = round($totalPay, 2);

            // UPSERT: update if active row exists, else insert
            $chkE = $pdo->prepare("SELECT id FROM fch_earnings_computation WHERE batch_id=? AND employee_id=? AND is_archived=0 LIMIT 1");
            $chkE->execute([$batchId, $empId]);
            $existEcId = $chkE->fetchColumn();

            if ($existEcId) {
                $upd = $pdo->prepare("
                    UPDATE fch_earnings_computation SET
                        payroll_period=?, emp_fullname=?, emp_dept=?,
                        reg_pay=?, ot_pay=?, nd_pay=?, ot_nd_pay=?,
                        reg_holiday_days=?, reg_holiday_pay=?, reg_holiday_ot_pay=?, reg_holiday_nd_pay=?, reg_holiday_ot_nd_pay=?,
                        reg_holiday_rd_pay=?, reg_holiday_rd_ot_pay=?, reg_holiday_rd_nd_pay=?, reg_holiday_rd_ot_nd_pay=?,
                        spec_holiday_pay=?, spec_holiday_ot_pay=?, spec_holiday_nd_pay=?, spec_holiday_ot_nd_pay=?,
                        spec_holiday_rd_pay=?, spec_holiday_rd_ot_pay=?, spec_holiday_rd_nd_pay=?, spec_holiday_rd_ot_nd_pay=?,
                        rd_pay=?, rd_ot_pay=?, rd_nd_pay=?, rd_ot_nd_pay=?,
                        leave_pay=?, total_pay=?
                    WHERE id=?
                ");
                $upd->execute([
                    $payrollPeriod, $row['emp_fullname'], $row['emp_dept'],
                    $pays['reg_pay'], $pays['ot_pay'], $pays['nd_pay'], $pays['ot_nd_pay'],
                    $pays['reg_holiday_days'], $pays['reg_holiday_pay'], $pays['reg_holiday_ot_pay'],
                    $pays['reg_holiday_nd_pay'], $pays['reg_holiday_ot_nd_pay'],
                    $pays['reg_holiday_rd_pay'], $pays['reg_holiday_rd_ot_pay'],
                    $pays['reg_holiday_rd_nd_pay'], $pays['reg_holiday_rd_ot_nd_pay'],
                    $pays['spec_holiday_pay'], $pays['spec_holiday_ot_pay'],
                    $pays['spec_holiday_nd_pay'], $pays['spec_holiday_ot_nd_pay'],
                    $pays['spec_holiday_rd_pay'], $pays['spec_holiday_rd_ot_pay'],
                    $pays['spec_holiday_rd_nd_pay'], $pays['spec_holiday_rd_ot_nd_pay'],
                    $pays['rd_pay'], $pays['rd_ot_pay'], $pays['rd_nd_pay'], $pays['rd_ot_nd_pay'],
                    $pays['leave_pay'], $pays['total_pay'],
                    $existEcId,
                ]);
            } else {
                $ins = $pdo->prepare("
                    INSERT INTO fch_earnings_computation
                    (batch_id, payroll_id, payroll_period, employee_id, emp_fullname, emp_dept,
                     reg_pay, ot_pay, nd_pay, ot_nd_pay,
                     reg_holiday_days, reg_holiday_pay, reg_holiday_ot_pay, reg_holiday_nd_pay, reg_holiday_ot_nd_pay,
                     reg_holiday_rd_pay, reg_holiday_rd_ot_pay, reg_holiday_rd_nd_pay, reg_holiday_rd_ot_nd_pay,
                     spec_holiday_pay, spec_holiday_ot_pay, spec_holiday_nd_pay, spec_holiday_ot_nd_pay,
                     spec_holiday_rd_pay, spec_holiday_rd_ot_pay, spec_holiday_rd_nd_pay, spec_holiday_rd_ot_nd_pay,
                     rd_pay, rd_ot_pay, rd_nd_pay, rd_ot_nd_pay,
                     leave_pay, total_pay)
                    VALUES (?,0,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ");
                $ins->execute([
                    $batchId, $payrollPeriod, $empId, $row['emp_fullname'], $row['emp_dept'],
                    $pays['reg_pay'], $pays['ot_pay'], $pays['nd_pay'], $pays['ot_nd_pay'],
                    $pays['reg_holiday_days'], $pays['reg_holiday_pay'], $pays['reg_holiday_ot_pay'],
                    $pays['reg_holiday_nd_pay'], $pays['reg_holiday_ot_nd_pay'],
                    $pays['reg_holiday_rd_pay'], $pays['reg_holiday_rd_ot_pay'],
                    $pays['reg_holiday_rd_nd_pay'], $pays['reg_holiday_rd_ot_nd_pay'],
                    $pays['spec_holiday_pay'], $pays['spec_holiday_ot_pay'],
                    $pays['spec_holiday_nd_pay'], $pays['spec_holiday_ot_nd_pay'],
                    $pays['spec_holiday_rd_pay'], $pays['spec_holiday_rd_ot_pay'],
                    $pays['spec_holiday_rd_nd_pay'], $pays['spec_holiday_rd_ot_nd_pay'],
                    $pays['rd_pay'], $pays['rd_ot_pay'], $pays['rd_nd_pay'], $pays['rd_ot_nd_pay'],
                    $pays['leave_pay'], $pays['total_pay'],
                ]);
            }

            // ── Cascade adj_: if any attendance adj_ input was used, write the derived
            //    pay value to the corresponding adj_ column so it displays in blue and
            //    is preserved through subsequent recomputes.
            $cascadeAdj = [];
            $sourceFlds = [];
            foreach ($map as $attCol => [$earnCol, $code]) {
                $adjInputKey = "adj_$attCol";
                if (array_key_exists($adjInputKey, $row) && $row[$adjInputKey] !== null && $row[$adjInputKey] !== '') {
                    $cascadeAdj["adj_{$earnCol}"] = $pays[$earnCol];
                    $sourceFlds[] = $adjInputKey;
                }
            }
            if (array_key_exists('adj_leave_days', $row) && $row['adj_leave_days'] !== null && $row['adj_leave_days'] !== '') {
                $cascadeAdj['adj_leave_pay'] = $pays['leave_pay'];
                $sourceFlds[] = 'adj_leave_days';
            }
            if (!empty($cascadeAdj)) {
                $cascadeAdj['adj_total_pay'] = $pays['total_pay'];
                $sourceDesc = implode(', ', array_unique($sourceFlds));
                cascadeAndAudit($pdo, $batchId, $empId, 'fch_earnings_computation', $cascadeAdj, $sourceDesc);
            }
        }
        if ($ownTx) $pdo->commit();
    } catch (Throwable $e) {
        if ($ownTx && $pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

// ─── Upsert helper for fch_deductions_computation ────────────────────────────
function upsertDeduction(PDO $pdo, int $batchId, int $empId, array $fields): void {
    $chk = $pdo->prepare("SELECT id FROM fch_deductions_computation WHERE batch_id=? AND employee_id=? AND is_archived=0");
    $chk->execute([$batchId, $empId]);
    $existingId = $chk->fetchColumn();

    if ($existingId) {
        // Fetch existing row to recompute totals
        $ex = $pdo->prepare("SELECT employee_sss,employer_sss,employee_philhealth,employer_philhealth,
            employee_pagibig,employer_pagibig,late_deduct,other_deduct FROM fch_deductions_computation WHERE id=?");
        $ex->execute([$existingId]);
        $existingRow = $ex->fetch(PDO::FETCH_ASSOC) ?: [];

        $merged = array_merge([
            'employee_sss'=>0,'employer_sss'=>0,
            'employee_philhealth'=>0,'employer_philhealth'=>0,
            'employee_pagibig'=>0,'employer_pagibig'=>0,
            'late_deduct'=>null,'other_deduct'=>null,
        ], $existingRow, $fields);

        $empBen = round((float)$merged['employee_sss'] + (float)$merged['employee_philhealth'] + (float)$merged['employee_pagibig'], 2);
        $erBen  = round((float)$merged['employer_sss'] + (float)$merged['employer_philhealth'] + (float)$merged['employer_pagibig'], 2);
        $late   = is_null($merged['late_deduct']) ? 0.0 : (float)$merged['late_deduct'];
        $other  = is_null($merged['other_deduct']) ? 0.0 : (float)$merged['other_deduct'];
        $totalDed = round($empBen + $late + $other, 2);
        $totalCon = round($empBen + $erBen, 2);

        // Build SET clause from changed fields + totals
        $setCols = [];
        foreach ($fields as $col => $val) $setCols[] = "$col = ?";
        $setCols[] = 'employee_total_benefits = ?';
        $setCols[] = 'employer_total_benefits = ?';
        $setCols[] = 'total_deduct = ?';
        $setCols[] = 'total_contributions = ?';

        $upd = $pdo->prepare("UPDATE fch_deductions_computation SET " . implode(',', $setCols) . " WHERE id=?");
        $vals = array_values($fields);
        $vals[] = $empBen; $vals[] = $erBen; $vals[] = $totalDed; $vals[] = $totalCon;
        $vals[] = $existingId;
        $upd->execute($vals);
    } else {
        // Fetch payroll_period + emp info
        $pp = $pdo->prepare("SELECT payroll_period, emp_fullname, emp_dept FROM fch_earnings_computation WHERE batch_id=? AND employee_id=? LIMIT 1");
        $pp->execute([$batchId, $empId]);
        $ppRow = $pp->fetch(PDO::FETCH_ASSOC) ?: ['payroll_period'=>'','emp_fullname'=>'','emp_dept'=>''];

        $defaults = ['employee_sss'=>0,'employer_sss'=>0,'employee_philhealth'=>0,'employer_philhealth'=>0,'employee_pagibig'=>0,'employer_pagibig'=>0,'late_deduct'=>null,'other_deduct'=>null];
        $merged   = array_merge($defaults, $fields);

        $empBen = round((float)$merged['employee_sss'] + (float)$merged['employee_philhealth'] + (float)$merged['employee_pagibig'], 2);
        $erBen  = round((float)$merged['employer_sss'] + (float)$merged['employer_philhealth'] + (float)$merged['employer_pagibig'], 2);
        $late   = is_null($merged['late_deduct']) ? 0.0 : (float)$merged['late_deduct'];
        $other  = is_null($merged['other_deduct']) ? 0.0 : (float)$merged['other_deduct'];
        $totalDed = round($empBen + $late + $other, 2);
        $totalCon = round($empBen + $erBen, 2);

        $ins = $pdo->prepare("
            INSERT INTO fch_deductions_computation
            (batch_id, payroll_period, employee_id, emp_fullname, emp_dept,
             employee_sss, employer_sss, employee_philhealth, employer_philhealth,
             employee_pagibig, employer_pagibig,
             late_deduct, other_deduct,
             employee_total_benefits, employer_total_benefits,
             total_deduct, total_contributions)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ");
        $ins->execute([
            $batchId, $ppRow['payroll_period'], $empId, $ppRow['emp_fullname'], $ppRow['emp_dept'],
            (float)$merged['employee_sss'], (float)$merged['employer_sss'],
            (float)$merged['employee_philhealth'], (float)$merged['employer_philhealth'],
            (float)$merged['employee_pagibig'], (float)$merged['employer_pagibig'],
            $merged['late_deduct'], $merged['other_deduct'],
            $empBen, $erBen, $totalDed, $totalCon,
        ]);
    }
}

// ─── Step 3: Late Deductions ─────────────────────────────────────────────────
function stepLate(PDO $pdo, int $batchId, ?int $empId = null): void {
    $ownTx = !$pdo->inTransaction(); if ($ownTx) $pdo->beginTransaction();
    try {
        $empSql = $empId ? ' AND employee_id=?' : '';
        $rows = $pdo->prepare("SELECT employee_id, late_mins, adj_late_mins FROM fch_attendance_summary WHERE batch_id=? AND is_archived=0$empSql");
        $rows->execute($empId ? [$batchId, $empId] : [$batchId]);
        foreach ($rows->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $empId    = (int)$row['employee_id'];
            $lateMins = adjValInt($row, 'late_mins');

            $es = $pdo->prepare("SELECT emp_dailyrate FROM fch_employees WHERE employee_id=?");
            $es->execute([$empId]);
            $daily = (float)($es->fetchColumn() ?: 0.0);

            $lateDeduct = round(($daily / 8.0 / 60.0) * $lateMins, 2);
            upsertDeduction($pdo, $batchId, $empId, ['late_deduct' => $lateDeduct]);
            // Cascade: adj_late_mins drove the result → mirror to adj_late_deduct
            if ($row['adj_late_mins'] !== null && $row['adj_late_mins'] !== '') {
                cascadeAndAudit($pdo, $batchId, $empId, 'fch_deductions_computation', ['adj_late_deduct' => $lateDeduct], 'adj_late_mins');
            }
        }
        if ($ownTx) $pdo->commit();
    } catch (Throwable $e) {
        if ($ownTx && $pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

// ─── Step 4: SSS ─────────────────────────────────────────────────────────────
function stepSSS(PDO $pdo, int $batchId, ?int $empId = null): void {
    $ownTx = !$pdo->inTransaction(); if ($ownTx) $pdo->beginTransaction();
    try {
        $empSql = $empId ? ' AND employee_id=?' : '';
        $rows = $pdo->prepare("SELECT employee_id, total_pay, adj_total_pay FROM fch_earnings_computation WHERE batch_id=? AND is_archived=0$empSql");
        $rows->execute($empId ? [$batchId, $empId] : [$batchId]);
        foreach ($rows->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $empId    = (int)$row['employee_id'];
            $totalPay = adjVal($row, 'total_pay');

            $br = $pdo->prepare("SELECT employee_share, employer_share FROM fch_sss_contributions WHERE salary_from <= ? AND salary_to >= ? ORDER BY salary_from LIMIT 1");
            $br->execute([$totalPay, $totalPay]);
            $sss = $br->fetch(PDO::FETCH_ASSOC);
            $empSss = $sss ? (float)$sss['employee_share'] : 0.0;
            $erSss  = $sss ? (float)$sss['employer_share']  : 0.0;

            upsertDeduction($pdo, $batchId, $empId, ['employee_sss' => $empSss, 'employer_sss' => $erSss]);
            // Cascade: adj_total_pay (from earnings) drove the SSS bracket → mirror to adj_ SSS columns
            if ($row['adj_total_pay'] !== null && $row['adj_total_pay'] !== '') {
                cascadeAndAudit($pdo, $batchId, $empId, 'fch_deductions_computation', ['adj_employee_sss' => $empSss, 'adj_employer_sss' => $erSss], 'adj_total_pay');
            }
        }
        if ($ownTx) $pdo->commit();
    } catch (Throwable $e) {
        if ($ownTx && $pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

// ─── Step 5: PhilHealth ──────────────────────────────────────────────────────
function stepPhilHealth(PDO $pdo, int $batchId, ?int $empId = null): void {
    $ownTx = !$pdo->inTransaction(); if ($ownTx) $pdo->beginTransaction();
    try {
        $empSql = $empId ? ' AND ec.employee_id=?' : '';
        $rows = $pdo->prepare("SELECT ec.employee_id FROM fch_earnings_computation ec WHERE ec.batch_id=? AND ec.is_archived=0$empSql");
        $rows->execute($empId ? [$batchId, $empId] : [$batchId]);
        foreach ($rows->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $empId = (int)$row['employee_id'];

            $es = $pdo->prepare("SELECT emp_dailyrate FROM fch_employees WHERE employee_id=?");
            $es->execute([$empId]);
            $daily = (float)($es->fetchColumn() ?: 0.0);
            $base  = $daily * 26.0;

            $br = $pdo->prepare("SELECT employee_share, employer_share FROM fch_philhealth_contributions WHERE salary_from <= ? AND salary_to >= ? ORDER BY salary_from LIMIT 1");
            $br->execute([$base, $base]);
            $ph = $br->fetch(PDO::FETCH_ASSOC);
            $empPh = $ph ? (float)$ph['employee_share'] : 0.0;
            $erPh  = $ph ? (float)$ph['employer_share']  : 0.0;

            upsertDeduction($pdo, $batchId, $empId, ['employee_philhealth' => $empPh, 'employer_philhealth' => $erPh]);
        }
        if ($ownTx) $pdo->commit();
    } catch (Throwable $e) {
        if ($ownTx && $pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

// ─── Step 6: Pag-IBIG ────────────────────────────────────────────────────────
function stepPagIBIG(PDO $pdo, int $batchId, ?int $empId = null): void {
    $ownTx = !$pdo->inTransaction(); if ($ownTx) $pdo->beginTransaction();
    try {
        $empSql = $empId ? ' AND employee_id=?' : '';
        $rows = $pdo->prepare("SELECT employee_id, total_pay, adj_total_pay FROM fch_earnings_computation WHERE batch_id=? AND is_archived=0$empSql");
        $rows->execute($empId ? [$batchId, $empId] : [$batchId]);
        foreach ($rows->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $empId    = (int)$row['employee_id'];
            $totalPay = adjVal($row, 'total_pay');

            $br = $pdo->prepare("SELECT employee_share, employer_share FROM fch_pagibig_contributions WHERE salary_from <= ? AND salary_to >= ? ORDER BY salary_from LIMIT 1");
            $br->execute([$totalPay, $totalPay]);
            $pi = $br->fetch(PDO::FETCH_ASSOC);
            $empPi = $pi ? (float)$pi['employee_share'] : 0.0;
            $erPi  = $pi ? (float)$pi['employer_share']  : 0.0;

            // If share < 1: treat as percentage multiplier
            if ($empPi > 0 && $empPi < 1.0) $empPi = round($totalPay * $empPi, 2);
            if ($erPi  > 0 && $erPi  < 1.0) $erPi  = round($totalPay * $erPi,  2);

            upsertDeduction($pdo, $batchId, $empId, ['employee_pagibig' => $empPi, 'employer_pagibig' => $erPi]);
            // Cascade: adj_total_pay drove the Pag-IBIG lookup → mirror to adj_ columns
            if ($row['adj_total_pay'] !== null && $row['adj_total_pay'] !== '') {
                cascadeAndAudit($pdo, $batchId, $empId, 'fch_deductions_computation', ['adj_employee_pagibig' => $empPi, 'adj_employer_pagibig' => $erPi], 'adj_total_pay');
            }
        }
        if ($ownTx) $pdo->commit();
    } catch (Throwable $e) {
        if ($ownTx && $pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

// ─── Step 7: Withholding Tax ─────────────────────────────────────────────────
function stepTax(PDO $pdo, int $batchId, ?int $empId = null): void {
    $ownTx = !$pdo->inTransaction(); if ($ownTx) $pdo->beginTransaction();
    try {
        $empSql = $empId ? ' AND ec.employee_id=?' : '';
        // Use effective deductions: COALESCE(adj_X, base_X) for each component so that
        // cascade-set adj_ values (and user-manual adj_ overrides) flow into taxable income.
        $rows = $pdo->prepare("
            SELECT ec.employee_id, ec.emp_fullname, ec.emp_dept, ec.payroll_period,
                   COALESCE(ec.adj_total_pay, ec.total_pay)   AS total_pay,
                   ec.adj_total_pay,
                   (COALESCE(dc.adj_employee_sss,        dc.employee_sss,        0)
                  + COALESCE(dc.adj_employee_philhealth,  dc.employee_philhealth, 0)
                  + COALESCE(dc.adj_employee_pagibig,     dc.employee_pagibig,    0)
                  + COALESCE(dc.adj_late_deduct,          dc.late_deduct,         0)
                  + COALESCE(dc.adj_other_deduct,         dc.other_deduct,        0)) AS total_deduct,
                   (dc.adj_employee_sss IS NOT NULL OR dc.adj_employee_philhealth IS NOT NULL
                    OR dc.adj_employee_pagibig IS NOT NULL OR dc.adj_late_deduct IS NOT NULL
                    OR dc.adj_other_deduct IS NOT NULL) AS has_ded_adj
            FROM fch_earnings_computation ec
            LEFT JOIN fch_deductions_computation dc
                   ON dc.batch_id=ec.batch_id AND dc.employee_id=ec.employee_id AND dc.is_archived=0
            WHERE ec.batch_id=? AND ec.is_archived=0$empSql
        ");
        $rows->execute($empId ? [$batchId, $empId] : [$batchId]);

        $chk = $pdo->prepare("SELECT id FROM fch_tax_deduction WHERE batch_id=? AND employee_id=? AND is_archived=0");
        $ins = $pdo->prepare("INSERT INTO fch_tax_deduction (batch_id,payroll_period,employee_id,emp_fullname,emp_dept,taxable_income,tax_deduct,total) VALUES (?,?,?,?,?,?,?,?)");
        $upd = $pdo->prepare("UPDATE fch_tax_deduction SET taxable_income=?,tax_deduct=?,total=? WHERE id=?");

        foreach ($rows->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $empId      = (int)$row['employee_id'];
            $totalPay   = (float)$row['total_pay'];
            $totalDeduct= (float)$row['total_deduct'];

            $taxable = max(0.0, round($totalPay - $totalDeduct, 2));

            $br = $pdo->prepare("SELECT salary_from, base_tax, excess_rate FROM fch_withholding_tax_table WHERE salary_from <= ? AND salary_to >= ? ORDER BY salary_from LIMIT 1");
            $br->execute([$taxable, $taxable]);
            $bracket = $br->fetch(PDO::FETCH_ASSOC);

            $baseTax    = $bracket ? (float)$bracket['base_tax']    : 0.0;
            $excessRate = $bracket ? (float)$bracket['excess_rate'] : 0.0;
            $salaryFrom = $bracket ? (float)$bracket['salary_from']  : 0.0;

            $taxDeduct = max(0.0, round(($taxable - $salaryFrom) * $excessRate + $baseTax, 2));
            $total      = round($taxable - $taxDeduct, 2);

            $chk->execute([$batchId, $empId]);
            $existingId = $chk->fetchColumn();
            if ($existingId) {
                $upd->execute([$taxable, $taxDeduct, $total, $existingId]);
            } else {
                $ins->execute([$batchId, $row['payroll_period'], $empId, $row['emp_fullname'], $row['emp_dept'], $taxable, $taxDeduct, $total]);
            }
            // Cascade: if earnings adj_ or deductions adj_ were active, mirror tax results to adj_ columns
            $hasEarningsAdj = ($row['adj_total_pay'] !== null && $row['adj_total_pay'] !== '');
            $hasDedAdj      = !empty($row['has_ded_adj']);
            if ($hasEarningsAdj || $hasDedAdj) {
                $taxSourceParts = [];
                if ($hasEarningsAdj) $taxSourceParts[] = 'adj_total_pay';
                if ($hasDedAdj)      $taxSourceParts[] = 'deductions adj';
                cascadeAndAudit($pdo, $batchId, $empId, 'fch_tax_deduction', [
                    'adj_taxable_income' => $taxable,
                    'adj_tax_deduct'     => $taxDeduct,
                    'adj_total'          => $total,
                ], implode(', ', $taxSourceParts));
            }
        }
        if ($ownTx) $pdo->commit();
    } catch (Throwable $e) {
        if ($ownTx && $pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

// ─── Step 8: Payroll Summary ─────────────────────────────────────────────────
function stepPayrollSummary(PDO $pdo, int $batchId, ?int $empId = null): void {
    $ownTx = !$pdo->inTransaction(); if ($ownTx) $pdo->beginTransaction();
    try {
        $empSql = $empId ? ' AND employee_id=?' : '';
        $rows = $pdo->prepare("SELECT batch_id,payroll_period,employee_id,emp_fullname,emp_dept, COALESCE(adj_total_pay,total_pay) AS total_pay FROM fch_earnings_computation WHERE batch_id=? AND is_archived=0$empSql");
        $rows->execute($empId ? [$batchId, $empId] : [$batchId]);

        $chk = $pdo->prepare("SELECT id FROM fch_payroll_summary WHERE batch_id=? AND employee_id=?");
        $ins = $pdo->prepare("INSERT INTO fch_payroll_summary (batch_id,payroll_period,employee_id,emp_fullname,emp_dept,gross_pay,total_deductions,tax_deduct,net_pay,days_worked) VALUES (?,?,?,?,?,?,?,?,?,?)");
        $upd = $pdo->prepare("UPDATE fch_payroll_summary SET gross_pay=?,total_deductions=?,tax_deduct=?,net_pay=?,days_worked=? WHERE id=?");

        foreach ($rows->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $empId    = (int)$row['employee_id'];
            $grossPay = (float)$row['total_pay'];

            // Use effective deductions (same COALESCE logic as stepTax) for accurate net pay
            $ded = $pdo->prepare("SELECT
                COALESCE(adj_employee_sss,       employee_sss,       0)
                + COALESCE(adj_employee_philhealth, employee_philhealth, 0)
                + COALESCE(adj_employee_pagibig,    employee_pagibig,    0)
                + COALESCE(adj_late_deduct,          late_deduct,         0)
                + COALESCE(adj_other_deduct,         other_deduct,        0) AS eff_deduct
                FROM fch_deductions_computation WHERE batch_id=? AND employee_id=? AND is_archived=0");
            $ded->execute([$batchId, $empId]);
            $totalDed = (float)($ded->fetchColumn() ?: 0.0);

            $tax = $pdo->prepare("SELECT COALESCE(adj_tax_deduct, tax_deduct, 0), COALESCE(adj_total, total, 0) FROM fch_tax_deduction WHERE batch_id=? AND employee_id=? AND is_archived=0");
            $tax->execute([$batchId, $empId]);
            $taxRow = $tax->fetch(PDO::FETCH_NUM);
            $taxDeduct = $taxRow ? (float)$taxRow[0] : 0.0;
            $netPay    = $taxRow ? (float)$taxRow[1] : 0.0;

            // Days worked
            $parts      = explode(' to ', $row['payroll_period']);
            $pStart     = $parts[0] ?? $row['payroll_period'];
            $pEnd       = $parts[1] ?? $pStart;
            $dw = $pdo->prepare("SELECT COUNT(*) FROM fch_attendance WHERE employee_id=? AND date BETWEEN ? AND ?");
            $dw->execute([$empId, $pStart, $pEnd]);
            $daysWorked = (int)$dw->fetchColumn();

            $chk->execute([$batchId, $empId]);
            $existingId = $chk->fetchColumn();
            if ($existingId) {
                // Archive existing summary row before overwriting (history record-keeping)
                archiveRow($pdo, 'fch_payroll_summary', $batchId, $empId);
                $upd->execute([$grossPay, $totalDed, $taxDeduct, $netPay, $daysWorked, $existingId]);
            } else {
                $ins->execute([$batchId, $row['payroll_period'], $empId, $row['emp_fullname'], $row['emp_dept'], $grossPay, $totalDed, $taxDeduct, $netPay, $daysWorked]);
            }
        }
        if ($ownTx) $pdo->commit();
    } catch (Throwable $e) {
        if ($ownTx && $pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

// ─── Step 9: Payroll Results ─────────────────────────────────────────────────
function stepPayrollResults(PDO $pdo, int $batchId): void {
    // Get period from attendance summary
    $ps = $pdo->prepare("SELECT payroll_start, payroll_end FROM fch_attendance_summary WHERE batch_id=? LIMIT 1");
    $ps->execute([$batchId]);
    $period = $ps->fetch(PDO::FETCH_ASSOC);
    if (!$period) throw new Exception("Attendance summary not found for batch $batchId");

    $cnt = $pdo->prepare("SELECT COUNT(DISTINCT employee_id) FROM fch_payroll_summary WHERE batch_id=?");
    $cnt->execute([$batchId]);
    $numEmp = (int)$cnt->fetchColumn();

    $ownTx = !$pdo->inTransaction(); if ($ownTx) $pdo->beginTransaction();
    try {
        // Check if result already exists, skip
        $chk = $pdo->prepare("SELECT id FROM fch_payroll_results WHERE batch_id=?");
        $chk->execute([$batchId]);
        if (!$chk->fetchColumn()) {
            $ins = $pdo->prepare("INSERT INTO fch_payroll_results (batch_id,payroll_start,payroll_end,num_employees,status,created_at,updated_at) VALUES (?,?,?,?,'Draft',NOW(),NOW())");
            $ins->execute([$batchId, $period['payroll_start'], $period['payroll_end'], $numEmp]);
        }
        if ($ownTx) $pdo->commit();
    } catch (Throwable $e) {
        if ($ownTx && $pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

// ─── Route Request ────────────────────────────────────────────────────────────
// When included from update-row.php we only want functions, not the route.
if (defined('PAYROLL_FUNCTIONS_ONLY')) return;

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
if (!empty($_SESSION['is_read_only'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: your account has read-only access']);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST required']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];

$pdo = getDB();

// Check for single-step re-run
$step    = $body['step']       ?? null;
$batchId = isset($body['batch_id'])    ? (int)$body['batch_id']    : null;
$empIdP  = isset($body['employee_id']) ? (int)$body['employee_id'] : null;

$stepFns = [
    'earnings'  => fn() => stepEarnings($pdo, $batchId, $empIdP),
    'late'      => fn() => stepLate($pdo, $batchId, $empIdP),
    'sss'       => fn() => stepSSS($pdo, $batchId, $empIdP),
    'philhealth'=> fn() => stepPhilHealth($pdo, $batchId, $empIdP),
    'pagibig'   => fn() => stepPagIBIG($pdo, $batchId, $empIdP),
    'tax'       => fn() => stepTax($pdo, $batchId, $empIdP),
    'summary'   => fn() => stepPayrollSummary($pdo, $batchId, $empIdP),
    'results'   => fn() => stepPayrollResults($pdo, $batchId),
];

if ($step && $batchId) {
    // ── 'recompute': archive all computed rows, then re-run the full pipeline.
    //    The step functions themselves will re-derive adj_ cascade values from
    //    whatever adj_ values are set on fch_attendance_summary (the root inputs).
    //    We do NOT snapshot/restore adj_ on earnings/deductions/tax – those are
    //    fully re-derived. Only attendance_summary adj_ values survive (they are
    //    the user's authoritative hour/day overrides).
    if ($step === 'recompute') {
        $cascadeTables = [
            'fch_earnings_computation',
            'fch_deductions_computation',
            'fch_tax_deduction',
        ];

        // Support per-employee recompute when employee_id is provided
        if ($empIdP) {
            $empIds = [$empIdP];
        } else {
            $empRowsStmt = $pdo->prepare("SELECT DISTINCT employee_id FROM fch_attendance_summary WHERE batch_id=? AND is_archived=0");
            $empRowsStmt->execute([$batchId]);
            $empIds = $empRowsStmt->fetchAll(PDO::FETCH_COLUMN);
            if (empty($empIds)) {
                echo json_encode(['success'=>false,'message'=>'No employees found for this batch']);
                exit;
            }
        }

        // Archive active computed rows for the target employee(s)
        try {
            $pdo->beginTransaction();
            foreach ($empIds as $empId) {
                foreach ($cascadeTables as $tbl) {
                    archiveRow($pdo, $tbl, $batchId, (int)$empId);
                }
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log("Recompute archive error: " . $e->getMessage());
            echo json_encode(['success'=>false,'message'=>'Archive step failed: '.$e->getMessage()]);
            exit;
        }

        // Re-run the pipeline — scoped to the target employee or all if null
        $recompEmpId = $empIdP ?: null;
        $reSteps = [];
        $pipelineMap = [
            'earnings'   => fn() => stepEarnings($pdo, $batchId, $recompEmpId),
            'late'       => fn() => stepLate($pdo, $batchId, $recompEmpId),
            'sss'        => fn() => stepSSS($pdo, $batchId, $recompEmpId),
            'philhealth' => fn() => stepPhilHealth($pdo, $batchId, $recompEmpId),
            'pagibig'    => fn() => stepPagIBIG($pdo, $batchId, $recompEmpId),
            'tax'        => fn() => stepTax($pdo, $batchId, $recompEmpId),
            'summary'    => fn() => stepPayrollSummary($pdo, $batchId, $recompEmpId),
            'results'    => fn() => stepPayrollResults($pdo, $batchId),
        ];
        $hasError = false;
        foreach ($pipelineMap as $sName => $fn) {
            try {
                $fn();
                $reSteps[] = ['step'=>$sName,'success'=>true,'message'=>'OK'];
            } catch (Throwable $e) {
                error_log("Recompute step $sName error: " . $e->getMessage());
                $reSteps[] = ['step'=>$sName,'success'=>false,'message'=>$e->getMessage()];
                $hasError = true;
            }
        }

        echo json_encode([
            'success' => !$hasError,
            'batch_id'=> $batchId,
            'message' => $hasError ? 'Recomputed with some errors' : 'Recomputed successfully',
            'steps'   => $reSteps,
        ]);
        exit;
    }

    if (!isset($stepFns[$step])) {
        echo json_encode(['success'=>false,'message'=>"Unknown step: $step"]);
        exit;
    }
    try {
        $stepFns[$step]();
        echo json_encode(['success'=>true,'message'=>"Step '$step' completed",'batch_id'=>$batchId]);
    } catch (Throwable $e) {
        error_log("Payroll step $step error: " . $e->getMessage());
        echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
    }
    exit;
}

// ── Full pipeline ────────────────────────────────────────────────────────────
$startDate = $body['start_date'] ?? null;
$endDate   = $body['end_date']   ?? null;
$employees = $body['employees']  ?? [];

if (!$startDate || !$endDate || empty($employees)) {
    echo json_encode(['success'=>false,'message'=>'Missing start_date, end_date, or employees']);
    exit;
}

// Duplicate check (skip when force=true)
$force = !empty($body['force']);
$dup = $pdo->prepare("SELECT COUNT(*) FROM fch_attendance_summary WHERE payroll_start=? AND payroll_end=?");
$dup->execute([$startDate, $endDate]);
if ((int)$dup->fetchColumn() > 0 && !$force) {
    echo json_encode(['success'=>false,'code'=>'DUPLICATE_PERIOD','message'=>'A payroll batch already exists for this period.']);
    exit;
}

$steps = [];
$newBatchId = null;

try {
    $result = stepAttendanceSummary($pdo, $startDate, $endDate, $employees);
    $newBatchId = $result['batch_id'];
    $steps[] = ['step'=>'attendance_summary','success'=>true,'message'=>"Processed {$result['count']} employee(s)"];
} catch (Throwable $e) {
    echo json_encode(['success'=>false,'message'=>$e->getMessage(),'steps'=>[['step'=>'attendance_summary','success'=>false,'message'=>$e->getMessage()]]]);
    exit;
}

$pipeline = [
    'earnings'   => fn() => stepEarnings($pdo, $newBatchId),
    'late'       => fn() => stepLate($pdo, $newBatchId),
    'sss'        => fn() => stepSSS($pdo, $newBatchId),
    'philhealth' => fn() => stepPhilHealth($pdo, $newBatchId),
    'pagibig'    => fn() => stepPagIBIG($pdo, $newBatchId),
    'tax'        => fn() => stepTax($pdo, $newBatchId),
    'summary'    => fn() => stepPayrollSummary($pdo, $newBatchId),
    'results'    => fn() => stepPayrollResults($pdo, $newBatchId),
];

foreach ($pipeline as $name => $fn) {
    try {
        $fn();
        $steps[] = ['step'=>$name,'success'=>true,'message'=>'OK'];
    } catch (Throwable $e) {
        error_log("Payroll pipeline step $name: " . $e->getMessage());
        $steps[] = ['step'=>$name,'success'=>false,'message'=>$e->getMessage()];
        echo json_encode(['success'=>false,'batch_id'=>$newBatchId,'message'=>"Failed at '$name': ".$e->getMessage(),'steps'=>$steps]);
        exit;
    }
}

echo json_encode(['success'=>true,'batch_id'=>$newBatchId,'message'=>'Payroll generated successfully','steps'=>$steps]);
