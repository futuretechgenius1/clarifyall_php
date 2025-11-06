-- ============================================
-- ADD MISSING COLUMNS TO TOOLS TABLE
-- ============================================
-- This script adds the missing category_id and description columns

-- Step 1: Add category_id column
ALTER TABLE `tools` 
ADD COLUMN `category_id` INT(11) NULL AFTER `logo_url`;

-- Step 2: Add description column (alias for short_description)
-- Note: Your table has 'short_description' but the API expects 'description'
-- We'll add description as an alias
ALTER TABLE `tools` 
ADD COLUMN `description` TEXT NULL AFTER `slug`;

-- Step 3: Copy data from short_description to description
UPDATE `tools` 
SET `description` = `short_description` 
WHERE `description` IS NULL;

-- Step 4: Add index for category_id for better performance
ALTER TABLE `tools` 
ADD INDEX `idx_category_id` (`category_id`);

-- Step 5: Add index for status for better query performance
ALTER TABLE `tools` 
ADD INDEX `idx_status` (`status`);

-- Step 6: Verify the changes
SELECT 'Updated tools table structure:' AS info;
DESCRIBE tools;

SELECT 'Sample tool with new columns:' AS info;
SELECT id, name, slug, description, category_id, status FROM tools LIMIT 1;

SELECT 'SUCCESS: Missing columns added!' AS status;
