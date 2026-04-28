-- --------------------------------------------------------
-- Table structure for table `fch_attendance_audit`
-- Tracks edits and deletes made to fch_attendance records.
-- --------------------------------------------------------

CREATE TABLE `fch_attendance_audit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `attendance_uniq_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) DEFAULT NULL,
  `action` enum('edit','delete') NOT NULL,
  `field_changed` varchar(50) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `changed_by_user_id` int(11) NOT NULL,
  `changed_by_name` varchar(150) DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_attendance_uniq_id` (`attendance_uniq_id`),
  KEY `idx_employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
