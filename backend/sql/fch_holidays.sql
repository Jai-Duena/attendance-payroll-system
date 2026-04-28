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
-- Table structure for table `fch_holidays`
--

CREATE TABLE `fch_holidays` (
  `holiday_date` date NOT NULL,
  `holiday_type` varchar(20) NOT NULL,
  `holiday_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_holidays`
-- Source: RA 9492 (Rationalized Holiday Law), RA 9849 (Islamic Holidays),
--         RA 10966, and Proclamation for 2026 PH legal holidays.
-- Note: Eid'l Fitr (Mar 20) and Eid'l Adha (May 27) are based on moon
--       calculations for 1447 AH and subject to official OMNCC confirmation.
--

INSERT INTO `fch_holidays` (`holiday_date`, `holiday_type`, `holiday_name`) VALUES
-- Regular Holidays
('2026-01-01', 'Regular', 'New Year\'s Day'),
('2026-03-20', 'Regular', 'Eid\'l Fitr'),
('2026-04-02', 'Regular', 'Maundy Thursday'),
('2026-04-03', 'Regular', 'Good Friday'),
('2026-04-09', 'Regular', 'Day of Valor (Araw ng Kagitingan)'),
('2026-05-01', 'Regular', 'Labor Day'),
('2026-05-27', 'Regular', 'Eid\'l Adha'),
('2026-06-12', 'Regular', 'Independence Day'),
('2026-08-31', 'Regular', 'National Heroes Day'),
('2026-11-30', 'Regular', 'Bonifacio Day'),
('2026-12-25', 'Regular', 'Christmas Day'),
('2026-12-30', 'Regular', 'Rizal Day'),
-- Special Non-Working Days
('2026-02-17', 'Special', 'Chinese New Year'),
('2026-02-25', 'Special', 'EDSA People Power Revolution Anniversary'),
('2026-04-04', 'Special', 'Black Saturday'),
('2026-08-21', 'Special', 'Ninoy Aquino Day'),
('2026-11-01', 'Special', 'All Saints\' Day'),
('2026-11-02', 'Special', 'All Souls\' Day'),
('2026-12-08', 'Special', 'Feast of the Immaculate Conception of Mary'),
('2026-12-24', 'Special', 'Christmas Eve'),
('2026-12-31', 'Special', 'Last Day of the Year');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_holidays`
--
ALTER TABLE `fch_holidays`
  ADD PRIMARY KEY (`holiday_date`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
