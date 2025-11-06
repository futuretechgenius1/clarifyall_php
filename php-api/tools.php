<?php
/**
 * Tools API
 * Handles CRUD operations for AI tools
 */

// Use centralized API initialization (handles CORS, security, rate limiting, DB connection)
require_once __DIR__ . '/api-init.php';

// Validate HTTP method
validateMethod(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));

// Check for upload_logo action in query string
if (isset($_GET['action']) && $_GET['action'] === 'upload_logo') {
    uploadLogo();
    exit;
}

switch ($method) {
    case 'GET':
        // Check for /tools/all endpoint
        if (isset($segments[2]) && $segments[2] === 'all') {
            getAllTools();
        } elseif (isset($segments[2]) && !empty($segments[2])) {
            // Support both ID and slug
            if (is_numeric($segments[2])) {
                getToolById($segments[2]);
            } else {
                getToolBySlug($segments[2]);
            }
        } else {
            getTools();
        }
        break;
    case 'POST':
        // Check for specific POST endpoints
        if (isset($segments[2]) && isset($segments[3]) && $segments[3] === 'view') {
            incrementViewCount($segments[2]);
        } elseif (isset($segments[2]) && isset($segments[3]) && $segments[3] === 'upload-logo') {
            uploadLogo($segments[2]);
        } else {
            createTool();
        }
        break;
    case 'PUT':
        if (isset($segments[2])) {
            if (isset($segments[3]) && $segments[3] === 'approve') {
                approveTool($segments[2]);
            } elseif (isset($segments[3]) && $segments[3] === 'reject') {
                rejectTool($segments[2]);
            } else {
                updateTool($segments[2]);
            }
        }
        break;
    case 'DELETE':
        if (isset($segments[2])) {
            deleteTool($segments[2]);
        }
        break;
}

// Helper function to convert relative logo URLs to full URLs
function getFullLogoUrl($logoUrl) {
    if (empty($logoUrl)) {
        return 'https://clarifyall.com/logos/default.png';
    }
    
    // If already a full URL, return as is
    if (strpos($logoUrl, 'http://') === 0 || strpos($logoUrl, 'https://') === 0) {
        return $logoUrl;
    }
    
    // If relative path starting with /logos/, convert to full URL
    if (strpos($logoUrl, '/logos/') === 0) {
        return 'https://clarifyall.com' . $logoUrl;
    }
    
    // If relative path starting with /api/v1/files/logos/ (old Node.js format), convert
    if (strpos($logoUrl, '/api/v1/files/logos/') === 0) {
        $filename = basename($logoUrl);
        return 'https://clarifyall.com/logos/' . $filename;
    }
    
    // Default
    return 'https://clarifyall.com/logos/default.png';
}

