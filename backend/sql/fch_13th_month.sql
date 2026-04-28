-- 13th Month Pay Computation Table
-- Run once: mysql -u root family_care < sql/fch_13th_month.sql

CREATE TABLE IF NOT EXISTS `fch_13th_month` (
  `id`                     INT            NOT NULL AUTO_INCREMENT,
  `employee_id`            INT            NOT NULL,
  `emp_fullname`           VARCHAR(255)   NOT NULL DEFAULT '',
  `emp_dept`               VARCHAR(100)   DEFAULT NULL,
  `year`                   YEAR           NOT NULL,
  `total_basic_pay`        DECIMAL(12,2)  NOT NULL DEFAULT 0.00 COMMENT 'Sum of reg_pay for all payroll batches in the year',
  `thirteenth_month_pay`   DECIMAL(12,2)  NOT NULL DEFAULT 0.00 COMMENT 'total_basic_pay / 12',
  `is_released`            TINYINT(1)     NOT NULL DEFAULT 0,
  `released_at`            DATETIME       DEFAULT NULL,
  `created_at`             DATETIME       DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_emp_year` (`employee_id`, `year`),
  KEY `idx_year`           (`year`),
  KEY `idx_employee`       (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='13th Month Pay — one row per employee per calendar year';
