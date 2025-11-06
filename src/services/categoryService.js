import dbService from './dbService';

// Get all categories
export const getCategories = async () => {
  return await dbService.getCategories();
};

// Get category by ID
export const getCategoryById = async (id) => {
  try {
    const category = await dbService.getCategoryById(id);
    if (!category) {
      console.warn(`Category with ID ${id} not found`);
      return null; // Return null instead of throwing error
    }
    return category;
  } catch (err) {
    console.warn(`Error fetching category ${id}:`, err);
    return null; // Return null instead of throwing error
  }
};

// Get category by slug
export const getCategoryBySlug = async (slug) => {
  const categories = await dbService.getCategories();
  const category = categories.find(cat => cat.slug === slug);
  if (!category) {
    throw new Error('Category not found');
  }
  return category;
};

// Export as default object as well for backward compatibility
export default {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
};
