-- Add OPEN_SOURCE to pricing_model ENUM
-- Run this SQL script to update the tools table

ALTER TABLE tools 
MODIFY COLUMN pricing_model ENUM('FREE', 'FREEMIUM', 'FREE_TRIAL', 'OPEN_SOURCE', 'PAID') DEFAULT 'FREE';

-- Verify the change
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'tools' 
  AND COLUMN_NAME = 'pricing_model';




