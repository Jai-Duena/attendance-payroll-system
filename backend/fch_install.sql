SET FOREIGN_KEY_CHECKS=0;
-- fch_date_settings.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

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

;
;
;

-- fch_rate_multipliers.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:50 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

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

;
;
;

-- fch_holidays.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:48 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

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
--

INSERT INTO `fch_holidays` (`holiday_date`, `holiday_type`, `holiday_name`) VALUES
('2026-02-01', 'Regular', 'Test 1'),
('2026-02-09', 'Special', 'Test 2'),
('2026-02-11', 'Regular', 'Test3'),
('2026-02-13', 'Special', 'New Year\\\'s Day');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_holidays`
--
ALTER TABLE `fch_holidays`
  ADD PRIMARY KEY (`holiday_date`);

;
;
;

-- fch_reg_holiday.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:50 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_reg_holiday`
--

CREATE TABLE `fch_reg_holiday` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `reg_holiday_date` date DEFAULT NULL,
  `reg_holiday_start` datetime DEFAULT NULL,
  `reg_holiday_end` datetime DEFAULT NULL,
  `total_hrs` decimal(5,2) DEFAULT NULL,
  `is_restday` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_reg_holiday`
--

INSERT INTO `fch_reg_holiday` (`id`, `employee_id`, `emp_fullname`, `emp_dept`, `reg_holiday_date`, `reg_holiday_start`, `reg_holiday_end`, `total_hrs`, `is_restday`) VALUES
(1, 2, 'Supervisor Supervisor', 'IT', '2026-02-01', '2026-02-01 18:00:00', '2026-02-01 23:59:59', 6.00, 0),
(2, 3, 'Employee Employee', 'IT', '2026-02-01', '2026-02-01 07:00:00', '2026-02-01 14:00:00', 7.00, 0),
(3, 1, 'Jai Duena', 'Admin', '2026-02-11', '2026-02-11 06:00:00', '2026-02-11 14:00:00', 8.00, 1),
(4, 2, 'Supervisor Supervisor', 'IT', '2026-02-11', '2026-02-11 18:00:00', '2026-02-11 23:59:59', 6.00, 0),
(5, 3, 'Employee Employee', 'IT', '2026-02-11', '2026-02-11 06:00:00', '2026-02-11 14:00:00', 8.00, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_reg_holiday`
--
ALTER TABLE `fch_reg_holiday`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_reg_holiday`
--
ALTER TABLE `fch_reg_holiday`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

;
;
;

-- fch_special_holiday.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:51 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_special_holiday`
--

CREATE TABLE `fch_special_holiday` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `special_holiday_date` date NOT NULL,
  `special_holiday_start` datetime NOT NULL,
  `special_holiday_end` datetime NOT NULL,
  `total_hrs` decimal(5,2) DEFAULT 0.00,
  `is_restday` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_special_holiday`
--

INSERT INTO `fch_special_holiday` (`id`, `employee_id`, `emp_fullname`, `emp_dept`, `special_holiday_date`, `special_holiday_start`, `special_holiday_end`, `total_hrs`, `is_restday`) VALUES
(1, 1, 'Jai Duena', 'Admin', '2026-02-09', '2026-02-09 06:00:00', '2026-02-09 14:00:00', 8.00, 0),
(2, 2, 'Supervisor Supervisor', 'IT', '2026-02-09', '2026-02-09 18:00:00', '2026-02-09 23:59:59', 6.00, 0),
(3, 1, 'Jai Duena', 'Admin', '2026-02-13', '2026-02-13 06:00:00', '2026-02-13 14:00:00', 8.00, 1),
(4, 2, 'Supervisor Supervisor', 'IT', '2026-02-13', '2026-02-13 18:00:00', '2026-02-13 23:59:59', 6.00, 1),
(5, 3, 'Employee Employee', 'IT', '2026-02-13', '2026-02-13 06:00:00', '2026-02-13 14:00:00', 8.00, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_special_holiday`
--
ALTER TABLE `fch_special_holiday`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_special_holiday`
--
ALTER TABLE `fch_special_holiday`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

;
;
;

-- fch_sss_contributions.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:51 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_sss_contributions`
--

