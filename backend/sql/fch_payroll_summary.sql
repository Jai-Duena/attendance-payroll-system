-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:49 PM
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
-- Table structure for table `fch_payroll_summary`
--

CREATE TABLE `fch_payroll_summary` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `payroll_period` varchar(50) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `gross_pay` decimal(12,2) DEFAULT 0.00,
  `total_deductions` decimal(12,2) DEFAULT 0.00,
  `tax_deduct` decimal(12,2) NOT NULL DEFAULT 0.00,
  `net_pay` decimal(12,2) DEFAULT 0.00,
  `days_worked` decimal(5,2) NOT NULL DEFAULT 0.00,
  `generated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_payroll_summary`
--

INSERT INTO `fch_payroll_summary` (`id`, `batch_id`, `payroll_period`, `employee_id`, `emp_fullname`, `emp_dept`, `gross_pay`, `total_deductions`, `tax_deduct`, `net_pay`, `days_worked`, `generated_at`) VALUES
(1, 20, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 6837.50, 1195.08, 0.00, 5642.00, 12.00, '2026-02-08 00:56:21'),
(2, 20, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 9897.50, 1197.95, 0.00, 8699.00, 13.00, '2026-02-08 00:56:21'),
(3, 20, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 15980.00, 1500.00, 0.00, 14480.00, 15.00, '2026-02-08 00:56:21'),
(4, 21, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7521.25, 1254.60, 0.00, 6266.00, 12.00, '2026-02-08 00:57:40'),
(5, 21, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 4127.63, 23389.00, 13.00, '2026-02-08 00:57:40'),
(6, 21, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 12890.60, 42187.00, 15.00, '2026-02-08 00:57:40'),
(7, 22, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7521.25, 1254.60, 0.00, 6266.00, 12.00, '2026-02-09 03:43:32'),
(8, 22, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-09 03:43:32'),
(9, 22, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-09 03:43:32'),
(10, 23, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7521.25, 1254.60, 0.00, 6266.00, 12.00, '2026-02-09 03:44:14'),
(11, 23, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-09 03:44:14'),
(12, 23, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-09 03:44:14'),
(13, 24, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7521.25, 1254.60, 0.00, 6266.00, 12.00, '2026-02-09 14:24:27'),
(14, 24, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-09 14:24:27'),
(15, 24, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-09 14:24:27'),
(16, 26, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 02:52:36'),
(17, 26, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 02:52:36'),
(18, 26, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 02:52:36'),
(19, 27, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 02:57:35'),
(20, 27, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 02:57:35'),
(21, 27, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 02:57:35'),
(22, 28, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 15:33:15'),
(23, 28, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 15:33:15'),
(24, 28, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 15:33:15'),
(25, 29, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 20:19:51'),
(26, 29, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 20:19:51'),
(27, 29, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 20:19:51'),
(28, 30, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 20:49:48'),
(29, 30, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 20:49:48'),
(30, 30, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 20:49:48'),
(31, 31, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 20:59:14'),
(32, 31, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 20:59:14'),
(33, 31, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 20:59:14'),
(34, 32, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 21:02:35'),
(35, 32, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 21:02:35'),
(36, 32, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 21:02:35'),
(37, 33, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 21:02:56'),
(38, 33, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 21:02:56'),
(39, 33, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 21:02:56'),
(40, 34, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 21:06:03'),
(41, 34, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 21:06:03'),
(42, 34, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 21:06:03'),
(43, 35, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 21:06:21'),
(44, 35, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 21:06:21'),
(45, 35, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 21:06:21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_payroll_summary`
--
ALTER TABLE `fch_payroll_summary`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_batch` (`batch_id`),
  ADD KEY `idx_employee` (`employee_id`),
  ADD KEY `idx_period` (`payroll_period`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_payroll_summary`
--
ALTER TABLE `fch_payroll_summary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
