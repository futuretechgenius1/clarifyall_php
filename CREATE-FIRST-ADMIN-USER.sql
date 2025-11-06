-- Create First Admin User
-- This SQL script creates the first admin user for the Clarifyall admin dashboard
-- Run this once to set up your first administrator

INSERT INTO users (name, email, password_hash, role, is_verified, created_at)
VALUES (
    'Admin User',
    'admin@clarifyall.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Password: 'password' (please change after first login!)
    'ADMIN',
    TRUE,
    NOW()
)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    role = 'ADMIN',
    is_verified = TRUE;

-- Default password is 'password' - CHANGE THIS IMMEDIATELY after first login!
-- Email: admin@clarifyall.com
-- Password: password