function getTools() {
    global $pdo;
    
    // Build base query with LEFT JOIN to include category information
    $query = "SELECT DISTINCT t.*, c.name as category_name 
              FROM tools t 
              LEFT JOIN categories c ON t.category_id = c.id 
              WHERE t.status = 'APPROVED'";
    $params = [];
    
    // Enhanced search across multiple fields including category names
    if (isset($_GET['search']) && !empty(trim($_GET['search']))) {
        $searchTerm = trim($_GET['search']);
        $search = '%' . $searchTerm . '%';
        
        // Search in: tool name, description, full_description, short_description, slug, category name, website_url, feature_tags
        // Using LOWER for case-insensitive search
        // For JSON fields (feature_tags), convert to text for searching
        $query .= " AND (
            LOWER(t.name) LIKE LOWER(?) OR 
            LOWER(t.description) LIKE LOWER(?) OR 
            LOWER(COALESCE(t.full_description, '')) LIKE LOWER(?) OR 
            LOWER(COALESCE(t.short_description, '')) LIKE LOWER(?) OR 
            LOWER(t.slug) LIKE LOWER(?) OR 
            LOWER(COALESCE(c.name, '')) LIKE LOWER(?) OR
            LOWER(COALESCE(t.website_url, '')) LIKE LOWER(?) OR
            LOWER(COALESCE(t.feature_tags, '')) LIKE LOWER(?) OR
            LOWER(COALESCE(t.platforms, '')) LIKE LOWER(?)
        )";
        
        // Add search term 9 times (one for each field)
        for ($i = 0; $i < 9; $i++) {
            $params[] = $search;
        }
    }
    
    if (isset($_GET['category_id']) && !empty($_GET['category_id'])) {
        $query .= " AND t.category_id = ?";
        $params[] = $_GET['category_id'];
    }
    
    // Handle pagination
    $page = isset($_GET['page']) ? max(0, (int)$_GET['page']) : 0;
    $size = isset($_GET['size']) ? max(1, min(100, (int)$_GET['size'])) : 12;
    $offset = $page * $size;
    
    // Get total count for pagination
    $countQuery = "SELECT COUNT(DISTINCT t.id) as total 
                   FROM tools t 
                   LEFT JOIN categories c ON t.category_id = c.id 
                   WHERE t.status = 'APPROVED'";
    $countParams = [];
    
    if (isset($_GET['search']) && !empty(trim($_GET['search']))) {
        $searchTerm = trim($_GET['search']);
        $search = '%' . $searchTerm . '%';
        
        $countQuery .= " AND (
            LOWER(t.name) LIKE LOWER(?) OR 
            LOWER(t.description) LIKE LOWER(?) OR 
            LOWER(COALESCE(t.full_description, '')) LIKE LOWER(?) OR 
            LOWER(COALESCE(t.short_description, '')) LIKE LOWER(?) OR 
            LOWER(t.slug) LIKE LOWER(?) OR 
            LOWER(COALESCE(c.name, '')) LIKE LOWER(?) OR
            LOWER(COALESCE(t.website_url, '')) LIKE LOWER(?) OR
            LOWER(COALESCE(t.feature_tags, '')) LIKE LOWER(?) OR
            LOWER(COALESCE(t.platforms, '')) LIKE LOWER(?)
        )";
        
        for ($i = 0; $i < 9; $i++) {
            $countParams[] = $search;
        }
    }
    
    if (isset($_GET['category_id']) && !empty($_GET['category_id'])) {
        $countQuery .= " AND t.category_id = ?";
        $countParams[] = $_GET['category_id'];
    }
    
    // Get total count
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($countParams);
    $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Add ordering and pagination
    $query .= " ORDER BY t.created_at DESC LIMIT " . max(1, $size) . " OFFSET " . max(0, $offset);
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $tools = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map short_description to description and convert logo URLs to full URLs
    foreach ($tools as &$tool) {
        if (isset($tool['short_description']) && !isset($tool['description'])) {
            $tool['description'] = $tool['short_description'];
        }
        // Convert logo URL to full URL for cross-origin setup
        if (isset($tool['logo_url'])) {
            $tool['logo_url'] = getFullLogoUrl($tool['logo_url']);
        }
    }
    
    $totalPages = ceil($totalCount / $size);
    
    echo json_encode([
        'tools' => $tools, 
        'totalElements' => (int)$totalCount,
        'totalPages' => $totalPages,
        'currentPage' => $page,
        'size' => $size
    ]);
}

function getToolById($id) {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT * FROM tools WHERE id = ?");
    $stmt->execute([$id]);
    $tool = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($tool) {
        // Map short_description to description for frontend compatibility
        if (isset($tool['short_description']) && !isset($tool['description'])) {
            $tool['description'] = $tool['short_description'];
        }
        
        // Convert logo URL to full URL for cross-origin setup
        if (isset($tool['logo_url'])) {
            $tool['logo_url'] = getFullLogoUrl($tool['logo_url']);
        }
        
        $updateStmt = $pdo->prepare("UPDATE tools SET view_count = view_count + 1 WHERE id = ?");
        $updateStmt->execute([$id]);
        echo json_encode($tool);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Tool not found']);
    }
}

function getToolBySlug($slug) {
    global $pdo;
    
    // Decode URL-encoded slug
    $slug = urldecode($slug);
    
    $stmt = $pdo->prepare("SELECT * FROM tools WHERE slug = ?");
    $stmt->execute([$slug]);
    $tool = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($tool) {
        // Map short_description to description for frontend compatibility
        if (isset($tool['short_description']) && !isset($tool['description'])) {
            $tool['description'] = $tool['short_description'];
        }
        
        // Convert logo URL to full URL for cross-origin setup
        if (isset($tool['logo_url'])) {
            $tool['logo_url'] = getFullLogoUrl($tool['logo_url']);
        }
        
        $updateStmt = $pdo->prepare("UPDATE tools SET view_count = view_count + 1 WHERE id = ?");
        $updateStmt->execute([$tool['id']]);
        echo json_encode($tool);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Tool not found', 'slug' => $slug]);
    }
}

