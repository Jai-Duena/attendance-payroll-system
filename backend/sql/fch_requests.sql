-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:51 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_requests`
--

CREATE TABLE `fch_requests` (
  `uniq_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `mp_date` date DEFAULT NULL,
  `mp_time` time DEFAULT NULL,
  `mp_type` varchar(50) DEFAULT NULL,
  `mp_reason` text DEFAULT NULL,
  `encode_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `rqst_type` varchar(50) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `user` varchar(255) DEFAULT NULL,
  `fullname` varchar(255) DEFAULT NULL,
  `dept` varchar(255) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
  `sup_status` varchar(50) DEFAULT NULL,
  `sup_name` varchar(255) DEFAULT NULL,
  `admin_status` varchar(50) DEFAULT NULL,
  `admin_name` varchar(255) DEFAULT NULL,
  `cs_date` date DEFAULT NULL,
  `cs_new_shift` varchar(255) DEFAULT NULL,
  `cs_old_shift` varchar(50) DEFAULT NULL,
  `leave_type` varchar(100) DEFAULT NULL,
  `leave_from` date DEFAULT NULL,
  `leave_to` date DEFAULT NULL,
  `leave_total` int(11) DEFAULT NULL,
  `ot_date` date DEFAULT NULL,
  `ot_work_done` varchar(255) DEFAULT NULL,
  `ot_from` time DEFAULT NULL,
  `ot_to` time DEFAULT NULL,
  `ot_total` decimal(5,2) DEFAULT NULL,
  `wfh_date` date DEFAULT NULL,
  `wfh_start` time DEFAULT NULL,
  `wfh_end` time DEFAULT NULL,
  `wfh_activity` varchar(255) DEFAULT NULL,
  `wfh_output` varchar(255) DEFAULT NULL,
  `other_type` varchar(100) DEFAULT NULL,
  `other_from_date` date DEFAULT NULL,
  `other_to_date` date DEFAULT NULL,
  `other_total_date` int(11) DEFAULT NULL,
  `other_from_time` time DEFAULT NULL,
  `other_to_time` time DEFAULT NULL,
  `other_total_time` decimal(5,2) DEFAULT NULL,
  `manage_status` varchar(50) DEFAULT NULL,
  `manage_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_requests`
--

INSERT INTO `fch_requests` (`uniq_id`, `employee_id`, `mp_date`, `mp_time`, `mp_type`, `mp_reason`, `encode_date`, `rqst_type`, `reason`, `user`, `fullname`, `dept`, `position`, `status`, `sup_status`, `sup_name`, `admin_status`, `admin_name`, `cs_date`, `cs_new_shift`, `cs_old_shift`, `leave_type`, `leave_from`, `leave_to`, `leave_total`, `ot_date`, `ot_work_done`, `ot_from`, `ot_to`, `ot_total`, `wfh_date`, `wfh_start`, `wfh_end`, `wfh_activity`, `wfh_output`, `other_type`, `other_from_date`, `other_to_date`, `other_total_date`, `other_from_time`, `other_to_time`, `other_total_time`, `manage_status`, `manage_name`) VALUES
(1, 1, NULL, NULL, NULL, NULL, '2026-02-03 14:53:01', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-01', 'YES', '14:00:00', '17:00:00', 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 1, NULL, NULL, NULL, NULL, '2026-02-03 14:53:21', 'Leave', 'Vacation', 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, 'Rest Day', '2026-02-02', '2026-02-02', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 1, NULL, NULL, NULL, NULL, '2026-02-03 14:53:39', 'Change Shift', 'Vacation', 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', '2026-02-03', 'Shift 2: 2 PM to 10 PM', 'Shift 1: 6 AM to 2 PM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 3, NULL, NULL, NULL, NULL, '2026-02-03 15:01:00', 'Leave', 'Vacation', 'Employee', NULL, 'IT', NULL, 'Approved', 'Approved', 'Supervisor', 'Approved', 'Jai', NULL, NULL, NULL, 'Vacation Leave', '2026-02-08', '2026-02-10', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Pending', NULL),
(5, 2, NULL, NULL, NULL, NULL, '2026-02-04 14:47:55', 'Overtime', NULL, 'Supervisor', NULL, 'IT', NULL, 'Approved', 'Approved', 'Supervisor', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-13', 'YES', '06:00:00', '09:00:00', 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:12:27', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-08', 'YES', '22:00:00', '00:00:00', 22.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:14:26', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-06', 'YES', '22:00:00', '01:00:00', 21.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:18:08', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-11', 'YES', '22:00:00', '23:00:00', 1.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:25:37', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-06', 'YES', '22:00:00', '06:00:00', 16.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:31:05', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-17', 'YES', '22:30:00', '05:31:00', 16.98, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:42:21', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-12', 'YES', '22:00:00', '06:42:00', 15.30, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:45:50', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-10', 'YES', '22:45:00', '05:45:00', 17.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:49:15', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-08', 'YES', '22:49:00', '06:49:00', 16.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 1, NULL, NULL, NULL, NULL, '2026-02-04 18:38:04', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-09', 'YES', '21:37:00', '02:38:00', 18.98, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 1, NULL, NULL, NULL, NULL, '2026-02-04 18:41:10', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-22', 'YES', '14:40:00', '02:41:00', 11.98, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 1, NULL, NULL, NULL, NULL, '2026-02-04 18:48:49', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-27', 'YES', '21:48:00', '02:48:00', 19.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 1, NULL, NULL, NULL, NULL, '2026-02-05 14:29:19', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-01', 'YES', '14:00:00', '17:00:00', 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 1, NULL, NULL, NULL, NULL, '2026-02-05 17:43:00', 'Leave', 'Vacation', 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, 'Rest Day', '2026-02-13', '2026-02-13', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 1, NULL, NULL, NULL, NULL, '2026-02-05 17:43:18', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-13', 'YES', '15:43:00', '19:43:00', 4.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 2, NULL, NULL, NULL, NULL, '2026-02-05 17:49:28', 'Leave', 'Vacation', 'Supervisor', NULL, 'IT', NULL, 'Approved', 'Approved', 'Supervisor', 'Approved', 'Jai', NULL, NULL, NULL, 'Rest Day', '2026-02-13', '2026-02-13', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 1, NULL, NULL, NULL, NULL, '2026-02-05 18:13:19', 'Leave', 'Vacation', 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, 'Rest Day', '2026-02-11', '2026-02-11', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 1, '2026-02-05', '14:00:00', 'Time Out', NULL, '2026-02-06 08:23:18', 'Manual Punch', 'asd', 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 2, '2026-02-12', '06:25:00', 'Time Out', NULL, '2026-02-06 08:25:07', 'Manual Punch', 'asd', 'Supervisor', NULL, 'IT', NULL, 'Rejected', 'Approved', 'Supervisor', 'Rejected', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_requests`
--
ALTER TABLE `fch_requests`
  ADD PRIMARY KEY (`uniq_id`),
  ADD KEY `idx_employee_id` (`employee_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_requests`
--
ALTER TABLE `fch_requests`
  MODIFY `uniq_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
