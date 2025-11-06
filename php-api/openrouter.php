<?php
/**
 * OpenRouter AI API Proxy
 * This file handles AI-generated tool information via OpenRouter API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// No database connection needed for this endpoint

// OpenRouter API credentials
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Get the HTTP method
$method = $_SERVER['REQUEST_METHOD'];

// Route based on method and path
$path = $_SERVER['REQUEST_URI'] ?? '';
$path = str_replace('/php-api/openrouter.php', '', $path);
$path = trim($path, '/');

// Routing
if ($method === 'POST' && empty($path)) {
    generateToolInfo();
} else if ($method === 'POST' && $path === 'blog') {
    generateBlogPost();
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}

/**
 * Generate tool information using AI
 */
function generateToolInfo() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['toolName'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Tool name is required']);
        return;
    }
    
    $toolName = $input['toolName'];
    
    try {
        $prompt = "Generate comprehensive information for an AI tool called \"{$toolName}\". 

You must respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks, no additional text.

Required JSON structure:
{
  \"name\": \"{$toolName}\",
  \"shortDescription\": \"Brief marketing description (1-2 sentences)\",
  \"fullDescription\": \"Comprehensive detailed description (8-12 sentences) covering: core features and capabilities, how it works, key use cases, supported platforms/integrations, pricing/rate limits, any limitations, target audience, and main benefits over competitors\",
  \"websiteUrl\": \"Official website URL\",
  \"pricingModel\": \"FREE, FREEMIUM, FREE_TRIAL, PAID, or OPEN_SOURCE\",
  \"features\": [\"feature 1\", \"feature 2\", \"feature 3\"],
  \"categories\": [\"Most relevant category\"],
  \"useCases\": [\"Use case 1\", \"Use case 2\", \"Use case 3\"]
}

Guidelines:
- Be factual and accurate
- fullDescription must be detailed and comprehensive (8-12 sentences minimum)
- Include information about: features, usage, rate limits, limitations, integrations
- Return ONLY the JSON object, nothing else";
        
        $requestBody = [
            'model' => 'meta-llama/llama-3.2-3b-instruct:free',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.7,
            'max_tokens' => 3000
        ];
        
        $response = makeOpenRouterRequest($requestBody);
        
        if (!$response) {
            throw new Exception('Failed to get response from OpenRouter API');
        }
        
        $aiResponse = $response['choices'][0]['message']['content'] ?? '';
        
        error_log("OpenRouter AI Response: " . $aiResponse);
        
        // Parse JSON from AI response
        $parsedData = parseAiResponse($aiResponse);
        
        // Normalize categories to array if it's a string
        if (isset($parsedData['categories']) && is_string($parsedData['categories'])) {
            $parsedData['categories'] = [$parsedData['categories']];
        }
        
        // Normalize pricing model to uppercase
        $pricingModel = strtoupper($parsedData['pricingModel'] ?? 'FREE');
        $pricingMap = [
            'FREEMIUM' => 'FREEMIUM',
            'FREMIUM' => 'FREEMIUM',
            'FREE_TRIAL' => 'FREE_TRIAL',
            'TRIAL' => 'FREE_TRIAL',
            'OPEN_SOURCE' => 'OPEN_SOURCE',
            'OPENSOURCE' => 'OPEN_SOURCE',
            'PAID' => 'PAID',
            'PRICE' => 'PAID',
            'FREE' => 'FREE'
        ];
        $pricingModel = $pricingMap[$pricingModel] ?? 'FREE';
        $parsedData['pricingModel'] = $pricingModel;
        
        // Format full description with HTML
        $fullDescription = $parsedData['fullDescription'] ?? '';
        $sentences = preg_split('/[.!?]\s+/', $fullDescription);
        $sentences = array_filter(array_map('trim', $sentences));
        
        $fullDescription = '';
        foreach ($sentences as $sentence) {
            // Add period if missing
            if (!preg_match('/[.!?]$/', $sentence)) {
                $sentence .= '.';
            }
            // Wrap key phrases in <strong> tags
            $formatted = $sentence;
            $keywords = ['features', 'capabilities', 'integration', 'pricing', 'rate limit', 'limitation', 'benefit', 'target audience'];
            foreach ($keywords as $keyword) {
                $formatted = preg_replace('/\b' . preg_quote($keyword, '/') . 's?\b/iu', '<strong>$0</strong>', $formatted);
            }
            $fullDescription .= '<p>' . $formatted . '</p>';
        }
        $parsedData['fullDescription'] = $fullDescription;
        
        echo json_encode($parsedData);
        
    } catch (Exception $e) {
        error_log("Error in generateToolInfo: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate tool information: ' . $e->getMessage()]);
    }
}

/**
 * Make a request to OpenRouter API
 */
function makeOpenRouterRequest($body) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => OPENROUTER_API_URL,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($body),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . OPENROUTER_API_KEY,
            'HTTP-Referer: https://clarifyall.com',
            'X-Title: ClarifyAll Tool Generator'
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        error_log("cURL Error: " . $error);
        return null;
    }
    
    if ($httpCode !== 200) {
        error_log("OpenRouter API HTTP Error: " . $httpCode . " - " . $response);
        return null;
    }
    
    return json_decode($response, true);
}

