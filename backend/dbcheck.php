<?php
require_once __DIR__ . '/config/db.php';
$db = getDB();
$rows = $db->query('SHOW COLUMNS FROM fch_payroll_corrections')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo $r['Field'] . ' | ' . $r['Type'] . ' | default=' . var_export($r['Default'], true) . "\n";
}
echo "\n--- sample rows ---\n";
$rows2 = $db->query('SELECT id, batch_id, employee_id, status, source FROM fch_payroll_corrections ORDER BY id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows2 as $r) {
    echo implode(' | ', $r) . "\n";
}
