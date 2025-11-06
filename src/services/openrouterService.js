/**
 * OpenRouter AI Service
 * Uses PHP backend API to generate tool information from tool names
 */

const API_BASE_URL = 'https://clarifyall.com/php-api';

/**
 * Generate tool information using AI
 * @param {string} toolName - The name of the tool
 * @returns {Promise<Object>} Generated tool data
 */
export async function generateToolInfo(toolName) {
  try {
    const response = await fetch(`${API_BASE_URL}/openrouter.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        toolName: toolName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Data is already normalized by the backend
    return {
      name: data.name || toolName,
      shortDescription: data.shortDescription || '',
      fullDescription: data.fullDescription || '',
      websiteUrl: data.websiteUrl || '',
      pricingModel: data.pricingModel || 'FREE',
      features: data.features || [],
      categories: data.categories || [],
      useCases: data.useCases || []
    };
  } catch (error) {
    console.error('Error generating tool info:', error);
    throw new Error(`Failed to generate tool information: ${error.message}`);
  }
}

/**
 * Generate blog post content using AI
 * @param {string} subject - The blog topic/subject
 * @returns {Promise<Object>} Generated blog post data
 */
export async function generateBlogPost(subject) {
  try {
    const response = await fetch(`${API_BASE_URL}/openrouter.php/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: subject
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    
    return {
      title: data.title || '',
      excerpt: data.excerpt || '',
      content: data.content || '',
      tags: data.tags || [],
      category: data.category || 'General'
    };
  } catch (error) {
    console.error('Error generating blog post:', error);
    throw new Error(`Failed to generate blog post: ${error.message}`);
  }
}

/**
 * Check if OpenRouter API is available
 * Note: This is a simplified check - the actual availability is checked by the backend
 */
export async function checkOpenRouterAvailability() {
  try {
    const response = await fetch(`${API_BASE_URL}/openrouter.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        toolName: 'test'
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  generateToolInfo,
  generateBlogPost,
  checkOpenRouterAvailability
};

