import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { generateToolInfo } from '../services/openrouterService';
import { PRICING_LABELS } from '../utils/constants';
import '../styles/AdminDashboard.css';

function AdminSubmitTool() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    categoryIds: [],
    pricingModel: '',
    shortDescription: '',
    fullDescription: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [toolNameSearch, setToolNameSearch] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  // Cleanup logo preview URL on unmount
  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  useEffect(() => {
    if (logoFile) {
      const preview = URL.createObjectURL(logoFile);
      setLogoPreview(preview);
      return () => {
        URL.revokeObjectURL(preview);
      };
    } else {
      setLogoPreview(null);
    }
  }, [logoFile]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories.php');
      setCategories(response.data || []);
      setFilteredCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
      setFilteredCategories([]);
    }
  };

  useEffect(() => {
    if (categorySearch.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(cat =>
        cat.name?.toLowerCase().includes(categorySearch.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [categorySearch, categories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCategoryChange = (categoryId) => {
    const currentCategories = [...formData.categoryIds];
    const index = currentCategories.indexOf(categoryId);

    if (index > -1) {
      currentCategories.splice(index, 1);
    } else {
      if (currentCategories.length < 3) {
        currentCategories.push(categoryId);
      } else {
        setError('You can select a maximum of 3 categories');
        setTimeout(() => setError(''), 3000);
        return;
      }
    }

    setFormData({ ...formData, categoryIds: currentCategories });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (PNG, JPG, or GIF)');
        setTimeout(() => setError(''), 3000);
        e.target.value = '';
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setTimeout(() => setError(''), 3000);
        e.target.value = '';
        return;
      }
      
      setLogoFile(file);
    }
  };

  // Generate tool info using AI
  const handleGenerateWithAI = async () => {
    if (!toolNameSearch.trim()) {
      setError('Please enter a tool name to generate information');
      return;
    }

    setGenerating(true);
    setError('');
    setAiSuggestions([]);

    try {
      const generatedData = await generateToolInfo(toolNameSearch);
      setAiSuggestions([generatedData]);
      
      // Auto-populate form with generated data
      setFormData({
        name: generatedData.name || '',
        websiteUrl: generatedData.websiteUrl || '',
        categoryIds: [], // Will be filled based on category matching
        pricingModel: generatedData.pricingModel || '',
        shortDescription: generatedData.shortDescription || '',
        fullDescription: generatedData.fullDescription || '',
      });

      // Try to match categories
      const matchedCategories = [];
      for (const catName of (generatedData.categories || [])) {
        const matched = categories.find(cat => 
          cat.name.toLowerCase().includes(catName.toLowerCase()) ||
          catName.toLowerCase().includes(cat.name.toLowerCase())
        );
        if (matched && matchedCategories.length < 3) {
          matchedCategories.push(matched.id);
        }
      }
      
      if (matchedCategories.length > 0) {
        setFormData(prev => ({ ...prev, categoryIds: matchedCategories }));
      }

      setError('');
    } catch (err) {
      setError(err.message || 'Failed to generate tool information. Please try again.');
      console.error('AI generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.name) {
      setError('Tool name is required');
      setLoading(false);
      return;
    }

    if (!formData.categoryIds || formData.categoryIds.length === 0) {
      setError('Please select at least one category');
      setLoading(false);
      return;
    }

    if (!formData.pricingModel) {
      setError('Please select a pricing model');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for submission
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('name', formData.name);
      formDataToSubmit.append('websiteUrl', formData.websiteUrl);
      formDataToSubmit.append('shortDescription', formData.shortDescription);
      formDataToSubmit.append('fullDescription', formData.fullDescription);
      formDataToSubmit.append('pricingModel', formData.pricingModel);
      formDataToSubmit.append('categoryIds', JSON.stringify(formData.categoryIds));
      formDataToSubmit.append('status', 'APPROVED'); // Auto-approve for admin submissions
      
      if (logoFile) {
        formDataToSubmit.append('logo', logoFile);
      }

      await api.postFormData('/tools.php', formDataToSubmit);
      
      setSuccess(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: '',
          websiteUrl: '',
          categoryIds: [],
          pricingModel: '',
          shortDescription: '',
          fullDescription: '',
        });
        setLogoFile(null);
        setLogoPreview(null);
        setToolNameSearch('');
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit tool. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-submit-tool admin-page admin-content">
      <div className="admin-header-new">
        <div>
          <h1>Submit New Tool</h1>
          <p className="text-muted">AI-powered tool submission with auto-approval</p>
        </div>
      </div>

      {success && (
        <div className="alert alert-success">
          ✓ Tool submitted and approved successfully!
        </div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* AI Search Bar */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3>🤖 AI Tool Information Generator</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label>Enter Tool Name</label>
              <input
                type="text"
                placeholder="e.g., ChatGPT, Midjourney, Claude"
                value={toolNameSearch}
                onChange={(e) => setToolNameSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGenerateWithAI()}
                style={{ width: '100%', padding: '0.75rem' }}
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={generating || !toolNameSearch.trim()}
              className="btn btn-primary"
              style={{ marginTop: '1.5rem' }}
            >
              {generating ? '✨ Generating...' : '✨ Generate with AI'}
            </button>
          </div>
          {generating && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f4ff', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#4a5568' }}>
                AI is analyzing the tool and generating comprehensive information...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body">
          <div className="form-group">
            <label>Tool Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Tool Website (URL) *</label>
            <input
              type="url"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleInputChange}
              placeholder="https://..."
              required
            />
          </div>

          <div className="form-group">
            <label>Categories (Select up to 3) *</label>
            {categories.length > 8 && (
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                style={{ marginBottom: '1rem', padding: '0.5rem' }}
              />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
              {filteredCategories.map((category) => (
                <label
                  key={category.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: formData.categoryIds.includes(category.id) ? '#e6fffa' : 'white'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.categoryIds.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {category.name}
                </label>
              ))}
            </div>
            <small>{formData.categoryIds.length}/3 categories selected</small>
          </div>

          <div className="form-group">
            <label>Pricing Model *</label>
            <select
              name="pricingModel"
              value={formData.pricingModel}
              onChange={handleInputChange}
              required
            >
              <option value="">Select pricing model</option>
              <option value="FREE">Free</option>
              <option value="FREEMIUM">Freemium</option>
              <option value="FREE_TRIAL">Free Trial</option>
              <option value="OPEN_SOURCE">Open Source</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div className="form-group">
            <label>Short Description (Max 150 chars) *</label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleInputChange}
              maxLength={150}
              required
            />
            <small>{formData.shortDescription.length}/150</small>
          </div>

          <div className="form-group">
            <label>Full Description</label>
            <textarea
              name="fullDescription"
              value={formData.fullDescription}
              onChange={handleInputChange}
              rows={8}
              placeholder="Provide detailed description..."
            />
            <small>{formData.fullDescription.length} characters</small>
          </div>

          <div className="form-group">
            <label>Upload Logo (Optional)</label>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                onChange={handleFileChange}
                style={{ width: '100%' }}
              />
            </div>
            {logoPreview && (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{ maxWidth: '200px', height: 'auto', borderRadius: '8px' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            <small>Max file size: 5MB | Supported: PNG, JPG, GIF</small>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Submitting...' : '✓ Submit & Auto-Approve'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  name: '',
                  websiteUrl: '',
                  categoryIds: [],
                  pricingModel: '',
                  shortDescription: '',
                  fullDescription: '',
                });
                setLogoFile(null);
                setLogoPreview(null);
                setToolNameSearch('');
              }}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Clear Form
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminSubmitTool;


