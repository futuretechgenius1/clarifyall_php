import React, { useState, useEffect } from 'react';
import blogService from '../services/blogService';
import { generateBlogPost } from '../services/openrouterService';

const BLOG_CATEGORIES = ['review', 'how-to', 'tutorial', 'news', 'comparison', 'tips', 'general'];

function BlogAdmin() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category: 'general',
    tags: [],
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    status: 'DRAFT',
    is_featured: false,
    related_tools: []
  });
  const [tagInput, setTagInput] = useState('');
  const [toolInput, setToolInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [aiSubject, setAiSubject] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const filters = { status: filterStatus === 'all' ? 'PUBLISHED' : filterStatus };
      if (searchTerm) filters.search = searchTerm;
      const data = await blogService.getArticles(filters);
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Error loading articles:', err);
      alert('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article.id);
    setArticleForm({
      title: article.title || '',
      slug: article.slug || '',
      excerpt: article.excerpt || '',
      content: article.content || '',
      featured_image: article.featured_image || '',
      category: article.category || 'general',
      tags: article.tags || [],
      meta_title: article.meta_title || '',
      meta_description: article.meta_description || '',
      meta_keywords: article.meta_keywords || '',
      status: article.status || 'DRAFT',
      is_featured: article.is_featured || false,
      related_tools: article.related_tools || []
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingArticle) {
        await blogService.updateArticle(editingArticle, articleForm);
        alert('Article updated successfully!');
      } else {
        await blogService.createArticle(articleForm);
        alert('Article created successfully!');
      }
      setShowForm(false);
      setEditingArticle(null);
      setArticleForm({
        title: '', slug: '', excerpt: '', content: '', featured_image: '',
        category: 'general', tags: [], meta_title: '', meta_description: '',
        meta_keywords: '', status: 'DRAFT', is_featured: false, related_tools: []
      });
      loadArticles();
    } catch (err) {
      console.error('Error saving article:', err);
      alert('Failed to save article');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    
    try {
      await blogService.deleteArticle(id);
      alert('Article deleted successfully!');
      loadArticles();
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Failed to delete article');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !articleForm.tags.includes(tagInput.trim())) {
      setArticleForm({
        ...articleForm,
        tags: [...articleForm.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setArticleForm({
      ...articleForm,
      tags: articleForm.tags.filter(t => t !== tag)
    });
  };

  const addRelatedTool = () => {
    const toolId = parseInt(toolInput.trim());
    if (toolId && !articleForm.related_tools.includes(toolId)) {
      setArticleForm({
        ...articleForm,
        related_tools: [...articleForm.related_tools, toolId]
      });
      setToolInput('');
    }
  };

  const removeRelatedTool = (toolId) => {
    setArticleForm({
      ...articleForm,
      related_tools: articleForm.related_tools.filter(id => id !== toolId)
    });
  };

  // Auto-generate slug from title
  const generateSlug = (title) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Generate blog post using AI
  const handleGenerateAI = async () => {
    if (!aiSubject.trim()) {
      alert('Please enter a subject for the blog post');
      return;
    }
    
    try {
      setGenerating(true);
      const generatedData = await generateBlogPost(aiSubject.trim());
      
      // Auto-fill the form with generated data
      setArticleForm({
        ...articleForm,
        title: generatedData.title || articleForm.title,
        slug: generateSlug(generatedData.title || articleForm.title),
        excerpt: generatedData.excerpt || articleForm.excerpt,
        content: generatedData.content || articleForm.content,
        category: generatedData.category || articleForm.category,
        tags: generatedData.tags || articleForm.tags
      });
      
      alert('Blog post generated successfully! Please review and edit as needed before publishing.');
      setAiSubject('');
    } catch (error) {
      console.error('Error generating blog post:', error);
      alert('Failed to generate blog post: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="blog-admin admin-page">
      <div className="admin-header-new">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Blog Management</h1>
            <p className="text-muted">Create, edit, and manage blog articles</p>
          </div>
          <button className="btn btn-primary" onClick={() => {
            setShowForm(true);
            setEditingArticle(null);
            setArticleForm({
              title: '', slug: '', excerpt: '', content: '', featured_image: '',
              category: 'general', tags: [], meta_title: '', meta_description: '',
              meta_keywords: '', status: 'DRAFT', is_featured: false, related_tools: []
            });
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v16m8-8H4" />
            </svg>
            New Article
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input-sm"
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="form-input-sm"
        >
          <option value="all">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button className="btn btn-secondary" onClick={loadArticles}>
          Refresh
        </button>
      </div>

      {/* Article Form */}
      {showForm && (
        <div className="category-form-card" style={{ marginBottom: '2rem' }}>
          <h3>{editingArticle ? 'Edit Article' : 'Create New Article'}</h3>
          
          {/* AI Generation Section */}
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #bae6fd', 
            borderRadius: '8px', 
            padding: '1.5rem', 
            marginBottom: '1.5rem' 
          }}>
            <h4 style={{ marginTop: 0, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🤖 AI Blog Generator
              <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#64748b' }}>
                Generate high-quality, human-like content
              </span>
            </h4>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Blog Subject/Topic
                </label>
                <input
                  type="text"
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !generating && handleGenerateAI()}
                  className="form-input-sm"
                  placeholder="e.g., 'Best AI Tools for Small Businesses in 2024'"
                  disabled={generating}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleGenerateAI}
                disabled={generating || !aiSubject.trim()}
                style={{ whiteSpace: 'nowrap' }}
              >
                {generating ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
            {generating && (
              <div style={{ marginTop: '1rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                Generating your blog post...
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={articleForm.title}
              onChange={(e) => {
                setArticleForm({
                  ...articleForm,
                  title: e.target.value,
                  slug: articleForm.slug || generateSlug(e.target.value)
                });
              }}
              className="form-input-sm"
              placeholder="Article title"
            />
          </div>

          <div className="form-group">
            <label>Slug *</label>
            <input
              type="text"
              value={articleForm.slug}
              onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
              className="form-input-sm"
              placeholder="url-friendly-slug"
            />
          </div>

          <div className="form-group">
            <label>Excerpt</label>
            <textarea
              value={articleForm.excerpt}
              onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
              className="form-textarea-sm"
              rows="3"
              placeholder="Short description for article listing"
            />
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea
              value={articleForm.content}
              onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
              className="form-textarea-sm"
              rows="15"
              placeholder="Article content (HTML supported)"
            />
          </div>

          <div className="form-group">
            <label>Featured Image URL</label>
            <input
              type="url"
              value={articleForm.featured_image}
              onChange={(e) => setArticleForm({ ...articleForm, featured_image: e.target.value })}
              className="form-input-sm"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Category</label>
              <select
                value={articleForm.category}
                onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                className="form-input-sm"
              >
                {BLOG_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={articleForm.status}
                onChange={(e) => setArticleForm({ ...articleForm, status: e.target.value })}
                className="form-input-sm"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="form-input-sm"
                placeholder="Add tag and press Enter"
              />
              <button type="button" className="btn btn-secondary" onClick={addTag}>
                Add
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {articleForm.tags.map((tag, i) => (
                <span key={i} style={{ 
                  background: '#e0e7ff', 
                  color: '#4338ca', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4338ca' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={articleForm.is_featured}
                onChange={(e) => setArticleForm({ ...articleForm, is_featured: e.target.checked })}
              />
              {' '}Featured Article
            </label>
          </div>

          <div className="form-group">
            <label>SEO Meta Title</label>
            <input
              type="text"
              value={articleForm.meta_title}
              onChange={(e) => setArticleForm({ ...articleForm, meta_title: e.target.value })}
              className="form-input-sm"
              placeholder="SEO title"
            />
          </div>

          <div className="form-group">
            <label>SEO Meta Description</label>
            <textarea
              value={articleForm.meta_description}
              onChange={(e) => setArticleForm({ ...articleForm, meta_description: e.target.value })}
              className="form-textarea-sm"
              rows="2"
              placeholder="SEO description"
            />
          </div>

          <div className="form-group">
            <label>Related Tools (Tool IDs)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="number"
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRelatedTool())}
                className="form-input-sm"
                placeholder="Tool ID"
              />
              <button type="button" className="btn btn-secondary" onClick={addRelatedTool}>
                Add
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {articleForm.related_tools.map((toolId, i) => (
                <span key={i} style={{ 
                  background: '#fef3c7', 
                  color: '#92400e', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  Tool #{toolId}
                  <button
                    type="button"
                    onClick={() => removeRelatedTool(toolId)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="btn-group">
            <button className="btn btn-primary" onClick={handleSave}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7" />
              </svg>
              {editingArticle ? 'Update Article' : 'Create Article'}
            </button>
            <button className="btn btn-secondary" onClick={() => {
              setShowForm(false);
              setEditingArticle(null);
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Articles List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="empty-state-new">
          <h3>No articles found</h3>
          <p>Create your first article to get started</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="tools-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Views</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <strong>{article.title}</strong>
                    {article.is_featured && <span style={{ marginLeft: '0.5rem', color: '#f59e0b' }}>⭐</span>}
                  </td>
                  <td>{article.category}</td>
                  <td>
                    <span className={`status-badge ${article.status.toLowerCase()}`}>
                      {article.status}
                    </span>
                  </td>
                  <td>{article.view_count || 0}</td>
                  <td>{new Date(article.published_at || article.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(article)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(article.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                      <a
                        href={`/blog/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-icon"
                        title="View"
                      >
                        👁️
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BlogAdmin;

