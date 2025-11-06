-- Fix Logo Paths in Database
-- This script updates logo paths from Node.js format to PHP format

-- Step 1: Check current logo paths
SELECT 
    id, 
    name, 
    logo_url,
    CASE 
        WHEN logo_url LIKE '/api/v1/files/logos/%' THEN 'Node.js format (needs fix)'
        WHEN logo_url LIKE '/logos/%' THEN 'PHP format (correct)'
        ELSE 'Other format'
    END as path_type
FROM tools
WHERE logo_url IS NOT NULL
ORDER BY id DESC;

-- Step 2: Update Node.js paths to PHP paths
UPDATE tools 
SET logo_url = REPLACE(logo_url, '/api/v1/files/logos/', '/logos/')
WHERE logo_url LIKE '/api/v1/files/logos/%';

-- Step 3: Verify the update
SELECT 
    id, 
    name, 
    logo_url,
    'Updated to PHP format' as status
FROM tools
WHERE logo_url LIKE '/logos/%'
ORDER BY id DESC;

-- Step 4: Check if any paths still need fixing
SELECT 
    id, 
    name, 
    logo_url,
    'Still needs fixing' as status
FROM tools
WHERE logo_url LIKE '/api/v1/%'
ORDER BY id DESC;

-- Summary
SELECT 
    COUNT(*) as total_tools,
    SUM(CASE WHEN logo_url LIKE '/logos/%' THEN 1 ELSE 0 END) as php_format_count,
    SUM(CASE WHEN logo_url LIKE '/api/v1/%' THEN 1 ELSE 0 END) as nodejs_format_count,
    SUM(CASE WHEN logo_url IS NULL OR logo_url = '' THEN 1 ELSE 0 END) as no_logo_count
FROM tools;
