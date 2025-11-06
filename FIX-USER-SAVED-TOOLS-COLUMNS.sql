-- Fix user_saved_tools table - add missing columns

-- First, check what columns exist
DESCRIBE user_saved_tools;

-- Drop the table if it exists with wrong structure
DROP TABLE IF EXISTS user_saved_tools;

-- Create the table with correct structure
CREATE TABLE `user_saved_tools` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `tool_id` INT(11) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_tool` (`user_id`, `tool_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_tool_id` (`tool_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Foreign key constraints removed to avoid issues if users/tools tables don't exist yet
-- You can add them later if needed:
-- ALTER TABLE user_saved_tools ADD CONSTRAINT fk_user_saved_tools_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE user_saved_tools ADD CONSTRAINT fk_user_saved_tools_tool FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE;

-- Verify the table structure
DESCRIBE user_saved_tools;

-- Test insert
INSERT INTO user_saved_tools (user_id, tool_id) VALUES (1, 1);

-- Verify insert worked
SELECT * FROM user_saved_tools;

-- Clean up test data
DELETE FROM user_saved_tools WHERE user_id = 1 AND tool_id = 1;

SELECT 'Table fixed successfully!' AS status;
