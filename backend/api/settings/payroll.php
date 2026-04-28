<?php
ini_set('display_errors', '0');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../notifications/helper.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$role = $_SESSION['role'] ?? 'employee';

// Only admin may mutate; all authenticated roles can view
$canWrite = in_array($role, ['admin']);

$method = $_SERVER['REQUEST_METHOD'];
$pdo    = getDB();

// Allowed tables and their metadata
// pk       = primary key column name
// pk_type  = 'string' | 'int'
// columns  = ordered list of non-PK columns (for INSERT/UPDATE)
// num_cols = columns that should be cast to float in responses
$tables = [
    'rate_multipliers' => [
        'table'    => 'fch_rate_multipliers',
        'pk'       => 'code',
        'pk_type'  => 'string',
        'columns'  => ['code', 'multiplier', 'description'],
        'num_cols' => ['multiplier'],
        'order'    => 'code ASC',
    ],
    'pagibig' => [
        'table'    => 'fch_pagibig_contributions',
        'pk'       => 'id',
        'pk_type'  => 'int',
        'columns'  => ['salary_from', 'salary_to', 'employee_share', 'employer_share', 'effective_date'],
        'num_cols' => ['salary_from', 'salary_to', 'employee_share', 'employer_share'],
        'order'    => 'salary_from ASC',
    ],
    'philhealth' => [
        'table'    => 'fch_philhealth_contributions',
        'pk'       => 'id',
        'pk_type'  => 'int',
        'columns'  => ['salary_from', 'salary_to', 'employee_share', 'employer_share', 'effective_date'],
        'num_cols' => ['salary_from', 'salary_to', 'employee_share', 'employer_share'],
        'order'    => 'salary_from ASC',
    ],
    'sss' => [
        'table'    => 'fch_sss_contributions',
        'pk'       => 'id',
        'pk_type'  => 'int',
        'columns'  => ['salary_from', 'salary_to', 'employee_share', 'employer_share', 'effective_date'],
        'num_cols' => ['salary_from', 'salary_to', 'employee_share', 'employer_share'],
        'order'    => 'salary_from ASC',
    ],
    'withholding_tax' => [
        'table'    => 'fch_withholding_tax_table',
        'pk'       => 'id',
        'pk_type'  => 'int',
        'columns'  => ['salary_from', 'salary_to', 'base_tax', 'excess_rate', 'effective_date'],
        'num_cols' => ['salary_from', 'salary_to', 'base_tax', 'excess_rate'],
        'order'    => 'salary_from ASC',
    ],
];

// ── Resolve table ────────────────────────────────────────────────────────────
$tableKey = trim($_GET['table'] ?? '');
if (!isset($tables[$tableKey])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing ?table= parameter. Allowed: ' . implode(', ', array_keys($tables))]);
    exit;
}
$meta = $tables[$tableKey];

// ── Helper: cast numeric columns ────────────────────────────────────────────
function castRow(array $row, array $numCols): array {
    foreach ($numCols as $col) {
        if (isset($row[$col]) && $row[$col] !== null) {
            $row[$col] = (float)$row[$col];
        }
    }
    return $row;
}

// ────────────────────────────────────────────────────────────────────────────
// GET – list all rows
// ────────────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM {$meta['table']} ORDER BY {$meta['order']}");
    $rows = array_map(fn($r) => castRow($r, $meta['num_cols']), $stmt->fetchAll(PDO::FETCH_ASSOC));
    echo json_encode(['success' => true, 'data' => $rows]);
    exit;
}

// ── Write operations require admin ───────────────────────────────────────────
if (!$canWrite) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: admin role required']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];

