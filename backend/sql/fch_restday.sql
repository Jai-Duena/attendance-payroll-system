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
-- Table structure for table `fch_restday`
--

CREATE TABLE `fch_restday` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `rest_date` date DEFAULT NULL,
  `rest_start` datetime DEFAULT NULL,
  `rest_end` datetime DEFAULT NULL,
  `total_hrs` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_restday`
--

INSERT INTO `fch_restday` (`id`, `employee_id`, `emp_fullname`, `emp_dept`, `rest_date`, `rest_start`, `rest_end`, `total_hrs`) VALUES
(1, 1, 'Jai Duena', 'Admin', '2026-02-11', '2026-02-11 06:00:00', '2026-02-11 14:00:00', 8.00),
(2, 1, 'Jai Duena', 'Admin', '2026-02-13', '2026-02-13 06:00:00', '2026-02-13 14:00:00', 8.00),
(3, 2, 'Supervisor Supervisor', 'IT', '2026-02-13', '2026-02-13 18:00:00', '2026-02-14 06:00:00', 12.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_restday`
--
ALTER TABLE `fch_restday`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_restday`
--
ALTER TABLE `fch_restday`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
