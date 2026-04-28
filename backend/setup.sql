-- ============================================================
-- family_care  —  Run this once in phpMyAdmin
-- ============================================================

USE family_care;

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

