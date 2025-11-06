import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import blogService from '../services/blogService';
import SEO from './SEO';
import '../styles/BlogPage.css';

const BLOG_CATEGORIES = {
  'all': 'All Articles',
  'review': 'AI Tool Reviews',
  'how-to': 'How-To Guides',
  'tutorial': 'Tutorials',
  'news': 'News & Updates',
  'comparison': 'Comparisons',
  'tips': 'Tips & Tricks'
};

function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  
  const currentCategory = searchParams.get('category') || 'all';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';

  useEffect(() => {
    loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCategory, currentPage, search]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {
        status: 'PUBLISHED',
        page: currentPage,
        limit: 12
      };
      
      if (currentCategory !== 'all') {
        filters.category = currentCategory;
      }
      
      if (search) {
        filters.search = search;
      }
      
      const data = await blogService.getArticles(filters);
      // Ensure we handle both array and object responses
      if (Array.isArray(data)) {
        setArticles(data);
        setPagination(null);
      } else if (data && data.articles) {
        setArticles(data.articles || []);
        setPagination(data.pagination || null);
      } else {
        setArticles([]);
        setPagination(null);
      }
    } catch (err) {
      setError('Failed to load articles. Please try again later.');
      console.error('Error loading articles:', err);
      setArticles([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSearchParams({ category, page: '1' });
  };

  const handlePageChange = (page) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', page.toString());
      return newParams;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !articles.length) {
    return (
      <div className="blog-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page">
      <SEO 
        title={`AI Tools Blog - ${currentCategory !== 'all' ? BLOG_CATEGORIES[currentCategory] : 'Reviews, Guides & News'} | Clarifyall`}
        description={`Read the latest AI tool ${currentCategory === 'review' ? 'reviews' : currentCategory === 'how-to' ? 'how-to guides' : currentCategory === 'news' ? 'news and updates' : currentCategory === 'comparison' ? 'comparisons' : 'articles'}. Stay updated with the AI industry and discover new tools. ${pagination?.total_elements ? `Browse ${pagination.total_elements} articles.` : ''}`}
        keywords={`AI tools blog, AI tool ${currentCategory === 'review' ? 'reviews' : currentCategory === 'how-to' ? 'guides' : currentCategory === 'news' ? 'news' : currentCategory === 'comparison' ? 'comparisons' : 'articles'}, AI tutorials, AI news, ChatGPT guides`}
        dynamicKeywords={{
          category: BLOG_CATEGORIES[currentCategory],
          totalArticles: pagination?.total_elements
        }}
        canonicalUrl={`/blog${currentCategory !== 'all' ? `?category=${currentCategory}` : ''}`}
        schemaType="website"
      />
      
      {/* Hero Section */}
      <section className="blog-hero">
        <div className="blog-hero-content">
          <h1>AI Tools Blog</h1>
          <p>Reviews, guides, tutorials, and the latest news about AI tools</p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="blog-filters">
        <div className="blog-filters-container">
          <div className="category-filters">
            {Object.entries(BLOG_CATEGORIES).map(([key, label]) => (
              <button
                key={key}
                className={`category-filter ${currentCategory === key ? 'active' : ''}`}
                onClick={() => handleCategoryChange(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="blog-content">
        <div className="blog-container">
          {error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={loadArticles} className="btn btn-primary">Try Again</button>
            </div>
          ) : articles.length === 0 ? (
            <div className="no-articles">
              <h3>No articles found</h3>
              <p>Try selecting a different category or check back later for new content.</p>
            </div>
          ) : (
            <>
              <div className="articles-grid">
                {articles.map((article, index) => {
                  // Skip if article doesn't have required fields
                  if (!article || !article.id || !article.slug || !article.title) {
                    return null;
                  }
                  
                  return (
                  <React.Fragment key={article.id}>
                    <Link to={`/blog/${article.slug}`} className="article-card">
                      {article.featured_image && (
                        <div className="article-image">
                          <img src={article.featured_image} alt={article.title} />
                        </div>
                      )}
                      <div className="article-content">
                        <div className="article-meta">
                          <span className="article-category">{article.category || 'general'}</span>
                          <span className="article-date">
                            {article.published_at || article.created_at ? new Date(article.published_at || article.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'Recently'}
                          </span>
                          <span className="article-read-time">{article.read_time || 5} min read</span>
                        </div>
                        <h2 className="article-title">{article.title}</h2>
                        {article.excerpt && (
                          <p className="article-excerpt">{article.excerpt}</p>
                        )}
                        <div className="article-footer">
                          {article.author_name && (
                            <span className="article-author">By {article.author_name}</span>
                          )}
                          <div className="article-stats">
                            <span>👁️ {article.view_count || 0} views</span>
                          </div>
                        </div>
                        {article.tags && Array.isArray(article.tags) && article.tags.length > 0 && (
                          <div className="article-tags">
                            {article.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="article-tag">{typeof tag === 'string' ? tag : String(tag)}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                    
                  </React.Fragment>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="blog-pagination">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </button>
                  
                  <div className="pagination-numbers">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    className="pagination-btn"
                    disabled={currentPage === pagination.pages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default BlogPage;