// ────────────────────────────────────────────────────────────────────────────
// POST – insert new row
// ────────────────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $cols   = $meta['columns'];
    $values = [];

    foreach ($cols as $col) {
        if (!array_key_exists($col, $body)) {
            http_response_code(400);
            echo json_encode(['error' => "Missing field: {$col}"]);
            exit;
        }
        $values[] = $body[$col] === '' ? null : $body[$col];
    }

    $placeholders = implode(', ', array_fill(0, count($cols), '?'));
    $colList      = implode(', ', $cols);

    $stmt = $pdo->prepare("INSERT INTO {$meta['table']} ({$colList}) VALUES ({$placeholders})");
    $stmt->execute($values);

    $newId = $meta['pk_type'] === 'int' ? (int)$pdo->lastInsertId() : $body[$meta['pk']];

    // Notify all active employees of the payroll settings change
    $adminName = $_SESSION['full_name'] ?? 'Admin';
    $tableLabels = [
        'rate_multipliers' => 'Rate Multipliers',
        'pagibig'          => 'Pag-IBIG Contributions',
        'philhealth'       => 'PhilHealth Contributions',
        'sss'              => 'SSS Contributions',
        'withholding_tax'  => 'Withholding Tax Table',
    ];
    $tableLabel = $tableLabels[$tableKey] ?? ucwords(str_replace('_', ' ', $tableKey));
    notifyAllActive($pdo, "settings_update_{$tableKey}",
        "{$tableLabel} Updated",
        "{$adminName} added a new entry to the {$tableLabel} table."
    );

    echo json_encode(['success' => true, 'message' => 'Row created.', 'id' => $newId]);
    exit;
}

// ────────────────────────────────────────────────────────────────────────────
// PUT – update existing row
// ────────────────────────────────────────────────────────────────────────────
if ($method === 'PUT') {
    $pk = $body[$meta['pk']] ?? ($_GET[$meta['pk']] ?? null);
    if ($pk === null || $pk === '') {
        http_response_code(400);
        echo json_encode(['error' => "Missing primary key: {$meta['pk']}"]);
        exit;
    }

    // Build update columns = all cols except PK (for tables where PK is auto-int)
    // For rate_multipliers where PK=code we allow updating everything except code via separate check
    $updateCols = array_filter($meta['columns'], fn($c) => $c !== $meta['pk']);
    $setClauses = [];
    $values     = [];

    foreach ($updateCols as $col) {
        if (!array_key_exists($col, $body)) continue; // skip absent fields
        $setClauses[] = "{$col} = ?";
        $values[]     = $body[$col] === '' ? null : $body[$col];
    }

    if (empty($setClauses)) {
        echo json_encode(['success' => true, 'message' => 'Nothing to update.']);
        exit;
    }

    $values[] = $meta['pk_type'] === 'int' ? (int)$pk : $pk;

    $sql = "UPDATE {$meta['table']} SET " . implode(', ', $setClauses) . " WHERE {$meta['pk']} = ?";
    $pdo->prepare($sql)->execute($values);

    // Notify all active employees of the payroll settings change
    $adminName = $_SESSION['full_name'] ?? 'Admin';
    $tableLabels2 = [
        'rate_multipliers' => 'Rate Multipliers',
        'pagibig'          => 'Pag-IBIG Contributions',
        'philhealth'       => 'PhilHealth Contributions',
        'sss'              => 'SSS Contributions',
        'withholding_tax'  => 'Withholding Tax Table',
    ];
    $tableLabel2 = $tableLabels2[$tableKey] ?? ucwords(str_replace('_', ' ', $tableKey));
    notifyAllActive($pdo, "settings_update_{$tableKey}",
        "{$tableLabel2} Updated",
        "{$adminName} updated an entry in the {$tableLabel2} table."
    );

    echo json_encode(['success' => true, 'message' => 'Row updated.']);
    exit;
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE – remove a row
// ────────────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $pk = $body[$meta['pk']] ?? ($_GET[$meta['pk']] ?? null);
    if ($pk === null || $pk === '') {
        http_response_code(400);
        echo json_encode(['error' => "Missing primary key: {$meta['pk']}"]);
        exit;
    }

    $value = $meta['pk_type'] === 'int' ? (int)$pk : $pk;
    $pdo->prepare("DELETE FROM {$meta['table']} WHERE {$meta['pk']} = ?")->execute([$value]);

    // Notify all active employees of the deletion
    $adminName = $_SESSION['full_name'] ?? 'Admin';
    $tableLabelsD = [
        'rate_multipliers' => 'Rate Multipliers',
        'pagibig'          => 'Pag-IBIG Contributions',
        'philhealth'       => 'PhilHealth Contributions',
        'sss'              => 'SSS Contributions',
        'withholding_tax'  => 'Withholding Tax Table',
    ];
    $tableLabelD = $tableLabelsD[$tableKey] ?? ucwords(str_replace('_', ' ', $tableKey));
    notifyAllActive($pdo, "settings_update_{$tableKey}",
        "{$tableLabelD} Updated",
        "{$adminName} removed an entry from the {$tableLabelD} table."
    );

    echo json_encode(['success' => true, 'message' => 'Row deleted.']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