CREATE TABLE `fch_sss_contributions` (
  `id` int(11) NOT NULL,
  `salary_from` decimal(12,2) NOT NULL,
  `salary_to` decimal(12,2) NOT NULL,
  `employee_share` decimal(12,2) NOT NULL,
  `employer_share` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_sss_contributions`
--

INSERT INTO `fch_sss_contributions` (`id`, `salary_from`, `salary_to`, `employee_share`, `employer_share`, `effective_date`) VALUES
(4, 0.00, 5249.99, 250.00, 510.00, '2026-01-01'),
(5, 5250.00, 5749.99, 275.00, 560.00, '2026-01-01'),
(6, 5750.00, 6249.99, 300.00, 610.00, '2026-01-01'),
(7, 6250.00, 6749.99, 325.00, 660.00, '2026-01-01'),
(8, 6750.00, 7249.99, 350.00, 710.00, '2026-01-01'),
(9, 7250.00, 7749.99, 375.00, 760.00, '2026-01-01'),
(10, 7750.00, 8249.99, 400.00, 810.00, '2026-01-01'),
(11, 8250.00, 8749.99, 425.00, 860.00, '2026-01-01'),
(12, 8750.00, 9249.99, 450.00, 910.00, '2026-01-01'),
(13, 9250.00, 9749.99, 475.00, 960.00, '2026-01-01'),
(14, 9750.00, 10249.99, 500.00, 1010.00, '2026-01-01'),
(15, 10250.00, 10749.99, 525.00, 1060.00, '2026-01-01'),
(16, 10750.00, 11249.99, 550.00, 1110.00, '2026-01-01'),
(17, 11250.00, 11749.99, 575.00, 1160.00, '2026-01-01'),
(18, 11750.00, 12249.99, 600.00, 1210.00, '2026-01-01'),
(19, 12250.00, 12749.99, 625.00, 1260.00, '2026-01-01'),
(20, 12750.00, 13249.99, 650.00, 1310.00, '2026-01-01'),
(21, 13250.00, 13749.99, 675.00, 1360.00, '2026-01-01'),
(22, 13750.00, 14249.99, 700.00, 1410.00, '2026-01-01'),
(23, 14250.00, 14749.99, 725.00, 1460.00, '2026-01-01'),
(24, 14750.00, 15249.99, 750.00, 1530.00, '2026-01-01'),
(25, 15250.00, 15749.99, 775.00, 1580.00, '2026-01-01'),
(26, 15750.00, 16249.99, 800.00, 1630.00, '2026-01-01'),
(27, 16250.00, 16749.99, 825.00, 1680.00, '2026-01-01'),
(28, 16750.00, 17249.99, 850.00, 1730.00, '2026-01-01'),
(29, 17250.00, 17749.99, 875.00, 1780.00, '2026-01-01'),
(30, 17750.00, 18249.99, 900.00, 1830.00, '2026-01-01'),
(31, 18250.00, 18749.99, 925.00, 1880.00, '2026-01-01'),
(32, 18750.00, 19249.99, 950.00, 1930.00, '2026-01-01'),
(33, 19250.00, 19749.99, 975.00, 1980.00, '2026-01-01'),
(34, 19750.00, 20249.99, 1000.00, 2030.00, '2026-01-01'),
(35, 20250.00, 20749.99, 1025.00, 2080.00, '2026-01-01'),
(36, 20750.00, 21249.99, 1050.00, 2130.00, '2026-01-01'),
(37, 21250.00, 21749.99, 1075.00, 2180.00, '2026-01-01'),
(38, 21750.00, 22249.99, 1100.00, 2230.00, '2026-01-01'),
(39, 22250.00, 22749.99, 1125.00, 2280.00, '2026-01-01'),
(40, 22750.00, 23249.99, 1150.00, 2330.00, '2026-01-01'),
(41, 23250.00, 23749.99, 1175.00, 2380.00, '2026-01-01'),
(42, 23750.00, 24249.99, 1200.00, 2430.00, '2026-01-01'),
(43, 24250.00, 24749.99, 1225.00, 2480.00, '2026-01-01'),
(44, 24750.00, 25249.99, 1250.00, 2530.00, '2026-01-01'),
(45, 25250.00, 25749.99, 1275.00, 2580.00, '2026-01-01'),
(46, 25750.00, 26249.99, 1300.00, 2630.00, '2026-01-01'),
(47, 26250.00, 26749.99, 1325.00, 2680.00, '2026-01-01'),
(48, 26750.00, 27249.99, 1350.00, 2730.00, '2026-01-01'),
(49, 27250.00, 27749.99, 1375.00, 2780.00, '2026-01-01'),
(50, 27750.00, 28249.99, 1400.00, 2830.00, '2026-01-01'),
(51, 28250.00, 28749.99, 1425.00, 2880.00, '2026-01-01'),
(52, 28750.00, 29249.99, 1450.00, 2930.00, '2026-01-01'),
(53, 29250.00, 29749.99, 1475.00, 2980.00, '2026-01-01'),
(54, 29750.00, 30249.99, 1500.00, 3030.00, '2026-01-01'),
(55, 30250.00, 30749.99, 1525.00, 3080.00, '2026-01-01'),
(56, 30750.00, 31249.99, 1550.00, 3130.00, '2026-01-01'),
(57, 31250.00, 31749.99, 1575.00, 3180.00, '2026-01-01'),
(58, 31750.00, 32249.99, 1600.00, 3230.00, '2026-01-01'),
(59, 32250.00, 32749.99, 1625.00, 3280.00, '2026-01-01'),
(60, 32750.00, 33249.99, 1650.00, 3330.00, '2026-01-01'),
(61, 33250.00, 33749.99, 1675.00, 3380.00, '2026-01-01'),
(62, 33750.00, 34249.99, 1700.00, 3430.00, '2026-01-01'),
(63, 34250.00, 34749.99, 1725.00, 3480.00, '2026-01-01'),
(64, 34750.00, 999999.99, 1750.00, 3530.00, '2026-01-01');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_sss_contributions`
--
ALTER TABLE `fch_sss_contributions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_salary` (`salary_from`,`salary_to`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_sss_contributions`
--
ALTER TABLE `fch_sss_contributions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

;
;
;

-- fch_pagibig_contributions.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:48 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

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

;
;
;

-- fch_philhealth_contributions.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:49 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_philhealth_contributions`
--

CREATE TABLE `fch_philhealth_contributions` (
  `id` int(11) NOT NULL,
  `salary_from` decimal(12,2) NOT NULL,
  `salary_to` decimal(12,2) NOT NULL,
  `employee_share` decimal(12,2) NOT NULL,
  `employer_share` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_philhealth_contributions`
--

INSERT INTO `fch_philhealth_contributions` (`id`, `salary_from`, `salary_to`, `employee_share`, `employer_share`, `effective_date`) VALUES
(1, 1.00, 10000.99, 250.00, 250.00, '2026-01-01'),
(2, 10001.00, 99999.99, 500.00, 500.00, '2025-01-01'),
(3, 100000.00, 9999999.99, 2500.00, 2500.00, '2025-01-01');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_philhealth_contributions`
--
ALTER TABLE `fch_philhealth_contributions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_salary` (`salary_from`,`salary_to`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_philhealth_contributions`
--
ALTER TABLE `fch_philhealth_contributions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

;
;
;

-- fch_withholding_tax_table.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:52 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

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

;
;
;

-- fch_tax_deduction.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:51 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_tax_deduction`
--

CREATE TABLE `fch_tax_deduction` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `payroll_period` varchar(50) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `taxable_income` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax_deduct` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `adj_taxable_income` decimal(10,2) DEFAULT NULL,
  `adj_tax_deduct` decimal(10,2) DEFAULT NULL,
  `adj_total` decimal(10,2) DEFAULT NULL,
  `adj_reason` text DEFAULT NULL,
  `adj_by` int(11) DEFAULT NULL,
  `adj_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_tax_deduction`
--

INSERT INTO `fch_tax_deduction` (`id`, `batch_id`, `payroll_period`, `employee_id`, `emp_fullname`, `emp_dept`, `taxable_income`, `tax_deduct`, `total`, `created_at`, `adj_taxable_income`, `adj_tax_deduct`, `adj_total`, `adj_reason`, `adj_by`, `adj_at`) VALUES
(1, 13, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4295.67, 0.00, 4295.67, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(2, 13, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 6991.60, 0.00, 6991.60, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(3, 13, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', -790.00, 0.00, -790.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(4, 13, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', -790.00, 0.00, -790.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(5, 13, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', -790.00, 0.00, -790.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(6, 13, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', -790.00, 0.00, -790.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(7, 13, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 12150.00, 0.00, 12150.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(8, 13, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', -790.00, 0.00, -790.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(9, 13, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', -790.00, 0.00, -790.00, '2026-02-07 16:00:02', NULL, NULL, NULL, NULL, NULL, NULL),
(10, 14, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4295.67, 0.00, 4295.67, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(11, 14, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 6991.60, 0.00, 6991.60, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(12, 14, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(13, 14, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(14, 14, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(15, 14, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(16, 14, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 12150.00, 0.00, 12150.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(17, 14, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(18, 14, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL),
(19, 17, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 5642.42, 0.00, 5642.42, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(20, 17, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 8699.55, 0.00, 8699.55, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(21, 17, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 240.00, 0.00, 240.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(22, 17, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 240.00, 0.00, 240.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(23, 17, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 240.00, 0.00, 240.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(24, 17, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 240.00, 0.00, 240.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(25, 17, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 14480.00, 0.00, 14480.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(26, 17, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 240.00, 0.00, 240.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(27, 17, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 240.00, 0.00, 240.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL),
(28, 18, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 5642.42, 0.00, 5642.42, '2026-02-07 16:45:04', NULL, NULL, NULL, NULL, NULL, NULL),
(29, 18, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 8699.55, 0.00, 8699.55, '2026-02-07 16:45:04', NULL, NULL, NULL, NULL, NULL, NULL),
(30, 18, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 14480.00, 0.00, 14480.00, '2026-02-07 16:45:04', NULL, NULL, NULL, NULL, NULL, NULL),
(31, 19, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 5642.42, 0.00, 5642.42, '2026-02-07 16:55:36', NULL, NULL, NULL, NULL, NULL, NULL),
(32, 19, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 8699.55, 0.00, 8699.55, '2026-02-07 16:55:36', NULL, NULL, NULL, NULL, NULL, NULL),
(33, 19, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 14480.00, 0.00, 14480.00, '2026-02-07 16:55:36', NULL, NULL, NULL, NULL, NULL, NULL),
(34, 20, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 5642.42, 0.00, 5642.42, '2026-02-07 16:56:21', NULL, NULL, NULL, NULL, NULL, NULL),
(35, 20, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 8699.55, 0.00, 8699.55, '2026-02-07 16:56:21', NULL, NULL, NULL, NULL, NULL, NULL),
(36, 20, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 14480.00, 0.00, 14480.00, '2026-02-07 16:56:21', NULL, NULL, NULL, NULL, NULL, NULL),
(37, 21, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 6266.65, 0.00, 6266.65, '2026-02-07 16:57:40', NULL, NULL, NULL, NULL, NULL, NULL),
(38, 21, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 4127.63, 23389.87, '2026-02-07 16:57:40', NULL, NULL, NULL, NULL, NULL, NULL),
(39, 21, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 12890.60, 42187.40, '2026-02-07 16:57:40', NULL, NULL, NULL, NULL, NULL, NULL),
(40, 22, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 6266.65, 0.00, 6266.65, '2026-02-08 19:43:32', NULL, NULL, NULL, NULL, NULL, NULL),
(41, 22, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-08 19:43:32', NULL, NULL, NULL, NULL, NULL, NULL),
(42, 22, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-08 19:43:32', NULL, NULL, NULL, NULL, NULL, NULL),
(43, 23, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 6266.65, 0.00, 6266.65, '2026-02-08 19:44:14', NULL, NULL, NULL, NULL, NULL, NULL),
(44, 23, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-08 19:44:14', NULL, NULL, NULL, NULL, NULL, NULL),
(45, 23, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-08 19:44:14', NULL, NULL, NULL, NULL, NULL, NULL),
(46, 24, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 6266.65, 0.00, 6266.65, '2026-02-09 06:24:26', NULL, NULL, NULL, NULL, NULL, NULL),
(47, 24, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-09 06:24:26', NULL, NULL, NULL, NULL, NULL, NULL),
(48, 24, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-09 06:24:26', NULL, NULL, NULL, NULL, NULL, NULL),
(49, 26, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-09 18:52:36', NULL, NULL, NULL, NULL, NULL, NULL),
(50, 26, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-09 18:52:36', NULL, NULL, NULL, NULL, NULL, NULL),
(51, 26, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-09 18:52:36', NULL, NULL, NULL, NULL, NULL, NULL),
(52, 27, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-09 18:57:35', NULL, NULL, NULL, NULL, NULL, NULL),
(53, 27, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-09 18:57:35', NULL, NULL, NULL, NULL, NULL, NULL),
(54, 27, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-09 18:57:35', NULL, NULL, NULL, NULL, NULL, NULL),
(55, 28, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 07:33:15', NULL, NULL, NULL, NULL, NULL, NULL),
(56, 28, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 07:33:15', NULL, NULL, NULL, NULL, NULL, NULL),
(57, 28, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 07:33:15', NULL, NULL, NULL, NULL, NULL, NULL),
(58, 29, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 12:19:51', NULL, NULL, NULL, NULL, NULL, NULL),
(59, 29, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 12:19:51', NULL, NULL, NULL, NULL, NULL, NULL),
(60, 29, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 12:19:51', NULL, NULL, NULL, NULL, NULL, NULL),
(61, 30, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 12:49:48', NULL, NULL, NULL, NULL, NULL, NULL),
(62, 30, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 12:49:48', NULL, NULL, NULL, NULL, NULL, NULL),
(63, 30, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 12:49:48', NULL, NULL, NULL, NULL, NULL, NULL),
(64, 31, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 12:59:14', NULL, NULL, NULL, NULL, NULL, NULL),
(65, 31, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 12:59:14', NULL, NULL, NULL, NULL, NULL, NULL),
(66, 31, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 12:59:14', NULL, NULL, NULL, NULL, NULL, NULL),
(67, 32, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 13:02:35', NULL, NULL, NULL, NULL, NULL, NULL),
(68, 32, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 13:02:35', NULL, NULL, NULL, NULL, NULL, NULL),
(69, 32, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 13:02:35', NULL, NULL, NULL, NULL, NULL, NULL),
(70, 33, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 13:02:56', NULL, NULL, NULL, NULL, NULL, NULL),
(71, 33, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 13:02:56', NULL, NULL, NULL, NULL, NULL, NULL),
(72, 33, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 13:02:56', NULL, NULL, NULL, NULL, NULL, NULL),
(73, 34, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 13:06:03', NULL, NULL, NULL, NULL, NULL, NULL),
(74, 34, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 13:06:03', NULL, NULL, NULL, NULL, NULL, NULL),
(75, 34, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 13:06:03', NULL, NULL, NULL, NULL, NULL, NULL),
(76, 35, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7808.65, 0.00, 7808.65, '2026-02-10 13:06:21', NULL, NULL, NULL, NULL, NULL, NULL),
(77, 35, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 27517.50, 1002.62, 26514.88, '2026-02-10 13:06:21', NULL, NULL, NULL, NULL, NULL, NULL),
(78, 35, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 55078.00, 6223.93, 48854.07, '2026-02-10 13:06:21', NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_tax_deduction`
--
ALTER TABLE `fch_tax_deduction`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_tax_deduction`
--
ALTER TABLE `fch_tax_deduction`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

;
;
;

-- fch_employees.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

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

;
;
;

-- fch_employees_shift.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

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

;
;
;

-- att_punches.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:46 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `att_punches`
--

CREATE TABLE `att_punches` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `punch_time` datetime NOT NULL,
  `workcode` int(11) DEFAULT NULL,
  `workstate` int(11) DEFAULT NULL,
  `verifycode` varchar(64) DEFAULT NULL,
  `terminal_id` int(11) DEFAULT NULL,
  `punch_type` varchar(64) DEFAULT NULL,
  `operator` varchar(64) DEFAULT NULL,
  `operator_reason` varchar(255) DEFAULT NULL,
  `operator_time` datetime DEFAULT NULL,
  `IsSelect` int(11) DEFAULT NULL,
  `middleware_id` bigint(20) DEFAULT NULL,
  `attendance_event` varchar(64) DEFAULT NULL,
  `login_combination` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `annotation` varchar(255) DEFAULT NULL,
  `processed` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `att_punches`
--

INSERT INTO `att_punches` (`id`, `employee_id`, `punch_time`, `workcode`, `workstate`, `verifycode`, `terminal_id`, `punch_type`, `operator`, `operator_reason`, `operator_time`, `IsSelect`, `middleware_id`, `attendance_event`, `login_combination`, `status`, `annotation`, `processed`) VALUES
(5, 1, '2026-02-03 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 1, '2026-02-03 22:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 1, '2026-02-04 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 1, '2026-02-04 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 1, '2026-02-05 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 1, '2026-02-06 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 1, '2026-02-06 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 1, '2026-02-07 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 1, '2026-02-07 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 1, '2026-02-08 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 1, '2026-02-08 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 1, '2026-02-09 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 1, '2026-02-09 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 1, '2026-02-10 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 1, '2026-02-10 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 1, '2026-02-11 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 1, '2026-02-11 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, 1, '2026-02-12 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 1, '2026-02-12 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 1, '2026-02-13 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, 1, '2026-02-13 19:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(27, 1, '2026-02-14 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 1, '2026-02-14 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(29, 1, '2026-02-15 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 1, '2026-02-15 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, 2, '2026-02-01 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, 2, '2026-02-02 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, 2, '2026-02-02 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(34, 2, '2026-02-03 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(35, 2, '2026-02-03 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(36, 2, '2026-02-04 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(37, 2, '2026-02-04 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(38, 2, '2026-02-05 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(39, 2, '2026-02-05 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(40, 2, '2026-02-06 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(41, 2, '2026-02-06 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(42, 2, '2026-02-07 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(43, 2, '2026-02-07 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(44, 2, '2026-02-08 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(45, 2, '2026-02-08 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(46, 2, '2026-02-09 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(47, 2, '2026-02-09 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(48, 2, '2026-02-10 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(49, 2, '2026-02-10 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(50, 2, '2026-02-11 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(51, 2, '2026-02-11 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(52, 2, '2026-02-12 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(53, 2, '2026-02-12 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(54, 2, '2026-02-13 09:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(55, 2, '2026-02-13 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(56, 2, '2026-02-14 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(57, 2, '2026-02-14 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(58, 2, '2026-02-15 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(59, 2, '2026-02-15 18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(60, 2, '2026-02-16 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(61, 3, '2026-02-01 07:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(62, 3, '2026-02-01 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(63, 3, '2026-02-02 07:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(64, 3, '2026-02-02 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(65, 3, '2026-02-03 07:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(66, 3, '2026-02-03 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(67, 3, '2026-02-04 07:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(68, 3, '2026-02-04 15:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(69, 3, '2026-02-05 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(70, 3, '2026-02-05 15:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(71, 3, '2026-02-06 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(72, 3, '2026-02-06 15:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(73, 3, '2026-02-07 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(74, 3, '2026-02-07 15:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(75, 3, '2026-02-11 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(76, 3, '2026-02-11 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(77, 3, '2026-02-12 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(78, 3, '2026-02-12 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(79, 3, '2026-02-13 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(80, 3, '2026-02-13 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(81, 3, '2026-02-14 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(82, 3, '2026-02-14 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(83, 3, '2026-02-15 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(84, 3, '2026-02-15 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `att_punches`
--
ALTER TABLE `att_punches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `terminal_id` (`terminal_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `att_punches`
--
ALTER TABLE `att_punches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `att_punches`
--
ALTER TABLE `att_punches`
  ADD CONSTRAINT `FK63030A9050F52429` FOREIGN KEY (`employee_id`) REFERENCES `hr_employee` (`id`),
  ADD CONSTRAINT `FK63030A9060342464` FOREIGN KEY (`terminal_id`) REFERENCES `att_terminal` (`id`);

;
;
;

-- fch_attendance.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:46 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_attendance`
--

CREATE TABLE `fch_attendance` (
  `uniq_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) DEFAULT NULL,
  `emp_dept` varchar(100) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time_in` datetime DEFAULT NULL,
  `time_out` datetime DEFAULT NULL,
  `shift_time_in` datetime DEFAULT NULL,
  `shift_time_out` datetime DEFAULT NULL,
  `total_hrs` decimal(8,2) DEFAULT 0.00,
  `adj_date` date DEFAULT NULL,
  `adj_time_in` datetime DEFAULT NULL,
  `adj_time_out` datetime DEFAULT NULL,
  `adj_shift_time_in` datetime DEFAULT NULL,
  `adj_shift_time_out` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_attendance`
--

INSERT INTO `fch_attendance` (`uniq_id`, `employee_id`, `emp_fullname`, `emp_dept`, `date`, `time_in`, `time_out`, `shift_time_in`, `shift_time_out`, `total_hrs`) VALUES
(1, 1, 'Jai Duena', 'Admin', '2026-02-03', NULL, '2026-02-03 14:00:00', '2026-02-03 06:00:00', '2026-02-03 14:00:00', 0.00),
(2, 1, 'Jai Duena', 'Admin', '2026-02-04', '2026-02-04 06:00:00', '2026-02-04 14:00:00', '2026-02-04 06:00:00', '2026-02-04 14:00:00', 8.00),
(3, 1, 'Jai Duena', 'Admin', '2026-02-05', '2026-02-05 06:00:00', NULL, '2026-02-05 06:00:00', '2026-02-05 14:00:00', 0.00),
(4, 1, 'Jai Duena', 'Admin', '2026-02-06', '2026-02-06 06:00:00', '2026-02-06 14:00:00', '2026-02-06 06:00:00', '2026-02-06 14:00:00', 8.00),
(5, 1, 'Jai Duena', 'Admin', '2026-02-07', '2026-02-07 06:00:00', '2026-02-07 14:00:00', '2026-02-07 06:00:00', '2026-02-07 14:00:00', 8.00),
(6, 1, 'Jai Duena', 'Admin', '2026-02-08', '2026-02-08 06:00:00', '2026-02-08 14:00:00', '2026-02-08 06:00:00', '2026-02-08 14:00:00', 8.00),
(7, 1, 'Jai Duena', 'Admin', '2026-02-09', '2026-02-09 06:00:00', '2026-02-09 14:00:00', '2026-02-09 06:00:00', '2026-02-09 14:00:00', 8.00),
(8, 1, 'Jai Duena', 'Admin', '2026-02-10', '2026-02-10 06:00:00', '2026-02-10 14:00:00', '2026-02-10 06:00:00', '2026-02-10 14:00:00', 8.00),
(9, 1, 'Jai Duena', 'Admin', '2026-02-11', '2026-02-11 06:00:00', '2026-02-11 14:00:00', '2026-02-11 06:00:00', '2026-02-11 14:00:00', 8.00),
(10, 1, 'Jai Duena', 'Admin', '2026-02-12', '2026-02-12 06:00:00', '2026-02-12 14:00:00', '2026-02-12 06:00:00', '2026-02-12 14:00:00', 8.00),
(11, 1, 'Jai Duena', 'Admin', '2026-02-13', '2026-02-13 06:00:00', '2026-02-13 19:00:00', '2026-02-13 06:00:00', '2026-02-13 14:00:00', 13.00),
(12, 1, 'Jai Duena', 'Admin', '2026-02-14', '2026-02-14 06:00:00', '2026-02-14 14:00:00', '2026-02-14 06:00:00', '2026-02-14 14:00:00', 8.00),
(13, 1, 'Jai Duena', 'Admin', '2026-02-15', '2026-02-15 06:00:00', '2026-02-15 14:00:00', '2026-02-15 06:00:00', '2026-02-15 14:00:00', 8.00),
(14, 2, 'Supervisor Supervisor', 'IT', '2026-02-01', '2026-02-01 18:00:00', '2026-02-02 06:00:00', '2026-02-01 18:00:00', '2026-02-02 06:00:00', 12.00),
(15, 2, 'Supervisor Supervisor', 'IT', '2026-02-02', '2026-02-02 18:00:00', '2026-02-03 06:00:00', '2026-02-02 18:00:00', '2026-02-03 06:00:00', 12.00),
(16, 2, 'Supervisor Supervisor', 'IT', '2026-02-03', '2026-02-03 18:00:00', '2026-02-04 06:00:00', '2026-02-03 18:00:00', '2026-02-04 06:00:00', 12.00),
(17, 2, 'Supervisor Supervisor', 'IT', '2026-02-04', '2026-02-04 18:00:00', '2026-02-05 06:00:00', '2026-02-04 18:00:00', '2026-02-05 06:00:00', 12.00),
(18, 2, 'Supervisor Supervisor', 'IT', '2026-02-05', '2026-02-05 18:00:00', '2026-02-06 06:00:00', '2026-02-05 18:00:00', '2026-02-06 06:00:00', 12.00),
(19, 2, 'Supervisor Supervisor', 'IT', '2026-02-06', '2026-02-06 18:00:00', '2026-02-07 06:00:00', '2026-02-06 18:00:00', '2026-02-07 06:00:00', 12.00),
(20, 2, 'Supervisor Supervisor', 'IT', '2026-02-07', '2026-02-07 18:00:00', '2026-02-08 06:00:00', '2026-02-07 18:00:00', '2026-02-08 06:00:00', 12.00),
(21, 2, 'Supervisor Supervisor', 'IT', '2026-02-08', '2026-02-08 18:00:00', '2026-02-09 06:00:00', '2026-02-08 18:00:00', '2026-02-09 06:00:00', 12.00),
(22, 2, 'Supervisor Supervisor', 'IT', '2026-02-09', '2026-02-09 18:00:00', '2026-02-10 06:00:00', '2026-02-09 18:00:00', '2026-02-10 06:00:00', 12.00),
(23, 2, 'Supervisor Supervisor', 'IT', '2026-02-10', '2026-02-10 18:00:00', '2026-02-11 06:00:00', '2026-02-10 18:00:00', '2026-02-11 06:00:00', 12.00),
(24, 2, 'Supervisor Supervisor', 'IT', '2026-02-11', '2026-02-11 18:00:00', '2026-02-12 06:00:00', '2026-02-11 18:00:00', '2026-02-12 06:00:00', 12.00),
(25, 2, 'Supervisor Supervisor', 'IT', '2026-02-12', '2026-02-12 18:00:00', NULL, '2026-02-12 18:00:00', '2026-02-12 06:00:00', 0.00),
(26, 2, 'Supervisor Supervisor', 'IT', '2026-02-13', '2026-02-13 18:00:00', '2026-02-14 06:00:00', '2026-02-13 18:00:00', '2026-02-14 06:00:00', 12.00),
(27, 2, 'Supervisor Supervisor', 'IT', '2026-02-14', '2026-02-14 18:00:00', '2026-02-15 06:00:00', '2026-02-14 18:00:00', '2026-02-15 06:00:00', 12.00),
(28, 2, 'Supervisor Supervisor', 'IT', '2026-02-15', '2026-02-15 18:00:00', '2026-02-16 06:00:00', '2026-02-15 18:00:00', '2026-02-16 06:00:00', 12.00),
(29, 3, 'Employee Employee', 'IT', '2026-02-01', '2026-02-01 07:00:00', '2026-02-01 14:00:00', '2026-02-01 06:00:00', '2026-02-01 14:00:00', 7.00),
(30, 3, 'Employee Employee', 'IT', '2026-02-02', '2026-02-02 07:00:00', '2026-02-02 14:00:00', '2026-02-02 06:00:00', '2026-02-02 14:00:00', 7.00),
(31, 3, 'Employee Employee', 'IT', '2026-02-03', '2026-02-03 07:00:00', '2026-02-03 14:00:00', '2026-02-03 06:00:00', '2026-02-03 14:00:00', 7.00),
(32, 3, 'Employee Employee', 'IT', '2026-02-04', '2026-02-04 07:00:00', '2026-02-04 15:00:00', '2026-02-04 06:00:00', '2026-02-04 14:00:00', 8.00),
(33, 3, 'Employee Employee', 'IT', '2026-02-05', '2026-02-05 06:00:00', '2026-02-05 15:00:00', '2026-02-05 06:00:00', '2026-02-05 14:00:00', 9.00),
(34, 3, 'Employee Employee', 'IT', '2026-02-06', '2026-02-06 06:00:00', '2026-02-06 15:00:00', '2026-02-06 06:00:00', '2026-02-06 14:00:00', 9.00),
(35, 3, 'Employee Employee', 'IT', '2026-02-07', '2026-02-07 06:00:00', '2026-02-07 15:00:00', '2026-02-07 06:00:00', '2026-02-07 14:00:00', 9.00),
(36, 3, 'Employee Employee', 'IT', '2026-02-11', '2026-02-11 06:00:00', '2026-02-11 14:00:00', '2026-02-11 06:00:00', '2026-02-11 14:00:00', 8.00),
(37, 3, 'Employee Employee', 'IT', '2026-02-12', '2026-02-12 06:00:00', '2026-02-12 14:00:00', '2026-02-12 06:00:00', '2026-02-12 14:00:00', 8.00),
(38, 3, 'Employee Employee', 'IT', '2026-02-13', '2026-02-13 06:00:00', '2026-02-13 14:00:00', '2026-02-13 06:00:00', '2026-02-13 14:00:00', 8.00),
(39, 3, 'Employee Employee', 'IT', '2026-02-14', '2026-02-14 06:00:00', '2026-02-14 14:00:00', '2026-02-14 06:00:00', '2026-02-14 14:00:00', 8.00),
(40, 3, 'Employee Employee', 'IT', '2026-02-15', '2026-02-15 06:00:00', '2026-02-15 14:00:00', '2026-02-15 06:00:00', '2026-02-15 14:00:00', 8.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_attendance`
--
ALTER TABLE `fch_attendance`
  ADD PRIMARY KEY (`uniq_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_attendance`
--
ALTER TABLE `fch_attendance`
  MODIFY `uniq_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

;
;
;

-- fch_attendance_summary.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_attendance_summary`
--

CREATE TABLE `fch_attendance_summary` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(255) DEFAULT NULL,
  `emp_dept` varchar(100) DEFAULT NULL,
  `payroll_start` date NOT NULL,
  `payroll_end` date NOT NULL,
  `reg_hrs` decimal(8,2) DEFAULT 0.00,
  `ot_hrs` decimal(8,2) DEFAULT 0.00,
  `nd_hrs` decimal(8,2) DEFAULT 0.00,
  `ot_nd_hrs` decimal(8,2) DEFAULT 0.00,
  `reg_holiday_days` decimal(5,2) DEFAULT 0.00,
  `reg_holiday_hrs` decimal(8,2) DEFAULT 0.00,
  `reg_holiday_ot_hrs` decimal(8,2) DEFAULT 0.00,
  `reg_holiday_nd_hrs` decimal(8,2) DEFAULT 0.00,
  `reg_holiday_ot_nd_hrs` decimal(8,2) DEFAULT 0.00,
  `reg_holiday_rd_hrs` decimal(5,2) DEFAULT 0.00,
  `reg_holiday_rd_ot_hrs` decimal(5,2) DEFAULT 0.00,
  `reg_holiday_rd_nd_hrs` decimal(5,2) DEFAULT 0.00,
  `reg_holiday_rd_ot_nd_hrs` decimal(5,2) DEFAULT 0.00,
  `spec_holiday_hrs` decimal(8,2) DEFAULT 0.00,
  `spec_holiday_ot_hrs` decimal(8,2) DEFAULT 0.00,
  `spec_holiday_nd_hrs` decimal(8,2) DEFAULT 0.00,
  `spec_holiday_ot_nd_hrs` decimal(8,2) DEFAULT 0.00,
  `spec_holiday_rd_hrs` decimal(5,2) DEFAULT 0.00,
  `spec_holiday_rd_ot_hrs` decimal(5,2) DEFAULT 0.00,
  `spec_holiday_rd_nd_hrs` decimal(5,2) DEFAULT 0.00,
  `spec_holiday_rd_ot_nd_hrs` decimal(5,2) DEFAULT 0.00,
  `rd_hrs` decimal(8,2) DEFAULT 0.00,
  `rd_ot_hrs` decimal(8,2) DEFAULT 0.00,
  `rd_nd_hrs` decimal(8,2) DEFAULT 0.00,
  `rd_ot_nd_hrs` decimal(8,2) DEFAULT 0.00,
  `late_mins` int(11) DEFAULT 0,
  `leave_days` decimal(5,2) DEFAULT 0.00,
  `adj_reg_hrs` decimal(10,2) DEFAULT NULL,
  `adj_ot_hrs` decimal(10,2) DEFAULT NULL,
  `adj_nd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_ot_nd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_days` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_hrs` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_ot_hrs` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_nd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_ot_nd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_rd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_rd_ot_hrs` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_rd_nd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_rd_ot_nd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_hrs` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_ot_hrs` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_nd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_ot_nd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_rd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_rd_ot_hrs` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_rd_nd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_rd_ot_nd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_rd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_rd_ot_hrs` decimal(10,2) DEFAULT NULL,
  `adj_rd_nd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_rd_ot_nd_hrs` decimal(10,2) DEFAULT NULL,
  `adj_late_mins` decimal(10,2) DEFAULT NULL,
  `adj_leave_days` decimal(10,2) DEFAULT NULL,
  `adj_reason` text DEFAULT NULL,
  `adj_by` int(11) DEFAULT NULL,
  `adj_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_attendance_summary`
--

INSERT INTO `fch_attendance_summary` (`id`, `batch_id`, `employee_id`, `emp_fullname`, `emp_dept`, `payroll_start`, `payroll_end`, `reg_hrs`, `ot_hrs`, `nd_hrs`, `ot_nd_hrs`, `reg_holiday_days`, `reg_holiday_hrs`, `reg_holiday_ot_hrs`, `reg_holiday_nd_hrs`, `reg_holiday_ot_nd_hrs`, `reg_holiday_rd_hrs`, `reg_holiday_rd_ot_hrs`, `reg_holiday_rd_nd_hrs`, `reg_holiday_rd_ot_nd_hrs`, `spec_holiday_hrs`, `spec_holiday_ot_hrs`, `spec_holiday_nd_hrs`, `spec_holiday_ot_nd_hrs`, `spec_holiday_rd_hrs`, `spec_holiday_rd_ot_hrs`, `spec_holiday_rd_nd_hrs`, `spec_holiday_rd_ot_nd_hrs`, `rd_hrs`, `rd_ot_hrs`, `rd_nd_hrs`, `rd_ot_nd_hrs`, `late_mins`, `leave_days`, `adj_reg_hrs`, `adj_ot_hrs`, `adj_nd_hrs`, `adj_ot_nd_hrs`, `adj_reg_holiday_days`, `adj_reg_holiday_hrs`, `adj_reg_holiday_ot_hrs`, `adj_reg_holiday_nd_hrs`, `adj_reg_holiday_ot_nd_hrs`, `adj_reg_holiday_rd_hrs`, `adj_reg_holiday_rd_ot_hrs`, `adj_reg_holiday_rd_nd_hrs`, `adj_reg_holiday_rd_ot_nd_hrs`, `adj_spec_holiday_hrs`, `adj_spec_holiday_ot_hrs`, `adj_spec_holiday_nd_hrs`, `adj_spec_holiday_ot_nd_hrs`, `adj_spec_holiday_rd_hrs`, `adj_spec_holiday_rd_ot_hrs`, `adj_spec_holiday_rd_nd_hrs`, `adj_spec_holiday_rd_ot_nd_hrs`, `adj_rd_hrs`, `adj_rd_ot_hrs`, `adj_rd_nd_hrs`, `adj_rd_ot_nd_hrs`, `adj_late_mins`, `adj_leave_days`, `adj_reason`, `adj_by`, `adj_at`) VALUES
(1, 1, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 72.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 24.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 1, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 1, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 1, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 1, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 1, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 1, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 1, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 1, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 2, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 2, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 72.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 24.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 2, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 2, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 2, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 2, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 2, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 2, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 2, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 3, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 3, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 72.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 24.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 3, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 4, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, 4, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 72.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 24.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 4, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 4, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, 4, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(27, 4, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 4, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(29, 4, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 4, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, 5, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, 5, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 72.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 24.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, 5, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(34, 5, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(35, 5, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(36, 5, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(37, 5, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(38, 5, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(39, 5, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(40, 6, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(41, 6, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 72.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 24.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(42, 6, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(43, 6, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(44, 6, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(45, 6, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(46, 6, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(47, 6, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(48, 6, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(49, 7, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(50, 7, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 72.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 24.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(51, 7, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(52, 7, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(53, 7, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(54, 7, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(55, 7, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(56, 7, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(57, 7, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(58, 8, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(59, 8, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(60, 8, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(61, 8, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(62, 8, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(63, 8, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(64, 8, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(65, 8, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(66, 8, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(67, 9, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(68, 9, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(69, 9, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(70, 9, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(71, 9, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(72, 9, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(73, 9, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(74, 9, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(75, 9, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(76, 10, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(77, 10, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(78, 10, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(79, 10, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(80, 10, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(81, 10, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(82, 10, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(83, 10, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(84, 10, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(85, 11, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(86, 11, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(87, 11, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(88, 11, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(89, 11, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(90, 11, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(91, 11, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(92, 11, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(93, 11, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(94, 12, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(95, 12, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(96, 12, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(97, 12, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(98, 12, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(99, 12, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(100, 12, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(101, 12, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(102, 12, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(103, 13, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(104, 13, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(105, 13, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(106, 13, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(107, 13, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(108, 13, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(109, 13, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(110, 13, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(111, 13, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(112, 14, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(113, 14, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(114, 14, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(115, 14, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(116, 14, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(117, 14, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(118, 14, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(119, 14, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `fch_attendance_summary` (`id`, `batch_id`, `employee_id`, `emp_fullname`, `emp_dept`, `payroll_start`, `payroll_end`, `reg_hrs`, `ot_hrs`, `nd_hrs`, `ot_nd_hrs`, `reg_holiday_days`, `reg_holiday_hrs`, `reg_holiday_ot_hrs`, `reg_holiday_nd_hrs`, `reg_holiday_ot_nd_hrs`, `reg_holiday_rd_hrs`, `reg_holiday_rd_ot_hrs`, `reg_holiday_rd_nd_hrs`, `reg_holiday_rd_ot_nd_hrs`, `spec_holiday_hrs`, `spec_holiday_ot_hrs`, `spec_holiday_nd_hrs`, `spec_holiday_ot_nd_hrs`, `spec_holiday_rd_hrs`, `spec_holiday_rd_ot_hrs`, `spec_holiday_rd_nd_hrs`, `spec_holiday_rd_ot_nd_hrs`, `rd_hrs`, `rd_ot_hrs`, `rd_nd_hrs`, `rd_ot_nd_hrs`, `late_mins`, `leave_days`, `adj_reg_hrs`, `adj_ot_hrs`, `adj_nd_hrs`, `adj_ot_nd_hrs`, `adj_reg_holiday_days`, `adj_reg_holiday_hrs`, `adj_reg_holiday_ot_hrs`, `adj_reg_holiday_nd_hrs`, `adj_reg_holiday_ot_nd_hrs`, `adj_reg_holiday_rd_hrs`, `adj_reg_holiday_rd_ot_hrs`, `adj_reg_holiday_rd_nd_hrs`, `adj_reg_holiday_rd_ot_nd_hrs`, `adj_spec_holiday_hrs`, `adj_spec_holiday_ot_hrs`, `adj_spec_holiday_nd_hrs`, `adj_spec_holiday_ot_nd_hrs`, `adj_spec_holiday_rd_hrs`, `adj_spec_holiday_rd_ot_hrs`, `adj_spec_holiday_rd_nd_hrs`, `adj_spec_holiday_rd_ot_nd_hrs`, `adj_rd_hrs`, `adj_rd_ot_hrs`, `adj_rd_nd_hrs`, `adj_rd_ot_nd_hrs`, `adj_late_mins`, `adj_leave_days`, `adj_reason`, `adj_by`, `adj_at`) VALUES
(120, 14, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(121, 15, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(122, 15, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(123, 15, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(124, 15, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(125, 15, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(126, 15, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(127, 15, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(128, 15, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(129, 15, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(130, 16, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(131, 16, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(132, 16, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(133, 16, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(134, 16, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(135, 16, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(136, 16, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(137, 16, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(138, 16, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(139, 17, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(140, 17, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(141, 17, 9, 'Rizal, Jose', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(142, 17, 5, 'Cruz, Juan D', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(143, 17, 4, 'Management, Management M', 'Management', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(144, 17, 6, 'Pedro, Pedro P', 'IT', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(145, 17, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(146, 17, 7, 'One, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(147, 17, 8, '2, Test', 'Admin', '2026-02-01', '2026-02-15', 0.00, 0.00, 0.00, 0.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(148, 18, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(149, 18, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(150, 18, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(151, 19, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(152, 19, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(153, 19, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(154, 20, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(155, 20, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(156, 20, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(157, 21, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(158, 21, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(159, 21, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(160, 22, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(161, 22, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(162, 22, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(163, 23, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(164, 23, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(165, 23, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(166, 24, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(167, 24, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(168, 24, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(169, 25, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(170, 25, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(171, 25, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(172, 26, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(173, 26, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(174, 26, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(175, 27, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(176, 27, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(177, 27, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(178, 28, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(179, 28, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(180, 28, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(181, 29, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(182, 29, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(183, 29, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(184, 30, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(185, 30, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(186, 30, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(187, 31, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(188, 31, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(189, 31, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(190, 32, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(191, 32, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(192, 32, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(193, 33, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(194, 33, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(195, 33, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(196, 34, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(197, 34, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(198, 34, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(199, 35, 3, 'Employee, Employee E', 'IT', '2026-02-01', '2026-02-15', 69.00, 0.00, 0.00, 0.00, 0.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 200, 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(200, 35, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-15', 64.00, 0.00, 0.00, 0.00, 1.00, 0.00, 3.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 0.00, 0.00, 0.00, 8.00, 4.00, 0.00, 0.00, 16.00, 4.00, 0.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(201, 35, 2, 'Supervisor, Supervisor S', 'IT', '2026-02-01', '2026-02-15', 120.00, 0.00, 80.00, 0.00, 0.00, 12.00, 0.00, 16.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6.00, 0.00, 8.00, 0.00, 6.00, 0.00, 8.00, 0.00, 12.00, 0.00, 8.00, 0.00, 0, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_attendance_summary`
--
ALTER TABLE `fch_attendance_summary`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_attendance_summary`
--
ALTER TABLE `fch_attendance_summary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=202;

;
;
;

-- fch_reg_hrs.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:50 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_reg_hrs`
--

CREATE TABLE `fch_reg_hrs` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `reg_date` date NOT NULL,
  `reg_start` datetime DEFAULT NULL,
  `reg_end` datetime DEFAULT NULL,
  `total_hrs` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_reg_hrs`
--

INSERT INTO `fch_reg_hrs` (`id`, `employee_id`, `emp_fullname`, `emp_dept`, `reg_date`, `reg_start`, `reg_end`, `total_hrs`) VALUES
(1, 1, 'Jai Duena', 'Admin', '2026-02-04', '2026-02-04 06:00:00', '2026-02-04 14:00:00', 8.00),
(2, 1, 'Jai Duena', 'Admin', '2026-02-06', '2026-02-06 06:00:00', '2026-02-06 14:00:00', 8.00),
(3, 1, 'Jai Duena', 'Admin', '2026-02-07', '2026-02-07 06:00:00', '2026-02-07 14:00:00', 8.00),
(4, 1, 'Jai Duena', 'Admin', '2026-02-08', '2026-02-08 06:00:00', '2026-02-08 14:00:00', 8.00),
(5, 1, 'Jai Duena', 'Admin', '2026-02-09', '2026-02-09 06:00:00', '2026-02-09 14:00:00', 8.00),
(6, 1, 'Jai Duena', 'Admin', '2026-02-10', '2026-02-10 06:00:00', '2026-02-10 14:00:00', 8.00),
(7, 1, 'Jai Duena', 'Admin', '2026-02-11', '2026-02-11 06:00:00', '2026-02-11 14:00:00', 8.00),
(8, 1, 'Jai Duena', 'Admin', '2026-02-12', '2026-02-12 06:00:00', '2026-02-12 14:00:00', 8.00),
(9, 1, 'Jai Duena', 'Admin', '2026-02-13', '2026-02-13 06:00:00', '2026-02-13 14:00:00', 8.00),
(10, 1, 'Jai Duena', 'Admin', '2026-02-14', '2026-02-14 06:00:00', '2026-02-14 14:00:00', 8.00),
(11, 1, 'Jai Duena', 'Admin', '2026-02-15', '2026-02-15 06:00:00', '2026-02-15 14:00:00', 8.00),
(12, 2, 'Supervisor Supervisor', 'IT', '2026-02-01', '2026-02-01 18:00:00', '2026-02-02 06:00:00', 12.00),
(13, 2, 'Supervisor Supervisor', 'IT', '2026-02-02', '2026-02-02 18:00:00', '2026-02-03 06:00:00', 12.00),
(14, 2, 'Supervisor Supervisor', 'IT', '2026-02-03', '2026-02-03 18:00:00', '2026-02-04 06:00:00', 12.00),
(15, 2, 'Supervisor Supervisor', 'IT', '2026-02-04', '2026-02-04 18:00:00', '2026-02-05 06:00:00', 12.00),
(16, 2, 'Supervisor Supervisor', 'IT', '2026-02-05', '2026-02-05 18:00:00', '2026-02-06 06:00:00', 12.00),
(17, 2, 'Supervisor Supervisor', 'IT', '2026-02-06', '2026-02-06 18:00:00', '2026-02-07 06:00:00', 12.00),
(18, 2, 'Supervisor Supervisor', 'IT', '2026-02-07', '2026-02-07 18:00:00', '2026-02-08 06:00:00', 12.00),
(19, 2, 'Supervisor Supervisor', 'IT', '2026-02-08', '2026-02-08 18:00:00', '2026-02-09 06:00:00', 12.00),
(20, 2, 'Supervisor Supervisor', 'IT', '2026-02-09', '2026-02-09 18:00:00', '2026-02-10 06:00:00', 12.00),
(21, 2, 'Supervisor Supervisor', 'IT', '2026-02-10', '2026-02-10 18:00:00', '2026-02-11 06:00:00', 12.00),
(22, 2, 'Supervisor Supervisor', 'IT', '2026-02-11', '2026-02-11 18:00:00', '2026-02-12 06:00:00', 12.00),
(23, 2, 'Supervisor Supervisor', 'IT', '2026-02-13', '2026-02-13 18:00:00', '2026-02-14 06:00:00', 12.00),
(24, 2, 'Supervisor Supervisor', 'IT', '2026-02-14', '2026-02-14 18:00:00', '2026-02-15 06:00:00', 12.00),
(25, 2, 'Supervisor Supervisor', 'IT', '2026-02-15', '2026-02-15 18:00:00', '2026-02-16 06:00:00', 12.00),
(26, 3, 'Employee Employee', 'IT', '2026-02-01', '2026-02-01 07:00:00', '2026-02-01 14:00:00', 7.00),
(27, 3, 'Employee Employee', 'IT', '2026-02-02', '2026-02-02 07:00:00', '2026-02-02 14:00:00', 7.00),
(28, 3, 'Employee Employee', 'IT', '2026-02-03', '2026-02-03 07:00:00', '2026-02-03 14:00:00', 7.00),
(29, 3, 'Employee Employee', 'IT', '2026-02-04', '2026-02-04 07:00:00', '2026-02-04 14:00:00', 7.00),
(30, 3, 'Employee Employee', 'IT', '2026-02-05', '2026-02-05 06:00:00', '2026-02-05 14:00:00', 8.00),
(31, 3, 'Employee Employee', 'IT', '2026-02-06', '2026-02-06 06:00:00', '2026-02-06 14:00:00', 8.00),
(32, 3, 'Employee Employee', 'IT', '2026-02-07', '2026-02-07 06:00:00', '2026-02-07 14:00:00', 8.00),
(33, 3, 'Employee Employee', 'IT', '2026-02-11', '2026-02-11 06:00:00', '2026-02-11 14:00:00', 8.00),
(34, 3, 'Employee Employee', 'IT', '2026-02-12', '2026-02-12 06:00:00', '2026-02-12 14:00:00', 8.00),
(35, 3, 'Employee Employee', 'IT', '2026-02-13', '2026-02-13 06:00:00', '2026-02-13 14:00:00', 8.00),
(36, 3, 'Employee Employee', 'IT', '2026-02-14', '2026-02-14 06:00:00', '2026-02-14 14:00:00', 8.00),
(37, 3, 'Employee Employee', 'IT', '2026-02-15', '2026-02-15 06:00:00', '2026-02-15 14:00:00', 8.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_reg_hrs`
--
ALTER TABLE `fch_reg_hrs`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_reg_hrs`
--
ALTER TABLE `fch_reg_hrs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

;
;
;

-- fch_late.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:48 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_late`
--

CREATE TABLE `fch_late` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `late_date` date DEFAULT NULL,
  `late_mins` int(11) DEFAULT NULL,
  `late_time_in` datetime DEFAULT NULL,
  `shift_time_in` datetime DEFAULT NULL,
  `total_hrs` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_late`
--

INSERT INTO `fch_late` (`id`, `employee_id`, `emp_fullname`, `emp_dept`, `late_date`, `late_mins`, `late_time_in`, `shift_time_in`, `total_hrs`) VALUES
(1, 3, 'Employee Employee', 'IT', '2026-02-01', 50, '2026-02-01 07:00:00', '2026-02-01 06:00:00', 7.00),
(2, 3, 'Employee Employee', 'IT', '2026-02-02', 50, '2026-02-02 07:00:00', '2026-02-02 06:00:00', 7.00),
(3, 3, 'Employee Employee', 'IT', '2026-02-03', 50, '2026-02-03 07:00:00', '2026-02-03 06:00:00', 7.00),
(4, 3, 'Employee Employee', 'IT', '2026-02-04', 50, '2026-02-04 07:00:00', '2026-02-04 06:00:00', 8.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_late`
--
ALTER TABLE `fch_late`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_late`
--
ALTER TABLE `fch_late`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

;
;
;

-- fch_ot.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:48 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_ot`
--

CREATE TABLE `fch_ot` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `ot_date` date NOT NULL,
  `ot_start` datetime NOT NULL,
  `ot_end` datetime NOT NULL,
  `is_restday` tinyint(1) NOT NULL DEFAULT 0,
  `total_hrs` decimal(8,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_ot`
--

INSERT INTO `fch_ot` (`id`, `employee_id`, `emp_fullname`, `emp_dept`, `ot_date`, `ot_start`, `ot_end`, `is_restday`, `total_hrs`) VALUES
(12, 1, 'Duena, Jai C', 'Admin', '2026-02-22', '2026-02-22 14:40:00', '2026-02-23 02:41:00', 0, 12.02),
(13, 1, 'Duena, Jai C', 'Admin', '2026-02-27', '2026-02-27 21:48:00', '2026-02-28 02:48:00', 0, 5.00),
(14, 1, 'Duena, Jai C', 'Admin', '2026-02-01', '2026-02-01 14:00:00', '2026-02-01 17:00:00', 0, 3.00),
(15, 1, 'Duena, Jai C', 'Admin', '2026-02-13', '2026-02-13 15:43:00', '2026-02-13 19:43:00', 1, 4.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_ot`
--
ALTER TABLE `fch_ot`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_ot`
--
ALTER TABLE `fch_ot`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

;
;
;

-- fch_nd.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:48 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_nd`
--

CREATE TABLE `fch_nd` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `nd_date` date NOT NULL,
  `nd_start` datetime DEFAULT NULL,
  `nd_end` datetime DEFAULT NULL,
  `total_hrs` decimal(8,2) DEFAULT 0.00,
  `ot_nd` tinyint(1) NOT NULL DEFAULT 0,
  `is_restday` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_nd`
--

INSERT INTO `fch_nd` (`id`, `employee_id`, `emp_fullname`, `emp_dept`, `nd_date`, `nd_start`, `nd_end`, `total_hrs`, `ot_nd`, `is_restday`) VALUES
(1, 2, 'Supervisor Supervisor', 'IT', '2026-02-01', '2026-02-01 22:00:00', '2026-02-02 06:00:00', 8.00, 0, 0),
(2, 2, 'Supervisor Supervisor', 'IT', '2026-02-02', '2026-02-02 22:00:00', '2026-02-03 06:00:00', 8.00, 0, 0),
(3, 2, 'Supervisor Supervisor', 'IT', '2026-02-03', '2026-02-03 22:00:00', '2026-02-04 06:00:00', 8.00, 0, 0),
(4, 2, 'Supervisor Supervisor', 'IT', '2026-02-04', '2026-02-04 22:00:00', '2026-02-05 06:00:00', 8.00, 0, 0),
(5, 2, 'Supervisor Supervisor', 'IT', '2026-02-05', '2026-02-05 22:00:00', '2026-02-06 06:00:00', 8.00, 0, 0),
(6, 2, 'Supervisor Supervisor', 'IT', '2026-02-06', '2026-02-06 22:00:00', '2026-02-07 06:00:00', 8.00, 0, 0),
(7, 2, 'Supervisor Supervisor', 'IT', '2026-02-07', '2026-02-07 22:00:00', '2026-02-08 06:00:00', 8.00, 0, 0),
(8, 2, 'Supervisor Supervisor', 'IT', '2026-02-08', '2026-02-08 22:00:00', '2026-02-09 06:00:00', 8.00, 0, 0),
(9, 2, 'Supervisor Supervisor', 'IT', '2026-02-09', '2026-02-09 22:00:00', '2026-02-10 06:00:00', 8.00, 0, 0),
(10, 2, 'Supervisor Supervisor', 'IT', '2026-02-10', '2026-02-10 22:00:00', '2026-02-11 06:00:00', 8.00, 0, 0),
(11, 2, 'Supervisor Supervisor', 'IT', '2026-02-11', '2026-02-11 22:00:00', '2026-02-12 06:00:00', 8.00, 0, 0),
(12, 2, 'Supervisor Supervisor', 'IT', '2026-02-13', '2026-02-13 22:00:00', '2026-02-14 06:00:00', 8.00, 0, 1),
(13, 2, 'Supervisor Supervisor', 'IT', '2026-02-14', '2026-02-14 22:00:00', '2026-02-15 06:00:00', 8.00, 0, 0),
(14, 2, 'Supervisor Supervisor', 'IT', '2026-02-15', '2026-02-15 22:00:00', '2026-02-16 06:00:00', 8.00, 0, 0),
(15, 1, 'Duena, Jai C', 'Admin', '2026-02-22', '2026-02-22 22:00:00', '2026-02-23 02:41:00', 4.68, 1, 0),
(16, 1, 'Duena, Jai C', 'Admin', '2026-02-27', '2026-02-27 22:00:00', '2026-02-28 02:48:00', 4.80, 1, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_nd`
--
ALTER TABLE `fch_nd`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_nd`
--
ALTER TABLE `fch_nd`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

;
;
;

-- fch_restday.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:51 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

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

;
;
;

-- fch_deductions_computation.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_deductions_computation`
--

CREATE TABLE `fch_deductions_computation` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `payroll_period` varchar(50) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `employee_sss` decimal(10,2) DEFAULT 0.00,
  `employer_sss` decimal(10,2) DEFAULT 0.00,
  `employee_philhealth` decimal(10,2) DEFAULT 0.00,
  `employer_philhealth` decimal(10,2) DEFAULT 0.00,
  `employee_pagibig` decimal(10,2) DEFAULT 0.00,
  `employer_pagibig` decimal(10,2) DEFAULT 0.00,
  `late_deduct` decimal(10,2) DEFAULT 0.00,
  `other_deduct` decimal(10,2) DEFAULT 0.00,
  `other_deduct_label` varchar(100) DEFAULT NULL,
  `employee_total_benefits` decimal(12,2) NOT NULL DEFAULT 0.00,
  `employer_total_benefits` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_deduct` decimal(10,2) DEFAULT 0.00,
  `total_contributions` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `adj_employee_sss` decimal(10,2) DEFAULT NULL,
  `adj_employer_sss` decimal(10,2) DEFAULT NULL,
  `adj_employee_philhealth` decimal(10,2) DEFAULT NULL,
  `adj_employer_philhealth` decimal(10,2) DEFAULT NULL,
  `adj_employee_pagibig` decimal(10,2) DEFAULT NULL,
  `adj_employer_pagibig` decimal(10,2) DEFAULT NULL,
  `adj_late_deduct` decimal(10,2) DEFAULT NULL,
  `adj_other_deduct` decimal(10,2) DEFAULT NULL,
  `adj_other_deduct_label` varchar(255) DEFAULT NULL,
  `adj_employee_total_benefits` decimal(10,2) DEFAULT NULL,
  `adj_employer_total_benefits` decimal(10,2) DEFAULT NULL,
  `adj_total_deduct` decimal(10,2) DEFAULT NULL,
  `adj_total_contributions` decimal(10,2) DEFAULT NULL,
  `adj_reason` text DEFAULT NULL,
  `adj_by` int(11) DEFAULT NULL,
  `adj_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fch_deductions_computation`
--

INSERT INTO `fch_deductions_computation` (`id`, `batch_id`, `payroll_period`, `employee_id`, `emp_fullname`, `emp_dept`, `employee_sss`, `employer_sss`, `employee_philhealth`, `employer_philhealth`, `employee_pagibig`, `employer_pagibig`, `late_deduct`, `other_deduct`, `other_deduct_label`, `employee_total_benefits`, `employer_total_benefits`, `total_deduct`, `total_contributions`, `created_at`, `adj_employee_sss`, `adj_employer_sss`, `adj_employee_philhealth`, `adj_employer_philhealth`, `adj_employee_pagibig`, `adj_employer_pagibig`, `adj_late_deduct`, `adj_other_deduct`, `adj_other_deduct_label`, `adj_employee_total_benefits`, `adj_employer_total_benefits`, `adj_total_deduct`, `adj_total_contributions`, `adj_reason`, `adj_by`, `adj_at`) VALUES
(1, 7, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 350.00, 710.00, 500.00, 500.00, 136.75, 136.75, NULL, NULL, NULL, 0.00, 0.00, 2333.50, 0.00, '2026-02-07 14:45:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 7, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 550.00, 1110.00, 500.00, 500.00, 200.00, 200.00, NULL, NULL, NULL, 0.00, 0.00, 3060.00, 0.00, '2026-02-07 14:45:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 7, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, NULL, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 14:45:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 7, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, NULL, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 14:45:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 7, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, NULL, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 14:45:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 7, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, NULL, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 14:45:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 7, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 800.00, 1630.00, 500.00, 500.00, 200.00, 200.00, NULL, NULL, NULL, 0.00, 0.00, 3830.00, 0.00, '2026-02-07 14:45:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 7, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, NULL, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 14:45:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 7, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, NULL, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 14:45:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 8, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 350.00, 710.00, 500.00, 500.00, 136.75, 136.75, NULL, NULL, NULL, 0.00, 0.00, 2333.50, 0.00, '2026-02-07 15:02:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 8, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 500.00, 1010.00, 500.00, 500.00, 197.95, 197.95, NULL, NULL, NULL, 0.00, 0.00, 2905.90, 0.00, '2026-02-07 15:02:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 8, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, NULL, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:02:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 8, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, NULL, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:02:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 8, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, NULL, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:02:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 8, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, NULL, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:02:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 8, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 800.00, 1630.00, 500.00, 500.00, 200.00, 200.00, NULL, NULL, NULL, 0.00, 0.00, 3830.00, 0.00, '2026-02-07 15:02:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 8, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, NULL, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:02:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 8, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, NULL, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:02:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 11, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 350.00, 710.00, 500.00, 500.00, 136.75, 136.75, 208.33, NULL, NULL, 0.00, 0.00, 2541.83, 0.00, '2026-02-07 15:09:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 11, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 500.00, 1010.00, 500.00, 500.00, 197.95, 197.95, 0.00, NULL, NULL, 0.00, 0.00, 2905.90, 0.00, '2026-02-07 15:09:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 11, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:09:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 11, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:09:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, 11, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:09:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 11, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:09:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 11, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 800.00, 1630.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 0.00, 0.00, 3830.00, 0.00, '2026-02-07 15:09:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, 11, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:09:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(27, 11, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:09:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 12, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 350.00, 710.00, 500.00, 500.00, 136.75, 136.75, 208.33, NULL, NULL, 0.00, 0.00, 2541.83, 0.00, '2026-02-07 15:59:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(29, 12, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 500.00, 1010.00, 500.00, 500.00, 197.95, 197.95, 0.00, NULL, NULL, 0.00, 0.00, 2905.90, 0.00, '2026-02-07 15:59:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 12, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:59:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, 12, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:59:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, 12, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:59:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, 12, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:59:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(34, 12, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 800.00, 1630.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 0.00, 0.00, 3830.00, 0.00, '2026-02-07 15:59:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(35, 12, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:59:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(36, 12, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 15:59:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(37, 13, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 350.00, 710.00, 500.00, 500.00, 136.75, 136.75, 208.33, NULL, NULL, 0.00, 0.00, 2541.83, 0.00, '2026-02-07 16:00:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(38, 13, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 500.00, 1010.00, 500.00, 500.00, 197.95, 197.95, 0.00, NULL, NULL, 0.00, 0.00, 2905.90, 0.00, '2026-02-07 16:00:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(39, 13, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 16:00:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(40, 13, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 16:00:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(41, 13, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 16:00:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(42, 13, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 16:00:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(43, 13, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 800.00, 1630.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 0.00, 0.00, 3830.00, 0.00, '2026-02-07 16:00:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(44, 13, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 16:00:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(45, 13, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 16:00:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(46, 14, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 350.00, 710.00, 500.00, 500.00, 136.75, 136.75, 208.33, NULL, NULL, 0.00, 0.00, 2541.83, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(47, 14, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 500.00, 1010.00, 500.00, 500.00, 197.95, 197.95, 0.00, NULL, NULL, 0.00, 0.00, 2905.90, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(48, 14, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(49, 14, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(50, 14, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(51, 14, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(52, 14, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 800.00, 1630.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 0.00, 0.00, 3830.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(53, 14, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(54, 14, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 0.00, 0.00, 1790.00, 0.00, '2026-02-07 16:03:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(55, 16, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 350.00, 710.00, 0.00, 0.00, 0.00, 0.00, 208.33, NULL, NULL, 350.00, 710.00, 558.33, 1060.00, '2026-02-07 16:37:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(56, 16, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 500.00, 1010.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 500.00, 1010.00, 500.00, 1510.00, '2026-02-07 16:37:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(57, 16, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 250.00, 510.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 250.00, 510.00, 250.00, 760.00, '2026-02-07 16:37:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(58, 16, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 250.00, 510.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 250.00, 510.00, 250.00, 760.00, '2026-02-07 16:37:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(59, 16, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 250.00, 510.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 250.00, 510.00, 250.00, 760.00, '2026-02-07 16:37:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(60, 16, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 250.00, 510.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 250.00, 510.00, 250.00, 760.00, '2026-02-07 16:37:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(61, 16, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 800.00, 1630.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 800.00, 1630.00, 800.00, 2430.00, '2026-02-07 16:37:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(62, 16, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 250.00, 510.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 250.00, 510.00, 250.00, 760.00, '2026-02-07 16:37:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(63, 16, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 250.00, 510.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 250.00, 510.00, 250.00, 760.00, '2026-02-07 16:37:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(64, 17, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 350.00, 710.00, 500.00, 500.00, 136.75, 136.75, 208.33, NULL, NULL, 986.75, 1346.75, 1195.08, 2333.50, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(65, 17, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 500.00, 1010.00, 500.00, 500.00, 197.95, 197.95, 0.00, NULL, NULL, 1197.95, 1707.95, 1197.95, 2905.90, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(66, 17, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 760.00, 1030.00, 760.00, 1790.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(67, 17, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 760.00, 1030.00, 760.00, 1790.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(68, 17, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 760.00, 1030.00, 760.00, 1790.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(69, 17, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 760.00, 1030.00, 760.00, 1790.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(70, 17, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 800.00, 1630.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 1500.00, 2330.00, 1500.00, 3830.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(71, 17, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 760.00, 1030.00, 760.00, 1790.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(72, 17, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 250.00, 510.00, 500.00, 500.00, 10.00, 20.00, 0.00, NULL, NULL, 760.00, 1030.00, 760.00, 1790.00, '2026-02-07 16:38:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(73, 18, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 350.00, 710.00, 500.00, 500.00, 136.75, 136.75, 208.33, NULL, NULL, 986.75, 1346.75, 1195.08, 2333.50, '2026-02-07 16:45:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(74, 18, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 500.00, 1010.00, 500.00, 500.00, 197.95, 197.95, 0.00, NULL, NULL, 1197.95, 1707.95, 1197.95, 2905.90, '2026-02-07 16:45:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(75, 18, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 800.00, 1630.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 1500.00, 2330.00, 1500.00, 3830.00, '2026-02-07 16:45:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(76, 19, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 350.00, 710.00, 500.00, 500.00, 136.75, 136.75, 208.33, NULL, NULL, 986.75, 1346.75, 1195.08, 2333.50, '2026-02-07 16:55:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(77, 19, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 500.00, 1010.00, 500.00, 500.00, 197.95, 197.95, 0.00, NULL, NULL, 1197.95, 1707.95, 1197.95, 2905.90, '2026-02-07 16:55:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(78, 19, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 800.00, 1630.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 1500.00, 2330.00, 1500.00, 3830.00, '2026-02-07 16:55:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(79, 20, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 350.00, 710.00, 500.00, 500.00, 136.75, 136.75, 208.33, NULL, NULL, 986.75, 1346.75, 1195.08, 2333.50, '2026-02-07 16:56:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(80, 20, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 500.00, 1010.00, 500.00, 500.00, 197.95, 197.95, 0.00, NULL, NULL, 1197.95, 1707.95, 1197.95, 2905.90, '2026-02-07 16:56:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(81, 20, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 800.00, 1630.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 1500.00, 2330.00, 1500.00, 3830.00, '2026-02-07 16:56:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(82, 21, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 375.00, 760.00, 500.00, 500.00, 150.43, 150.43, 229.17, NULL, NULL, 1025.43, 1410.43, 1254.60, 2435.86, '2026-02-07 16:57:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(83, 21, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-07 16:57:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(84, 21, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-07 16:57:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(85, 22, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 375.00, 760.00, 500.00, 500.00, 150.43, 150.43, 229.17, NULL, NULL, 1025.43, 1410.43, 1254.60, 2435.86, '2026-02-08 19:43:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(86, 22, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-08 19:43:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(87, 22, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-08 19:43:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(88, 23, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 375.00, 760.00, 500.00, 500.00, 150.43, 150.43, 229.17, NULL, NULL, 1025.43, 1410.43, 1254.60, 2435.86, '2026-02-08 19:44:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(89, 23, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-08 19:44:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(90, 23, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-08 19:44:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(91, 24, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 375.00, 760.00, 500.00, 500.00, 150.43, 150.43, 229.17, NULL, NULL, 1025.43, 1410.43, 1254.60, 2435.86, '2026-02-09 06:24:26', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(92, 24, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-09 06:24:26', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(93, 24, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-09 06:24:26', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(94, 25, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 450.00, 910.00, 500.00, 500.00, 183.43, 183.43, 229.17, NULL, NULL, 1133.43, 1593.43, 1362.60, 2726.86, '2026-02-09 18:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(95, 25, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-09 18:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(96, 25, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-09 18:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(97, 26, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 450.00, 910.00, 500.00, 500.00, 183.43, 183.43, 229.17, NULL, NULL, 1133.43, 1593.43, 1362.60, 2726.86, '2026-02-09 18:52:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(98, 26, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-09 18:52:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(99, 26, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-09 18:52:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(100, 27, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 450.00, 910.00, 500.00, 500.00, 183.43, 183.43, 229.17, NULL, NULL, 1133.43, 1593.43, 1362.60, 2726.86, '2026-02-09 18:57:34', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(101, 27, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-09 18:57:34', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(102, 27, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-09 18:57:34', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(103, 28, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 450.00, 910.00, 500.00, 500.00, 183.43, 183.43, 229.17, NULL, NULL, 1133.43, 1593.43, 1362.60, 2726.86, '2026-02-10 07:33:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(104, 28, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-10 07:33:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(105, 28, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-10 07:33:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(106, 29, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 450.00, 910.00, 500.00, 500.00, 183.43, 183.43, 229.17, NULL, NULL, 1133.43, 1593.43, 1362.60, 2726.86, '2026-02-10 12:19:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(107, 29, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-10 12:19:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(108, 29, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-10 12:19:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(109, 30, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 450.00, 910.00, 500.00, 500.00, 183.43, 183.43, 229.17, NULL, NULL, 1133.43, 1593.43, 1362.60, 2726.86, '2026-02-10 12:49:47', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(110, 30, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-10 12:49:47', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(111, 30, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-10 12:49:47', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(112, 31, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 450.00, 910.00, 500.00, 500.00, 183.43, 183.43, 229.17, NULL, NULL, 1133.43, 1593.43, 1362.60, 2726.86, '2026-02-10 12:59:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(113, 31, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-10 12:59:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(114, 31, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-10 12:59:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(115, 32, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 450.00, 910.00, 500.00, 500.00, 183.43, 183.43, 229.17, NULL, NULL, 1133.43, 1593.43, 1362.60, 2726.86, '2026-02-10 13:02:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(116, 32, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-10 13:02:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(117, 32, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-10 13:02:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(118, 33, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 450.00, 910.00, 500.00, 500.00, 183.43, 183.43, 229.17, NULL, NULL, 1133.43, 1593.43, 1362.60, 2726.86, '2026-02-10 13:02:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(119, 33, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-10 13:02:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(120, 33, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-10 13:02:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(121, 34, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 450.00, 910.00, 500.00, 500.00, 183.43, 183.43, 229.17, NULL, NULL, 1133.43, 1593.43, 1362.60, 2726.86, '2026-02-10 13:06:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(122, 34, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-10 13:06:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(123, 34, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-10 13:06:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(124, 35, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 450.00, 910.00, 500.00, 500.00, 183.43, 183.43, 229.17, NULL, NULL, 1133.43, 1593.43, 1362.60, 2726.86, '2026-02-10 13:06:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(125, 35, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 1475.00, 2980.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2175.00, 3680.00, 2175.00, 5855.00, '2026-02-10 13:06:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(126, 35, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 1750.00, 3530.00, 500.00, 500.00, 200.00, 200.00, 0.00, NULL, NULL, 2450.00, 4230.00, 2450.00, 6680.00, '2026-02-10 13:06:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_deductions_computation`
--
ALTER TABLE `fch_deductions_computation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_batch` (`batch_id`),
  ADD KEY `idx_employee` (`employee_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_deductions_computation`
--
ALTER TABLE `fch_deductions_computation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=127;

;
;
;

-- fch_earnings_computation.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_earnings_computation`
--

CREATE TABLE `fch_earnings_computation` (
  `id` int(11) NOT NULL,
  `payroll_id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `payroll_period` varchar(50) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(255) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `reg_pay` decimal(10,2) DEFAULT 0.00,
  `ot_pay` decimal(10,2) DEFAULT 0.00,
  `nd_pay` decimal(10,2) DEFAULT 0.00,
  `ot_nd_pay` decimal(10,2) DEFAULT 0.00,
  `reg_holiday_days` decimal(10,2) DEFAULT NULL,
  `reg_holiday_pay` decimal(10,2) DEFAULT 0.00,
  `reg_holiday_ot_pay` decimal(10,2) DEFAULT 0.00,
  `reg_holiday_nd_pay` decimal(10,2) DEFAULT 0.00,
  `reg_holiday_ot_nd_pay` decimal(10,2) DEFAULT 0.00,
  `reg_holiday_rd_pay` decimal(10,2) DEFAULT 0.00,
  `reg_holiday_rd_ot_pay` decimal(10,2) DEFAULT 0.00,
  `reg_holiday_rd_nd_pay` decimal(10,2) DEFAULT 0.00,
  `reg_holiday_rd_ot_nd_pay` decimal(10,2) DEFAULT 0.00,
  `spec_holiday_pay` decimal(10,2) DEFAULT 0.00,
  `spec_holiday_ot_pay` decimal(10,2) DEFAULT 0.00,
  `spec_holiday_nd_pay` decimal(10,2) DEFAULT 0.00,
  `spec_holiday_ot_nd_pay` decimal(10,2) DEFAULT 0.00,
  `spec_holiday_rd_pay` decimal(10,2) DEFAULT 0.00,
  `spec_holiday_rd_ot_pay` decimal(10,2) DEFAULT 0.00,
  `spec_holiday_rd_nd_pay` decimal(10,2) DEFAULT 0.00,
  `spec_holiday_rd_ot_nd_pay` decimal(10,2) DEFAULT 0.00,
  `rd_pay` decimal(10,2) DEFAULT 0.00,
  `rd_ot_pay` decimal(10,2) DEFAULT 0.00,
  `rd_nd_pay` decimal(10,2) DEFAULT 0.00,
  `rd_ot_nd_pay` decimal(10,2) DEFAULT 0.00,
  `leave_pay` decimal(10,2) NOT NULL DEFAULT 0.00,
  `other_pay` decimal(10,2) DEFAULT 0.00,
  `other_pay_label` varchar(100) DEFAULT NULL,
  `total_pay` decimal(10,2) DEFAULT NULL,
  `adj_reg_pay` decimal(10,2) DEFAULT NULL,
  `adj_ot_pay` decimal(10,2) DEFAULT NULL,
  `adj_nd_pay` decimal(10,2) DEFAULT NULL,
  `adj_ot_nd_pay` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_days` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_pay` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_ot_pay` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_nd_pay` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_ot_nd_pay` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_rd_pay` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_rd_ot_pay` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_rd_nd_pay` decimal(10,2) DEFAULT NULL,
  `adj_reg_holiday_rd_ot_nd_pay` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_pay` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_ot_pay` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_nd_pay` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_ot_nd_pay` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_rd_pay` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_rd_ot_pay` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_rd_nd_pay` decimal(10,2) DEFAULT NULL,
  `adj_spec_holiday_rd_ot_nd_pay` decimal(10,2) DEFAULT NULL,
  `adj_rd_pay` decimal(10,2) DEFAULT NULL,
  `adj_rd_ot_pay` decimal(10,2) DEFAULT NULL,
  `adj_rd_nd_pay` decimal(10,2) DEFAULT NULL,
  `adj_rd_ot_nd_pay` decimal(10,2) DEFAULT NULL,
  `adj_leave_pay` decimal(10,2) DEFAULT NULL,
  `adj_other_pay` decimal(10,2) DEFAULT NULL,
  `adj_other_pay_label` varchar(255) DEFAULT NULL,
  `adj_total_pay` decimal(10,2) DEFAULT NULL,
  `adj_reason` text DEFAULT NULL,
  `adj_by` int(11) DEFAULT NULL,
  `adj_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_earnings_computation`
--

INSERT INTO `fch_earnings_computation` (`id`, `payroll_id`, `batch_id`, `payroll_period`, `employee_id`, `emp_fullname`, `emp_dept`, `reg_pay`, `ot_pay`, `nd_pay`, `ot_nd_pay`, `reg_holiday_days`, `reg_holiday_pay`, `reg_holiday_ot_pay`, `reg_holiday_nd_pay`, `reg_holiday_ot_nd_pay`, `reg_holiday_rd_pay`, `reg_holiday_rd_ot_pay`, `reg_holiday_rd_nd_pay`, `reg_holiday_rd_ot_nd_pay`, `spec_holiday_pay`, `spec_holiday_ot_pay`, `spec_holiday_nd_pay`, `spec_holiday_ot_nd_pay`, `spec_holiday_rd_pay`, `spec_holiday_rd_ot_pay`, `spec_holiday_rd_nd_pay`, `spec_holiday_rd_ot_nd_pay`, `rd_pay`, `rd_ot_pay`, `rd_nd_pay`, `rd_ot_nd_pay`, `leave_pay`, `other_pay`, `other_pay_label`, `total_pay`, `adj_reg_pay`, `adj_ot_pay`, `adj_nd_pay`, `adj_ot_nd_pay`, `adj_reg_holiday_days`, `adj_reg_holiday_pay`, `adj_reg_holiday_ot_pay`, `adj_reg_holiday_nd_pay`, `adj_reg_holiday_ot_nd_pay`, `adj_reg_holiday_rd_pay`, `adj_reg_holiday_rd_ot_pay`, `adj_reg_holiday_rd_nd_pay`, `adj_reg_holiday_rd_ot_nd_pay`, `adj_spec_holiday_pay`, `adj_spec_holiday_ot_pay`, `adj_spec_holiday_nd_pay`, `adj_spec_holiday_ot_nd_pay`, `adj_spec_holiday_rd_pay`, `adj_spec_holiday_rd_ot_pay`, `adj_spec_holiday_rd_nd_pay`, `adj_spec_holiday_rd_ot_nd_pay`, `adj_rd_pay`, `adj_rd_ot_pay`, `adj_rd_nd_pay`, `adj_rd_ot_nd_pay`, `adj_leave_pay`, `adj_other_pay`, `adj_other_pay_label`, `adj_total_pay`, `adj_reason`, `adj_by`, `adj_at`) VALUES
(1, 0, 1, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4500.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1950.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 0, 1, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 0, 1, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 0, 1, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 0, 1, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 999.99, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 0, 1, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 999.99, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 0, 1, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 426.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 0, 1, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 999.99, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 0, 1, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 999.99, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 0, 2, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 0, 2, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4500.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1950.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 0, 2, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 999.99, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 0, 2, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 999.99, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 0, 2, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 0, 2, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 999.99, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 0, 2, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 0, 2, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 999.99, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 0, 2, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 999.99, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 0, 3, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 0, 3, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4500.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1950.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 0, 3, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 0, 4, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, 0, 4, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4500.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1950.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 0, 4, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 0, 4, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, 0, 4, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(27, 0, 4, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 0, 4, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(29, 0, 4, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 0, 4, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, 0, 5, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, 0, 5, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4500.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1950.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 11047.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, 0, 5, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(34, 0, 5, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(35, 0, 5, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(36, 0, 5, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(37, 0, 5, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(38, 0, 5, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(39, 0, 5, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(40, 0, 6, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(41, 0, 6, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4500.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1950.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 11047.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(42, 0, 6, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(43, 0, 6, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(44, 0, 6, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(45, 0, 6, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(46, 0, 6, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(47, 0, 6, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(48, 0, 6, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(49, 0, 7, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(50, 0, 7, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4500.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1950.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 11047.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(51, 0, 7, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(52, 0, 7, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(53, 0, 7, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(54, 0, 7, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(55, 0, 7, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(56, 0, 7, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(57, 0, 7, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(58, 0, 8, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(59, 0, 8, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(60, 0, 8, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(61, 0, 8, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(62, 0, 8, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(63, 0, 8, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(64, 0, 8, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(65, 0, 8, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(66, 0, 8, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(67, 0, 9, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(68, 0, 9, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(69, 0, 9, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(70, 0, 9, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(71, 0, 9, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(72, 0, 9, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(73, 0, 9, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(74, 0, 9, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(75, 0, 9, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(76, 0, 10, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(77, 0, 10, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(78, 0, 10, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(79, 0, 10, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(80, 0, 10, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(81, 0, 10, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(82, 0, 10, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(83, 0, 10, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(84, 0, 10, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(85, 0, 11, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(86, 0, 11, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(87, 0, 11, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(88, 0, 11, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(89, 0, 11, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(90, 0, 11, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(91, 0, 11, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(92, 0, 11, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(93, 0, 11, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(94, 0, 12, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(95, 0, 12, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(96, 0, 12, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(97, 0, 12, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(98, 0, 12, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(99, 0, 12, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(100, 0, 12, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(101, 0, 12, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(102, 0, 12, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(103, 0, 13, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(104, 0, 13, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(105, 0, 13, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(106, 0, 13, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(107, 0, 13, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(108, 0, 13, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(109, 0, 13, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `fch_earnings_computation` (`id`, `payroll_id`, `batch_id`, `payroll_period`, `employee_id`, `emp_fullname`, `emp_dept`, `reg_pay`, `ot_pay`, `nd_pay`, `ot_nd_pay`, `reg_holiday_days`, `reg_holiday_pay`, `reg_holiday_ot_pay`, `reg_holiday_nd_pay`, `reg_holiday_ot_nd_pay`, `reg_holiday_rd_pay`, `reg_holiday_rd_ot_pay`, `reg_holiday_rd_nd_pay`, `reg_holiday_rd_ot_nd_pay`, `spec_holiday_pay`, `spec_holiday_ot_pay`, `spec_holiday_nd_pay`, `spec_holiday_ot_nd_pay`, `spec_holiday_rd_pay`, `spec_holiday_rd_ot_pay`, `spec_holiday_rd_nd_pay`, `spec_holiday_rd_ot_nd_pay`, `rd_pay`, `rd_ot_pay`, `rd_nd_pay`, `rd_ot_nd_pay`, `leave_pay`, `other_pay`, `other_pay_label`, `total_pay`, `adj_reg_pay`, `adj_ot_pay`, `adj_nd_pay`, `adj_ot_nd_pay`, `adj_reg_holiday_days`, `adj_reg_holiday_pay`, `adj_reg_holiday_ot_pay`, `adj_reg_holiday_nd_pay`, `adj_reg_holiday_ot_nd_pay`, `adj_reg_holiday_rd_pay`, `adj_reg_holiday_rd_ot_pay`, `adj_reg_holiday_rd_nd_pay`, `adj_reg_holiday_rd_ot_nd_pay`, `adj_spec_holiday_pay`, `adj_spec_holiday_ot_pay`, `adj_spec_holiday_nd_pay`, `adj_spec_holiday_ot_nd_pay`, `adj_spec_holiday_rd_pay`, `adj_spec_holiday_rd_ot_pay`, `adj_spec_holiday_rd_nd_pay`, `adj_spec_holiday_rd_ot_nd_pay`, `adj_rd_pay`, `adj_rd_ot_pay`, `adj_rd_nd_pay`, `adj_rd_ot_nd_pay`, `adj_leave_pay`, `adj_other_pay`, `adj_other_pay_label`, `adj_total_pay`, `adj_reason`, `adj_by`, `adj_at`) VALUES
(110, 0, 13, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(111, 0, 13, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(112, 0, 14, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(113, 0, 14, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(114, 0, 14, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(115, 0, 14, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(116, 0, 14, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(117, 0, 14, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(118, 0, 14, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(119, 0, 14, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(120, 0, 14, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(121, 0, 15, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(122, 0, 15, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(123, 0, 15, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(124, 0, 15, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(125, 0, 15, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(126, 0, 15, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(127, 0, 15, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(128, 0, 15, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(129, 0, 15, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(130, 0, 16, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(131, 0, 16, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(132, 0, 16, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(133, 0, 16, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(134, 0, 16, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(135, 0, 16, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(136, 0, 16, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(137, 0, 16, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(138, 0, 16, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(139, 0, 17, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(140, 0, 17, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(141, 0, 17, '2026-02-01 to 2026-02-15', 9, 'Rizal, Jose', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(142, 0, 17, '2026-02-01 to 2026-02-15', 5, 'Cruz, Juan D', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(143, 0, 17, '2026-02-01 to 2026-02-15', 4, 'Management, Management M', 'Management', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(144, 0, 17, '2026-02-01 to 2026-02-15', 6, 'Pedro, Pedro P', 'IT', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(145, 0, 17, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(146, 0, 17, '2026-02-01 to 2026-02-15', 7, 'One, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(147, 0, 17, '2026-02-01 to 2026-02-15', 8, '2, Test', 'Admin', 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 1000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(148, 0, 18, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(149, 0, 18, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(150, 0, 18, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(151, 0, 19, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(152, 0, 19, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(153, 0, 19, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(154, 0, 20, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4312.50, 0.00, 0.00, 0.00, 0.00, 1875.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 6837.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(155, 0, 20, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 4000.00, 0.00, 0.00, 0.00, 500.00, 0.00, 487.50, 0.00, 0.00, 1300.00, 0.00, 0.00, 0.00, 650.00, 0.00, 0.00, 0.00, 750.00, 487.50, 0.00, 0.00, 1300.00, 422.50, 0.00, 0.00, 0.00, 0.00, NULL, 9897.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(156, 0, 20, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 7500.00, 0.00, 500.00, 0.00, 0.00, 1500.00, 0.00, 2200.00, 0.00, 0.00, 0.00, 0.00, 0.00, 487.50, 0.00, 715.00, 0.00, 562.50, 0.00, 825.00, 0.00, 975.00, 0.00, 715.00, 0.00, 0.00, 0.00, NULL, 15980.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(157, 0, 21, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 7521.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(158, 0, 21, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(159, 0, 21, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 100.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, '', 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(160, 0, 22, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 7521.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(161, 0, 22, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(162, 0, 22, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(163, 0, 23, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 7521.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(164, 0, 23, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(165, 0, 23, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(166, 0, 24, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 7521.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(167, 0, 24, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(168, 0, 24, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(169, 0, 25, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1650.00, 0.00, NULL, 9171.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(170, 0, 25, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(171, 0, 25, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(172, 0, 26, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1650.00, 0.00, NULL, 9171.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(173, 0, 26, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(174, 0, 26, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(175, 0, 27, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1650.00, 0.00, NULL, 9171.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(176, 0, 27, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(177, 0, 27, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(178, 0, 28, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1650.00, 0.00, NULL, 9171.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(179, 0, 28, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(180, 0, 28, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(181, 0, 29, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1650.00, 0.00, NULL, 9171.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(182, 0, 29, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(183, 0, 29, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(184, 0, 30, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1650.00, 0.00, NULL, 9171.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(185, 0, 30, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(186, 0, 30, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(187, 0, 31, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1650.00, 0.00, NULL, 9171.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(188, 0, 31, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(189, 0, 31, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(190, 0, 32, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1650.00, 0.00, NULL, 9171.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(191, 0, 32, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(192, 0, 32, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(193, 0, 33, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1650.00, 0.00, NULL, 9171.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(194, 0, 33, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(195, 0, 33, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(196, 0, 34, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1650.00, 0.00, NULL, 9171.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(197, 0, 34, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(198, 0, 34, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(199, 0, 35, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 4743.75, 0.00, 0.00, 0.00, 0.00, 2062.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 715.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1650.00, 0.00, NULL, 9171.25, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(200, 0, 35, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 12000.00, 0.00, 0.00, 0.00, 1500.00, 0.00, 1462.50, 0.00, 0.00, 3900.00, 0.00, 0.00, 0.00, 1950.00, 0.00, 0.00, 0.00, 2250.00, 1462.50, 0.00, 0.00, 3900.00, 1267.50, 0.00, 0.00, 0.00, 0.00, NULL, 29692.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(201, 0, 35, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 27000.00, 0.00, 1800.00, 0.00, 0.00, 5400.00, 0.00, 7920.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1755.00, 0.00, 2574.00, 0.00, 2025.00, 0.00, 2970.00, 0.00, 3510.00, 0.00, 2574.00, 0.00, 0.00, 0.00, NULL, 57528.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_earnings_computation`
--
ALTER TABLE `fch_earnings_computation`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_earnings_computation`
--
ALTER TABLE `fch_earnings_computation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=202;

;
;
;

-- fch_payroll_results.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:49 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

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

;
;
;

-- fch_payroll_summary.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:49 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_payroll_summary`
--

CREATE TABLE `fch_payroll_summary` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `payroll_period` varchar(50) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `emp_fullname` varchar(150) NOT NULL,
  `emp_dept` varchar(100) NOT NULL,
  `gross_pay` decimal(12,2) DEFAULT 0.00,
  `total_deductions` decimal(12,2) DEFAULT 0.00,
  `tax_deduct` decimal(12,2) NOT NULL DEFAULT 0.00,
  `net_pay` decimal(12,2) DEFAULT 0.00,
  `days_worked` decimal(5,2) NOT NULL DEFAULT 0.00,
  `generated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_payroll_summary`
--

INSERT INTO `fch_payroll_summary` (`id`, `batch_id`, `payroll_period`, `employee_id`, `emp_fullname`, `emp_dept`, `gross_pay`, `total_deductions`, `tax_deduct`, `net_pay`, `days_worked`, `generated_at`) VALUES
(1, 20, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 6837.50, 1195.08, 0.00, 5642.00, 12.00, '2026-02-08 00:56:21'),
(2, 20, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 9897.50, 1197.95, 0.00, 8699.00, 13.00, '2026-02-08 00:56:21'),
(3, 20, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 15980.00, 1500.00, 0.00, 14480.00, 15.00, '2026-02-08 00:56:21'),
(4, 21, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7521.25, 1254.60, 0.00, 6266.00, 12.00, '2026-02-08 00:57:40'),
(5, 21, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 4127.63, 23389.00, 13.00, '2026-02-08 00:57:40'),
(6, 21, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 12890.60, 42187.00, 15.00, '2026-02-08 00:57:40'),
(7, 22, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7521.25, 1254.60, 0.00, 6266.00, 12.00, '2026-02-09 03:43:32'),
(8, 22, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-09 03:43:32'),
(9, 22, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-09 03:43:32'),
(10, 23, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7521.25, 1254.60, 0.00, 6266.00, 12.00, '2026-02-09 03:44:14'),
(11, 23, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-09 03:44:14'),
(12, 23, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-09 03:44:14'),
(13, 24, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 7521.25, 1254.60, 0.00, 6266.00, 12.00, '2026-02-09 14:24:27'),
(14, 24, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-09 14:24:27'),
(15, 24, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-09 14:24:27'),
(16, 26, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 02:52:36'),
(17, 26, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 02:52:36'),
(18, 26, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 02:52:36'),
(19, 27, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 02:57:35'),
(20, 27, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 02:57:35'),
(21, 27, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 02:57:35'),
(22, 28, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 15:33:15'),
(23, 28, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 15:33:15'),
(24, 28, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 15:33:15'),
(25, 29, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 20:19:51'),
(26, 29, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 20:19:51'),
(27, 29, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 20:19:51'),
(28, 30, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 20:49:48'),
(29, 30, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 20:49:48'),
(30, 30, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 20:49:48'),
(31, 31, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 20:59:14'),
(32, 31, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 20:59:14'),
(33, 31, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 20:59:14'),
(34, 32, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 21:02:35'),
(35, 32, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 21:02:35'),
(36, 32, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 21:02:35'),
(37, 33, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 21:02:56'),
(38, 33, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 21:02:56'),
(39, 33, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 21:02:56'),
(40, 34, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 21:06:03'),
(41, 34, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 21:06:03'),
(42, 34, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 21:06:03'),
(43, 35, '2026-02-01 to 2026-02-15', 3, 'Employee, Employee E', 'IT', 9171.25, 1362.60, 0.00, 7808.00, 12.00, '2026-02-10 21:06:21'),
(44, 35, '2026-02-01 to 2026-02-15', 1, 'Duena, Jai C', 'Admin', 29692.50, 2175.00, 1002.62, 26514.00, 13.00, '2026-02-10 21:06:21'),
(45, 35, '2026-02-01 to 2026-02-15', 2, 'Supervisor, Supervisor S', 'IT', 57528.00, 2450.00, 6223.93, 48854.00, 15.00, '2026-02-10 21:06:21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_payroll_summary`
--
ALTER TABLE `fch_payroll_summary`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_batch` (`batch_id`),
  ADD KEY `idx_employee` (`employee_id`),
  ADD KEY `idx_period` (`payroll_period`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_payroll_summary`
--
ALTER TABLE `fch_payroll_summary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

;
;
;

-- fch_requests.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:51 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_requests`
--

CREATE TABLE `fch_requests` (
  `uniq_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `mp_date` date DEFAULT NULL,
  `mp_time` time DEFAULT NULL,
  `mp_type` varchar(50) DEFAULT NULL,
  `mp_reason` text DEFAULT NULL,
  `encode_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `rqst_type` varchar(50) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `user` varchar(255) DEFAULT NULL,
  `fullname` varchar(255) DEFAULT NULL,
  `dept` varchar(255) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
  `sup_status` varchar(50) DEFAULT NULL,
  `sup_name` varchar(255) DEFAULT NULL,
  `admin_status` varchar(50) DEFAULT NULL,
  `admin_name` varchar(255) DEFAULT NULL,
  `cs_date` date DEFAULT NULL,
  `cs_new_shift` varchar(255) DEFAULT NULL,
  `cs_old_shift` varchar(50) DEFAULT NULL,
  `leave_type` varchar(100) DEFAULT NULL,
  `leave_from` date DEFAULT NULL,
  `leave_to` date DEFAULT NULL,
  `leave_total` int(11) DEFAULT NULL,
  `ot_date` date DEFAULT NULL,
  `ot_work_done` varchar(255) DEFAULT NULL,
  `ot_from` time DEFAULT NULL,
  `ot_to` time DEFAULT NULL,
  `ot_total` decimal(5,2) DEFAULT NULL,
  `wfh_date` date DEFAULT NULL,
  `wfh_start` time DEFAULT NULL,
  `wfh_end` time DEFAULT NULL,
  `wfh_activity` varchar(255) DEFAULT NULL,
  `wfh_output` varchar(255) DEFAULT NULL,
  `other_type` varchar(100) DEFAULT NULL,
  `other_from_date` date DEFAULT NULL,
  `other_to_date` date DEFAULT NULL,
  `other_total_date` int(11) DEFAULT NULL,
  `other_from_time` time DEFAULT NULL,
  `other_to_time` time DEFAULT NULL,
  `other_total_time` decimal(5,2) DEFAULT NULL,
  `manage_status` varchar(50) DEFAULT NULL,
  `manage_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_requests`
--

INSERT INTO `fch_requests` (`uniq_id`, `employee_id`, `mp_date`, `mp_time`, `mp_type`, `mp_reason`, `encode_date`, `rqst_type`, `reason`, `user`, `fullname`, `dept`, `position`, `status`, `sup_status`, `sup_name`, `admin_status`, `admin_name`, `cs_date`, `cs_new_shift`, `cs_old_shift`, `leave_type`, `leave_from`, `leave_to`, `leave_total`, `ot_date`, `ot_work_done`, `ot_from`, `ot_to`, `ot_total`, `wfh_date`, `wfh_start`, `wfh_end`, `wfh_activity`, `wfh_output`, `other_type`, `other_from_date`, `other_to_date`, `other_total_date`, `other_from_time`, `other_to_time`, `other_total_time`, `manage_status`, `manage_name`) VALUES
(1, 1, NULL, NULL, NULL, NULL, '2026-02-03 14:53:01', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-01', 'YES', '14:00:00', '17:00:00', 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 1, NULL, NULL, NULL, NULL, '2026-02-03 14:53:21', 'Leave', 'Vacation', 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, 'Rest Day', '2026-02-02', '2026-02-02', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 1, NULL, NULL, NULL, NULL, '2026-02-03 14:53:39', 'Change Shift', 'Vacation', 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', '2026-02-03', 'Shift 2: 2 PM to 10 PM', 'Shift 1: 6 AM to 2 PM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 3, NULL, NULL, NULL, NULL, '2026-02-03 15:01:00', 'Leave', 'Vacation', 'Employee', NULL, 'IT', NULL, 'Approved', 'Approved', 'Supervisor', 'Approved', 'Jai', NULL, NULL, NULL, 'Vacation Leave', '2026-02-08', '2026-02-10', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Pending', NULL),
(5, 2, NULL, NULL, NULL, NULL, '2026-02-04 14:47:55', 'Overtime', NULL, 'Supervisor', NULL, 'IT', NULL, 'Approved', 'Approved', 'Supervisor', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-13', 'YES', '06:00:00', '09:00:00', 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:12:27', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-08', 'YES', '22:00:00', '00:00:00', 22.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:14:26', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-06', 'YES', '22:00:00', '01:00:00', 21.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:18:08', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-11', 'YES', '22:00:00', '23:00:00', 1.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:25:37', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-06', 'YES', '22:00:00', '06:00:00', 16.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:31:05', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-17', 'YES', '22:30:00', '05:31:00', 16.98, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:42:21', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-12', 'YES', '22:00:00', '06:42:00', 15.30, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:45:50', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-10', 'YES', '22:45:00', '05:45:00', 17.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 1, NULL, NULL, NULL, NULL, '2026-02-04 16:49:15', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-08', 'YES', '22:49:00', '06:49:00', 16.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 1, NULL, NULL, NULL, NULL, '2026-02-04 18:38:04', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-09', 'YES', '21:37:00', '02:38:00', 18.98, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 1, NULL, NULL, NULL, NULL, '2026-02-04 18:41:10', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-22', 'YES', '14:40:00', '02:41:00', 11.98, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 1, NULL, NULL, NULL, NULL, '2026-02-04 18:48:49', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-27', 'YES', '21:48:00', '02:48:00', 19.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 1, NULL, NULL, NULL, NULL, '2026-02-05 14:29:19', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-01', 'YES', '14:00:00', '17:00:00', 3.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 1, NULL, NULL, NULL, NULL, '2026-02-05 17:43:00', 'Leave', 'Vacation', 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, 'Rest Day', '2026-02-13', '2026-02-13', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 1, NULL, NULL, NULL, NULL, '2026-02-05 17:43:18', 'Overtime', NULL, 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-13', 'YES', '15:43:00', '19:43:00', 4.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 2, NULL, NULL, NULL, NULL, '2026-02-05 17:49:28', 'Leave', 'Vacation', 'Supervisor', NULL, 'IT', NULL, 'Approved', 'Approved', 'Supervisor', 'Approved', 'Jai', NULL, NULL, NULL, 'Rest Day', '2026-02-13', '2026-02-13', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 1, NULL, NULL, NULL, NULL, '2026-02-05 18:13:19', 'Leave', 'Vacation', 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, 'Rest Day', '2026-02-11', '2026-02-11', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 1, '2026-02-05', '14:00:00', 'Time Out', NULL, '2026-02-06 08:23:18', 'Manual Punch', 'asd', 'Jai', NULL, 'Admin', NULL, 'Approved', 'Approved', 'Jai', 'Approved', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 2, '2026-02-12', '06:25:00', 'Time Out', NULL, '2026-02-06 08:25:07', 'Manual Punch', 'asd', 'Supervisor', NULL, 'IT', NULL, 'Rejected', 'Approved', 'Supervisor', 'Rejected', 'Jai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_requests`
--
ALTER TABLE `fch_requests`
  ADD PRIMARY KEY (`uniq_id`),
  ADD KEY `idx_employee_id` (`employee_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_requests`
--
ALTER TABLE `fch_requests`
  MODIFY `uniq_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

;
;
;

-- fch_bulletin_board.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

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

;
;
;

-- fch_user_notes.sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 03:51 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

;
;
;
;

--
-- Database: `family_care`
--

-- --------------------------------------------------------

--
-- Table structure for table `fch_user_notes`
--

CREATE TABLE `fch_user_notes` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `fch_user_notes`
--

INSERT INTO `fch_user_notes` (`id`, `employee_id`, `text`, `created_at`) VALUES
(5, 1, 'asd', '2026-02-09 04:27:34');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fch_user_notes`
--
ALTER TABLE `fch_user_notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`employee_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fch_user_notes`
--
ALTER TABLE `fch_user_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

;
;
;

-- ============================================================
-- family_care  —  Run this once in phpMyAdmin
-- ============================================================

-- 1. Chat table (new)
CREATE TABLE IF NOT EXISTS fch_chat_messages (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    employee_id  INT           NOT NULL,
    emp_fullname VARCHAR(150)  NOT NULL,
    emp_acc_type VARCHAR(50)   NOT NULL DEFAULT 'Employee',
    message      TEXT          NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add date-range + dept targeting to bulletin board
ALTER TABLE fch_bulletin_board
    ADD COLUMN IF NOT EXISTS display_from  DATE          NULL AFTER text,
    ADD COLUMN IF NOT EXISTS display_to    DATE          NULL AFTER display_from,
    ADD COLUMN IF NOT EXISTS target_dept   VARCHAR(100)  NOT NULL DEFAULT 'All' AFTER display_to;


-- ============================================================
-- family_care — Performance Indexes
-- Run after all tables have been created.
-- Uses CREATE INDEX IF NOT EXISTS (safe to re-run).
-- ============================================================

-- --------------------------------------------------------
-- fch_attendance
-- Most queried by employee + date range
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_att_employee_id  ON fch_attendance (employee_id);
CREATE INDEX IF NOT EXISTS idx_att_date         ON fch_attendance (date);
CREATE INDEX IF NOT EXISTS idx_att_emp_date     ON fch_attendance (employee_id, date);

-- --------------------------------------------------------
-- fch_attendance_summary
-- Queried by employee + payroll period
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_attsum_employee_id     ON fch_attendance_summary (employee_id);
CREATE INDEX IF NOT EXISTS idx_attsum_period          ON fch_attendance_summary (payroll_start, payroll_end);
CREATE INDEX IF NOT EXISTS idx_attsum_emp_period      ON fch_attendance_summary (employee_id, payroll_start, payroll_end);
CREATE INDEX IF NOT EXISTS idx_attsum_batch           ON fch_attendance_summary (batch_id);

-- --------------------------------------------------------
-- att_punches
-- Queried by employee + time range when syncing biometrics
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_punch_employee_id  ON att_punches (employee_id);
CREATE INDEX IF NOT EXISTS idx_punch_time         ON att_punches (punch_time);
CREATE INDEX IF NOT EXISTS idx_punch_emp_time     ON att_punches (employee_id, punch_time);
CREATE INDEX IF NOT EXISTS idx_punch_processed    ON att_punches (processed);

-- --------------------------------------------------------
-- fch_requests
-- Already has idx_employee_id; add status for approval filters
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_req_status         ON fch_requests (status);
CREATE INDEX IF NOT EXISTS idx_req_emp_status     ON fch_requests (employee_id, status);
CREATE INDEX IF NOT EXISTS idx_req_type           ON fch_requests (rqst_type);
CREATE INDEX IF NOT EXISTS idx_req_encode_date    ON fch_requests (encode_date);

-- --------------------------------------------------------
-- fch_employees
-- Add dept + acc_type for role/department filtering
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_emp_dept           ON fch_employees (emp_dept);
CREATE INDEX IF NOT EXISTS idx_emp_acc_type       ON fch_employees (emp_acc_type);
CREATE INDEX IF NOT EXISTS idx_emp_emptype        ON fch_employees (emp_emptype);
CREATE INDEX IF NOT EXISTS idx_emp_dept_acctype   ON fch_employees (emp_dept, emp_acc_type);

-- --------------------------------------------------------
-- fch_payroll_results
-- Queried by date range + status
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pr_period          ON fch_payroll_results (payroll_start, payroll_end);
CREATE INDEX IF NOT EXISTS idx_pr_status          ON fch_payroll_results (status);
CREATE INDEX IF NOT EXISTS idx_pr_batch           ON fch_payroll_results (batch_id);

-- --------------------------------------------------------
-- fch_payroll_summary
-- Queried by employee + batch + period
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ps_employee_id     ON fch_payroll_summary (employee_id);
CREATE INDEX IF NOT EXISTS idx_ps_batch           ON fch_payroll_summary (batch_id);
CREATE INDEX IF NOT EXISTS idx_ps_emp_batch       ON fch_payroll_summary (employee_id, batch_id);

-- --------------------------------------------------------
-- fch_bulletin_board
-- Already has employee_id; add created_at for sorted display
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bb_created_at      ON fch_bulletin_board (created_at);
CREATE INDEX IF NOT EXISTS idx_bb_acc_type        ON fch_bulletin_board (emp_acc_type);

-- --------------------------------------------------------
-- fch_user_notes
-- Queried by employee
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notes_employee_id  ON fch_user_notes (employee_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at   ON fch_user_notes (created_at);

-- --------------------------------------------------------
-- fch_late / fch_ot / fch_nd / fch_restday / fch_reg_hrs
-- All are queried by employee_id + date range for payroll
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_late_emp_date      ON fch_late (employee_id, late_date);
CREATE INDEX IF NOT EXISTS idx_ot_emp_date        ON fch_ot (employee_id, ot_date);
CREATE INDEX IF NOT EXISTS idx_nd_emp_date        ON fch_nd (employee_id, nd_date);
CREATE INDEX IF NOT EXISTS idx_restday_emp_date   ON fch_restday (employee_id, rest_date);
CREATE INDEX IF NOT EXISTS idx_reghrs_emp_date    ON fch_reg_hrs (employee_id, reg_date);

INSERT IGNORE INTO `fch_employees` (employee_id,emp_fname,emp_lname,emp_dept,emp_position,emp_datehire,emp_emptype,emp_username,emp_pass,emp_acc_type,emp_dailyrate) VALUES (1,'Admin','User','Management','Administrator',CURDATE(),'Regular','Admin','Family Care','Management',0);

-- --------------------------------------------------------
-- fch_attendance_flags
-- Stores employee-submitted attendance correction requests
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fch_attendance_flags` (
  `id`                  int(11)       NOT NULL AUTO_INCREMENT,
  `attendance_id`       int(11)       NOT NULL,
  `employee_id`         int(11)       NOT NULL,
  `emp_fullname`        varchar(150)  DEFAULT NULL,
  `date`                date          DEFAULT NULL,
  `flag_column`         varchar(50)   NOT NULL,
  `current_value`       datetime      DEFAULT NULL,
  `suggested_punch_id`  int(11)       DEFAULT NULL,
  `suggested_value`     datetime      NOT NULL,
  `reason`              text          DEFAULT NULL,
  `status`              enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `admin_notes`         varchar(255)  DEFAULT NULL,
  `reviewed_by`         int(11)       DEFAULT NULL,
  `reviewed_at`         datetime      DEFAULT NULL,
  `created_at`          timestamp     NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

SET FOREIGN_KEY_CHECKS=1;
