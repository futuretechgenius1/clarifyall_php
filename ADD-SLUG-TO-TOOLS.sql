-- Add slug column to tools table
ALTER TABLE tools ADD COLUMN slug VARCHAR(200) UNIQUE AFTER name;

-- Generate slugs from existing tool names
UPDATE tools 
SET slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'), '.', ''), '/', '-'), '--', '-'))
WHERE slug IS NULL OR slug = '';

-- Update specific tools to have clean slugs
UPDATE tools SET slug = 'chatgpt' WHERE name = 'ChatGPT';
UPDATE tools SET slug = 'vs-code' WHERE name = 'VS Code';
UPDATE tools SET slug = 'figma' WHERE name = 'Figma';
UPDATE tools SET slug = 'notion' WHERE name = 'Notion';

-- Make slug NOT NULL after populating
ALTER TABLE tools MODIFY slug VARCHAR(200) NOT NULL;

-- Verify the changes
SELECT id, name, slug FROM tools ORDER BY id;
