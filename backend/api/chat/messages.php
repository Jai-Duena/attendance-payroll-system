<?php
/**
 * Unified messages API for DM and department chats.
 * Room IDs:
 *   dm_{minId}_{maxId}   – direct message between two employees
 *   dept_{DEPT_NAME}     – department-wide chat
 *   company              – company-wide (uses existing fch_chat_messages for the company chat)
 *
 * GET  ?room_id=xxx              → fetch last 80 messages
 * GET  ?conversations=1          → list recent DM conversations for current user
 * POST { room_id, message }      → send
 */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$pdo    = getDB();
$userId = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// Auto-create table
$pdo->exec("
    CREATE TABLE IF NOT EXISTS `fch_messages` (
      `id`           INT          NOT NULL AUTO_INCREMENT,
      `room_id`      VARCHAR(150) NOT NULL,
      `sender_id`    INT          NOT NULL,
      `sender_name`  VARCHAR(255) NOT NULL,
      `sender_photo` VARCHAR(500) NULL DEFAULT NULL,
      `message`      TEXT         NOT NULL,
      `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      KEY `idx_msg_room` (`room_id`, `created_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
");

// Resolve sender photo URL
$baseUrl       = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
$senderStmt    = $pdo->prepare("SELECT emp_fullname, emp_photo FROM fch_employees WHERE employee_id = ? LIMIT 1");
$senderStmt->execute([$userId]);
$senderRow     = $senderStmt->fetch(PDO::FETCH_ASSOC);
$senderName    = $senderRow['emp_fullname'] ?? ($_SESSION['full_name'] ?? "User#{$userId}");
$senderPhoto   = !empty($senderRow['emp_photo']) ? $baseUrl . '/' . ltrim($senderRow['emp_photo'], '/') : null;

// ── GET: list recent DM conversations ─────────────────────────────────────
if ($method === 'GET' && isset($_GET['conversations'])) {
    // Find all room_ids that contain this user (DM rooms only: dm_X_Y)
    $stmt = $pdo->prepare(
        "SELECT room_id, MAX(created_at) AS last_at, COUNT(*) AS msg_count
         FROM fch_messages
         WHERE room_id LIKE 'dm_%' AND (
           room_id LIKE CONCAT('dm_', ?, '_%') OR
           room_id LIKE CONCAT('dm_%_', ?)
         )
         GROUP BY room_id
         ORDER BY last_at DESC
         LIMIT 30"
    );
    $stmt->execute([$userId, $userId]);
    $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $conversations = [];
    foreach ($rooms as $room) {
        $rid   = $room['room_id']; // dm_X_Y
        $parts = explode('_', $rid); // ['dm', X, Y]
        $otherId = ((int)$parts[1] === $userId) ? (int)$parts[2] : (int)$parts[1];
        $otherStmt = $pdo->prepare("SELECT employee_id, emp_fullname, emp_photo FROM fch_employees WHERE employee_id = ? LIMIT 1");
        $otherStmt->execute([$otherId]);
        $other = $otherStmt->fetch(PDO::FETCH_ASSOC);
        if (!$other) continue;

        // Last message
        $lastMsgStmt = $pdo->prepare("SELECT message FROM fch_messages WHERE room_id = ? ORDER BY created_at DESC LIMIT 1");
        $lastMsgStmt->execute([$rid]);
        $lastMsg = $lastMsgStmt->fetchColumn();

        $conversations[] = [
            'room_id'     => $rid,
            'type'        => 'direct',
            'other_id'    => $otherId,
            'name'        => $other['emp_fullname'],
            'photo'       => !empty($other['emp_photo']) ? $baseUrl . '/' . ltrim($other['emp_photo'], '/') : null,
            'last_msg'    => $lastMsg,
            'last_at'     => $room['last_at'],
        ];
    }
    echo json_encode(['conversations' => $conversations]);
    exit;
}

// ── GET: messages for a room ──────────────────────────────────────────────
if ($method === 'GET') {
    $roomId = trim($_GET['room_id'] ?? '');
    if (!$roomId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing room_id']);
        exit;
    }

    // For DM rooms, verify this user is a participant
    if (str_starts_with($roomId, 'dm_')) {
        $parts = explode('_', $roomId);
        $ids   = [(int)($parts[1] ?? 0), (int)($parts[2] ?? 0)];
        if (!in_array($userId, $ids)) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            exit;
        }
    }

    $limit  = min((int)($_GET['limit'] ?? 80), 200);
    $since  = $_GET['since_id'] ?? null;
    if ($since) {
        $stmt = $pdo->prepare(
            "SELECT id, room_id, sender_id, sender_name, sender_photo, message, created_at
             FROM fch_messages WHERE room_id = ? AND id > ? ORDER BY created_at ASC LIMIT ?"
        );
        $stmt->execute([$roomId, (int)$since, $limit]);
    } else {
        $stmt = $pdo->prepare(
            "SELECT id, room_id, sender_id, sender_name, sender_photo, message, created_at
             FROM fch_messages WHERE room_id = ? ORDER BY created_at ASC LIMIT ?"
        );
        $stmt->execute([$roomId, $limit]);
    }
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['messages' => $rows]);
    exit;
}

// ── POST: send a message ──────────────────────────────────────────────────
if ($method === 'POST') {
    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $roomId  = trim($body['room_id'] ?? '');
    $message = trim($body['message'] ?? '');

    if (!$roomId || !$message) {
        http_response_code(400);
        echo json_encode(['error' => 'room_id and message are required']);
        exit;
    }

    // For DM rooms, verify participant
    if (str_starts_with($roomId, 'dm_')) {
        $parts = explode('_', $roomId);
        $ids   = [(int)($parts[1] ?? 0), (int)($parts[2] ?? 0)];
        if (!in_array($userId, $ids)) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            exit;
        }
    }

    $ins = $pdo->prepare(
        "INSERT INTO fch_messages (room_id, sender_id, sender_name, sender_photo, message)
         VALUES (?, ?, ?, ?, ?)"
    );
    $ins->execute([$roomId, $userId, $senderName, $senderPhoto, $message]);
    $newId = (int)$pdo->lastInsertId();

    // Fetch created_at from DB so the timezone matches MySQL (+08:00 from connection init)
    $tsSel = $pdo->prepare("SELECT created_at FROM fch_messages WHERE id = ? LIMIT 1");
    $tsSel->execute([$newId]);
    $createdAt = $tsSel->fetchColumn() ?: date('Y-m-d H:i:s');

    echo json_encode([
        'success'     => true,
        'id'          => $newId,
        'room_id'     => $roomId,
        'sender_id'   => $userId,
        'sender_name' => $senderName,
        'sender_photo'=> $senderPhoto,
        'message'     => $message,
        'created_at'  => $createdAt,
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
