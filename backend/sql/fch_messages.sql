-- Unified message table for: DM (dm_minId_maxId), department (dept_DEPTNAME), or company-wide (company)
CREATE TABLE IF NOT EXISTS `fch_messages` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `room_id`      VARCHAR(150) NOT NULL,
  `sender_id`    INT          NOT NULL,
  `sender_name`  VARCHAR(255) NOT NULL,
  `sender_photo` VARCHAR(500) NULL DEFAULT NULL,
  `message`      TEXT         NOT NULL,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_msg_room` (`room_id`),
  KEY `idx_msg_sender` (`sender_id`),
  CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`)
    REFERENCES `fch_employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
