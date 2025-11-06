import dbService from './dbService';

// Get all tools with filters
export const getTools = async (filters = {}) => {
  const response = await dbService.getTools(filters);
  // dbService now returns full response with pagination
  return response;
};

// Get tool by ID
export const getToolById = async (id) => {
  const tool = await dbService.getToolById(id);
  if (!tool) {
    throw new Error('Tool not found');
  }
  return tool;
};

// Submit a new tool
export const submitTool = async (toolData, logoFile) => {
  // First, upload the logo if provided
  let logoUrl = '/logos/default.png';
  
  if (logoFile) {
    try {
      const uploadResult = await dbService.uploadLogo(logoFile);
      logoUrl = uploadResult.logoUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      // Continue with default logo if upload fails
    }
  }
  
  const toolToSubmit = {
    ...toolData,
    logoUrl
  };
  
  const toolId = await dbService.createTool(toolToSubmit);
  
  return {
    success: true,
    message: 'Tool submitted successfully! It will be reviewed and published soon.',
    toolId
  };
};

// Increment view count
export const incrementViewCount = async (id) => {
  await dbService.incrementViewCount(id);
  return { success: true };
};

// Increment save count
export const incrementSaveCount = async (id) => {
  // This will be handled by user save/unsave actions
  return { success: true };
};

// Get popular tools
export const getPopularTools = async () => {
  const tools = await dbService.getTools({ sortBy: 'popular', size: 6 });
  return tools;
};

// Get recent tools
export const getRecentTools = async () => {
  const tools = await dbService.getTools({ sortBy: 'recent', size: 6 });
  return tools;
};

// Get similar tools based on category and related content
export const getSimilarTools = async (id) => {
  try {
    const currentTool = await dbService.getToolById(id);
    if (!currentTool) return [];
    
    const relatedTools = [];
    const seenIds = new Set([parseInt(id)]);
    
    // 1. Get tools from same category (primary match)
    if (currentTool.category_id) {
      try {
        const categoryTools = await dbService.getTools({ 
          categoryId: currentTool.category_id, 
          size: 10 
        });
        const tools = categoryTools.tools || categoryTools || [];
        for (const tool of tools) {
          if (tool.id && !seenIds.has(parseInt(tool.id)) && tool.status === 'APPROVED') {
            relatedTools.push(tool);
            seenIds.add(parseInt(tool.id));
            if (relatedTools.length >= 6) break;
          }
        }
      } catch (err) {
        console.warn('Error loading tools by category:', err);
      }
    }
    
    // 2. If we don't have enough, get tools with similar pricing model
    if (relatedTools.length < 6 && currentTool.pricingModel) {
      try {
        const pricingTools = await dbService.getTools({ 
          size: 20 
        });
        const tools = pricingTools.tools || pricingTools || [];
        for (const tool of tools) {
          if (tool.id && !seenIds.has(parseInt(tool.id)) && 
              tool.pricingModel === currentTool.pricingModel && 
              tool.status === 'APPROVED') {
            relatedTools.push(tool);
            seenIds.add(parseInt(tool.id));
            if (relatedTools.length >= 6) break;
          }
        }
      } catch (err) {
        console.warn('Error loading tools by pricing:', err);
      }
    }
    
    // 3. If still not enough, get popular tools
    if (relatedTools.length < 6) {
      try {
        const popularTools = await dbService.getTools({ 
          sortBy: 'popular', 
          size: 20 
        });
        const tools = popularTools.tools || popularTools || [];
        for (const tool of tools) {
          if (tool.id && !seenIds.has(parseInt(tool.id)) && tool.status === 'APPROVED') {
            relatedTools.push(tool);
            seenIds.add(parseInt(tool.id));
            if (relatedTools.length >= 6) break;
          }
        }
      } catch (err) {
        console.warn('Error loading popular tools:', err);
      }
    }
    
    return relatedTools.slice(0, 6);
  } catch (error) {
    console.error('Error loading similar tools:', error);
    return [];
  }
};

// Export as default object as well for backward compatibility
export default {
  getTools,
  getToolById,
  submitTool,
  incrementViewCount,
  incrementSaveCount,
  getPopularTools,
  getRecentTools,
  getSimilarTools,
};
