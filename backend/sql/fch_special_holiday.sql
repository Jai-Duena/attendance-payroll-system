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
-- Table structure for table `fch_special_holiday`
--

CREATE TABLE `fch_special_holiday` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `special_holiday_date` date NOT NULL,
  `special_holiday_start` datetime NOT NULL,
  `special_holiday_end` datetime NOT NULL,
  `total_hrs` decimal(5,2) DEFAULT 0.00,
  `is_restday` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_special_holiday`
--

INSERT INTO `fch_special_holiday` (`id`, `employee_id`, `emp_fullname`, `emp_dept`, `special_holiday_date`, `special_holiday_start`, `special_holiday_end`, `total_hrs`, `is_restday`) VALUES
(1, 1, 'Jai Duena', 'Admin', '2026-02-09', '2026-02-09 06:00:00', '2026-02-09 14:00:00', 8.00, 0),
(2, 2, 'Supervisor Supervisor', 'IT', '2026-02-09', '2026-02-09 18:00:00', '2026-02-09 23:59:59', 6.00, 0),
(3, 1, 'Jai Duena', 'Admin', '2026-02-13', '2026-02-13 06:00:00', '2026-02-13 14:00:00', 8.00, 1),
(4, 2, 'Supervisor Supervisor', 'IT', '2026-02-13', '2026-02-13 18:00:00', '2026-02-13 23:59:59', 6.00, 1),
(5, 3, 'Employee Employee', 'IT', '2026-02-13', '2026-02-13 06:00:00', '2026-02-13 14:00:00', 8.00, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_special_holiday`
--
ALTER TABLE `fch_special_holiday`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_special_holiday`
--
ALTER TABLE `fch_special_holiday`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
