<?php
// This file is no longer needed for seeding employees — they already exist
// in the family_care database from your SQL dump.
//
// The only thing to run is setup.sql to create the fch_chat_messages table.
//
// Open phpMyAdmin, select the family_care database, go to SQL tab, and paste:
//
//   CREATE TABLE IF NOT EXISTS fch_chat_messages (
//       id           INT AUTO_INCREMENT PRIMARY KEY,
//       employee_id  INT           NOT NULL,
//       emp_fullname VARCHAR(150)  NOT NULL,
//       emp_acc_type VARCHAR(50)   NOT NULL DEFAULT 'Employee',
//       message      TEXT          NOT NULL,
//       created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//   );
//
// Then delete this file.

echo "See comments inside this file for instructions.";


require_once __DIR__ . '/config/db.php';

$users = [
    [
        'username'   => 'admin',
        'password'   => 'password123',
        'full_name'  => 'Admin User',
        'role'       => 'admin',
        'department' => 'Management',
    ],
    [
        'username'   => 'supervisor1',
        'password'   => 'password123',
        'full_name'  => 'John Smith',
        'role'       => 'supervisor',
        'department' => 'HR',
    ],
    [
        'username'   => 'employee1',
        'password'   => 'password123',
        'full_name'  => 'Sarah Johnson',
        'role'       => 'employee',
        'department' => 'Engineering',
    ],
    [
        'username'   => 'employee2',
        'password'   => 'password123',
        'full_name'  => 'Mike Chen',
        'role'       => 'employee',
        'department' => 'Engineering',
    ],
];

$db   = getDB();
$stmt = $db->prepare(
    'INSERT IGNORE INTO users (username, password, full_name, role, department)
     VALUES (?, ?, ?, ?, ?)'
);

foreach ($users as $u) {
    $hash = password_hash($u['password'], PASSWORD_BCRYPT);
    $stmt->execute([$u['username'], $hash, $u['full_name'], $u['role'], $u['department']]);
    echo "Inserted: {$u['username']} ({$u['role']})<br>";
}

// Seed a sample announcement
$db->exec(
    "INSERT IGNORE INTO announcements (title, content, created_by)
     SELECT 'Important Announcement',
            'Company holiday on February 14, 2026 (Valentine\'s Day). All offices will be closed. Please submit your timesheets before February 13, 2026.',
            id
     FROM users WHERE role = 'admin' LIMIT 1"
);
echo "Announcement seeded.<br>";

echo "<br><strong>Done! Delete or rename this file now.</strong>";
