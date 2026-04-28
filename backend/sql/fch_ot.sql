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
-- Table structure for table `fch_ot`
--

CREATE TABLE `fch_ot` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `ot_date` date NOT NULL,
  `ot_start` datetime NOT NULL,
  `ot_end` datetime NOT NULL,
  `is_restday` tinyint(1) NOT NULL DEFAULT 0,
  `total_hrs` decimal(8,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_ot`
--

INSERT INTO `fch_ot` (`id`, `employee_id`, `emp_fullname`, `emp_dept`, `ot_date`, `ot_start`, `ot_end`, `is_restday`, `total_hrs`) VALUES
(12, 1, 'Duena, Jai C', 'Admin', '2026-02-22', '2026-02-22 14:40:00', '2026-02-23 02:41:00', 0, 12.02),
(13, 1, 'Duena, Jai C', 'Admin', '2026-02-27', '2026-02-27 21:48:00', '2026-02-28 02:48:00', 0, 5.00),
(14, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-01 14:00:00', '2026-02-01 17:00:00', 0, 3.00),
(15, 1, 'Duena, Jai C', 'Admin', '2026-02-13', '2026-02-13 15:43:00', '2026-02-13 19:43:00', 1, 4.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_ot`
--
ALTER TABLE `fch_ot`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_ot`
--
ALTER TABLE `fch_ot`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
