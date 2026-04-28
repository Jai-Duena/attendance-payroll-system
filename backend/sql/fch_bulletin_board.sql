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
-- Table structure for table `fch_bulletin_board`
--

CREATE TABLE `fch_bulletin_board` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_acc_type` varchar(50) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_bulletin_board`
--

INSERT INTO `fch_bulletin_board` (`id`, `employee_id`, `emp_fullname`, `emp_acc_type`, `emp_dept`, `text`, `created_at`) VALUES
(1, 1, 'Jai Ching Duena', 'Admin', 'Admin', 'This is a new announcement.                    ', '2026-02-09 04:47:32'),
(2, 1, 'Jai Ching Duena', 'Admin', 'Admin', 'This is a new announcement.                    ', '2026-02-09 04:47:32'),
(3, 1, 'Jai Ching Duena', 'Admin', 'Admin', 'asdasd                    asdas', '2026-02-09 05:45:34'),
(4, 1, 'Jai Ching Duena', 'Admin', 'Admin', 'asdasd', '2026-02-09 05:45:39'),
(5, 1, 'Jai Ching Duena', 'Admin', 'Admin', 'asdasdas', '2026-02-09 05:45:45'),
(6, 1, 'Jai Ching Duena', 'Admin', 'Admin', '                    aasd', '2026-02-09 05:45:50'),
(7, 1, 'Jai Ching Duena', 'Admin', 'Admin', '                    aaaaaaaaaaaaaaaaaaaaaaaaaaa                    aaaaaaaaaaaaaaaaaaaaaaaaaaa                    aaaaaaaaaaaaaaaaaaaaaaaaaaa                    aaaaaaaaaaaaaaaaaaaaaaaaaaa                    aaaaaaaaaaaaaaaaaaaaaaaaaaa', '2026-02-09 05:47:10'),
(8, 1, 'Jai Ching Duena', 'Admin', 'Admin', '                    asd', '2026-02-09 05:47:40'),
(9, 1, 'Jai Ching Duena', 'Admin', 'Admin', 'asdas', '2026-02-09 05:49:13');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_bulletin_board`
--
ALTER TABLE `fch_bulletin_board`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_bulletin_board`
--
ALTER TABLE `fch_bulletin_board`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
