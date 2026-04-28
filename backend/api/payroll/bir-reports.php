<?php
/**
 * GET /api/payroll/bir-reports.php
 * Streams BIR-formatted CSV reports.
 *
 * Query params:
 *  type    bir_1601c  – Monthly Remittance Return of Creditable Income Taxes
 *          bir_2316   – Certificate of Compensation Payment/Tax Withheld
 *
 *  month   YYYY-MM         required for bir_1601c
 *  year    YYYY (integer)  required for bir_2316
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

$type  = trim($_GET['type']  ?? '');
$month = trim($_GET['month'] ?? '');
$year  = !empty($_GET['year']) ? (int)$_GET['year'] : null;
$pdo   = getDB();

$allowed = ['bir_1601c', 'bir_2316'];
if (!in_array($type, $allowed)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type. Allowed: bir_1601c, bir_2316']);
    exit;
}

// ── Load company info ────────────────────────────────────────────────────────
$company = $pdo->query(
    'SELECT company_name, address FROM fch_company_profile WHERE id = 1 LIMIT 1'
)->fetch(PDO::FETCH_ASSOC);
$companyName    = $company['company_name'] ?? 'Family Care Hospital';
$companyAddress = $company['address']      ?? '';

$out = fopen('php://output', 'w');

// ════════════════════════════════════════════════════════════════════════════
// BIR FORM 1601-C — Monthly Remittance of Creditable Withheld Tax
// Aggregates all batches whose payroll_start falls in the selected month.
// ════════════════════════════════════════════════════════════════════════════
if ($type === 'bir_1601c') {
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        http_response_code(400);
        echo json_encode(['error' => 'month must be in YYYY-MM format']);
        exit;
    }

    $monthStart = $month . '-01';
    $monthEnd   = date('Y-m-t', strtotime($monthStart));
    $monthLabel = date('F Y', strtotime($monthStart));

    // Per-employee totals across all batches in this month
    $stmt = $pdo->prepare("
        SELECT
            t.employee_id,
            t.emp_fullname,
            t.emp_dept,
            e.emp_tin,
            SUM(COALESCE(t.adj_taxable_income, t.taxable_income)) AS taxable_income,
            SUM(COALESCE(t.adj_tax_deduct,     t.tax_deduct))     AS tax_withheld
        FROM fch_tax_deduction t
        JOIN fch_payroll_results r ON r.batch_id = t.batch_id
        JOIN fch_employees e       ON e.employee_id = t.employee_id
        WHERE r.payroll_start BETWEEN ? AND ?
        GROUP BY t.employee_id, t.emp_fullname, t.emp_dept, e.emp_tin
        ORDER BY t.emp_fullname ASC
    ");
    $stmt->execute([$monthStart, $monthEnd]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $filename = "BIR_1601C_{$month}.csv";
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache'); header('Expires: 0');
    fwrite($out, "\xEF\xBB\xBF");

    // Report header
    fputcsv($out, ['BIR FORM 1601-C — MONTHLY REMITTANCE RETURN (CREDITABLE INCOME TAX)']);
    fputcsv($out, ['Employer / Company Name:', $companyName]);
    fputcsv($out, ['Address:', $companyAddress]);
    fputcsv($out, ['Return Period (Month):', $monthLabel]);
    fputcsv($out, []);

    // Column headers
    fputcsv($out, [
        'No.',
        'Employee Name',
        'Department',
        'TIN',
        'Taxable Compensation (₱)',
        'Tax Withheld (₱)',
    ]);

    $totalTaxable = 0;
    $totalTax     = 0;
    $i = 1;
    foreach ($data as $r) {
        $taxable = (float)$r['taxable_income'];
        $tax     = (float)$r['tax_withheld'];
        $totalTaxable += $taxable;
        $totalTax     += $tax;
        fputcsv($out, [
            $i++,
            $r['emp_fullname'],
            $r['emp_dept'],
            $r['emp_tin'] ?: 'N/A',
            number_format($taxable, 2, '.', ''),
            number_format($tax,     2, '.', ''),
        ]);
    }

    fputcsv($out, []);
    fputcsv($out, [
        '', 'TOTAL', '', '',
        number_format($totalTaxable, 2, '.', ''),
        number_format($totalTax,     2, '.', ''),
    ]);
    fputcsv($out, ['Total Employees:', count($data)]);
    fputcsv($out, []);
    fputcsv($out, ['NOTE: Verify figures against BIR Form 1601-C before filing.']);
}

// ════════════════════════════════════════════════════════════════════════════
// BIR FORM 2316 — Certificate of Compensation Payment / Tax Withheld
// One row per employee summarising the full calendar year.
// ════════════════════════════════════════════════════════════════════════════
if ($type === 'bir_2316') {
    if (!$year || $year < 2000 || $year > 2100) {
        http_response_code(400);
        echo json_encode(['error' => 'year must be a valid 4-digit year']);
        exit;
    }

    $yearStart = "{$year}-01-01";
    $yearEnd   = "{$year}-12-31";

    // Annual totals per employee
    $stmt = $pdo->prepare("
        SELECT
            t.employee_id,
            t.emp_fullname,
            t.emp_dept,
            e.emp_tin,
            SUM(COALESCE(t.adj_taxable_income, t.taxable_income)) AS taxable_income,
            SUM(COALESCE(t.adj_tax_deduct,     t.tax_deduct))     AS tax_withheld
        FROM fch_tax_deduction t
        JOIN fch_payroll_results r ON r.batch_id = t.batch_id
        JOIN fch_employees e       ON e.employee_id = t.employee_id
        WHERE r.payroll_start BETWEEN ? AND ?
        GROUP BY t.employee_id, t.emp_fullname, t.emp_dept, e.emp_tin
        ORDER BY t.emp_fullname ASC
    ");
    $stmt->execute([$yearStart, $yearEnd]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Also pull gross compensation from payroll summary
    $sumStmt = $pdo->prepare("
        SELECT
            s.employee_id,
            SUM(s.gross_pay) AS gross_pay
        FROM fch_payroll_summary s
        JOIN fch_payroll_results r ON r.batch_id = s.batch_id
        WHERE r.payroll_start BETWEEN ? AND ?
        GROUP BY s.employee_id
    ");
    $sumStmt->execute([$yearStart, $yearEnd]);
    $grossMap = [];
    foreach ($sumStmt->fetchAll(PDO::FETCH_ASSOC) as $g) {
        $grossMap[$g['employee_id']] = (float)$g['gross_pay'];
    }

    $filename = "BIR_2316_Year{$year}.csv";
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache'); header('Expires: 0');
    fwrite($out, "\xEF\xBB\xBF");

    fputcsv($out, ['BIR FORM 2316 — CERTIFICATE OF COMPENSATION PAYMENT / TAX WITHHELD']);
    fputcsv($out, ['Employer / Company Name:', $companyName]);
    fputcsv($out, ['Address:', $companyAddress]);
    fputcsv($out, ['Year:', $year]);
    fputcsv($out, []);

    fputcsv($out, [
        'No.',
        'Employee Name',
        'Department',
        'TIN',
        'Gross Compensation (₱)',
        'Taxable Compensation (₱)',
        'Total Tax Withheld (₱)',
    ]);

    $totalGross   = 0;
    $totalTaxable = 0;
    $totalTax     = 0;
    $i = 1;
    foreach ($data as $r) {
        $gross   = $grossMap[$r['employee_id']] ?? 0.0;
        $taxable = (float)$r['taxable_income'];
        $tax     = (float)$r['tax_withheld'];
        $totalGross   += $gross;
        $totalTaxable += $taxable;
        $totalTax     += $tax;
        fputcsv($out, [
            $i++,
            $r['emp_fullname'],
            $r['emp_dept'],
            $r['emp_tin'] ?: 'N/A',
            number_format($gross,   2, '.', ''),
            number_format($taxable, 2, '.', ''),
            number_format($tax,     2, '.', ''),
        ]);
    }

    fputcsv($out, []);
    fputcsv($out, [
        '', 'TOTAL', '', '',
        number_format($totalGross,   2, '.', ''),
        number_format($totalTaxable, 2, '.', ''),
        number_format($totalTax,     2, '.', ''),
    ]);
    fputcsv($out, ['Total Employees:', count($data)]);
    fputcsv($out, []);
    fputcsv($out, ['NOTE: Issue individual certificates to each employee before Jan 31 or last day of employment.']);
}

fclose($out);
