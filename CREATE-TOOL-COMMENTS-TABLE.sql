-- Create tool_comments table for storing user comments on tools

CREATE TABLE IF NOT EXISTS tool_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tool_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'DELETED') DEFAULT 'APPROVED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tool_id (tool_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

