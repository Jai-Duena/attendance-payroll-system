-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:52 PM
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
-- Table structure for table `fch_withholding_tax_table`
--

CREATE TABLE `fch_withholding_tax_table` (
  `id` int(11) NOT NULL,
  `salary_from` decimal(12,2) NOT NULL,
  `salary_to` decimal(12,2) NOT NULL,
  `base_tax` decimal(12,2) NOT NULL,
  `excess_rate` decimal(6,4) NOT NULL,
  `effective_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_withholding_tax_table`
--

INSERT INTO `fch_withholding_tax_table` (`id`, `salary_from`, `salary_to`, `base_tax`, `excess_rate`, `effective_date`) VALUES
(1, 0.00, 20833.33, 0.00, 0.0000, '2025-01-01'),
(2, 20833.34, 33333.33, 0.00, 0.1500, '2025-01-01'),
(3, 33333.34, 66666.67, 1875.00, 0.2000, '2025-01-01'),
(4, 66666.68, 166666.67, 8541.80, 0.2500, '2025-01-01'),
(5, 166666.68, 666666.67, 33541.80, 0.3000, '2025-01-01'),
(6, 666666.68, 999999999.00, 183541.80, 0.3500, '2025-01-01');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_withholding_tax_table`
--
ALTER TABLE `fch_withholding_tax_table`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_salary` (`salary_from`,`salary_to`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_withholding_tax_table`
--
ALTER TABLE `fch_withholding_tax_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
