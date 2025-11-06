-- Quick query to get user IDs for blog posts
-- Run this first to find an author ID

-- Get all users with their IDs
SELECT id, name, email, role, created_at 
FROM users 
ORDER BY id;

-- Or get the first admin user
SELECT id, name, email 
FROM users 
WHERE role = 'ADMIN' 
LIMIT 1;

-- Or get the first regular user
SELECT id, name, email 
FROM users 
WHERE role = 'USER' 
LIMIT 1;

