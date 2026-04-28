<?php
// Upload to web host, visit it, then DELETE immediately after
define('DB_HOST', 'sql100.infinityfree.com');   // external hostname for InfinityFree PHP
define('DB_PORT', '3306');
define('DB_NAME', 'if0_40965702_family_care');
define('DB_USER', 'if0_40965702');
define('DB_PASS', 'clRx4wLpE8gM');

header('Content-Type: text/plain');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "Connected OK!\n";

    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables (" . count($tables) . "):\n";
    echo implode("\n", $tables) ?: "(none)";

} catch (PDOException $e) {
    echo "FAILED: " . $e->getMessage();
}
