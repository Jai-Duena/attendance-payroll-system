USE family_care;

ALTER TABLE fch_attendance
  ADD COLUMN adj_date DATE DEFAULT NULL AFTER total_hrs,
  ADD COLUMN adj_time_in DATETIME DEFAULT NULL AFTER adj_date,
  ADD COLUMN adj_time_out DATETIME DEFAULT NULL AFTER adj_time_in,
  ADD COLUMN adj_shift_time_in DATETIME DEFAULT NULL AFTER adj_time_out,
  ADD COLUMN adj_shift_time_out DATETIME DEFAULT NULL AFTER adj_shift_time_in;

CREATE TABLE IF NOT EXISTS fch_attendance_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attendance_uniq_id INT NOT NULL,
  employee_id INT NOT NULL,
  emp_fullname VARCHAR(150),
  action ENUM('edit','delete') NOT NULL,
  field_changed VARCHAR(50),
  old_value TEXT,
  new_value TEXT,
  changed_by_user_id INT NOT NULL,
  changed_by_name VARCHAR(150),
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

SELECT 'Migration complete' AS result;
