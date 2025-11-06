import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import promptService from '../services/promptService';
import PromptCard from './PromptCard';
import PromptFilters from './PromptFilters';
import SEO from './SEO';
import '../styles/PromptsLibrary.css';

function PromptsPage() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    type: null,
    category_id: null,
    tool_id: null,
    sort: 'created_at',
    order: 'desc',
    page: 1,
    limit: 12
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [filters]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadCategories()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await promptService.getPrompts({
        search: filters.search,
        type: filters.type,
        category_id: filters.category_id,
        tool_id: filters.tool_id,
        sort: filters.sort,
        order: filters.order,
        page: filters.page,
        limit: filters.limit
      });
      
      setPrompts(data.prompts || data);
      
      // Calculate total pages if pagination info is available
      if (data.total) {
        setTotalPages(Math.ceil(data.total / filters.limit));
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await promptService.getCategories();
      // Flatten categories for dropdown
      const flatCategories = flattenCategories(data);
      // Remove duplicates by ID (additional safety check)
      const uniqueCategories = flatCategories.filter((cat, index, self) => 
        index === self.findIndex(c => c.id === cat.id)
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const flattenCategories = (categories, level = 0, seenIds = new Set(), seenNames = new Set()) => {
    let result = [];
    if (!categories || !Array.isArray(categories)) {
      return result;
    }
    categories.forEach(cat => {
      // Skip if category is invalid or we've already seen this category ID
      if (cat && cat.id && !seenIds.has(cat.id)) {
        // Only include parent categories (no parent_id) or if we haven't seen this name yet
        // This prevents showing duplicate category names (parent and child with same name)
        const isParent = !cat.parent_id || cat.parent_id === null;
        const nameKey = (cat.name || '').toLowerCase().trim();
        
        if (isParent || !seenNames.has(nameKey)) {
          seenIds.add(cat.id);
          seenNames.add(nameKey);
          result.push({ ...cat, level });
          // Don't include children in the dropdown to avoid duplicates
          // if (cat.children && Array.isArray(cat.children) && cat.children.length > 0) {
          //   result = result.concat(flattenCategories(cat.children, level + 1, seenIds, seenNames));
          // }
        }
      }
    });
    return result;
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...newFilters, page: 1 });
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: null,
      category_id: null,
      tool_id: null,
      sort: 'created_at',
      order: 'desc',
      page: 1,
      limit: 12
    });
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = (promptId) => {
    // TODO: Implement save to collection
    console.log('Save prompt:', promptId);
    alert('Please login to save prompts to your collection');
  };

  const handleUpvote = async (promptId) => {
    try {
      // TODO: Get user ID from auth context
      const userId = 1; // Placeholder
      await promptService.upvotePrompt(promptId, userId);
      loadPrompts(); // Reload to get updated counts
    } catch (error) {
      console.error('Error upvoting:', error);
      alert('Please login to vote on prompts');
    }
  };

  const handleDownvote = async (promptId) => {
    try {
      // TODO: Get user ID from auth context
      const userId = 1; // Placeholder
      await promptService.downvotePrompt(promptId, userId);
      loadPrompts(); // Reload to get updated counts
    } catch (error) {
      console.error('Error downvoting:', error);
      alert('Please login to vote on prompts');
    }
  };

  return (
    <div className="prompts-library">
      <SEO 
        title={`AI Prompts Library - ${filters.search ? `Search: ${filters.search}` : filters.category_id ? 'Browse by Category' : filters.tool_id ? 'Browse by Tool' : 'Free AI Prompts'} | Clarifyall`}
        description={`Browse our collection of ${prompts.length > 0 ? `${prompts.length}+` : ''} AI prompts for image generation, video creation, and editing. Find prompts for Midjourney, DALL-E, Stable Diffusion, and more. ${filters.difficulty ? `Difficulty: ${filters.difficulty}.` : ''}`}
        keywords={`AI prompts, ${filters.type || 'image generation'} prompts, Midjourney prompts, DALL-E prompts, Stable Diffusion prompts, AI art, image generation, video prompts, ${filters.difficulty ? `${filters.difficulty} prompts` : ''}`}
        dynamicKeywords={{
          totalPrompts: prompts.length,
          type: filters.type,
          difficulty: filters.difficulty,
          category: filters.category_id
        }}
        canonicalUrl="/prompts"
        schemaType="website"
      />
      

      {/* Header */}
      <div className="prompts-header">
        <h1><span>🎨</span> AI Prompts Library</h1>
      
      </div>

      {/* Filters */}
      <PromptFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        onClearFilters={handleClearFilters}
      />

      {/* Results Header with Sort */}
      {!loading && prompts.length > 0 && (
        <div className="results-header">
          <div className="results-count">
            <span>{prompts.length} prompt{prompts.length !== 1 ? 's' : ''} found</span>
          </div>
          <div className="sort-control">
            <label>Sort By:</label>
            <select
              className="sort-select"
              value={filters.sort || 'created_at'}
              onChange={(e) => handleFilterChange({ ...filters, sort: e.target.value })}
            >
              <option value="created_at">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="views">Most Viewed</option>
              <option value="upvotes">Most Upvoted</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="prompts-loading">
          <div className="spinner"></div>
          <p>Loading prompts...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && prompts.length === 0 && (
        <div className="prompts-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3>No prompts found</h3>
          <p>Try adjusting your filters or be the first to submit a prompt!</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/submit-prompt')}
            style={{ marginTop: '1rem' }}
          >
            Submit Your Prompt
          </button>
        </div>
      )}

      {/* Prompts Grid */}
      {!loading && prompts.length > 0 && (
        <>
          <div className="prompts-grid">
            {prompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onSave={handleSave}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                isSaved={false} // TODO: Check if saved
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="prompts-pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                  <path d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === page - 2 || pageNum === page + 2) {
                  return <span key={pageNum} style={{ padding: '0 0.5rem' }}>...</span>;
                }
                return null;
              })}

              <button
                className="pagination-btn"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PromptsPage;
