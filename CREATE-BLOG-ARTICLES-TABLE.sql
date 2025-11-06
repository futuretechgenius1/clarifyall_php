-- Blog/Articles Table
-- Run this SQL in your MySQL database: u530425252_kyc

CREATE TABLE IF NOT EXISTS blog_articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    featured_image VARCHAR(500),
    author_id INT,
    category VARCHAR(100), -- 'review', 'how-to', 'news', 'comparison', 'tutorial', 'tips'
    tags JSON,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
    published_at DATETIME,
    view_count INT DEFAULT 0,
    read_time INT DEFAULT 0, -- Estimated reading time in minutes
    is_featured BOOLEAN DEFAULT FALSE,
    ad_positions JSON, -- Store AdSense ad placement positions
    related_tools JSON, -- Array of related tool IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status_published (status, published_at DESC),
    INDEX idx_category (category),
    INDEX idx_slug (slug),
    INDEX idx_featured (is_featured, published_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