function generateSlug($name) {
    // Convert to lowercase
    $slug = strtolower($name);
    
    // Replace special characters
    $slug = str_replace('&', 'and', $slug);
    $slug = str_replace('.', '', $slug);
    $slug = str_replace('/', '-', $slug);
    $slug = str_replace(' ', '-', $slug);
    
    // Remove multiple dashes
    $slug = preg_replace('/-+/', '-', $slug);
    
    // Remove leading/trailing dashes
    $slug = trim($slug, '-');
    
    return $slug;
}

function createTool() {
    global $pdo;
    
    // Check if request is JSON or FormData
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    $isFormData = strpos($contentType, 'multipart/form-data') !== false;
    
    if ($isFormData) {
        // Handle FormData submission
        $input = $_POST;
        $categoryIdsJson = $input['categoryIds'] ?? '[]';
        $categoryIds = json_decode($categoryIdsJson, true) ?? [];
    } else {
        // Handle JSON submission
        $input = json_decode(file_get_contents('php://input'), true);
        $categoryIds = $input['categoryIds'] ?? [];
    }
    
    // Generate slug from name
    $slug = generateSlug($input['name']);
    
    // Check if slug already exists and make it unique
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM tools WHERE slug = ?");
    $stmt->execute([$slug]);
    $count = $stmt->fetchColumn();
    
    if ($count > 0) {
        $slug = $slug . '-' . time();
    }
    
    // Map frontend field names to database columns
    $shortDescription = $input['shortDescription'] ?? $input['description'] ?? '';
    $fullDescription = $input['fullDescription'] ?? $shortDescription;
    $websiteUrl = $input['websiteUrl'] ?? $input['website_url'] ?? '';
    $logoUrl = $input['logoUrl'] ?? $input['logo_url'] ?? 'https://clarifyall.com/logos/default.png';
    $categoryId = $categoryIds[0] ?? $input['categoryId'] ?? null;
    $pricingModel = $input['pricingModel'] ?? $input['pricing_model'] ?? 'FREE';
    
    // Check if status is provided (for admin auto-approval)
    $status = $input['status'] ?? 'PENDING_APPROVAL';
    
    // Handle logo upload if FormData
    if ($isFormData && isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
        $uploadResult = handleLogoUpload($_FILES['logo']);
        if ($uploadResult['success']) {
            $logoUrl = $uploadResult['url'];
        }
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO tools (
            name, 
            slug, 
            description, 
            short_description, 
            full_description, 
            website_url, 
            logo_url, 
            category_id, 
            pricing_model, 
            platforms, 
            feature_tags, 
            status, 
            created_at
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $result = $stmt->execute([
        $input['name'],
        $slug,
        $shortDescription, // description field
        $shortDescription, // short_description field
        $fullDescription,  // full_description field
        $websiteUrl,
        $logoUrl,
        $categoryId,
        $pricingModel,
        json_encode($input['platforms'] ?? []),
        json_encode($input['featureTags'] ?? []),
        $status
    ]);
    
    if ($result) {
        $toolId = $pdo->lastInsertId();
        echo json_encode([
            'success' => true, 
            'id' => $toolId,
            'slug' => $slug,
            'message' => $status === 'APPROVED' 
                ? 'Tool submitted and approved successfully!' 
                : 'Tool submitted successfully! It will be reviewed and published soon.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create tool']);
    }
}

function handleLogoUpload($file) {
    $allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    
    // Validate file type
    if (!in_array($file['type'], $allowedTypes)) {
        return ['success' => false, 'error' => 'Invalid file type'];
    }
    
    // Validate file size
    if ($file['size'] > $maxSize) {
        return ['success' => false, 'error' => 'File too large'];
    }
    
    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/../logos/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('tool_', true) . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return ['success' => true, 'url' => 'https://clarifyall.com/logos/' . $filename];
    }
    
    return ['success' => false, 'error' => 'Upload failed'];
}

function getAllTools() {
    global $pdo;
    
    // Get all tools regardless of status (for admin)
    $query = "SELECT t.*, 
              GROUP_CONCAT(DISTINCT c.id) as category_ids,
              GROUP_CONCAT(DISTINCT c.name) as category_names
              FROM tools t
              LEFT JOIN categories c ON t.category_id = c.id
              GROUP BY t.id
              ORDER BY t.created_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $tools = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format tools with categories array
    foreach ($tools as &$tool) {
        $categories = [];
        if ($tool['category_ids']) {
            $ids = explode(',', $tool['category_ids']);
            $names = explode(',', $tool['category_names']);
            for ($i = 0; $i < count($ids); $i++) {
                $categories[] = [
                    'id' => (int)$ids[$i],
                    'name' => $names[$i]
                ];
            }
        }
        $tool['categories'] = $categories;
        
        // Convert logo URL to full URL for cross-origin setup
        $fullLogoUrl = getFullLogoUrl($tool['logo_url']);
        
        // Map fields for frontend compatibility
        $tool['websiteUrl'] = $tool['website_url'];
        $tool['logoUrl'] = $fullLogoUrl;
        $tool['logo_url'] = $fullLogoUrl;
        $tool['shortDescription'] = $tool['short_description'] ?? $tool['description'];
        $tool['fullDescription'] = $tool['full_description'] ?? $tool['description'];
        $tool['pricingModel'] = $tool['pricing_model'];
        $tool['viewCount'] = $tool['view_count'];
        $tool['saveCount'] = $tool['save_count'];
        
        unset($tool['category_ids']);
        unset($tool['category_names']);
    }
    
    echo json_encode($tools);
}

function incrementViewCount($id) {
    global $pdo;
    
    $stmt = $pdo->prepare("UPDATE tools SET view_count = view_count + 1 WHERE id = ?");
    $result = $stmt->execute([$id]);
    
    if ($result) {
        $stmt = $pdo->prepare("SELECT view_count FROM tools WHERE id = ?");
        $stmt->execute([$id]);
        $viewCount = $stmt->fetchColumn();
        echo json_encode(['success' => true, 'viewCount' => (int)$viewCount]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to increment view count']);
    }
}

function updateTool($id) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $fields = [];
    $params = [];
    
    if (isset($input['name'])) {
        $fields[] = "name = ?";
        $params[] = $input['name'];
    }
    if (isset($input['websiteUrl'])) {
        $fields[] = "website_url = ?";
        $params[] = $input['websiteUrl'];
    }
    if (isset($input['shortDescription'])) {
        $fields[] = "short_description = ?, description = ?";
        $params[] = $input['shortDescription'];
        $params[] = $input['shortDescription'];
    }
    if (isset($input['fullDescription'])) {
        $fields[] = "full_description = ?";
        $params[] = $input['fullDescription'];
    }
    if (isset($input['pricingModel'])) {
        $fields[] = "pricing_model = ?";
        $params[] = $input['pricingModel'];
    }
    if (isset($input['logoUrl'])) {
        $fields[] = "logo_url = ?";
        $params[] = $input['logoUrl'];
    }
    if (isset($input['categoryIds']) && is_array($input['categoryIds']) && count($input['categoryIds']) > 0) {
        $fields[] = "category_id = ?";
        $params[] = $input['categoryIds'][0]; // Use first category
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        return;
    }
    
    $params[] = $id;
    $query = "UPDATE tools SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($query);
    $result = $stmt->execute($params);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update tool']);
    }
}

