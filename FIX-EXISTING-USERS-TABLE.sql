-- ============================================
-- FIX EXISTING USERS TABLE FOR AUTHENTICATION
-- ============================================
-- This script updates your existing users table to work with the authentication system

-- Step 1: Check current users table structure
SELECT 'Current users table structure:' AS info;
DESCRIBE users;

-- Step 2: Add missing columns if they don't exist

-- Add password_hash column (if using 'password' column, we'll rename it)
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `password_hash` VARCHAR(255) NULL AFTER `email`;

-- If you have a 'password' column, copy it to password_hash
UPDATE `users` 
SET `password_hash` = `password` 
WHERE `password_hash` IS NULL AND `password` IS NOT NULL;

-- Add other missing columns
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `avatar_url` VARCHAR(500) DEFAULT NULL AFTER `password_hash`;

ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `is_verified` BOOLEAN DEFAULT TRUE AFTER `avatar_url`;

ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `role` ENUM('USER', 'ADMIN') DEFAULT 'USER' AFTER `is_verified`;

-- Add email verification columns
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `verification_token` VARCHAR(64) DEFAULT NULL AFTER `role`;

ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `verification_token_expiry` TIMESTAMP NULL DEFAULT NULL AFTER `verification_token`;

-- Add password reset columns
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `reset_token` VARCHAR(64) DEFAULT NULL AFTER `verification_token_expiry`;

ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `reset_token_expiry` TIMESTAMP NULL DEFAULT NULL AFTER `reset_token`;

ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER `reset_token_expiry`;

ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Step 3: Add indexes if they don't exist
ALTER TABLE `users` 
ADD INDEX IF NOT EXISTS `idx_email` (`email`);

ALTER TABLE `users` 
ADD INDEX IF NOT EXISTS `idx_role` (`role`);

ALTER TABLE `users` 
ADD INDEX IF NOT EXISTS `idx_verification_token` (`verification_token`);

ALTER TABLE `users` 
ADD INDEX IF NOT EXISTS `idx_reset_token` (`reset_token`);

-- Step 4: Make email unique if not already
ALTER TABLE `users` 
ADD UNIQUE INDEX IF NOT EXISTS `unique_email` (`email`);

-- Step 5: Create user_saved_tools table
CREATE TABLE IF NOT EXISTS `user_saved_tools` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `tool_id` INT(11) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_tool` (`user_id`, `tool_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_tool_id` (`tool_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 6: Add save_count to tools table
ALTER TABLE `tools` 
ADD COLUMN IF NOT EXISTS `save_count` INT(11) DEFAULT 0 AFTER `view_count`;

-- Step 7: Create admin user with hashed password
-- Password: admin123
INSERT INTO `users` (`name`, `email`, `password_hash`, `is_verified`, `role`)
VALUES (
  'Admin User',
  'admin@clarifyall.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  TRUE,
  'ADMIN'
) ON DUPLICATE KEY UPDATE 
  `password_hash` = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  `is_verified` = TRUE,
  `role` = 'ADMIN';

-- Step 8: Verify the changes
SELECT 'Updated users table structure:' AS info;
DESCRIBE users;

SELECT 'User saved tools table:' AS info;
DESCRIBE user_saved_tools;

SELECT 'Admin user:' AS info;
SELECT id, name, email, role, is_verified FROM users WHERE email = 'admin@clarifyall.com';

SELECT 'SUCCESS: Tables updated successfully!' AS status;
