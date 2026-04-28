<?php
// TEMPORARY DEBUG — delete after use
define('DB_HOST', 'sql100.infinityfree.com');
define('DB_PORT', '3306');
define('DB_NAME', 'if0_40965702_family_care');
define('DB_USER', 'if0_40965702');
define('DB_PASS', 'clRx4wLpE8gM');

header('Content-Type: text/plain');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );
    echo "Connected OK\n";
    echo "MySQL version: " . $pdo->query("SELECT VERSION()")->fetchColumn() . "\n\n";

    // Test the problematic sql_mode line
    echo "Testing sql_mode...\n";
    try {
        $pdo->exec("SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'");
        echo "sql_mode OK\n";
    } catch (PDOException $e) {
        echo "sql_mode FAILED: " . $e->getMessage() . "\n";
        echo "Retrying without NO_AUTO_CREATE_USER...\n";
        $pdo->exec("SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
        echo "sql_mode retry OK\n";
    }

    // Test creating one table
    echo "\nTesting CREATE TABLE...\n";
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `_test_fch` (`id` int NOT NULL AUTO_INCREMENT PRIMARY KEY)");
        echo "CREATE TABLE OK\n";
        $pdo->exec("DROP TABLE `_test_fch`");
        echo "DROP TABLE OK\n";
    } catch (PDOException $e) {
        echo "CREATE TABLE FAILED: " . $e->getMessage() . "\n";
    }

    // Check SQL files exist
    echo "\nChecking SQL files...\n";
    $sqlDir = __DIR__ . '/sql/';
    echo "sql/ path: $sqlDir\n";
    echo "sql/ exists: " . (is_dir($sqlDir) ? 'YES' : 'NO') . "\n";
    $firstFile = $sqlDir . 'fch_employees.sql';
    echo "fch_employees.sql exists: " . (file_exists($firstFile) ? 'YES' : 'NO') . "\n";

} catch (PDOException $e) {
    echo "FAILED: " . $e->getMessage() . "\n";
}
