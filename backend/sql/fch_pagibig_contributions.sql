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
-- Table structure for table `fch_pagibig_contributions`
--

CREATE TABLE `fch_pagibig_contributions` (
  `id` int(11) NOT NULL,
  `salary_from` decimal(12,2) NOT NULL,
  `salary_to` decimal(12,2) NOT NULL,
  `employee_share` decimal(12,2) NOT NULL,
  `employer_share` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_pagibig_contributions`
--

INSERT INTO `fch_pagibig_contributions` (`id`, `salary_from`, `salary_to`, `employee_share`, `employer_share`, `effective_date`) VALUES
(1, 0.00, 1499.99, 0.01, 0.02, '2025-01-01'),
(2, 1500.00, 9999.99, 0.02, 0.02, '2025-01-01'),
(3, 10000.00, 9999999.00, 200.00, 200.00, '2025-01-01');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_pagibig_contributions`
--
ALTER TABLE `fch_pagibig_contributions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_salary` (`salary_from`,`salary_to`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_pagibig_contributions`
--
ALTER TABLE `fch_pagibig_contributions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
