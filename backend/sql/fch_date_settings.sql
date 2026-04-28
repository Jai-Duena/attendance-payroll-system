-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:47 PM
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
-- Table structure for table `fch_date_settings`
--

CREATE TABLE `fch_date_settings` (
  `date` date NOT NULL,
  `reg_holiday` tinyint(1) DEFAULT 0,
  `special_holiday` tinyint(1) DEFAULT 0,
  `emp_leave` tinyint(1) DEFAULT 0,
  `emp_restday` tinyint(1) NOT NULL DEFAULT 0,
  `employee_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_date_settings`
--

INSERT INTO `fch_date_settings` (`date`, `reg_holiday`, `special_holiday`, `emp_leave`, `emp_restday`, `employee_id`) VALUES
('2026-02-01', 1, 0, 0, 0, 0),
('2026-02-02', 0, 0, 0, 1, 1),
('2026-02-08', 0, 0, 1, 0, 3),
('2026-02-09', 0, 1, 0, 0, 0),
('2026-02-09', 0, 0, 1, 0, 3),
('2026-02-10', 0, 0, 1, 0, 3),
('2026-02-11', 1, 0, 0, 0, 0),
('2026-02-11', 0, 0, 0, 1, 1),
('2026-02-13', 0, 1, 0, 1, 1),
('2026-02-13', 0, 0, 0, 1, 2);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_date_settings`
--
ALTER TABLE `fch_date_settings`
  ADD PRIMARY KEY (`date`,`employee_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
