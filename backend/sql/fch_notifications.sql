CREATE TABLE IF NOT EXISTS `fch_notifications` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `employee_id`  INT          NOT NULL,
  `type`         VARCHAR(60)  NOT NULL DEFAULT 'general',
  `title`        VARCHAR(255) NOT NULL,
  `message`      TEXT         NOT NULL,
  `reference_id` VARCHAR(100) NULL DEFAULT NULL,
  `is_read`      TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_employee` (`employee_id`),
  KEY `idx_notif_read`     (`is_read`),
  CONSTRAINT `fk_notif_emp` FOREIGN KEY (`employee_id`)
    REFERENCES `fch_employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
