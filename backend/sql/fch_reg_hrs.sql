-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:50 PM
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
-- Table structure for table `fch_reg_hrs`
--

CREATE TABLE `fch_reg_hrs` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `reg_date` date NOT NULL,
  `reg_start` datetime DEFAULT NULL,
  `reg_end` datetime DEFAULT NULL,
  `total_hrs` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_reg_hrs`
--

INSERT INTO `fch_reg_hrs` (`id`, `employee_id`, `emp_fullname`, `emp_dept`, `reg_date`, `reg_start`, `reg_end`, `total_hrs`) VALUES
(1, 1, 'Jai Duena', 'Admin', '2026-02-04', '2026-02-04 06:00:00', '2026-02-04 14:00:00', 8.00),
(2, 1, 'Jai Duena', 'Admin', '2026-02-06', '2026-02-06 06:00:00', '2026-02-06 14:00:00', 8.00),
(3, 1, 'Jai Duena', 'Admin', '2026-02-07', '2026-02-07 06:00:00', '2026-02-07 14:00:00', 8.00),
(4, 1, 'Jai Duena', 'Admin', '2026-02-08', '2026-02-08 06:00:00', '2026-02-08 14:00:00', 8.00),
(5, 1, 'Jai Duena', 'Admin', '2026-02-09', '2026-02-09 06:00:00', '2026-02-09 14:00:00', 8.00),
(6, 1, 'Jai Duena', 'Admin', '2026-02-10', '2026-02-10 06:00:00', '2026-02-10 14:00:00', 8.00),
(7, 1, 'Jai Duena', 'Admin', '2026-02-11', '2026-02-11 06:00:00', '2026-02-11 14:00:00', 8.00),
(8, 1, 'Jai Duena', 'Admin', '2026-02-12', '2026-02-12 06:00:00', '2026-02-12 14:00:00', 8.00),
(9, 1, 'Jai Duena', 'Admin', '2026-02-13', '2026-02-13 06:00:00', '2026-02-13 14:00:00', 8.00),
(10, 1, 'Jai Duena', 'Admin', '2026-02-14', '2026-02-14 06:00:00', '2026-02-14 14:00:00', 8.00),
(11, 1, 'Jai Duena', 'Admin', '2026-02-15', '2026-02-15 06:00:00', '2026-02-15 14:00:00', 8.00),
(12, 2, 'Supervisor Supervisor', 'IT', '2026-02-01', '2026-02-01 18:00:00', '2026-02-02 06:00:00', 12.00),
(13, 2, 'Supervisor Supervisor', 'IT', '2026-02-02', '2026-02-02 18:00:00', '2026-02-03 06:00:00', 12.00),
(14, 2, 'Supervisor Supervisor', 'IT', '2026-02-03', '2026-02-03 18:00:00', '2026-02-04 06:00:00', 12.00),
(15, 2, 'Supervisor Supervisor', 'IT', '2026-02-04', '2026-02-04 18:00:00', '2026-02-05 06:00:00', 12.00),
(16, 2, 'Supervisor Supervisor', 'IT', '2026-02-05', '2026-02-05 18:00:00', '2026-02-06 06:00:00', 12.00),
(17, 2, 'Supervisor Supervisor', 'IT', '2026-02-06', '2026-02-06 18:00:00', '2026-02-07 06:00:00', 12.00),
(18, 2, 'Supervisor Supervisor', 'IT', '2026-02-07', '2026-02-07 18:00:00', '2026-02-08 06:00:00', 12.00),
(19, 2, 'Supervisor Supervisor', 'IT', '2026-02-08', '2026-02-08 18:00:00', '2026-02-09 06:00:00', 12.00),
(20, 2, 'Supervisor Supervisor', 'IT', '2026-02-09', '2026-02-09 18:00:00', '2026-02-10 06:00:00', 12.00),
(21, 2, 'Supervisor Supervisor', 'IT', '2026-02-10', '2026-02-10 18:00:00', '2026-02-11 06:00:00', 12.00),
(22, 2, 'Supervisor Supervisor', 'IT', '2026-02-11', '2026-02-11 18:00:00', '2026-02-12 06:00:00', 12.00),
(23, 2, 'Supervisor Supervisor', 'IT', '2026-02-13', '2026-02-13 18:00:00', '2026-02-14 06:00:00', 12.00),
(24, 2, 'Supervisor Supervisor', 'IT', '2026-02-14', '2026-02-14 18:00:00', '2026-02-15 06:00:00', 12.00),
(25, 2, 'Supervisor Supervisor', 'IT', '2026-02-15', '2026-02-15 18:00:00', '2026-02-16 06:00:00', 12.00),
(26, 3, 'Employee Employee', 'IT', '2026-02-01', '2026-02-01 07:00:00', '2026-02-01 14:00:00', 7.00),
(27, 3, 'Employee Employee', 'IT', '2026-02-02', '2026-02-02 07:00:00', '2026-02-02 14:00:00', 7.00),
(28, 3, 'Employee Employee', 'IT', '2026-02-03', '2026-02-03 07:00:00', '2026-02-03 14:00:00', 7.00),
(29, 3, 'Employee Employee', 'IT', '2026-02-04', '2026-02-04 07:00:00', '2026-02-04 14:00:00', 7.00),
(30, 3, 'Employee Employee', 'IT', '2026-02-05', '2026-02-05 06:00:00', '2026-02-05 14:00:00', 8.00),
(31, 3, 'Employee Employee', 'IT', '2026-02-06', '2026-02-06 06:00:00', '2026-02-06 14:00:00', 8.00),
(32, 3, 'Employee Employee', 'IT', '2026-02-07', '2026-02-07 06:00:00', '2026-02-07 14:00:00', 8.00),
(33, 3, 'Employee Employee', 'IT', '2026-02-11', '2026-02-11 06:00:00', '2026-02-11 14:00:00', 8.00),
(34, 3, 'Employee Employee', 'IT', '2026-02-12', '2026-02-12 06:00:00', '2026-02-12 14:00:00', 8.00),
(35, 3, 'Employee Employee', 'IT', '2026-02-13', '2026-02-13 06:00:00', '2026-02-13 14:00:00', 8.00),
(36, 3, 'Employee Employee', 'IT', '2026-02-14', '2026-02-14 06:00:00', '2026-02-14 14:00:00', 8.00),
(37, 3, 'Employee Employee', 'IT', '2026-02-15', '2026-02-15 06:00:00', '2026-02-15 14:00:00', 8.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_reg_hrs`
--
ALTER TABLE `fch_reg_hrs`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_reg_hrs`
--
ALTER TABLE `fch_reg_hrs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
