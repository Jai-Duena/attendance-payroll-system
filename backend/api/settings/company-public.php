<?php
// Public endpoint — no authentication required
// Returns only public-safe company branding info (name, logo, colors)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$pdo  = getDB();
// Auto-migrate bg_image_path column if not present yet
try { $pdo->exec("ALTER TABLE fch_company_profile ADD COLUMN IF NOT EXISTS bg_image_path VARCHAR(255) NULL"); } catch (\Exception $e) {}
$stmt = $pdo->query('SELECT company_name, logo_path, bg_image_path, color_primary, color_secondary FROM fch_company_profile WHERE id = 1 LIMIT 1');
$row  = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    $row = [
        'company_name'    => 'Family Care Hospital',
        'logo_path'       => null,
        'bg_image_path'   => null,
        'color_primary'   => '#2563eb',
        'color_secondary' => '#1d4ed8',
    ];
}

$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
$row['logo_url'] = $row['logo_path']
    ? $baseUrl . '/backend/uploads/company/' . basename($row['logo_path'])
    : null;
$row['bg_image_url'] = !empty($row['bg_image_path'])
    ? $baseUrl . '/backend/uploads/company/' . basename($row['bg_image_path'])
    : null;
unset($row['logo_path'], $row['bg_image_path']);

echo json_encode(['success' => true, 'data' => $row]);
exit;
