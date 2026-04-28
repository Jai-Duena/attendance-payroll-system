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
-- Table structure for table `fch_employees_shift`
--

CREATE TABLE `fch_employees_shift` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `shift_start` time DEFAULT NULL,
  `shift_end` time DEFAULT NULL,
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_employees_shift`
--

INSERT INTO `fch_employees_shift` (`id`, `employee_id`, `shift_start`, `shift_end`, `date`) VALUES
(1, 8, '22:00:00', '06:00:00', NULL),
(2, 5, '06:00:00', '14:00:00', NULL),
(3, 1, '06:00:00', '14:00:00', NULL),
(4, 3, '06:00:00', '14:00:00', NULL),
(5, 4, '14:00:00', '22:00:00', NULL),
(6, 7, '22:00:00', '06:00:00', NULL),
(7, 6, '06:00:00', '14:00:00', NULL),
(8, 9, '06:00:00', '18:00:00', NULL),
(9, 2, '18:00:00', '06:00:00', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_employees_shift`
--
ALTER TABLE `fch_employees_shift`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_employees_shift`
--
ALTER TABLE `fch_employees_shift`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
