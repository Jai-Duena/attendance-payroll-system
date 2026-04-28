-- ============================================================
-- family_care — Performance Indexes
-- Run after all tables have been created.
-- Uses CREATE INDEX IF NOT EXISTS (safe to re-run).
-- ============================================================

-- --------------------------------------------------------
-- fch_attendance
-- Most queried by employee + date range
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_att_employee_id  ON fch_attendance (employee_id);
CREATE INDEX IF NOT EXISTS idx_att_date         ON fch_attendance (date);
CREATE INDEX IF NOT EXISTS idx_att_emp_date     ON fch_attendance (employee_id, date);

-- --------------------------------------------------------
-- fch_attendance_summary
-- Queried by employee + payroll period
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_attsum_employee_id     ON fch_attendance_summary (employee_id);
CREATE INDEX IF NOT EXISTS idx_attsum_period          ON fch_attendance_summary (payroll_start, payroll_end);
CREATE INDEX IF NOT EXISTS idx_attsum_emp_period      ON fch_attendance_summary (employee_id, payroll_start, payroll_end);
CREATE INDEX IF NOT EXISTS idx_attsum_batch           ON fch_attendance_summary (batch_id);

-- --------------------------------------------------------
-- att_punches
-- Queried by employee + time range when syncing biometrics
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_punch_employee_id  ON att_punches (employee_id);
CREATE INDEX IF NOT EXISTS idx_punch_time         ON att_punches (punch_time);
CREATE INDEX IF NOT EXISTS idx_punch_emp_time     ON att_punches (employee_id, punch_time);
CREATE INDEX IF NOT EXISTS idx_punch_processed    ON att_punches (processed);

-- --------------------------------------------------------
-- fch_requests
-- Already has idx_employee_id; add status for approval filters
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_req_status         ON fch_requests (status);
CREATE INDEX IF NOT EXISTS idx_req_emp_status     ON fch_requests (employee_id, status);
CREATE INDEX IF NOT EXISTS idx_req_type           ON fch_requests (rqst_type);
CREATE INDEX IF NOT EXISTS idx_req_encode_date    ON fch_requests (encode_date);

-- --------------------------------------------------------
-- fch_employees
-- Add dept + acc_type for role/department filtering
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_emp_dept           ON fch_employees (emp_dept);
CREATE INDEX IF NOT EXISTS idx_emp_acc_type       ON fch_employees (emp_acc_type);
CREATE INDEX IF NOT EXISTS idx_emp_emptype        ON fch_employees (emp_emptype);
CREATE INDEX IF NOT EXISTS idx_emp_dept_acctype   ON fch_employees (emp_dept, emp_acc_type);

-- --------------------------------------------------------
-- fch_payroll_results
-- Queried by date range + status
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pr_period          ON fch_payroll_results (payroll_start, payroll_end);
CREATE INDEX IF NOT EXISTS idx_pr_status          ON fch_payroll_results (status);
CREATE INDEX IF NOT EXISTS idx_pr_batch           ON fch_payroll_results (batch_id);

-- --------------------------------------------------------
-- fch_payroll_summary
-- Queried by employee + batch + period
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ps_employee_id     ON fch_payroll_summary (employee_id);
CREATE INDEX IF NOT EXISTS idx_ps_batch           ON fch_payroll_summary (batch_id);
CREATE INDEX IF NOT EXISTS idx_ps_emp_batch       ON fch_payroll_summary (employee_id, batch_id);

-- --------------------------------------------------------
-- fch_bulletin_board
-- Already has employee_id; add created_at for sorted display
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bb_created_at      ON fch_bulletin_board (created_at);
CREATE INDEX IF NOT EXISTS idx_bb_acc_type        ON fch_bulletin_board (emp_acc_type);

-- --------------------------------------------------------
-- fch_user_notes
-- Queried by employee
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notes_employee_id  ON fch_user_notes (employee_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at   ON fch_user_notes (created_at);

-- --------------------------------------------------------
-- fch_late / fch_ot / fch_nd / fch_restday / fch_reg_hrs
-- All are queried by employee_id + date range for payroll
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_late_emp_date      ON fch_late (employee_id, late_date);
CREATE INDEX IF NOT EXISTS idx_ot_emp_date        ON fch_ot (employee_id, ot_date);
CREATE INDEX IF NOT EXISTS idx_nd_emp_date        ON fch_nd (employee_id, nd_date);
CREATE INDEX IF NOT EXISTS idx_restday_emp_date   ON fch_restday (employee_id, rest_date);
CREATE INDEX IF NOT EXISTS idx_reghrs_emp_date    ON fch_reg_hrs (employee_id, reg_date);
