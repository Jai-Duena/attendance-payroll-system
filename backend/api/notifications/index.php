<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/helper.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$pdo        = getDB();
$userId     = (int)$_SESSION['user_id'];
$method     = $_SERVER['REQUEST_METHOD'];

// Auto-create table if needed
_ensureNotifTable($pdo);

// ── GET: list notifications for the current user ──────────────────────────
if ($method === 'GET') {
    $limit  = min((int)($_GET['limit'] ?? 50), 100);
    $offset = (int)($_GET['offset'] ?? 0);

    $rows = $pdo->prepare(
        "SELECT id, type, title, message, reference_id, is_read, created_at
         FROM fch_notifications
         WHERE employee_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?"
    );
    $rows->execute([$userId, $limit, $offset]);
    $notifications = $rows->fetchAll(PDO::FETCH_ASSOC);

    $unreadStmt = $pdo->prepare("SELECT COUNT(*) FROM fch_notifications WHERE employee_id = ? AND is_read = 0");
    $unreadStmt->execute([$userId]);
    $unread = (int)$unreadStmt->fetchColumn();

    echo json_encode(['notifications' => $notifications, 'unread' => $unread]);

// ── PUT: mark one or all as read ──────────────────────────────────────────
} elseif ($method === 'PUT') {
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $body['action'] ?? 'mark_one';
    $id     = isset($body['id']) ? (int)$body['id'] : null;

    if ($action === 'mark_all') {
        $stmt = $pdo->prepare("UPDATE fch_notifications SET is_read = 1 WHERE employee_id = ?");
        $stmt->execute([$userId]);
    } elseif ($id) {
        $stmt = $pdo->prepare("UPDATE fch_notifications SET is_read = 1 WHERE id = ? AND employee_id = ?");
        $stmt->execute([$id, $userId]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id or action=mark_all']);
        exit;
    }

    echo json_encode(['success' => true]);

// ── DELETE: delete a notification ─────────────────────────────────────────
} elseif ($method === 'DELETE') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = isset($body['id']) ? (int)$body['id'] : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM fch_notifications WHERE id = ? AND employee_id = ?");
    $stmt->execute([$id, $userId]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
