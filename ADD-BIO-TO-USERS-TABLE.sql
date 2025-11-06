-- ============================================
-- ADD BIO COLUMN TO USERS TABLE
-- ============================================
-- Run this SQL to add the bio column for user profiles

-- Add bio column to users table if it doesn't exist
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `bio` TEXT DEFAULT NULL AFTER `avatar_url`;

-- Verify the change
SELECT 'Updated users table structure:' AS info;
DESCRIBE users;

SELECT 'SUCCESS: Bio column added successfully!' AS status;


