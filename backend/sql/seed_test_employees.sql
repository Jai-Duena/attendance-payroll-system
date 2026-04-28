-- ============================================================
-- Seed: 24 Test Employees (uniq_id / employee_id 12–35 + 34,35 for Ana/Ben)
-- 20 regular employees + 1 supervisor per new department:
--   Surgery (30), ICU (31), Pharmacy (32), Radiology (33)
--   Nursing (28), HR (16), Finance (27) already included above.
-- Password for all: 'Family Care'  (plain-text test accounts)
-- ============================================================

SET SQL_MODE   = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone  = "+08:00";

-- ============================================================
-- 0. Cleanup — remove any previously inserted test rows
--    Safe to run multiple times.
-- ============================================================
DELETE FROM `fch_employees_shift` WHERE `employee_id` IN (12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35);
DELETE FROM `fch_employees`       WHERE `uniq_id`     IN (12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35);

-- ============================================================
-- 1. fch_employees
-- ============================================================

INSERT INTO `fch_employees`
  (`uniq_id`, `employee_id`,
   `emp_fname`, `emp_lname`, `emp_mname`, `emp_fullname`,
   `emp_dept`, `emp_position`, `emp_datehire`, `emp_emptype`, `emp_shift`,
   `emp_sss`, `emp_pagibig`, `emp_philhealth`,
   `emp_username`, `emp_email`, `emp_pass`, `emp_acc_type`,
   `emp_sign`, `emp_tin`, `emp_dailyrate`, `emp_bank`,
   `emp_created_at`, `emp_updated_at`,
   `emp_email_pending`, `emp_email_token`, `emp_email_token_expiry`)
VALUES

