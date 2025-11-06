-- ============================================
-- CREATE USERS AND AUTHENTICATION TABLES
-- ============================================
-- Run this SQL in your MySQL database to enable authentication
-- Database: u530425252_kyc

-- 1. Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `is_verified` BOOLEAN DEFAULT FALSE,
  `role` ENUM('USER', 'ADMIN') DEFAULT 'USER',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create user_saved_tools table (for save/unsave functionality)
CREATE TABLE IF NOT EXISTS `user_saved_tools` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `tool_id` INT(11) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_tool` (`user_id`, `tool_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_tool_id` (`tool_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add save_count column to tools table if it doesn't exist
ALTER TABLE `tools` 
ADD COLUMN IF NOT EXISTS `save_count` INT(11) DEFAULT 0 AFTER `view_count`;

-- 4. Create an admin user (optional - for testing)
-- Password: admin123 (change this after first login!)
INSERT INTO `users` (`name`, `email`, `password_hash`, `is_verified`, `role`, `created_at`)
VALUES (
  'Admin User',
  'admin@clarifyall.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  TRUE,
  'ADMIN',
  NOW()
) ON DUPLICATE KEY UPDATE email = email;

-- 5. Verify tables were created
SELECT 'Users table created successfully!' AS status;
SELECT COUNT(*) AS user_count FROM users;

SELECT 'User saved tools table created successfully!' AS status;
SELECT COUNT(*) AS saved_tools_count FROM user_saved_tools;

-- 6. Show table structures
SHOW CREATE TABLE users;
SHOW CREATE TABLE user_saved_tools;
