<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$pdo = getDB();

// Get the requesting user's current shift so we can exclude it
$meStmt = $pdo->prepare("SELECT emp_shift FROM fch_employees WHERE employee_id = ? LIMIT 1");
$meStmt->execute([$_SESSION['user_id']]);
$currentShift = $meStmt->fetchColumn() ?: null;

// Fixed preset shifts — only Shift 1–5
$all = [
    'Shift 1: 6 AM to 2 PM',
    'Shift 2: 2 PM to 10 PM',
    'Shift 3: 10 PM to 6 AM',
    'Shift 4: 6 AM to 6 PM',
    'Shift 5: 6 PM to 6 AM',
];

// Exclude the current user's shift
if ($currentShift !== null) {
    $all = array_values(array_filter($all, fn($s) => $s !== $currentShift));
}

$presets = array_map(fn($label) => ['label' => $label], $all);

echo json_encode(['data' => $presets, 'current_shift' => $currentShift]);
?>
exit;
