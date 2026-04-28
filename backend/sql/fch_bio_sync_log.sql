-- Table: fch_bio_sync_log
-- One row per bio_sync.py run — used by the monitoring page.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;

CREATE TABLE IF NOT EXISTS `fch_bio_sync_log` (
  `id`             int(11)       NOT NULL AUTO_INCREMENT,
  `status`         varchar(16)   NOT NULL COMMENT 'success | error | warning',
  `message`        varchar(1000) DEFAULT NULL,
  `users_synced`   int(11)       NOT NULL DEFAULT 0,
  `punches_synced` int(11)       NOT NULL DEFAULT 0,
  `created_at`     datetime      NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Run history for bio_sync.py — newest rows first, trimmed to 500';

-- Table: fch_bio_settings
-- Device connection settings editable from the Biometric admin page.

CREATE TABLE IF NOT EXISTS `fch_bio_settings` (
  `id`            int(11)      NOT NULL AUTO_INCREMENT,
  `setting_key`   varchar(64)  NOT NULL,
  `setting_value` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bio_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Biometric device settings (IP, port, timeout, etc.)';

-- Seed defaults (INSERT IGNORE so re-running is safe)
INSERT IGNORE INTO `fch_bio_settings` (`setting_key`, `setting_value`) VALUES
  ('device_ip',              '192.168.1.201'),
  ('device_port',            '4370'),
  ('device_timeout',         '10'),
  ('sync_interval_minutes',  '2'),
  ('chain_web_sync',         '1');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
