<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$db     = getDB();
$userId = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// Ensure table exists with all required columns
$db->exec("
    CREATE TABLE IF NOT EXISTS fch_user_notes (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        employee_id  INT NOT NULL,
        note_text    TEXT NOT NULL,
        color        VARCHAR(30) NOT NULL DEFAULT 'bg-blue-100',
        pinned       TINYINT(1) NOT NULL DEFAULT 0,
        sort_order   INT NOT NULL DEFAULT 0,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id)
    )
");

// Add columns if migrating from older schema
$cols = $db->query("SHOW COLUMNS FROM fch_user_notes")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('pinned', $cols)) {
    $db->exec("ALTER TABLE fch_user_notes ADD COLUMN pinned TINYINT(1) NOT NULL DEFAULT 0");
}
if (!in_array('sort_order', $cols)) {
    $db->exec("ALTER TABLE fch_user_notes ADD COLUMN sort_order INT NOT NULL DEFAULT 0");
}

// GET — list all notes for this user
if ($method === 'GET') {
    $stmt = $db->prepare(
        'SELECT id, note_text, color, pinned, sort_order, created_at, updated_at
         FROM fch_user_notes
         WHERE employee_id = ?
         ORDER BY pinned DESC, sort_order ASC, updated_at DESC'
    );
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();
    // Ensure boolean type for pinned
    foreach ($rows as &$r) {
        $r['pinned'] = (bool)$r['pinned'];
    }
    echo json_encode($rows);

// POST — create new note
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $text  = trim($data['note_text'] ?? '');
    $color = $data['color'] ?? 'bg-blue-100';

    if (!$text) {
        http_response_code(400);
        echo json_encode(['error' => 'note_text is required']);
        exit;
    }

    // Place new note after pinned ones at the top of unpinned
    $stmt = $db->prepare(
        'INSERT INTO fch_user_notes (employee_id, note_text, color, pinned, sort_order) VALUES (?, ?, ?, 0, 0)'
    );
    $stmt->execute([$userId, $text, $color]);
    $newId = (int)$db->lastInsertId();

    $stmt2 = $db->prepare('SELECT id, note_text, color, pinned, sort_order, created_at, updated_at FROM fch_user_notes WHERE id = ?');
    $stmt2->execute([$newId]);
    $row = $stmt2->fetch();
    $row['pinned'] = (bool)$row['pinned'];
    echo json_encode($row);

// PUT — update note text/color OR toggle pin
} elseif ($method === 'PUT') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $id    = (int)($data['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id is required']);
        exit;
    }

    // Toggle pin — dedicated action
    if (isset($data['pinned'])) {
        $pinned = $data['pinned'] ? 1 : 0;
        $db->prepare('UPDATE fch_user_notes SET pinned = ? WHERE id = ? AND employee_id = ?')
           ->execute([$pinned, $id, $userId]);
        echo json_encode(['success' => true]);
        exit;
    }

    // Batch reorder — array of {id, sort_order}
    if (isset($data['reorder']) && is_array($data['reorder'])) {
        $upd = $db->prepare('UPDATE fch_user_notes SET sort_order = ? WHERE id = ? AND employee_id = ?');
        foreach ($data['reorder'] as $item) {
            $upd->execute([(int)$item['sort_order'], (int)$item['id'], $userId]);
        }
        echo json_encode(['success' => true]);
        exit;
    }

    $text  = trim($data['note_text'] ?? '');
    $color = $data['color'] ?? null;

    if (!$text) {
        http_response_code(400);
        echo json_encode(['error' => 'note_text is required']);
        exit;
    }

    if ($color) {
        $stmt = $db->prepare(
            'UPDATE fch_user_notes SET note_text = ?, color = ? WHERE id = ? AND employee_id = ?'
        );
        $stmt->execute([$text, $color, $id, $userId]);
    } else {
        $stmt = $db->prepare(
            'UPDATE fch_user_notes SET note_text = ? WHERE id = ? AND employee_id = ?'
        );
        $stmt->execute([$text, $id, $userId]);
    }

    echo json_encode(['success' => true]);

// DELETE — remove a note
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = (int)($data['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id is required']);
        exit;
    }

    $stmt = $db->prepare('DELETE FROM fch_user_notes WHERE id = ? AND employee_id = ?');
    $stmt->execute([$id, $userId]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
exit;
