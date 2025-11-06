-- Create user_saved_tools table for save/like functionality

CREATE TABLE IF NOT EXISTS `user_saved_tools` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `tool_id` INT(11) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_tool` (`user_id`, `tool_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_tool_id` (`tool_id`),
  CONSTRAINT `fk_user_saved_tools_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_saved_tools_tool` FOREIGN KEY (`tool_id`) REFERENCES `tools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table was created
SELECT 'user_saved_tools table created successfully!' AS status;

-- Show table structure
DESCRIBE user_saved_tools;
