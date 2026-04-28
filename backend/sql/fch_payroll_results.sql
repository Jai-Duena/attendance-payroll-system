-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:49 PM
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
-- Table structure for table `fch_payroll_results`
--

CREATE TABLE `fch_payroll_results` (
  `id` int(11) NOT NULL,
  `batch_id` varchar(20) NOT NULL,
  `payroll_start` date NOT NULL,
  `payroll_end` date NOT NULL,
  `num_employees` int(11) DEFAULT 0,
  `status` varchar(20) DEFAULT 'draft',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_payroll_results`
--

INSERT INTO `fch_payroll_results` (`id`, `batch_id`, `payroll_start`, `payroll_end`, `num_employees`, `status`, `created_at`, `updated_at`) VALUES
(1, '31', '2026-02-01', '2026-02-15', 3, 'Draft', '2026-02-10 20:59:14', '2026-02-10 20:59:14'),
(2, '32', '2026-02-01', '2026-02-15', 3, 'Draft', '2026-02-10 21:02:35', '2026-02-10 21:02:35'),
(3, '33', '2026-02-01', '2026-02-15', 3, 'Draft', '2026-02-10 21:02:56', '2026-02-10 21:02:56'),
(4, '35', '2026-02-01', '2026-02-15', 3, 'Released', '2026-02-10 21:06:21', '2026-02-10 21:21:37');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_payroll_results`
--
ALTER TABLE `fch_payroll_results`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_payroll_results`
--
ALTER TABLE `fch_payroll_results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
