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
-- Table structure for table `fch_rate_multipliers`
--

CREATE TABLE `fch_rate_multipliers` (
  `code` varchar(50) NOT NULL,
  `multiplier` decimal(6,3) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_rate_multipliers`
--

INSERT INTO `fch_rate_multipliers` (`code`, `multiplier`, `description`) VALUES
('RD_ND', 1.430, 'Work Restday Night Differential: Hourly Rate × 1.43 × ND Hours'),
('RD_OT', 1.690, 'Work Restday Overtime: Hourly Rate × 1.69 × OT Hours'),
('RD_OT_ND', 0.169, 'Work Restday Overtime and Night Differential: (Hourly Rate × 1.69) × 0.10 × ND OT Hours'),
('RD_REG', 1.300, 'Work Restday Regular Hours: Daily Wage × 1.30'),
('REG', 1.000, 'Regular Hours: Hourly Rate × 1.00 × Hours Worked'),
('REG_ND', 0.100, 'Night Differential Hours: Hourly Rate × 1.00 × 0.10 × ND Hours'),
('REG_OT', 1.250, 'Overtime Hours: Hourly Rate × 1.25 × OT Hours'),
('REG_OT_ND', 0.125, 'Overtime and Night Differential Hours: (Hourly Rate × 1.25) × 0.10 × OT ND Hours'),
('RH_ND', 2.200, 'Regular Holiday Night Differential: Hourly Rate × 2.20 × ND Hours'),
('RH_NO_WORK', 1.000, 'No Work Regular Holiday: Daily Wage × 1.00'),
('RH_OT', 2.600, 'Regular Holiday Overtime: Hourly Rate × 2.60 × OT Hours'),
('RH_OT_ND', 0.260, 'Regular Holiday Overtime and Night Differential: (Hourly Rate × 2.60) × 0.10 × Hours ND OT'),
('RH_RD_ND', 2.860, 'Regular Holiday Plus Rest Day Night Differential: Hourly Rate × 2.86 × ND Hours'),
('RH_RD_OT', 3.380, 'Regular Holiday Plus Rest Day Overtime: Hourly Rate × 3.38 × OT Hours'),
('RH_RD_OT_ND', 0.338, 'Regular Holiday Plus Rest Day Overtime and Night Differential: (Hourly Rate × 3.38) × 0.10 × ND OT Hours'),
('RH_RD_REG', 2.600, 'Regular Holiday Plus Rest Day Regular Hours: Daily Wage × 2.60'),
('RH_REG', 2.000, 'Work Regular Holiday Regular Hours: Daily Wage × 2.00'),
('SH_ND', 1.430, 'Special Holiday Night Differential: Hourly Rate × 1.43 × ND Hours'),
('SH_OT', 1.690, 'Special Holiday Overtime: Hourly Rate × 1.69 × OT Hours'),
('SH_OT_ND', 0.169, 'Special Holiday Overtime and Night Differential: (Hourly Rate × 1.69) × 0.10 × ND OT Hours'),
('SH_RD_ND', 1.650, 'Special Holiday Plus Rest Day Night Differential: Hourly Rate × 1.65 × ND Hours'),
('SH_RD_OT', 1.950, 'Special Holiday Plus Rest Day Overtime: Hourly Rate × 1.95 × OT Hours'),
('SH_RD_OT_ND', 0.195, 'Special Holiday Plus Rest Day Overtime and Night Differential: (Hourly Rate × 1.95) × 0.10 × ND OT Hours'),
('SH_RD_REG', 1.500, 'Special Holiday Plus Rest Day Regular Hours: Daily Wage × 1.50'),
('SH_REG', 1.300, 'Work Special Holiday Regular Hours: Daily Wage × 1.30');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_rate_multipliers`
--
ALTER TABLE `fch_rate_multipliers`
  ADD PRIMARY KEY (`code`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
