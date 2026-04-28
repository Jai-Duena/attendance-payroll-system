-- Table: fch_bio_users
-- Stores users fetched from the ZKTeco biometric device.
-- employee_id is set once the device user is mapped to an fch_employees row.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;

CREATE TABLE IF NOT EXISTS `fch_bio_users` (
  `id`             int(11)      NOT NULL AUTO_INCREMENT,
  `uid`            int(11)      NOT NULL  COMMENT 'Device internal slot number',
  `device_user_id` varchar(64)  NOT NULL  COMMENT 'User-ID string from device (used as FK into fch_punches.device_user_id)',
  `name`           varchar(128) DEFAULT NULL,
  `privilege`      tinyint(1)   NOT NULL DEFAULT 0 COMMENT '0=user 2=enroller 6=manager 14=admin',
  `card`           varchar(64)  DEFAULT NULL,
  `employee_id`    int(11)      DEFAULT NULL COMMENT 'Mapped to fch_employees.employee_id; NULL = not yet mapped',
  `last_synced_at` datetime     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bio_device_user_id` (`device_user_id`),
  KEY `idx_bio_employee_id`          (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Biometric device users — synced by bio_sync.py';

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
