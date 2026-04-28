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

$pdo = getDB();
$role       = $_SESSION['role']       ?? 'employee';
$userId     = (int)$_SESSION['user_id'];

$table  = $_GET['table']  ?? 'attendance';  // attendance | summary | punches
$page   = max(1, (int)($_GET['page']  ?? 1));
$limitRaw = (int)($_GET['limit'] ?? 0);
$limit    = in_array($limitRaw, [25, 50, 100]) ? $limitRaw : 25;
$offset = ($page - 1) * $limit;

// Search/filter params
$name          = trim($_GET['name']          ?? '');
$dept          = trim($_GET['dept']          ?? '');
$empId         = trim($_GET['employee_id']   ?? '');
$date          = trim($_GET['date']          ?? '');
$month         = trim($_GET['month']         ?? '');
$year          = trim($_GET['year']          ?? '');
$batchId       = trim($_GET['batch_id']      ?? '');
$payrollPeriod = trim($_GET['payroll_period'] ?? '');  // format YYYY-MM-DD|YYYY-MM-DD

try {
    if ($table === 'attendance') {
        $where   = [];
        $params  = [];

        // Scope by role
        if ($role === 'employee') {
            $where[]  = 'a.employee_id = ?';
            $params[] = $userId;
        } elseif ($role === 'supervisor') {
            // Supervisor: scope to their department by default; allow specific employee filter within dept
            $supDept = $_SESSION['department'] ?? '';
            if ($empId !== '') {
                $where[]  = 'a.employee_id = ?';
                $params[] = (int)$empId;
            } elseif ($supDept) {
                $where[]  = 'a.emp_dept = ?';
                $params[] = $supDept;
            }
        } elseif ($empId !== '') {
            $where[]  = 'a.employee_id = ?';
            $params[] = (int)$empId;
        }

        if ($name !== '') {
            $where[]  = 'a.emp_fullname LIKE ?';
            $params[] = "%{$name}%";
        }
        if ($dept !== '' && in_array($role, ['admin', 'supervisor'])) {
            $where[]  = 'a.emp_dept = ?';
            $params[] = $dept;
        }
        if ($date !== '') {
            $where[]  = 'a.date = ?';
            $params[] = $date;
        } elseif ($month !== '' && $year !== '') {
            $where[]  = 'MONTH(a.date) = ? AND YEAR(a.date) = ?';
            $params[] = (int)$month;
            $params[] = (int)$year;
        } elseif ($year !== '') {
            $where[]  = 'YEAR(a.date) = ?';
            $params[] = (int)$year;
        }

        $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM fch_attendance a $whereSQL");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare(
            "SELECT a.uniq_id, a.employee_id, a.emp_fullname, a.emp_dept, a.date,
                    a.time_in, a.time_out,
                    COALESCE(a.shift_time_in,
                        CONCAT(a.date, ' ', COALESCE(es_d.shift_start, es_def.shift_start))) AS shift_time_in,
                    COALESCE(a.shift_time_out,
                        CONCAT(a.date, ' ', COALESCE(es_d.shift_end, es_def.shift_end)))     AS shift_time_out,
                    a.total_hrs,
                    a.adj_date, a.adj_time_in, a.adj_time_out, a.adj_shift_time_in, a.adj_shift_time_out
             FROM fch_attendance a
             LEFT JOIN fch_employees_shift es_d   ON es_d.employee_id   = a.employee_id AND es_d.date   = a.date
             LEFT JOIN fch_employees_shift es_def ON es_def.employee_id = a.employee_id AND es_def.date IS NULL
             $whereSQL
             ORDER BY a.date DESC, a.emp_fullname ASC
             LIMIT $limit OFFSET $offset"
        );
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } elseif ($table === 'summary') {
        $where  = [];
        $params = [];

        if ($role === 'employee') {
            $where[]  = 's.employee_id = ?';
            $params[] = $userId;
        } elseif ($role === 'supervisor') {
            $supDept = $_SESSION['department'] ?? '';
            if ($empId !== '') {
                $where[]  = 's.employee_id = ?';
                $params[] = (int)$empId;
            } elseif ($supDept) {
                $where[]  = 's.emp_dept = ?';
                $params[] = $supDept;
            }
        } elseif ($empId !== '') {
            $where[]  = 's.employee_id = ?';
            $params[] = (int)$empId;
        }

        if ($name !== '') {
            $where[]  = 's.emp_fullname LIKE ?';
            $params[] = "%{$name}%";
        }
        if ($dept !== '' && in_array($role, ['admin', 'supervisor'])) {
            $where[]  = 's.emp_dept = ?';
            $params[] = $dept;
        }
        if ($batchId !== '') {
            $where[]  = 's.batch_id = ?';
            $params[] = (int)$batchId;
        }
        if ($payrollPeriod !== '') {
            $parts = explode('|', $payrollPeriod);
            if (count($parts) === 2) {
                $where[]  = 's.payroll_start = ? AND s.payroll_end = ?';
                $params[] = trim($parts[0]);
                $params[] = trim($parts[1]);
            }
        } elseif ($month !== '' && $year !== '') {
            $where[]  = 'MONTH(s.payroll_start) = ? AND YEAR(s.payroll_start) = ?';
            $params[] = (int)$month;
            $params[] = (int)$year;
        } elseif ($year !== '') {
            $where[]  = 'YEAR(s.payroll_start) = ?';
            $params[] = (int)$year;
        }

        $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM fch_attendance_summary s $whereSQL");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare(
            "SELECT s.id, s.batch_id, s.employee_id, s.emp_fullname, s.emp_dept,
                    s.payroll_start, s.payroll_end,
                    s.reg_hrs, s.ot_hrs, s.nd_hrs, s.ot_nd_hrs,
                    s.reg_holiday_days, s.reg_holiday_hrs, s.reg_holiday_ot_hrs,
                    s.spec_holiday_hrs, s.spec_holiday_ot_hrs,
                    s.rd_hrs, s.rd_ot_hrs,
                    s.late_mins, s.leave_days,
                    s.adj_reg_hrs, s.adj_ot_hrs
             FROM fch_attendance_summary s
             $whereSQL
             ORDER BY s.payroll_start DESC, s.emp_fullname ASC
             LIMIT $limit OFFSET $offset"
        );
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } elseif ($table === 'punches') {
        $where  = [];
        $params = [];

        if ($role === 'employee') {
            $where[]  = 'p.employee_id = ?';
            $params[] = $userId;
        } elseif ($role === 'supervisor') {
            $supDept = $_SESSION['department'] ?? '';
            if ($empId !== '') {
                $where[]  = 'p.employee_id = ?';
                $params[] = (int)$empId;
            } elseif ($supDept) {
                $where[]  = 'e.emp_dept = ?';
                $params[] = $supDept;
            }
        } elseif ($empId !== '') {
            $where[]  = 'p.employee_id = ?';
            $params[] = (int)$empId;
        }

        // Join employees to get name/dept for display
        $joinSQL = "LEFT JOIN fch_employees e ON e.employee_id = p.employee_id";

        if ($name !== '') {
            $where[]  = 'e.emp_fullname LIKE ?';
            $params[] = "%{$name}%";
        }
        if ($dept !== '' && in_array($role, ['admin', 'supervisor'])) {
            $where[]  = 'e.emp_dept = ?';
            $params[] = $dept;
        }
        if ($date !== '') {
            $where[]  = 'DATE(p.punch_time) = ?';
            $params[] = $date;
        } elseif ($month !== '' && $year !== '') {
            $where[]  = 'MONTH(p.punch_time) = ? AND YEAR(p.punch_time) = ?';
            $params[] = (int)$month;
            $params[] = (int)$year;
        } elseif ($year !== '') {
            $where[]  = 'YEAR(p.punch_time) = ?';
            $params[] = (int)$year;
        }

        $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $pdo->prepare(
            "SELECT COUNT(*) FROM fch_punches p $joinSQL $whereSQL"
        );
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare(
            "SELECT p.id, p.employee_id, e.emp_fullname, e.emp_dept,
                    p.punch_time, p.punch_type, p.verifycode
             FROM fch_punches p
             $joinSQL
             $whereSQL
             ORDER BY p.punch_time DESC
             LIMIT $limit OFFSET $offset"
        );
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid table parameter']);
        exit;
    }

    echo json_encode([
        'data'       => $rows,
        'total'      => $total,
        'page'       => $page,
        'limit'      => $limit,
        'totalPages' => (int)ceil($total / $limit),
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;