/**
 * Parse AI response to extract JSON
 */
function parseAiResponse($aiResponse) {
    // First try to parse the response as JSON directly
    $parsed = json_decode($aiResponse, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        return $parsed;
    }
    
    // If direct parse fails, try to extract JSON from the response
    // Improved regex to handle multiline JSON with nested structures
    preg_match('/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/s', $aiResponse, $matches);
    
    if (empty($matches)) {
        // Try to find JSON starting from the first {
        $startPos = strpos($aiResponse, '{');
        if ($startPos !== false) {
            $jsonMatch = substr($aiResponse, $startPos);
            // Find matching closing brace
            $braceCount = 0;
            $endPos = $startPos;
            for ($i = $startPos; $i < strlen($aiResponse); $i++) {
                if ($aiResponse[$i] === '{') $braceCount++;
                if ($aiResponse[$i] === '}') {
                    $braceCount--;
                    if ($braceCount === 0) {
                        $endPos = $i + 1;
                        break;
                    }
                }
            }
            if ($endPos > $startPos) {
                $jsonMatch = substr($aiResponse, $startPos, $endPos - $startPos);
                $parsed = json_decode($jsonMatch, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $parsed;
                }
            }
        }
        throw new Exception('No JSON found in AI response');
    }
    
    $jsonMatch = $matches[0];
    
    $parsed = json_decode($jsonMatch, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('JSON Parse Error: ' . json_last_error_msg());
        error_log('Attempted to parse: ' . substr($jsonMatch, 0, 500));
        throw new Exception('Invalid JSON format in AI response');
    }
    
    return $parsed;
}

/**
 * Generate blog post using AI
 */
function generateBlogPost() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['subject'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Blog subject is required']);
        return;
    }
    
    $subject = $input['subject'];
    
    try {
        $prompt = "Write a comprehensive, engaging blog post about the following topic as if it were written by an expert blogger with personal experience and insights. Make it sound natural, human-written, and authentic.

Topic: {$subject}

CRITICAL REQUIREMENTS:
1. Write in a conversational, engaging style with a unique voice
2. Use personal experiences, anecdotes, and real-world examples where appropriate
3. Avoid generic AI-sounding phrases or patterns
4. Write naturally - vary sentence structure and tone
5. Include specific details, examples, and insights that feel authentic
6. Make the content valuable, informative, and well-researched
7. Use transition words naturally between paragraphs
8. Avoid repetitive phrasing or robotic language
9. Write a LONG, comprehensive article (2000+ words minimum)

You must respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks, no additional text.

Required JSON structure:
{
  \"title\": \"Compelling, SEO-friendly blog post title (50-60 characters)\",
  \"excerpt\": \"Engaging short summary (1-2 sentences) that hooks the reader\",
  \"content\": \"VERY LONG and comprehensive blog post content (minimum 2000 words). Write extensively with multiple sections. Use proper HTML formatting with <p>, <h2>, <h3>, <ul>, <li>, <strong>, and <em> tags. Include headings every 2-3 paragraphs. Make it detailed, valuable, and thorough with deep insights.\",
  \"tags\": [\"tag1\", \"tag2\", \"tag3\", \"tag4\"],
  \"category\": \"Most relevant category\"
}

Guidelines for content:
- Start with a hook that grabs attention
- Use clear headings (h2, h3) to structure content  
- Include 5-7 well-developed main sections with substantial detail
- End with a compelling conclusion that summarizes key points
- Write as if sharing personal knowledge and experience
- Use conversational language but remain professional
- Include specific examples and actionable insights
- Format with proper HTML tags for readability
- Be EXTENSIVE and thorough - the longer and more detailed, the better";
        
        $requestBody = [
            'model' => 'meta-llama/llama-3.3-70b-instruct:free',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.85, // Slightly lower for better consistency
            'max_tokens' => 12000,  // Much higher for comprehensive articles
            'response_format' => ['type' => 'json_object']  // Force JSON output
        ];
        
        $response = makeOpenRouterRequest($requestBody);
        
        if (!$response) {
            throw new Exception('Failed to get response from OpenRouter API');
        }
        
        $aiResponse = $response['choices'][0]['message']['content'] ?? '';
        
        error_log("OpenRouter AI Blog Response length: " . strlen($aiResponse));
        error_log("OpenRouter AI Blog Response first 1000 chars: " . substr($aiResponse, 0, 1000));
        
        // Parse JSON from AI response
        $parsedData = parseAiResponse($aiResponse);
        
        error_log("Parsed data keys: " . implode(', ', array_keys($parsedData)));
        
        // Return the generated blog post data
        echo json_encode([
            'title' => $parsedData['title'] ?? '',
            'excerpt' => $parsedData['excerpt'] ?? '',
            'content' => $parsedData['content'] ?? '',
            'tags' => $parsedData['tags'] ?? [],
            'category' => $parsedData['category'] ?? 'General'
        ]);
        
    } catch (Exception $e) {
        error_log("Error in generateBlogPost: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate blog post: ' . $e->getMessage()]);
    }
}

?>

