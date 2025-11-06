-- Fix duplicate verification columns
-- Remove isVerified (camelCase) if it exists and keep only is_verified (snake_case)

-- First, check what columns exist
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'users'
AND COLUMN_NAME IN ('is_verified', 'isVerified');

-- If isVerified exists, migrate data to is_verified before dropping
-- Note: Only run this if both columns exist and you need to preserve data
-- UPDATE users SET is_verified = COALESCE(isVerified, FALSE) WHERE isVerified IS NOT NULL;

-- Drop the camelCase column if it exists (uncomment to run)
-- ALTER TABLE users DROP COLUMN IF EXISTS isVerified;

-- Verify only is_verified exists now
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'users'
AND COLUMN_NAME LIKE '%verified%';

-- Ensure is_verified column has correct type and default
ALTER TABLE users 
MODIFY COLUMN is_verified BOOLEAN DEFAULT FALSE;

-- Add index if not exists
ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_is_verified (is_verified);

-- Verify the fix
SELECT 'Verification column check complete!' AS status;
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'users'
AND COLUMN_NAME = 'is_verified';