function approveTool($id) {
    global $pdo;
    
    $stmt = $pdo->prepare("UPDATE tools SET status = 'APPROVED' WHERE id = ?");
    $result = $stmt->execute([$id]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to approve tool']);
    }
}

function rejectTool($id) {
    global $pdo;
    
    $stmt = $pdo->prepare("UPDATE tools SET status = 'REJECTED' WHERE id = ?");
    $result = $stmt->execute([$id]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to reject tool']);
    }
}

function deleteTool($id) {
    global $pdo;
    
    $stmt = $pdo->prepare("DELETE FROM tools WHERE id = ?");
    $result = $stmt->execute([$id]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete tool']);
    }
}

function uploadLogo($id = null) {
    global $pdo;
    
    // Check if file was uploaded
    if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded or upload error']);
        return;
    }
    
    $file = $_FILES['logo'];
    $allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    
    // Validate file type
    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Only PNG, JPG, GIF, and WebP are allowed']);
        return;
    }
    
    // Validate file size
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'File size exceeds 5MB limit']);
        return;
    }
    
    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/../logos/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'tool-' . uniqid() . '-' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        // Return FULL URL for cross-origin setup (xenai.xyz frontend + clarifyall.com backend)
        $logoUrl = 'https://clarifyall.com/logos/' . $filename;
        echo json_encode([
            'success' => true,
            'logoUrl' => $logoUrl,
            'filename' => $filename
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save uploaded file']);
    }
}
?>
