-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:48 PM
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
-- Table structure for table `fch_late`
--

CREATE TABLE `fch_late` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `late_date` date DEFAULT NULL,
  `late_mins` int(11) DEFAULT NULL,
  `late_time_in` datetime DEFAULT NULL,
  `shift_time_in` datetime DEFAULT NULL,
  `total_hrs` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_late`
--

INSERT INTO `fch_late` (`id`, `employee_id`, `emp_fullname`, `emp_dept`, `late_date`, `late_mins`, `late_time_in`, `shift_time_in`, `total_hrs`) VALUES
(1, 3, 'Employee Employee', 'IT', '2026-02-01', 50, '2026-02-01 07:00:00', '2026-02-01 06:00:00', 7.00),
(2, 3, 'Employee Employee', 'IT', '2026-02-02', 50, '2026-02-02 07:00:00', '2026-02-02 06:00:00', 7.00),
(3, 3, 'Employee Employee', 'IT', '2026-02-03', 50, '2026-02-03 07:00:00', '2026-02-03 06:00:00', 7.00),
(4, 3, 'Employee Employee', 'IT', '2026-02-04', 50, '2026-02-04 07:00:00', '2026-02-04 06:00:00', 8.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_late`
--
ALTER TABLE `fch_late`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_late`
--
ALTER TABLE `fch_late`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
