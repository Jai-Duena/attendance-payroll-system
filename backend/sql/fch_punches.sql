-- phpMyAdmin SQL Dump
-- Table: fch_punches
-- Replaces att_punches. Stores raw biometric + manual punches.
-- device_user_id is set for device-sourced punches, NULL for manual.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------
-- Table structure for table `fch_punches`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `fch_punches` (
  `id`              int(11)      NOT NULL AUTO_INCREMENT,
  `employee_id`     int(11)      DEFAULT NULL COMMENT 'NULL for unmapped device users',
  `punch_time`      datetime     NOT NULL,
  `device_user_id`  varchar(64)  DEFAULT NULL COMMENT 'Raw user ID from ZKTeco device; NULL for manual punches',
  `punch_type`      varchar(64)  DEFAULT NULL COMMENT 'Time In / Time Out / Break Out / Break In / OT In / OT Out',
  `verifycode`      varchar(64)  DEFAULT NULL COMMENT 'Fingerprint / Face / Card / Password / Hand',
  `operator`        varchar(64)  DEFAULT NULL,
  `operator_reason` varchar(255) DEFAULT NULL,
  `operator_time`   datetime     DEFAULT NULL,
  `annotation`      varchar(255) DEFAULT NULL,
  `processed`       tinyint(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  -- Dedup by device source (device_user_id is always set for device punches)
  UNIQUE KEY `uq_fch_dev_punch`  (`device_user_id`, `punch_time`),
  -- Dedup for manual/mapped punches (employee_id + punch_time); NULLs are excluded by MySQL
  UNIQUE KEY `uq_fch_emp_punch`  (`employee_id`, `punch_time`),
  KEY `idx_fch_punch_emp`        (`employee_id`),
  KEY `idx_fch_punch_time`       (`punch_time`),
  KEY `idx_fch_punch_processed`  (`processed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Raw attendance punches — populated by bio_sync.py (device) and manual requests';

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
