-- ============================================
-- Prompts Library Database Schema
-- ============================================

-- 1. Prompt Categories Table
CREATE TABLE IF NOT EXISTS prompt_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '🎨',
  parent_id INT DEFAULT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES prompt_categories(id) ON DELETE SET NULL,
  INDEX idx_parent (parent_id),
  INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Prompts Table
CREATE TABLE IF NOT EXISTS prompts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_text TEXT NOT NULL,
  prompt_type ENUM('IMAGE', 'VIDEO', 'IMAGE_EDIT', 'VIDEO_EDIT') NOT NULL DEFAULT 'IMAGE',
  category_id INT,
  tool_id INT,
  difficulty ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT 'BEGINNER',
  tags JSON,
  example_image_url VARCHAR(500),
  example_video_url VARCHAR(500),
  parameters JSON,
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  views INT DEFAULT 0,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  submitted_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES prompt_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE SET NULL,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_type (prompt_type),
  INDEX idx_status (status),
  INDEX idx_category (category_id),
  INDEX idx_tool (tool_id),
  INDEX idx_difficulty (difficulty),
  INDEX idx_views (views),
  INDEX idx_upvotes (upvotes),
  FULLTEXT INDEX idx_search (title, description, prompt_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Prompt Collections Table
CREATE TABLE IF NOT EXISTS prompt_collections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Collection Prompts Junction Table
CREATE TABLE IF NOT EXISTS collection_prompts (
  collection_id INT NOT NULL,
  prompt_id INT NOT NULL,
  order_index INT DEFAULT 0,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, prompt_id),
  FOREIGN KEY (collection_id) REFERENCES prompt_collections(id) ON DELETE CASCADE,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Prompt Votes Table (to track individual user votes)
CREATE TABLE IF NOT EXISTS prompt_votes (
  prompt_id INT NOT NULL,
  user_id INT NOT NULL,
  vote_type ENUM('UPVOTE', 'DOWNVOTE') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (prompt_id, user_id),
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vote_type (vote_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Default Prompt Categories
-- ============================================

INSERT INTO prompt_categories (name, description, icon, order_index) VALUES
('Photography', 'Portrait, landscape, product, and food photography prompts', '📸', 1),
('Art & Design', 'Digital art, illustration, logo design, and 3D renders', '🎨', 2),
('Marketing', 'Social media, advertising, and brand identity prompts', '📱', 3),
('Entertainment', 'Character design, concept art, and animation', '🎮', 4),
('Editing', 'Retouching, compositing, effects, and color grading', '✂️', 5),
('Architecture', 'Building design, interior design, and urban planning', '🏛️', 6),
('Nature & Wildlife', 'Landscapes, animals, plants, and natural scenes', '🌿', 7),
('Abstract', 'Abstract art, patterns, and experimental designs', '🌀', 8),
('Fashion', 'Clothing, accessories, and fashion photography', '👗', 9),
('Food & Beverage', 'Food photography, recipes, and culinary art', '🍽️', 10);

-- Insert subcategories for Photography
INSERT INTO prompt_categories (name, description, icon, parent_id, order_index) VALUES
('Portrait', 'Portrait photography prompts', '👤', 1, 1),
('Landscape', 'Landscape and nature photography', '🏞️', 1, 2),
('Product', 'Product photography and showcase', '📦', 1, 3),
('Food Photography', 'Food and beverage photography', '🍕', 1, 4);

-- Insert subcategories for Art & Design
INSERT INTO prompt_categories (name, description, icon, parent_id, order_index) VALUES
('Digital Art', 'Digital painting and illustration', '🖼️', 2, 1),
('Logo Design', 'Logo and brand identity design', '🎯', 2, 2),
('3D Renders', '3D modeling and rendering', '🎲', 2, 3),
('UI/UX Design', 'User interface and experience design', '💻', 2, 4);

-- ============================================
-- Insert Sample Prompts
-- ============================================

INSERT INTO prompts (
  title, 
  description, 
  prompt_text, 
  prompt_type, 
  category_id, 
  difficulty, 
  tags, 
  parameters,
  status
) VALUES
(
  'Cinematic Portrait in Golden Hour',
  'Professional portrait with warm golden hour lighting and shallow depth of field',
  'A cinematic portrait of a young woman in golden hour lighting, shot with 85mm lens, shallow depth of field, warm tones, professional photography, high detail, bokeh background --ar 2:3 --style raw --v 6',
  'IMAGE',
  11, -- Portrait subcategory
  'INTERMEDIATE',
  '["portrait", "golden-hour", "cinematic", "photography", "professional"]',
  '{"aspect_ratio": "2:3", "style": "raw", "version": "6", "lens": "85mm"}',
  'APPROVED'
),
(
  'Product Showcase Animation',
  'Smooth product reveal with camera rotation and studio lighting',
  'A sleek product showcase video of a smartphone, smooth camera rotation around the device, studio lighting, reflective surface, modern aesthetic, 4K quality, 5 seconds duration, professional commercial style',
  'VIDEO',
  13, -- Product subcategory
  'ADVANCED',
  '["product", "showcase", "animation", "commercial", "4k"]',
  '{"duration": "5s", "quality": "4K", "fps": 30, "style": "commercial"}',
  'APPROVED'
),
(
  'Minimalist Logo Design',
  'Clean and modern minimalist logo with geometric shapes',
  'A minimalist logo design, geometric shapes, clean lines, modern aesthetic, professional branding, vector style, simple color palette, scalable design, negative space usage --style minimal',
  'IMAGE',
  15, -- Logo Design subcategory
  'BEGINNER',
  '["logo", "minimalist", "branding", "geometric", "modern"]',
  '{"style": "minimal", "format": "vector", "colors": "2-3"}',
  'APPROVED'
),
(
  'Fantasy Landscape Concept Art',
  'Epic fantasy landscape with dramatic lighting and atmospheric perspective',
  'An epic fantasy landscape, towering mountains, mystical atmosphere, dramatic lighting, concept art style, detailed environment, atmospheric perspective, vibrant colors, cinematic composition --ar 16:9 --style fantasy',
  'IMAGE',
  12, -- Landscape subcategory
  'ADVANCED',
  '["fantasy", "landscape", "concept-art", "environment", "cinematic"]',
  '{"aspect_ratio": "16:9", "style": "fantasy", "mood": "epic"}',
  'APPROVED'
),
(
  'Food Photography - Gourmet Dish',
  'Professional food photography with natural lighting and styling',
  'A gourmet dish beautifully plated, natural window lighting, shallow depth of field, food styling, professional food photography, appetizing presentation, garnish details, rustic wooden table --ar 4:5',
  'IMAGE',
  14, -- Food Photography subcategory
  'INTERMEDIATE',
  '["food", "photography", "gourmet", "styling", "natural-light"]',
  '{"aspect_ratio": "4:5", "lighting": "natural", "style": "professional"}',
  'APPROVED'
),
(
  'Character Design - Sci-Fi Hero',
  'Detailed character design for science fiction setting',
  'A sci-fi character design, futuristic armor, detailed costume, full body shot, concept art style, character sheet, multiple angles, professional illustration, cyberpunk aesthetic --style concept-art',
  'IMAGE',
  4, -- Entertainment category
  'ADVANCED',
  '["character-design", "sci-fi", "concept-art", "cyberpunk", "illustration"]',
  '{"style": "concept-art", "views": "multiple", "detail": "high"}',
  'APPROVED'
),
(
  'Background Removal - Clean Cut',
  'Remove background while preserving fine details like hair',
  'Remove background from subject, preserve fine details including hair strands, clean edges, transparent background, professional cutout, maintain subject quality',
  'IMAGE_EDIT',
  5, -- Editing category
  'BEGINNER',
  '["background-removal", "cutout", "editing", "transparent"]',
  '{"output": "transparent", "quality": "high", "edge_refinement": true}',
  'APPROVED'
),
(
  'Color Grading - Cinematic Look',
  'Apply cinematic color grading with teal and orange tones',
  'Apply cinematic color grading, teal and orange color palette, film look, contrast enhancement, shadow and highlight adjustment, professional color correction, moody atmosphere',
  'IMAGE_EDIT',
  5, -- Editing category
  'INTERMEDIATE',
  '["color-grading", "cinematic", "film-look", "teal-orange"]',
  '{"style": "cinematic", "palette": "teal-orange", "mood": "moody"}',
  'APPROVED'
),
(
  'Social Media Reel - Product Launch',
  'Dynamic product launch video for social media',
  'Create a dynamic product launch video, fast-paced editing, modern transitions, upbeat music, text overlays, brand colors, 15 seconds duration, vertical format 9:16, social media optimized',
  'VIDEO_EDIT',
  3, -- Marketing category
  'INTERMEDIATE',
  '["social-media", "product-launch", "reel", "vertical-video", "marketing"]',
  '{"duration": "15s", "aspect_ratio": "9:16", "style": "dynamic", "platform": "instagram"}',
  'APPROVED'
),
(
  '3D Product Render - Realistic',
  'Photorealistic 3D product rendering with studio setup',
  'A photorealistic 3D render of a product, studio lighting setup, reflective surface, high detail, ray tracing, professional product visualization, clean background, multiple light sources --render realistic',
  'IMAGE',
  16, -- 3D Renders subcategory
  'ADVANCED',
  '["3d-render", "product", "photorealistic", "visualization", "studio"]',
  '{"render_engine": "realistic", "lighting": "studio", "quality": "high"}',
  'APPROVED'
);

-- ============================================
-- Create Views for Analytics
-- ============================================

-- View: Popular Prompts
CREATE OR REPLACE VIEW popular_prompts AS
SELECT 
  p.*,
  pc.name as category_name,
  t.name as tool_name,
  (p.upvotes - p.downvotes) as score
FROM prompts p
LEFT JOIN prompt_categories pc ON p.category_id = pc.id
LEFT JOIN tools t ON p.tool_id = t.id
WHERE p.status = 'APPROVED'
ORDER BY score DESC, p.views DESC
LIMIT 50;

-- View: Trending Prompts (last 7 days)
CREATE OR REPLACE VIEW trending_prompts AS
SELECT 
  p.*,
  pc.name as category_name,
  t.name as tool_name,
  (p.upvotes - p.downvotes) as score
FROM prompts p
LEFT JOIN prompt_categories pc ON p.category_id = pc.id
LEFT JOIN tools t ON p.tool_id = t.id
WHERE p.status = 'APPROVED'
  AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY score DESC, p.views DESC
LIMIT 20;

-- View: Prompt Statistics
CREATE OR REPLACE VIEW prompt_statistics AS
SELECT 
  COUNT(*) as total_prompts,
  SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_prompts,
  SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_prompts,
  SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_prompts,
  SUM(CASE WHEN prompt_type = 'IMAGE' THEN 1 ELSE 0 END) as image_prompts,
  SUM(CASE WHEN prompt_type = 'VIDEO' THEN 1 ELSE 0 END) as video_prompts,
  SUM(CASE WHEN prompt_type = 'IMAGE_EDIT' THEN 1 ELSE 0 END) as image_edit_prompts,
  SUM(CASE WHEN prompt_type = 'VIDEO_EDIT' THEN 1 ELSE 0 END) as video_edit_prompts,
  SUM(views) as total_views,
  SUM(upvotes) as total_upvotes,
  SUM(downvotes) as total_downvotes
FROM prompts;

-- ============================================
-- Stored Procedures
-- ============================================

-- Procedure: Increment Prompt Views
DELIMITER //
CREATE PROCEDURE increment_prompt_views(IN prompt_id_param INT)
BEGIN
  UPDATE prompts 
  SET views = views + 1 
  WHERE id = prompt_id_param;
END //
DELIMITER ;

-- Procedure: Vote on Prompt
DELIMITER //
CREATE PROCEDURE vote_prompt(
  IN prompt_id_param INT,
  IN user_id_param INT,
  IN vote_type_param ENUM('UPVOTE', 'DOWNVOTE')
)
BEGIN
  DECLARE existing_vote ENUM('UPVOTE', 'DOWNVOTE');
  
  -- Check if user already voted
  SELECT vote_type INTO existing_vote
  FROM prompt_votes
  WHERE prompt_id = prompt_id_param AND user_id = user_id_param;
  
  IF existing_vote IS NULL THEN
    -- New vote
    INSERT INTO prompt_votes (prompt_id, user_id, vote_type)
    VALUES (prompt_id_param, user_id_param, vote_type_param);
    
    IF vote_type_param = 'UPVOTE' THEN
      UPDATE prompts SET upvotes = upvotes + 1 WHERE id = prompt_id_param;
    ELSE
      UPDATE prompts SET downvotes = downvotes + 1 WHERE id = prompt_id_param;
    END IF;
    
  ELSEIF existing_vote != vote_type_param THEN
    -- Change vote
    UPDATE prompt_votes 
    SET vote_type = vote_type_param
    WHERE prompt_id = prompt_id_param AND user_id = user_id_param;
    
    IF vote_type_param = 'UPVOTE' THEN
      UPDATE prompts 
      SET upvotes = upvotes + 1, downvotes = downvotes - 1 
      WHERE id = prompt_id_param;
    ELSE
      UPDATE prompts 
      SET upvotes = upvotes - 1, downvotes = downvotes + 1 
      WHERE id = prompt_id_param;
    END IF;
  END IF;
END //
DELIMITER ;

-- ============================================
-- Indexes for Performance
-- ============================================

-- Additional indexes for common queries
CREATE INDEX idx_prompts_created ON prompts(created_at DESC);
CREATE INDEX idx_prompts_score ON prompts((upvotes - downvotes) DESC);
CREATE INDEX idx_collections_user_public ON prompt_collections(user_id, is_public);

-- ============================================
-- Triggers
-- ============================================

-- Trigger: Update prompt updated_at on vote
DELIMITER //
CREATE TRIGGER update_prompt_timestamp
AFTER INSERT ON prompt_votes
FOR EACH ROW
BEGIN
  UPDATE prompts 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.prompt_id;
END //
DELIMITER ;

-- ============================================
-- Grants (if needed)
-- ============================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON prompts TO 'your_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON prompt_categories TO 'your_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON prompt_collections TO 'your_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON collection_prompts TO 'your_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON prompt_votes TO 'your_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE increment_prompt_views TO 'your_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE vote_prompt TO 'your_user'@'localhost';

-- ============================================
-- End of Schema
-- ============================================
