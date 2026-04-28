-- --------------------------------------------------------
-- Table structure for table `fch_company_profile`
-- Single-row configuration table (id is always 1)
-- --------------------------------------------------------

USE family_care;

CREATE TABLE IF NOT EXISTS `fch_company_profile` (
  `id`              int(11)      NOT NULL DEFAULT 1,
  `company_name`    varchar(255) NOT NULL DEFAULT 'Family Care Hospital',
  `address`         text         DEFAULT NULL,
  `contact`         varchar(100) DEFAULT NULL,
  `email`           varchar(255) DEFAULT NULL,
  `logo_path`       varchar(500) DEFAULT NULL,
  `color_primary`   varchar(7)   NOT NULL DEFAULT '#2563eb',
  `color_secondary` varchar(7)   NOT NULL DEFAULT '#1d4ed8',
  `color_tertiary`  varchar(7)   DEFAULT NULL,
  `updated_at`      datetime     NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Insert default row (only if table is empty)
INSERT IGNORE INTO `fch_company_profile`
  (`id`, `company_name`, `address`, `contact`, `email`,
   `logo_path`, `color_primary`, `color_secondary`, `color_tertiary`)
VALUES
  (1, 'Family Care Hospital', NULL, NULL, NULL,
   NULL, '#2563eb', '#1d4ed8', NULL);
