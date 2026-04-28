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
-- Table structure for table `fch_employees`
--

CREATE TABLE `fch_employees` (
  `uniq_id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `emp_fname` varchar(50) NOT NULL,
  `emp_lname` varchar(50) NOT NULL,
  `emp_mname` varchar(50) DEFAULT NULL,
  `emp_minit` varchar(5) GENERATED ALWAYS AS (if(`emp_mname` is null or `emp_mname` = '',NULL,left(`emp_mname`,1))) STORED,
  `emp_fullname` varchar(255) DEFAULT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `emp_position` varchar(50) NOT NULL,
  `emp_datehire` date NOT NULL,
  `emp_emptype` enum('Regular','Probationary','Part-time','Project-based','Intern','Resigned','Terminated','Added by User') NOT NULL,
  `emp_shift` varchar(50) DEFAULT NULL,
  `emp_sss` varchar(20) DEFAULT NULL,
  `emp_pagibig` varchar(20) DEFAULT NULL,
  `emp_philhealth` varchar(20) DEFAULT NULL,
  `emp_username` varchar(50) NOT NULL,
  `emp_email` varchar(255) DEFAULT NULL,
  `emp_pass` varchar(255) NOT NULL,
  `emp_acc_type` enum('Employee','Supervisor','Admin','Management') NOT NULL,
  `emp_sign` varchar(255) DEFAULT NULL,
  `emp_tin` varchar(20) DEFAULT NULL,
  `emp_dailyrate` int(11) NOT NULL,
  `emp_bank` varchar(100) DEFAULT NULL,
  `emp_created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `emp_updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `emp_email_pending` varchar(255) DEFAULT NULL,
  `emp_email_token` varchar(255) DEFAULT NULL,
  `emp_email_token_expiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_employees`
--

INSERT INTO `fch_employees` (`uniq_id`, `employee_id`, `emp_fname`, `emp_lname`, `emp_mname`, `emp_fullname`, `emp_dept`, `emp_position`, `emp_datehire`, `emp_emptype`, `emp_shift`, `emp_sss`, `emp_pagibig`, `emp_philhealth`, `emp_username`, `emp_email`, `emp_pass`, `emp_acc_type`, `emp_sign`, `emp_tin`, `emp_dailyrate`, `emp_bank`, `emp_created_at`, `emp_updated_at`, `emp_email_pending`, `emp_email_token`, `emp_email_token_expiry`) VALUES
(1, 1, 'Jai', 'Duena', 'Ching', 'Duena, Jai C', 'Admin', 'Developer', '0000-00-00', 'Regular', 'Shift 1: 6 AM to 2 PM', '11-1111111-1', '5555-5555-5555', '55-555555555-0', 'Jai', 'jirehduena@gmail.com', 'Jireh', 'Admin', '', NULL, 1500, NULL, '2026-02-07 16:57:17', '2026-01-20 08:06:16', 'jirehduena27@gmail.com', '3f3ec53dbb5a9fea4c94b630303b3c8609d1e3c7fc1cf58a1c10b3cee4fa78b5', '2026-01-25 17:53:11'),
(2, 2, 'Supervisor', 'Supervisor', 'Super Visor', 'Supervisor, Supervisor S', 'IT', 'Web Developer', '2025-01-01', 'Regular', 'Shift 5: 6 PM to 6 AM', '12-_______-_', '1212-1212-1212', '12-121212121-0', 'Supervisor', NULL, 'Supervisor', 'Supervisor', NULL, NULL, 1800, NULL, '2026-02-07 16:57:28', '2026-01-21 15:56:05', NULL, NULL, NULL),
(3, 3, 'Employee', 'Employee', 'Employee', 'Employee, Employee E', 'IT', 'Nurse', '2024-01-01', 'Regular', 'Shift 1: 6 AM to 2 PM', '0_-_______-_', '9999-9998-7777', '44-444777722-0', 'Employee', NULL, 'Employee', 'Employee', NULL, NULL, 550, NULL, '2026-02-07 16:57:32', '2026-01-21 15:56:54', NULL, NULL, NULL),
(4, 4, 'Management', 'Management', 'Management', 'Management, Management M', 'Management', 'CEO', '2023-01-01', 'Regular', 'Shift 2: 2 PM to 10 PM', '34-_______-_', '3463-4222-2222', '52-365437677-0', 'Management', NULL, 'Management', 'Management', NULL, NULL, 500, NULL, '2026-02-06 11:05:38', '2026-01-21 15:57:42', NULL, NULL, NULL),
(5, 5, 'Juan', 'Cruz', 'Dela', 'Cruz, Juan D', 'IT', 'IT', '2026-01-01', 'Regular', 'Shift 1: 6 AM to 2 PM', '25-4341111-1', '3631-6334-6134', '23-631434673-0', 'Juan', NULL, 'Family Care', 'Employee', NULL, '523-451-231', 500, NULL, '2026-01-27 12:33:34', '2026-01-21 16:26:30', NULL, NULL, NULL),
(6, 6, 'Pedro', 'Pedro', 'Pedro', 'Pedro, Pedro P', 'IT', 'asd', '2026-01-01', 'Regular', 'Shift 1: 6 AM to 2 PM', '21-5312534-6', '2523-____-____', '16-346416534-0', 'Pedro', NULL, 'Family Care', 'Employee', 'uploads/signatures/sign_1769014018_6.png', '111', 500, NULL, '2026-02-06 11:05:32', '2026-01-21 16:46:58', NULL, NULL, NULL),
(7, 7, 'Test', 'One', '', 'One, Test', 'Admin', 'asd', '2026-01-07', 'Regular', 'Shift 3: 10 PM to 6 AM', '21-5421463-4', '6707', '74-673263147-0', 'Test', NULL, 'Family Care', 'Admin', 'uploads/signatures/sign_1769516908_7.png', '124', 500, NULL, '2026-02-06 11:05:42', '2026-01-27 12:28:28', NULL, NULL, NULL),
(8, 8, 'Test', '2', '', '2, Test', 'Admin', 'asdf', '2026-01-05', 'Regular', 'Shift 3: 10 PM to 6 AM', '5246315728', '247525372654', '631784258450', 'Test 2', NULL, 'Family Care', 'Employee', 'uploads/signatures/sign_1769517518_8.png', '154364574', 500, NULL, '2026-02-06 11:05:48', '2026-01-27 12:38:38', NULL, NULL, NULL),
(9, 9, 'Jose', 'Rizal', '', 'Rizal, Jose', 'Admin', 'dsfghq', '2026-01-04', 'Intern', 'Shift 4: 6 AM to 6 PM', '56-3835684-3', '4278-____-____', '52-742673246-0', 'Jose', '', 'Family Care', 'Admin', NULL, '875-___-___', 500, NULL, '2026-02-06 11:05:54', '2026-01-29 16:16:54', NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_employees`
--
ALTER TABLE `fch_employees`
  ADD PRIMARY KEY (`uniq_id`),
  ADD UNIQUE KEY `employee_id` (`employee_id`),
  ADD UNIQUE KEY `emp_username` (`emp_username`),
  ADD UNIQUE KEY `emp_sss` (`emp_sss`),
  ADD UNIQUE KEY `emp_pagibig` (`emp_pagibig`),
  ADD UNIQUE KEY `emp_philhealth` (`emp_philhealth`),
  ADD UNIQUE KEY `emp_tin` (`emp_tin`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_employees`
--
ALTER TABLE `fch_employees`
  MODIFY `uniq_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
