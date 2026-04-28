<?php
ini_set('display_errors', '0');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$role     = $_SESSION['role'] ?? 'employee';
$canWrite = ($role === 'admin') && empty($_SESSION['is_read_only']);
$method   = $_SERVER['REQUEST_METHOD'];
$pdo      = getDB();

// ── GET — return company profile ─────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM fch_company_profile WHERE id = 1 LIMIT 1');
    $row  = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        // Return defaults if somehow missing
        $row = [
            'id'              => 1,
            'company_name'    => 'Family Care Hospital',
            'address'         => null,
            'contact'         => null,
            'email'           => null,
            'logo_path'       => null,
            'bg_image_path'   => null,
            'color_primary'   => '#2563eb',
            'color_secondary' => '#1d4ed8',
            'color_tertiary'  => null,
            'updated_at'      => null,
        ];
    }
    // Build public URL (absolute so the React dev‑server cross‑origin src works)
    $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
    if ($row['logo_path']) {
        $row['logo_url'] = $baseUrl . '/backend/uploads/company/' . basename($row['logo_path']);
    } else {
        $row['logo_url'] = null;
    }
    if (!empty($row['bg_image_path'])) {
        $row['bg_image_url'] = $baseUrl . '/backend/uploads/company/' . basename($row['bg_image_path']);
    } else {
        $row['bg_image_url'] = null;
    }
    echo json_encode(['success' => true, 'data' => $row]);
    exit;
}

// ── Write-gating ─────────────────────────────────────────────────────────────
if (!$canWrite) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: admin role required']);
    exit;
}

// ── POST ?action=upload_logo — handle logo file upload ───────────────────────
$action = $_GET['action'] ?? '';
if ($method === 'POST' && $action === 'upload_logo') {
    if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid file uploaded.']);
        exit;
    }

    $file     = $_FILES['logo'];
    $allowed  = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    $mimeType = mime_content_type($file['tmp_name']);

    if (!in_array($mimeType, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Allowed: JPEG, PNG, GIF, WEBP, SVG.']);
        exit;
    }

    // Max 2 MB
    if ($file['size'] > 2 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large. Max 2 MB.']);
        exit;
    }

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'logo.' . strtolower($ext);
    $dest     = __DIR__ . '/../../uploads/company/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file.']);
        exit;
    }

    // Persist path in DB
    $pdo->prepare('UPDATE fch_company_profile SET logo_path = ? WHERE id = 1')
        ->execute([$filename]);

    $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
    $logoUrl = $baseUrl . '/backend/uploads/company/' . $filename;
    echo json_encode(['success' => true, 'message' => 'Logo uploaded.', 'logo_url' => $logoUrl]);
    exit;
}

// ── PUT — update text fields via JSON body ────────────────────────────────────
if ($method === 'PUT' || ($method === 'POST' && $action === 'update')) {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    // Validate hex colors
    $hexPattern = '/^#(?:[0-9a-fA-F]{3}){1,2}$/';
    foreach (['color_primary', 'color_secondary', 'color_tertiary'] as $col) {
        if (!empty($body[$col]) && !preg_match($hexPattern, $body[$col])) {
            http_response_code(400);
            echo json_encode(['error' => "Invalid hex color for {$col}: {$body[$col]}"]);
            exit;
        }
    }

    $allowed = ['company_name', 'address', 'contact', 'email',
                'color_primary', 'color_secondary', 'color_tertiary'];

    $setClauses = [];
    $params     = [];

    foreach ($allowed as $col) {
        if (array_key_exists($col, $body)) {
            $setClauses[] = "{$col} = ?";
            $params[]     = ($body[$col] === '' || $body[$col] === null) ? null : $body[$col];
        }
    }

    // company_name must not be blank
    if (array_key_exists('company_name', $body) && empty(trim($body['company_name'] ?? ''))) {
        http_response_code(400);
        echo json_encode(['error' => 'company_name cannot be empty.']);
        exit;
    }

    if (empty($setClauses)) {
        echo json_encode(['success' => true, 'message' => 'Nothing to update.']);
        exit;
    }

    $params[] = 1; // WHERE id = 1
    $pdo->prepare('UPDATE fch_company_profile SET ' . implode(', ', $setClauses) . ' WHERE id = ?')
        ->execute($params);

    echo json_encode(['success' => true, 'message' => 'Company profile updated.']);
    exit;
}

// ── POST ?action=upload_bg_image — handle background image upload ────────────
if ($method === 'POST' && $action === 'upload_bg_image') {
    if (!isset($_FILES['bg_image']) || $_FILES['bg_image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid file uploaded.']);
        exit;
    }

    $file     = $_FILES['bg_image'];
    $allowed  = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $mimeType = mime_content_type($file['tmp_name']);

    if (!in_array($mimeType, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Allowed: JPEG, PNG, GIF, WEBP.']);
        exit;
    }

    // Max 5 MB
    if ($file['size'] > 5 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large. Max 5 MB.']);
        exit;
    }

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $filename = 'login_bg.' . strtolower($ext);
    $uploadDir = __DIR__ . '/../../uploads/company/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $dest = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file.']);
        exit;
    }

    // Auto-migrate column if needed
    $pdo->exec("ALTER TABLE fch_company_profile ADD COLUMN IF NOT EXISTS bg_image_path VARCHAR(255) NULL");
    $pdo->prepare('UPDATE fch_company_profile SET bg_image_path = ? WHERE id = 1')
        ->execute([$filename]);

    $baseUrl    = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
    $bgImageUrl = $baseUrl . '/backend/uploads/company/' . $filename;
    echo json_encode(['success' => true, 'message' => 'Background image uploaded.', 'bg_image_url' => $bgImageUrl]);
    exit;
}

// ── DELETE logo ───────────────────────────────────────────────────────────────
if ($method === 'DELETE' && $action === 'delete_logo') {
    // Get current logo path
    $row = $pdo->query('SELECT logo_path FROM fch_company_profile WHERE id = 1 LIMIT 1')->fetch(PDO::FETCH_ASSOC);
    if ($row && $row['logo_path']) {
        $path = __DIR__ . '/../../uploads/company/' . basename($row['logo_path']);
        if (file_exists($path)) @unlink($path);
    }
    $pdo->prepare('UPDATE fch_company_profile SET logo_path = NULL WHERE id = 1')->execute();
    echo json_encode(['success' => true, 'message' => 'Logo removed.']);
    exit;
}

// ── DELETE background image ───────────────────────────────────────────────────
if ($method === 'DELETE' && $action === 'delete_bg_image') {
    $row = $pdo->query('SELECT bg_image_path FROM fch_company_profile WHERE id = 1 LIMIT 1')->fetch(PDO::FETCH_ASSOC);
    if ($row && !empty($row['bg_image_path'])) {
        $path = __DIR__ . '/../../uploads/company/' . basename($row['bg_image_path']);
        if (file_exists($path)) @unlink($path);
    }
    $pdo->prepare('UPDATE fch_company_profile SET bg_image_path = NULL WHERE id = 1')->execute();
    echo json_encode(['success' => true, 'message' => 'Background image removed.']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
