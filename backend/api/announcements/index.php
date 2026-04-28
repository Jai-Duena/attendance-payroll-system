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
$method = $_SERVER['REQUEST_METHOD'];
$role   = $_SESSION['role'];       // employee | supervisor | admin
$dept   = $_SESSION['department'];

// ── GET ────────────────────────────────────────────────────────
if ($method === 'GET') {

    if ($role === 'employee') {
        // Employees: only active (within date range) + matches their dept or 'All'
        $stmt = $db->prepare(
            "SELECT id, emp_fullname AS author, emp_acc_type, emp_dept,
                    text AS content, display_from, display_to, target_dept, created_at
             FROM fch_bulletin_board
             WHERE (display_from IS NULL OR display_from <= CURDATE())
               AND (display_to   IS NULL OR display_to   >= CURDATE())
               AND (target_dept = 'All' OR target_dept = ?)
             ORDER BY created_at DESC"
        );
        $stmt->execute([$dept]);

    } elseif ($role === 'supervisor') {
        // Supervisors: all posts from their own department
        $stmt = $db->prepare(
            "SELECT id, emp_fullname AS author, emp_acc_type, emp_dept,
                    text AS content, display_from, display_to, target_dept, created_at
             FROM fch_bulletin_board
             WHERE target_dept = ? OR target_dept = 'All'
             ORDER BY created_at DESC"
        );
        $stmt->execute([$dept]);

    } else {
        // Admin: all posts
        $stmt = $db->query(
            "SELECT id, emp_fullname AS author, emp_acc_type, emp_dept,
                    text AS content, display_from, display_to, target_dept, created_at
             FROM fch_bulletin_board
             ORDER BY created_at DESC"
        );
    }

    echo json_encode($stmt->fetchAll());

// ── POST ───────────────────────────────────────────────────────
} elseif ($method === 'POST') {

    if (!in_array($role, ['admin', 'supervisor'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $data         = json_decode(file_get_contents('php://input'), true);
    $content      = trim($data['content']      ?? '');
    $display_from = $data['display_from']      ?? null;
    $display_to   = $data['display_to']        ?? null;
    $target_dept  = trim($data['target_dept']  ?? 'All');

    if (!$content) {
        http_response_code(400);
        echo json_encode(['error' => 'Content is required']);
        exit;
    }

    // Supervisors can only post to their own department
    if ($role === 'supervisor') {
        $target_dept = $dept;
    }

    $stmt = $db->prepare(
        'INSERT INTO fch_bulletin_board
             (employee_id, emp_fullname, emp_acc_type, emp_dept, text, display_from, display_to, target_dept)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $_SESSION['user_id'],
        $_SESSION['full_name'],
        ucfirst($role),
        $dept,
        $content,
        $display_from ?: null,
        $display_to   ?: null,
        $target_dept,
    ]);

    echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);

// ── DELETE ─────────────────────────────────────────────────────
} elseif ($method === 'DELETE') {

    if (!in_array($role, ['admin', 'supervisor'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $id   = (int)($data['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit;
    }

    // Supervisors may only delete their own dept posts
    if ($role === 'supervisor') {
        $stmt = $db->prepare('DELETE FROM fch_bulletin_board WHERE id = ? AND target_dept = ?');
        $stmt->execute([$id, $dept]);
    } else {
        $stmt = $db->prepare('DELETE FROM fch_bulletin_board WHERE id = ?');
        $stmt->execute([$id]);
    }

    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
exit;
