<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDB();
try {
    $pdo->exec("ALTER TABLE fch_requests ADD COLUMN IF NOT EXISTS mp_proof VARCHAR(500) DEFAULT NULL AFTER reason");
    echo "Migration done: mp_proof column added to fch_requests\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
