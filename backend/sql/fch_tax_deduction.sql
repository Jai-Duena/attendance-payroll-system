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
-- Table structure for table `fch_tax_deduction`
--

CREATE TABLE `fch_tax_deduction` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `payroll_period` varchar(50) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `taxable_income` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax_deduct` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `adj_taxable_income` decimal(10,2) DEFAULT NULL,
  `adj_tax_deduct` decimal(10,2) DEFAULT NULL,
  `adj_total` decimal(10,2) DEFAULT NULL,
  `adj_reason` text DEFAULT NULL,
  `adj_by` int(11) DEFAULT NULL,
  `adj_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_tax_deduction`
--

INSERT INTO `fch_tax_deduction` (`id`, `batch_id`, `payroll_period`, `employee_id`, `emp_fullname`, `emp_dept`, `taxable_income`, `tax_deduct`, `total`, `created_at`, `adj_taxable_income`, `adj_tax_deduct`, `adj_total`, `adj_reason`, `adj_by`, `adj_at`) VALUES
(1, 13, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4295.67, 0.00, 4295.67, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(2, 13, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 6991.60, 0.00, 6991.60, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(3, 13, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', -790.00, 0.00, -790.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(4, 13, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', -790.00, 0.00, -790.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(5, 13, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', -790.00, 0.00, -790.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(6, 13, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', -790.00, 0.00, -790.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(7, 13, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 12150.00, 0.00, 12150.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(8, 13, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', -790.00, 0.00, -790.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(9, 13, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', -790.00, 0.00, -790.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(10, 14, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4295.67, 0.00, 4295.67, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(11, 14, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 6991.60, 0.00, 6991.60, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(12, 14, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(13, 14, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(14, 14, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(15, 14, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(16, 14, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 12150.00, 0.00, 12150.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(17, 14, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(18, 14, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(19, 17, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 5642.42, 0.00, 5642.42, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(20, 17, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 8699.55, 0.00, 8699.55, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(21, 17, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 240.00, 0.00, 240.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(22, 17, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 240.00, 0.00, 240.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(23, 17, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 240.00, 0.00, 240.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(24, 17, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 240.00, 0.00, 240.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(25, 17, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 14480.00, 0.00, 14480.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(26, 17, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 240.00, 0.00, 240.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(27, 17, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 240.00, 0.00, 240.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(28, 18, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 5642.42, 0.00, 5642.42, '2026-02-07 16:45:04', NULL, NULL, NULL, NULL, NULL, NULL),
(29, 18, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 8699.55, 0.00, 8699.55, '2026-02-07 16:45:04', NULL, NULL, NULL, NULL, NULL, NULL),
(30, 18, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 14480.00, 0.00, 14480.00, '2026-02-07 16:45:04', NULL, NULL, NULL, NULL, NULL, NULL),
(31, 19, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 5642.42, 0.00, 5642.42, '2026-02-07 16:55:36', NULL, NULL, NULL, NULL, NULL, NULL),
(32, 19, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 8699.55, 0.00, 8699.55, '2026-02-07 16:55:36', NULL, NULL, NULL, NULL, NULL, NULL),
(33, 19, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 14480.00, 0.00, 14480.00, '2026-02-07 16:55:36', NULL, NULL, NULL, NULL, NULL, NULL),
(34, 20, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 5642.42, 0.00, 5642.42, '2026-02-07 16:56:21', NULL, NULL, NULL, NULL, NULL, NULL),
(35, 20, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 8699.55, 0.00, 8699.55, '2026-02-07 16:56:21', NULL, NULL, NULL, NULL, NULL, NULL),
(36, 20, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 14480.00, 0.00, 14480.00, '2026-02-07 16:56:21', NULL, NULL, NULL, NULL, NULL, NULL),
(37, 21, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 6266.65, 0.00, 6266.65, '2026-02-07 16:57:40', NULL, NULL, NULL, NULL, NULL, NULL),
(38, 21, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 4127.63, 23389.87, '2026-02-07 16:57:40', NULL, NULL, NULL, NULL, NULL, NULL),
(39, 21, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 12890.60, 42187.40, '2026-02-07 16:57:40', NULL, NULL, NULL, NULL, NULL, NULL),
(40, 22, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 6266.65, 0.00, 6266.65, '2026-02-08 19:43:32', NULL, NULL, NULL, NULL, NULL, NULL),
(41, 22, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-08 19:43:32', NULL, NULL, NULL, NULL, NULL, NULL),
(42, 22, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-08 19:43:32', NULL, NULL, NULL, NULL, NULL, NULL),
(43, 23, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 6266.65, 0.00, 6266.65, '2026-02-08 19:44:14', NULL, NULL, NULL, NULL, NULL, NULL),
(44, 23, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-08 19:44:14', NULL, NULL, NULL, NULL, NULL, NULL),
(45, 23, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-08 19:44:14', NULL, NULL, NULL, NULL, NULL, NULL),
(46, 24, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 6266.65, 0.00, 6266.65, '2026-02-09 06:24:26', NULL, NULL, NULL, NULL, NULL, NULL),
(47, 24, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-09 06:24:26', NULL, NULL, NULL, NULL, NULL, NULL),
(48, 24, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-09 06:24:26', NULL, NULL, NULL, NULL, NULL, NULL),
(49, 26, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-09 18:52:36', NULL, NULL, NULL, NULL, NULL, NULL),
(50, 26, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-09 18:52:36', NULL, NULL, NULL, NULL, NULL, NULL),
(51, 26, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-09 18:52:36', NULL, NULL, NULL, NULL, NULL, NULL),
(52, 27, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-09 18:57:35', NULL, NULL, NULL, NULL, NULL, NULL),
(53, 27, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-09 18:57:35', NULL, NULL, NULL, NULL, NULL, NULL),
(54, 27, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-09 18:57:35', NULL, NULL, NULL, NULL, NULL, NULL),
(55, 28, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 07:33:15', NULL, NULL, NULL, NULL, NULL, NULL),
(56, 28, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 07:33:15', NULL, NULL, NULL, NULL, NULL, NULL),
(57, 28, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 07:33:15', NULL, NULL, NULL, NULL, NULL, NULL),
(58, 29, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 12:19:51', NULL, NULL, NULL, NULL, NULL, NULL),
(59, 29, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 12:19:51', NULL, NULL, NULL, NULL, NULL, NULL),
(60, 29, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 12:19:51', NULL, NULL, NULL, NULL, NULL, NULL),
(61, 30, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 12:49:48', NULL, NULL, NULL, NULL, NULL, NULL),
(62, 30, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 12:49:48', NULL, NULL, NULL, NULL, NULL, NULL),
(63, 30, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 12:49:48', NULL, NULL, NULL, NULL, NULL, NULL),
(64, 31, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 12:59:14', NULL, NULL, NULL, NULL, NULL, NULL),
(65, 31, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 12:59:14', NULL, NULL, NULL, NULL, NULL, NULL),
(66, 31, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 12:59:14', NULL, NULL, NULL, NULL, NULL, NULL),
(67, 32, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 13:02:35', NULL, NULL, NULL, NULL, NULL, NULL),
(68, 32, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 13:02:35', NULL, NULL, NULL, NULL, NULL, NULL),
(69, 32, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 13:02:35', NULL, NULL, NULL, NULL, NULL, NULL),
(70, 33, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 13:02:56', NULL, NULL, NULL, NULL, NULL, NULL),
(71, 33, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 13:02:56', NULL, NULL, NULL, NULL, NULL, NULL),
(72, 33, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 13:02:56', NULL, NULL, NULL, NULL, NULL, NULL),
(73, 34, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 13:06:03', NULL, NULL, NULL, NULL, NULL, NULL),
(74, 34, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 13:06:03', NULL, NULL, NULL, NULL, NULL, NULL),
(75, 34, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 13:06:03', NULL, NULL, NULL, NULL, NULL, NULL),
(76, 35, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 13:06:21', NULL, NULL, NULL, NULL, NULL, NULL),
(77, 35, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 13:06:21', NULL, NULL, NULL, NULL, NULL, NULL),
(78, 35, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 13:06:21', NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_tax_deduction`
--
ALTER TABLE `fch_tax_deduction`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_tax_deduction`
--
ALTER TABLE `fch_tax_deduction`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
