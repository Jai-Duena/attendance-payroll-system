<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

// Public — no session required
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data       = json_decode(file_get_contents('php://input'), true);
$identifier = trim($data['identifier'] ?? '');

if (!$identifier) {
    http_response_code(400);
    echo json_encode(['error' => 'Username or email is required']);
    exit;
}

$db = getDB();

$stmt = $db->prepare('SELECT emp_email FROM fch_employees WHERE emp_username = ? OR emp_email = ? LIMIT 1');
$stmt->execute([$identifier, $identifier]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['error' => 'No account found with that username or email.']);
    exit;
}

$hasEmail    = !empty($user['emp_email']);
$maskedEmail = null;

if ($hasEmail) {
    [$local, $domain] = explode('@', $user['emp_email'], 2);
    $maskedEmail = substr($local, 0, 1) . str_repeat('*', max(1, strlen($local) - 1)) . '@' . $domain;
}

echo json_encode([
    'exists'       => true,
    'has_email'    => $hasEmail,
    'masked_email' => $maskedEmail,
]);
exit;
