-- Run this SQL in your MySQL database: u530425252_kyc

CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tools (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT,
    website_url VARCHAR(500),
    logo_url VARCHAR(500),
    category_id INT,
    pricing_model ENUM('FREE', 'FREEMIUM', 'FREE_TRIAL', 'OPEN_SOURCE', 'PAID') DEFAULT 'FREE',
    platforms JSON,
    feature_tags JSON,
    view_count INT DEFAULT 0,
    save_count INT DEFAULT 0,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT TRUE,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_saved_tools (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    tool_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_tool (user_id, tool_id)
);

-- Insert sample data
INSERT IGNORE INTO categories (name, slug, description, icon) VALUES
('AI & Machine Learning', 'ai-machine-learning', 'AI tools', '🤖'),
('Development Tools', 'development-tools', 'Dev tools', '💻'),
('Design & Creative', 'design-creative', 'Design tools', '🎨'),
('Productivity', 'productivity', 'Productivity tools', '⚡'),
('Marketing & SEO', 'marketing-seo', 'Marketing tools', '📈'),
('Communication', 'communication', 'Communication tools', '💬');

INSERT IGNORE INTO tools (name, description, full_description, website_url, logo_url, category_id, pricing_model, platforms, feature_tags, view_count, save_count) VALUES
('ChatGPT', 'AI assistant', 'Advanced AI assistant for various tasks', 'https://chat.openai.com', '/logos/chatgpt.png', 1, 'FREEMIUM', '["Web","Mobile"]', '["AI","Chat"]', 1500, 200),
('VS Code', 'Code editor', 'Popular code editor by Microsoft', 'https://code.visualstudio.com', '/logos/vscode.png', 2, 'FREE', '["Desktop"]', '["Editor","IDE"]', 1200, 180),
('Figma', 'Design tool', 'Collaborative design platform', 'https://figma.com', '/logos/figma.png', 3, 'FREEMIUM', '["Web","Desktop"]', '["Design","UI"]', 980, 150),
('Notion', 'Productivity', 'All-in-one workspace', 'https://notion.so', '/logos/notion.png', 4, 'FREEMIUM', '["Web","Desktop","Mobile"]', '["Notes","Database"]', 1100, 210);