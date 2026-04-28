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
-- Table structure for table `fch_nd`
--

CREATE TABLE `fch_nd` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `nd_date` date NOT NULL,
  `nd_start` datetime DEFAULT NULL,
  `nd_end` datetime DEFAULT NULL,
  `total_hrs` decimal(8,2) DEFAULT 0.00,
  `ot_nd` tinyint(1) NOT NULL DEFAULT 0,
  `is_restday` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_nd`
--

INSERT INTO `fch_nd` (`id`, `employee_id`, `emp_fullname`, `emp_dept`, `nd_date`, `nd_start`, `nd_end`, `total_hrs`, `ot_nd`, `is_restday`) VALUES
(1, 2, 'Supervisor Supervisor', 'IT', '2026-02-01', '2026-02-01 22:00:00', '2026-02-02 06:00:00', 8.00, 0, 0),
(2, 2, 'Supervisor Supervisor', 'IT', '2026-02-02', '2026-02-02 22:00:00', '2026-02-03 06:00:00', 8.00, 0, 0),
(3, 2, 'Supervisor Supervisor', 'IT', '2026-02-03', '2026-02-03 22:00:00', '2026-02-04 06:00:00', 8.00, 0, 0),
(4, 2, 'Supervisor Supervisor', 'IT', '2026-02-04', '2026-02-04 22:00:00', '2026-02-05 06:00:00', 8.00, 0, 0),
(5, 2, 'Supervisor Supervisor', 'IT', '2026-02-05', '2026-02-05 22:00:00', '2026-02-06 06:00:00', 8.00, 0, 0),
(6, 2, 'Supervisor Supervisor', 'IT', '2026-02-06', '2026-02-06 22:00:00', '2026-02-07 06:00:00', 8.00, 0, 0),
(7, 2, 'Supervisor Supervisor', 'IT', '2026-02-07', '2026-02-07 22:00:00', '2026-02-08 06:00:00', 8.00, 0, 0),
(8, 2, 'Supervisor Supervisor', 'IT', '2026-02-08', '2026-02-08 22:00:00', '2026-02-09 06:00:00', 8.00, 0, 0),
(9, 2, 'Supervisor Supervisor', 'IT', '2026-02-09', '2026-02-09 22:00:00', '2026-02-10 06:00:00', 8.00, 0, 0),
(10, 2, 'Supervisor Supervisor', 'IT', '2026-02-10', '2026-02-10 22:00:00', '2026-02-11 06:00:00', 8.00, 0, 0),
(11, 2, 'Supervisor Supervisor', 'IT', '2026-02-11', '2026-02-11 22:00:00', '2026-02-12 06:00:00', 8.00, 0, 0),
(12, 2, 'Supervisor Supervisor', 'IT', '2026-02-13', '2026-02-13 22:00:00', '2026-02-14 06:00:00', 8.00, 0, 1),
(13, 2, 'Supervisor Supervisor', 'IT', '2026-02-14', '2026-02-14 22:00:00', '2026-02-15 06:00:00', 8.00, 0, 0),
(14, 2, 'Supervisor Supervisor', 'IT', '2026-02-15', '2026-02-15 22:00:00', '2026-02-16 06:00:00', 8.00, 0, 0),
(15, 1, 'Duena, Jai C', 'Admin', '2026-02-22', '2026-02-22 22:00:00', '2026-02-23 02:41:00', 4.68, 1, 0),
(16, 1, 'Duena, Jai C', 'Admin', '2026-02-27', '2026-02-27 22:00:00', '2026-02-28 02:48:00', 4.80, 1, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_nd`
--
ALTER TABLE `fch_nd`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_nd`
--
ALTER TABLE `fch_nd`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
