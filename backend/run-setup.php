<?php
// TEMPORARY — delete after use
define('DB_HOST', 'sql100.infinityfree.com');
define('DB_PORT', '3306');
define('DB_NAME', 'if0_40965702_family_care');
define('DB_USER', 'if0_40965702');
define('DB_PASS', 'clRx4wLpE8gM');

header('Content-Type: text/plain');

$errors = [];

try {
    // Connect exactly as db.php does, with the INIT_COMMAND
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND =>
                "SET NAMES utf8mb4 COLLATE utf8mb4_general_ci, " .
                "time_zone = '+08:00', " .
                "sql_mode  = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'",
        ]
    );
    echo "Connected OK\n\n";

    // Test: manually create fch_date_settings and check if it persists
    echo "Testing manual CREATE TABLE...\n";
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `fch_date_settings` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `start_day` varchar(20) NOT NULL,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8");
        $count = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='fch_date_settings'")->fetchColumn();
        echo $count > 0 ? "Table EXISTS after CREATE\n\n" : "Table DOES NOT EXIST after CREATE — InfinityFree is blocking DDL silently\n\n";
    } catch (PDOException $e) {
        echo "Manual CREATE FAILED: " . $e->getMessage() . "\n\n";
    }

    // Run each SQL file
    $sqlDir = __DIR__ . '/sql/';
    $files  = [
        'fch_date_settings.sql', 'fch_rate_multipliers.sql',
        'fch_holidays.sql', 'fch_reg_holiday.sql', 'fch_special_holiday.sql',
        'fch_sss_contributions.sql', 'fch_pagibig_contributions.sql',
        'fch_philhealth_contributions.sql', 'fch_withholding_tax_table.sql',
        'fch_tax_deduction.sql', 'fch_employees.sql', 'fch_employees_shift.sql',
        'att_punches.sql', 'fch_attendance.sql', 'fch_attendance_summary.sql',
        'fch_reg_hrs.sql', 'fch_late.sql', 'fch_ot.sql', 'fch_nd.sql',
        'fch_restday.sql', 'fch_deductions_computation.sql',
        'fch_earnings_computation.sql', 'fch_payroll_results.sql',
        'fch_payroll_summary.sql', 'fch_requests.sql',
        'fch_bulletin_board.sql', 'fch_user_notes.sql',
    ];
    $extraFiles = [__DIR__ . '/setup.sql', $sqlDir . 'indexes.sql'];

    foreach ($files as $f) {
        $path = $sqlDir . $f;
        if (!file_exists($path)) { echo "MISSING: $f\n"; continue; }
        $sql = preg_replace('/\/\*![\s\S]*?\*\//', '', file_get_contents($path));
        $stmts = array_filter(array_map('trim', explode(';', $sql)),
            fn($s) => !empty($s) && !preg_match('/^\s*(--|#)/', $s));
        foreach ($stmts as $stmt) {
            if (empty(trim($stmt))) continue;
            try {
                $pdo->exec($stmt);
            } catch (PDOException $e) {
                // Log ALL errors this time — no filtering
                $errors[] = "$f [" . $e->getCode() . "]: " . $e->getMessage() . "\n  SQL: " . substr(trim($stmt), 0, 120);
            }
        }
        echo "OK: $f\n";
    }
    foreach ($extraFiles as $path) {
        if (!file_exists($path)) { echo "MISSING: " . basename($path) . "\n"; continue; }
        $sql = preg_replace('/\/\*![\s\S]*?\*\//', '', file_get_contents($path));
        $stmts = array_filter(array_map('trim', explode(';', $sql)),
            fn($s) => !empty($s) && !preg_match('/^\s*(--|#)/', $s));
        foreach ($stmts as $stmt) {
            if (empty(trim($stmt))) continue;
            try { $pdo->exec($stmt); } catch (PDOException $e) {
                // Log ALL errors
                $errors[] = basename($path) . " [" . $e->getCode() . "]: " . $e->getMessage() . "\n  SQL: " . substr(trim($stmt), 0, 120);
            }
        }
        echo "OK: " . basename($path) . "\n";
    }

    // Seed admin
    try {
        $pdo->exec("INSERT IGNORE INTO fch_employees
            (employee_id,emp_fname,emp_lname,emp_dept,emp_position,emp_datehire,emp_emptype,emp_username,emp_pass,emp_acc_type,emp_dailyrate)
            VALUES (1,'Admin','User','Management','Administrator',CURDATE(),'Regular','Admin','Family Care','Management',0)");
        echo "OK: admin seed\n";
    } catch (PDOException $e) {
        $errors[] = "admin seed: " . $e->getMessage();
    }

    echo "\n--- Results ---\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables created: " . count($tables) . "\n";
    if (!empty($errors)) {
        echo "\nErrors (" . count($errors) . "):\n";
        foreach ($errors as $err) echo "  $err\n";
    } else {
        echo "No errors!\n";
    }

} catch (PDOException $e) {
    echo "CONNECTION FAILED: " . $e->getMessage() . "\n";
}