-- ── ID 34 · Ana Santos · Nursing · Shift 1 · ₱750 · Regular ─────────────
(34, 34,
 'Ana', 'Santos', 'Maria', 'Santos, Ana M',
 'Nursing', 'Staff Nurse', '2023-03-01', 'Regular', 'Shift 1: 6 AM to 2 PM',
 '10-2000001-0', '1001-2001-3001', '20-200000001-0',
 'ana.santos', 'ana.santos@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-001', 750, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 35 · Ben Reyes · Nursing · Shift 2 · ₱750 · Regular ──────────────
(35, 35,
 'Ben', 'Reyes', 'Carlos', 'Reyes, Ben C',
 'Nursing', 'Staff Nurse', '2023-06-15', 'Regular', 'Shift 2: 2 PM to 10 PM',
 '10-2000002-0', '1001-2001-3002', '20-200000002-0',
 'ben.reyes', 'ben.reyes@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-002', 750, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 12 · Carla Mendoza · Nursing · Shift 3 · ₱900 · Regular ──────────
(12, 12,
 'Carla', 'Mendoza', 'Rose', 'Mendoza, Carla R',
 'Nursing', 'Senior Nurse', '2022-11-01', 'Regular', 'Shift 3: 10 PM to 6 AM',
 '10-2000003-0', '1001-2001-3003', '20-200000003-0',
 'carla.mendoza', 'carla.mendoza@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-003', 900, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 13 · Diego Torres · Surgery · Shift 4 · ₱1300 · Regular ──────────
(13, 13,
 'Diego', 'Torres', 'Antonio', 'Torres, Diego A',
 'Surgery', 'Surgical Tech', '2023-01-10', 'Regular', 'Shift 4: 6 AM to 6 PM',
 '10-2000004-0', '1001-2001-3004', '20-200000004-0',
 'diego.torres', 'diego.torres@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-004', 1300, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 14 · Elena Ramos · ICU · Shift 5 · ₱1000 · Regular ───────────────
(14, 14,
 'Elena', 'Ramos', 'Beatriz', 'Ramos, Elena B',
 'ICU', 'ICU Nurse', '2023-04-01', 'Regular', 'Shift 5: 6 PM to 6 AM',
 '10-2000005-0', '1001-2001-3005', '20-200000005-0',
 'elena.ramos', 'elena.ramos@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-005', 1000, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 15 · Felix Cruz · Pharmacy · Shift 1 · ₱850 · Probationary ───────
(15, 15,
 'Felix', 'Cruz', 'Jose', 'Cruz, Felix J',
 'Pharmacy', 'Pharmacist', '2025-08-01', 'Probationary', 'Shift 1: 6 AM to 2 PM',
 '10-2000006-0', '1001-2001-3006', '20-200000006-0',
 'felix.cruz', 'felix.cruz@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-006', 850, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 16 · Grace Lim · HR · Shift 1 · ₱800 · Regular · SUPERVISOR ──────
(16, 16,
 'Grace', 'Lim', 'Patricia', 'Lim, Grace P',
 'HR', 'HR Officer', '2022-05-15', 'Regular', 'Shift 1: 6 AM to 2 PM',
 '10-2000007-0', '1001-2001-3007', '20-200000007-0',
 'grace.lim', 'grace.lim@familycare.ph', 'Family Care', 'Supervisor',
 NULL, '200-000-007', 800, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 17 · Henry Tan · Finance · Shift 2 · ₱950 · Regular ──────────────
(17, 17,
 'Henry', 'Tan', 'Karlo', 'Tan, Henry K',
 'Finance', 'Accountant', '2023-02-01', 'Regular', 'Shift 2: 2 PM to 10 PM',
 '10-2000008-0', '1001-2001-3008', '20-200000008-0',
 'henry.tan', 'henry.tan@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-008', 950, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 18 · Iris Dela Cruz · Surgery · Shift 4 · ₱1100 · Regular ─────────
(18, 18,
 'Iris', 'Dela Cruz', 'Grace', 'Dela Cruz, Iris G',
 'Surgery', 'OR Nurse', '2022-09-01', 'Regular', 'Shift 4: 6 AM to 6 PM',
 '10-2000009-0', '1001-2001-3009', '20-200000009-0',
 'iris.delacruz', 'iris.delacruz@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-009', 1100, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 19 · Jay Villanueva · ICU · Shift 5 · ₱1200 · Regular ────────────
(19, 19,
 'Jay', 'Villanueva', 'Andres', 'Villanueva, Jay A',
 'ICU', 'ICU Specialist', '2022-07-01', 'Regular', 'Shift 5: 6 PM to 6 AM',
 '10-2000010-0', '1001-2001-3010', '20-200000010-0',
 'jay.villanueva', 'jay.villanueva@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-010', 1200, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 20 · Karen Ong · Nursing · Shift 1 · ₱700 · Probationary ─────────
(20, 20,
 'Karen', 'Ong', 'Michelle', 'Ong, Karen M',
 'Nursing', 'Staff Nurse', '2025-10-01', 'Probationary', 'Shift 1: 6 AM to 2 PM',
 '10-2000011-0', '1001-2001-3011', '20-200000011-0',
 'karen.ong', 'karen.ong@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-011', 700, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 21 · Luis Bautista · IT · Shift 2 · ₱650 · Regular ───────────────
(21, 21,
 'Luis', 'Bautista', 'Eduardo', 'Bautista, Luis E',
 'IT', 'IT Support', '2023-08-01', 'Regular', 'Shift 2: 2 PM to 10 PM',
 '10-2000012-0', '1001-2001-3012', '20-200000012-0',
 'luis.bautista', 'luis.bautista@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-012', 650, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 22 · Maria Fernandez · Admin · Shift 1 · ₱800 · Regular ──────────
(22, 22,
 'Maria', 'Fernandez', 'Clara', 'Fernandez, Maria C',
 'Admin', 'Admin Officer', '2023-05-01', 'Regular', 'Shift 1: 6 AM to 2 PM',
 '10-2000013-0', '1001-2001-3013', '20-200000013-0',
 'maria.fernandez', 'maria.fernandez@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-013', 800, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 23 · Noel Castillo · Radiology · Shift 3 · ₱1500 · Regular ────────
(23, 23,
 'Noel', 'Castillo', 'Rodrigo', 'Castillo, Noel R',
 'Radiology', 'Radiologist', '2022-12-01', 'Regular', 'Shift 3: 10 PM to 6 AM',
 '10-2000014-0', '1001-2001-3014', '20-200000014-0',
 'noel.castillo', 'noel.castillo@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-014', 1500, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 24 · Olivia Santos · Pharmacy · Shift 1 · ₱500 · Intern ──────────
(24, 24,
 'Olivia', 'Santos', 'Frances', 'Santos, Olivia F',
 'Pharmacy', 'Pharmacy Aide', '2026-01-15', 'Intern', 'Shift 1: 6 AM to 2 PM',
 '10-2000015-0', '1001-2001-3015', '20-200000015-0',
 'olivia.santos', 'olivia.santos@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-015', 500, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 25 · Paolo Aquino · HR · Shift 2 · ₱600 · Regular ────────────────
(25, 25,
 'Paolo', 'Aquino', 'Jose', 'Aquino, Paolo J',
 'HR', 'HR Assistant', '2024-03-01', 'Regular', 'Shift 2: 2 PM to 10 PM',
 '10-2000016-0', '1001-2001-3016', '20-200000016-0',
 'paolo.aquino', 'paolo.aquino@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-016', 600, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 26 · Queenie Soriano · ICU · Shift 5 · ₱1000 · Regular ───────────
(26, 26,
 'Queenie', 'Soriano', 'Luz', 'Soriano, Queenie L',
 'ICU', 'ICU Nurse', '2023-11-01', 'Regular', 'Shift 5: 6 PM to 6 AM',
 '10-2000017-0', '1001-2001-3017', '20-200000017-0',
 'queenie.soriano', 'queenie.soriano@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-017', 1000, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 27 · Ramon Garcia · Finance · Shift 2 · ₱900 · Regular · SUPERVISOR
(27, 27,
 'Ramon', 'Garcia', 'Fernando', 'Garcia, Ramon F',
 'Finance', 'Finance Supervisor', '2022-04-01', 'Regular', 'Shift 2: 2 PM to 10 PM',
 '10-2000018-0', '1001-2001-3018', '20-200000018-0',
 'ramon.garcia', 'ramon.garcia@familycare.ph', 'Family Care', 'Supervisor',
 NULL, '200-000-018', 900, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 28 · Sheila Navarro · Nursing · Shift 1 · ₱1100 · Regular · SUPERVISOR
(28, 28,
 'Sheila', 'Navarro', 'Carmen', 'Navarro, Sheila C',
 'Nursing', 'Head Nurse', '2021-08-01', 'Regular', 'Shift 1: 6 AM to 2 PM',
 '10-2000019-0', '1001-2001-3019', '20-200000019-0',
 'sheila.navarro', 'sheila.navarro@familycare.ph', 'Family Care', 'Supervisor',
 NULL, '200-000-019', 1100, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 29 · Tomas Pascual · Surgery · Shift 4 · ₱2000 · Regular ─────────
(29, 29,
 'Tomas', 'Pascual', 'Victor', 'Pascual, Tomas V',
 'Surgery', 'Surgeon', '2021-05-01', 'Regular', 'Shift 4: 6 AM to 6 PM',
 '10-2000020-0', '1001-2001-3020', '20-200000020-0',
 'tomas.pascual', 'tomas.pascual@familycare.ph', 'Family Care', 'Employee',
 NULL, '200-000-020', 2000, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 30 · Vincent Reyes · Surgery · Shift 4 · ₱2500 · Regular · SUPERVISOR
(30, 30,
 'Vincent', 'Reyes', 'Orlando', 'Reyes, Vincent O',
 'Surgery', 'Head Surgeon', '2020-11-01', 'Regular', 'Shift 4: 6 AM to 6 PM',
 '10-2000021-0', '1001-2001-3021', '20-200000021-0',
 'vincent.reyes', 'vincent.reyes@familycare.ph', 'Family Care', 'Supervisor',
 NULL, '200-000-021', 2500, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 31 · Wendy Park · ICU · Shift 5 · ₱1800 · Regular · SUPERVISOR ───
(31, 31,
 'Wendy', 'Park', 'Soo', 'Park, Wendy S',
 'ICU', 'ICU Head Nurse', '2020-07-01', 'Regular', 'Shift 5: 6 PM to 6 AM',
 '10-2000022-0', '1001-2001-3022', '20-200000022-0',
 'wendy.park', 'wendy.park@familycare.ph', 'Family Care', 'Supervisor',
 NULL, '200-000-022', 1800, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 32 · Xavier Gomez · Pharmacy · Shift 1 · ₱1500 · Regular · SUPERVISOR
(32, 32,
 'Xavier', 'Gomez', 'Ignacio', 'Gomez, Xavier I',
 'Pharmacy', 'Chief Pharmacist', '2021-02-01', 'Regular', 'Shift 1: 6 AM to 2 PM',
 '10-2000023-0', '1001-2001-3023', '20-200000023-0',
 'xavier.gomez', 'xavier.gomez@familycare.ph', 'Family Care', 'Supervisor',
 NULL, '200-000-023', 1500, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL),

-- ── ID 33 · Yvonne Castro · Radiology · Shift 3 · ₱2000 · Regular · SUPERVISOR
(33, 33,
 'Yvonne', 'Castro', 'Nicole', 'Castro, Yvonne N',
 'Radiology', 'Head Radiologist', '2020-09-01', 'Regular', 'Shift 3: 10 PM to 6 AM',
 '10-2000024-0', '1001-2001-3024', '20-200000024-0',
 'yvonne.castro', 'yvonne.castro@familycare.ph', 'Family Care', 'Supervisor',
 NULL, '200-000-024', 2000, NULL,
 '2026-03-01 08:00:00', '2026-03-01 08:00:00',
 NULL, NULL, NULL);

-- Update AUTO_INCREMENT
ALTER TABLE `fch_employees` AUTO_INCREMENT = 36;


-- ============================================================
-- 2. fch_employees_shift
--    One default (date=NULL) row per employee.
--    Shift times:
--      Shift 1 → 06:00–14:00  (IDs: 10,15,16,20,22,24,28,32)
--      Shift 2 → 14:00–22:00  (IDs: 11,17,21,25,27)
--      Shift 3 → 22:00–06:00  (IDs: 12,23,33)
--      Shift 4 → 06:00–18:00  (IDs: 13,18,29,30)
--      Shift 5 → 18:00–06:00  (IDs: 14,19,26,31)
-- ============================================================

INSERT INTO `fch_employees_shift` (`id`, `employee_id`, `shift_start`, `shift_end`, `date`)
VALUES
-- Shift 1
(34, 34, '06:00:00', '14:00:00', NULL),
(11, 15, '06:00:00', '14:00:00', NULL),
(12, 16, '06:00:00', '14:00:00', NULL),
(13, 20, '06:00:00', '14:00:00', NULL),
(14, 22, '06:00:00', '14:00:00', NULL),
(15, 24, '06:00:00', '14:00:00', NULL),
(16, 28, '06:00:00', '14:00:00', NULL),
(17, 32, '06:00:00', '14:00:00', NULL),
-- Shift 2
(18, 35, '14:00:00', '22:00:00', NULL),
(19, 17, '14:00:00', '22:00:00', NULL),
(20, 21, '14:00:00', '22:00:00', NULL),
(21, 25, '14:00:00', '22:00:00', NULL),
(22, 27, '14:00:00', '22:00:00', NULL),
-- Shift 3
(23, 12, '22:00:00', '06:00:00', NULL),
(24, 23, '22:00:00', '06:00:00', NULL),
(25, 33, '22:00:00', '06:00:00', NULL),
-- Shift 4
(26, 13, '06:00:00', '18:00:00', NULL),
(27, 18, '06:00:00', '18:00:00', NULL),
(28, 29, '06:00:00', '18:00:00', NULL),
(29, 30, '06:00:00', '18:00:00', NULL),
-- Shift 5
(30, 14, '18:00:00', '06:00:00', NULL),
(31, 19, '18:00:00', '06:00:00', NULL),
(32, 26, '18:00:00', '06:00:00', NULL),
(33, 31, '18:00:00', '06:00:00', NULL);

-- Update AUTO_INCREMENT
ALTER TABLE `fch_employees_shift` AUTO_INCREMENT = 36;
