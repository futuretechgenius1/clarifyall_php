-- Add verification and reset token columns to users table if they don't exist
-- This script ensures the users table has all required columns for registration

-- Add verification token columns
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `verification_token` VARCHAR(64) DEFAULT NULL AFTER `role`;

ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `verification_token_expiry` TIMESTAMP NULL DEFAULT NULL AFTER `verification_token`;

-- Add password reset columns
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `reset_token` VARCHAR(64) DEFAULT NULL AFTER `verification_token_expiry`;

ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `reset_token_expiry` TIMESTAMP NULL DEFAULT NULL AFTER `reset_token`;

-- Add bio column if not exists
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `bio` TEXT DEFAULT NULL AFTER `avatar_url`;

-- Add indexes for better performance
ALTER TABLE `users` 
ADD INDEX IF NOT EXISTS `idx_verification_token` (`verification_token`);

ALTER TABLE `users` 
ADD INDEX IF NOT EXISTS `idx_reset_token` (`reset_token`);

-- Verify columns were added
SELECT 'Verification columns check:' AS info;
SHOW COLUMNS FROM users WHERE Field IN ('verification_token', 'verification_token_expiry', 'reset_token', 'reset_token_expiry', 'bio');


