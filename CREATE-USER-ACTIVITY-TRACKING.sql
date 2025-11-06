-- User Activity Tracking Tables
-- Run this SQL in your MySQL database: u530425252_kyc

-- Track recently viewed tools
CREATE TABLE IF NOT EXISTS user_tool_views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    tool_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_duration INT DEFAULT 0, -- in seconds
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    INDEX idx_user_viewed_at (user_id, viewed_at DESC),
    INDEX idx_user_tool_date (user_id, tool_id, viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Track tool usage/actions (visits, saves, shares)
CREATE TABLE IF NOT EXISTS user_tool_activity (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    tool_id INT NOT NULL,
    activity_type ENUM('VIEW', 'SAVE', 'UNSAVE', 'SHARE', 'VISIT_WEBSITE', 'CLICK') DEFAULT 'VIEW',
    activity_data JSON, -- Store additional data like share platform, click type, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    INDEX idx_user_activity (user_id, created_at DESC),
    INDEX idx_tool_activity (tool_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User preferences for recommendations
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    preferred_categories JSON, -- Array of category IDs
    preferred_tags JSON, -- Array of feature tags
    preferred_pricing JSON, -- Array of pricing models
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

