-- ============================================================
-- Payroll Module Migration
-- Adds:  is_archived / archived_at / archived_from_id columns
--        to the 4 computation tables
-- Creates fch_payroll_audit table
-- Run once against the family_care database
-- ============================================================

-- ── fch_attendance_summary ────────────────────────────────────────────────────
ALTER TABLE `fch_attendance_summary`
  ADD COLUMN `is_archived`      TINYINT(1)  NOT NULL DEFAULT 0  AFTER `adj_at`,
  ADD COLUMN `archived_at`      DATETIME             DEFAULT NULL AFTER `is_archived`,
  ADD COLUMN `archived_from_id` INT                  DEFAULT NULL AFTER `archived_at`,
  ADD INDEX  `idx_as_archived`  (`is_archived`);

-- ── fch_earnings_computation ─────────────────────────────────────────────────
ALTER TABLE `fch_earnings_computation`
  ADD COLUMN `is_archived`      TINYINT(1)  NOT NULL DEFAULT 0  AFTER `adj_at`,
  ADD COLUMN `archived_at`      DATETIME             DEFAULT NULL AFTER `is_archived`,
  ADD COLUMN `archived_from_id` INT                  DEFAULT NULL AFTER `archived_at`,
  ADD INDEX  `idx_ec_archived`  (`is_archived`);

-- ── fch_deductions_computation ───────────────────────────────────────────────
ALTER TABLE `fch_deductions_computation`
  ADD COLUMN `is_archived`      TINYINT(1)  NOT NULL DEFAULT 0  AFTER `adj_at`,
  ADD COLUMN `archived_at`      DATETIME             DEFAULT NULL AFTER `is_archived`,
  ADD COLUMN `archived_from_id` INT                  DEFAULT NULL AFTER `archived_at`,
  ADD INDEX  `idx_dc_archived`  (`is_archived`);

-- ── fch_tax_deduction ────────────────────────────────────────────────────────
ALTER TABLE `fch_tax_deduction`
  ADD COLUMN `is_archived`      TINYINT(1)  NOT NULL DEFAULT 0  AFTER `adj_at`,
  ADD COLUMN `archived_at`      DATETIME             DEFAULT NULL AFTER `is_archived`,
  ADD COLUMN `archived_from_id` INT                  DEFAULT NULL AFTER `archived_at`,
  ADD INDEX  `idx_td_archived`  (`is_archived`);

-- ── fch_payroll_audit ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `fch_payroll_audit` (
  `id`                  INT          NOT NULL AUTO_INCREMENT,
  `batch_id`            INT          NOT NULL,
  `employee_id`         INT          NOT NULL,
  `emp_fullname`        VARCHAR(255) DEFAULT NULL,
  `table_name`          VARCHAR(100) NOT NULL,
  `field_name`          VARCHAR(100) NOT NULL,
  `old_value`           DECIMAL(15,4) DEFAULT NULL,
  `new_value`           DECIMAL(15,4) DEFAULT NULL,
  `action`              VARCHAR(50)  NOT NULL DEFAULT 'adj_edit',
  `changed_by_user_id`  INT          DEFAULT NULL,
  `changed_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes`               TEXT         DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_pa_batch_emp`   (`batch_id`, `employee_id`),
  INDEX `idx_pa_changed_at`  (`changed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ── fch_payroll_summary  (run once — adds archive support) ───────────────────
ALTER TABLE `fch_payroll_summary`
  ADD COLUMN IF NOT EXISTS `is_archived`      TINYINT(1) NOT NULL DEFAULT 0   AFTER `days_worked`,
  ADD COLUMN IF NOT EXISTS `archived_at`      DATETIME            DEFAULT NULL AFTER `is_archived`,
  ADD COLUMN IF NOT EXISTS `archived_from_id` INT                 DEFAULT NULL AFTER `archived_at`;

-- Add index only if it doesn't already exist (MariaDB >= 10.1.4 supports IF NOT EXISTS on index)
ALTER TABLE `fch_payroll_summary`
  ADD INDEX IF NOT EXISTS `idx_ps_archived` (`is_archived`);
