import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from './SEO';
import { getToolById, incrementViewCount, getSimilarTools } from '../services/toolService';
import { getCategoryById } from '../services/categoryService';
import { userService } from '../services/userService';
import userActivityService from '../services/userActivityService';
import { PRICING_MODELS } from '../utils/constants';
import { FEATURE_TAGS, PLATFORMS, SOCIAL_PLATFORMS } from '../utils/filterConstants';
import CommentsSection from './CommentsSection';
import '../styles/ToolDetailPage.css';

function ToolDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tool, setTool] = useState(null);
  const [category, setCategory] = useState(null);
  const [similarTools, setSimilarTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const viewStartTime = useRef(null);
  const viewTrackingInterval = useRef(null);

  useEffect(() => {
    loadTool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    checkSavedStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, tool]);

  // Track view time and activity
  useEffect(() => {
    if (tool && isAuthenticated && tool.id) {
      const userId = JSON.parse(localStorage.getItem('user'))?.id;
      if (userId) {
        // Track initial view
        viewStartTime.current = Date.now();
        userActivityService.trackToolView(userId, tool.id, 0);
        userActivityService.trackActivity(userId, tool.id, 'VIEW');
        
        // Update view duration every 30 seconds (reduced frequency to avoid rate limiting)
        viewTrackingInterval.current = setInterval(() => {
          if (viewStartTime.current) {
            const duration = Math.floor((Date.now() - viewStartTime.current) / 1000);
            userActivityService.trackToolView(userId, tool.id, duration);
          }
        }, 30000); // Changed from 10 seconds to 30 seconds
      }
    }
    
    return () => {
      if (viewTrackingInterval.current) {
        clearInterval(viewTrackingInterval.current);
      }
      // Track final duration on unmount
      if (viewStartTime.current && tool && isAuthenticated) {
        const userId = JSON.parse(localStorage.getItem('user'))?.id;
        if (userId) {
          const duration = Math.floor((Date.now() - viewStartTime.current) / 1000);
          userActivityService.trackToolView(userId, tool.id, duration);
        }
      }
    };
  }, [tool, isAuthenticated]);

  const checkSavedStatus = async () => {
    if (isAuthenticated && tool?.id) {
      try {
        const response = await userService.checkSavedTool(tool.id);
        setIsSaved(response.isSaved);
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    }
  };

  const loadTool = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get tool details
      const toolData = await getToolById(id);
      
      // Parse JSON fields if they're strings
      if (typeof toolData.platforms === 'string') {
        try {
          toolData.platforms = JSON.parse(toolData.platforms);
        } catch (e) {
          toolData.platforms = [];
        }
      }
      
      if (typeof toolData.feature_tags === 'string') {
        try {
          toolData.featureTags = JSON.parse(toolData.feature_tags);
        } catch (e) {
          toolData.featureTags = [];
        }
      }
      
      setTool(toolData);
      setSaveCount(toolData.save_count || toolData.saveCount || 0);
      
      // Increment view count
      await incrementViewCount(id);
      
      // Load category name
      if (toolData.category_id) {
        try {
          const categoryData = await getCategoryById(toolData.category_id);
          // Only set category if it exists, otherwise keep null
          if (categoryData) {
            setCategory(categoryData);
          } else {
            setCategory(null);
          }
        } catch (err) {
          console.warn('Category not found for tool:', toolData.category_id, err);
          // Set category to null to prevent breaking the page
          setCategory(null);
        }
      } else {
        setCategory(null);
      }
      
      // Load similar tools
      try {
        const similar = await getSimilarTools(id);
        setSimilarTools(similar);
      } catch (err) {
        console.error('Error loading similar tools:', err);
      }
    } catch (err) {
      setError('Failed to load tool details');
      console.error('Error loading tool:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      if (isSaved) {
        await userService.unsaveTool(tool.id);
        setIsSaved(false);
        setSaveCount(prev => Math.max(0, prev - 1));
      } else {
        await userService.saveTool(tool.id);
        setIsSaved(true);
        setSaveCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error saving/unsaving tool:', error);
    }
  };

  const handleShare = async () => {
    const userId = isAuthenticated ? JSON.parse(localStorage.getItem('user'))?.id : null;
    
    // Track share activity
    if (userId && tool?.id) {
      try {
        await userActivityService.trackActivity(userId, tool.id, 'SHARE', {
          platform: navigator.share ? 'native' : 'clipboard'
        });
      } catch (err) {
        console.error('Error tracking share:', err);
      }
    }
    
    if (navigator.share) {
      navigator.share({
        title: tool.name,
        text: tool.description || tool.shortDescription,
        url: window.location.href,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleVisitWebsite = () => {
    const userId = isAuthenticated ? JSON.parse(localStorage.getItem('user'))?.id : null;
    
    // Track website visit
    if (userId && tool?.id) {
      userActivityService.trackActivity(userId, tool.id, 'VISIT_WEBSITE');
    }
  };

  const getPricingLabel = (model) => {
    const pricing = PRICING_MODELS.find(p => p.value === model);
    return pricing ? pricing.label : model;
  };

  const getFeatureTagLabel = (tag) => {
    const feature = FEATURE_TAGS.find(f => f.value === tag);
    return feature ? feature.label : tag;
  };

  const getPlatformLabel = (platform) => {
    const p = PLATFORMS.find(pl => pl.value === platform);
    return p ? p.label : platform;
  };

  const getSocialIcon = (key) => {
    const social = SOCIAL_PLATFORMS.find(s => s.key === key);
    return social ? social.icon : '🔗';
  };

  const extractVideoId = (url) => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) return { type: 'youtube', id: youtubeMatch[1] };
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] };
    
    return null;
  };

  const formatDescription = (text) => {
    if (!text) return [];
    
    // Split by double newlines for paragraphs
    const paragraphs = text.split(/\n\n+/);
    
    return paragraphs.map(para => {
      // Check if it's a list item (starts with -, *, or number.)
      if (para.match(/^[-*]\s/m) || para.match(/^\d+\.\s/m)) {
        const items = para.split(/\n/).filter(line => line.trim());
        return { type: 'list', items };
      }
      
      // Check if it's a heading (starts with # or all caps short line)
      if (para.match(/^#+\s/) || (para.length < 50 && para === para.toUpperCase())) {
        return { type: 'heading', text: para.replace(/^#+\s/, '') };
      }
      
      // Regular paragraph
      return { type: 'paragraph', text: para.trim() };
    }).filter(item => item.text || item.items);
  };

  if (loading) {
    return (
      <div className="tool-detail-page">
        {/* Show hero section structure while loading */}
        <section className="tool-hero">
          <div className="tool-hero-content">
            <div className="loading-container" style={{ 
              background: 'transparent', 
              minHeight: 'auto', 
              padding: '4rem 2rem',
              color: 'white'
            }}>
              <div className="spinner" style={{ 
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderTopColor: 'white'
              }}></div>
              <p style={{ color: 'white', marginTop: '1.5rem', fontSize: '1.1rem', fontWeight: 500 }}>
                Loading tool details...
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="tool-detail-page">
        {/* Show hero section structure for error state */}
        <section className="tool-hero">
          <div className="tool-hero-content">
            <div className="error-container" style={{ 
              background: 'transparent', 
              minHeight: 'auto', 
              padding: '4rem 2rem',
              color: 'white'
            }}>
              <h2 style={{ color: 'white', marginBottom: '1rem' }}>Tool Not Found</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '2rem' }}>
                {error || 'The tool you are looking for does not exist.'}
              </p>
              <button 
                onClick={() => navigate('/')} 
                className="primary-button"
                style={{ 
                  background: 'white', 
                  color: '#667eea',
                  marginTop: '1rem'
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const videoData = extractVideoId(tool.videoUrl);
  const formattedDescription = formatDescription(tool.full_description || tool.fullDescription || tool.description || tool.shortDescription);

  // Generate Schema.org structured data for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": tool.name,
    "description": tool.description || tool.shortDescription,
    "url": tool.website_url,
    "image": tool.logo_url,
    "applicationCategory": category?.name || "AI Tool",
    "operatingSystem": tool.platforms?.map(p => getPlatformLabel(p)).join(', ') || "Web",
    "offers": {
      "@type": "Offer",
      "price": tool.pricing_model === 'FREE' ? "0" : "varies",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    ...(tool.rating && tool.rating > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": tool.rating,
        "reviewCount": tool.reviewCount || 0,
        "bestRating": "5",
        "worstRating": "1"
      }
    }),
    "author": {
      "@type": "Organization",
      "name": "Clarifyall"
    },
    "datePublished": tool.created_at,
    "keywords": [
      tool.name,
      category?.name || '',
      ...tool.featureTags?.map(t => getFeatureTagLabel(t)) || [],
      getPricingLabel(tool.pricing_model)
    ].filter(Boolean).join(', ')
  };

  return (
    <div className="tool-detail-page">
      <SEO 
        title={`${tool.name} - AI Tool Details & Review | Clarifyall`}
        description={tool.description || tool.shortDescription || `${tool.name} - Discover this powerful AI tool. ${category?.name ? `Part of ${category.name} category.` : ''} ${tool.pricing_model ? `Pricing: ${getPricingLabel(tool.pricing_model)}.` : ''}`}
        keywords={`${tool.name}, AI tool, ${category?.name || ''}, ${getPricingLabel(tool.pricing_model)}`}
        dynamicKeywords={{
          name: tool.name,
          category: category?.name,
          pricingModel: tool.pricing_model,
          tags: tool.featureTags?.map(t => getFeatureTagLabel(t))
        }}
        ogTitle={`${tool.name} - Best AI Tool for ${category?.name || 'AI Tasks'}`}
        ogDescription={tool.description || tool.shortDescription}
        ogImage={tool.logo_url || tool.logoUrl}
        canonicalUrl={`/tool/${tool.slug || tool.id}`}
        schemaType="tool"
        schemaData={schemaData}
      />
      
      {/* Hero Section */}
      <section className="tool-hero">
        <div className="tool-hero-content">
          <div className="tool-header">
            <div className="tool-logo-large">
              <img 
                src={tool.logo_url || tool.logoUrl} 
                alt={`${tool.name} logo`} 
                width="120"
                height="120"
                loading="eager"
              />
            </div>
            
            <div className="tool-header-info">
              <h1 className="tool-name">{tool.name}</h1>
              <p className="tool-tagline">{tool.description || tool.shortDescription}</p>
              
              <div className="tool-meta">
                {category && (
                  <Link 
                    to={`/?category=${tool.category_id}`}
                    className="category-badge"
                  >
                    {category.name}
                  </Link>
                )}
                
                <div className="tool-pricing-badge">
                  {getPricingLabel(tool.pricing_model || tool.pricingModel)}
                </div>
              </div>

              <div className="tool-stats">
                <div className="stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{tool.view_count || tool.viewCount || 0} views</span>
                </div>
                
                <div className="stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{saveCount} saves</span>
                </div>
                
                {tool.rating > 0 && (
                  <div className="stat">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>{tool.rating.toFixed(1)} ({tool.reviewCount} reviews)</span>
                  </div>
                )}
              </div>

              <div className="tool-actions">
                <a 
                  href={tool.website_url || tool.websiteUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="primary-button"
                  onClick={handleVisitWebsite}
                >
                  Visit Website
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                
                <button 
                  className={`secondary-button ${isSaved ? 'saved' : ''}`}
                  onClick={handleSave}
                >
                  <svg viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke={isSaved ? 'none' : 'currentColor'} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                
                <button className="secondary-button" onClick={handleShare}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="tool-tabs">
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          {tool.features && tool.features.length > 0 && (
            <button 
              className={`tab ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Features
            </button>
          )}
          {tool.pricingDetails && (
            <button 
              className={`tab ${activeTab === 'pricing' ? 'active' : ''}`}
              onClick={() => setActiveTab('pricing')}
            >
              Pricing
            </button>
          )}
          {tool.screenshots && tool.screenshots.length > 0 && (
            <button 
              className={`tab ${activeTab === 'screenshots' ? 'active' : ''}`}
              onClick={() => setActiveTab('screenshots')}
            >
              Screenshots
            </button>
          )}
        </div>
      </section>

      {/* Tab Content */}
      <section className="tool-content">
        <div className="content-container">
          <div className="main-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="tab-content">
                <h2>About {tool.name}</h2>
                <div className="tool-description-formatted">
                  {/* Check if description contains HTML tags */}
                  {tool.full_description && /<[^>]+>/.test(tool.full_description) ? (
                    <div dangerouslySetInnerHTML={{ __html: tool.full_description }} />
                  ) : tool.fullDescription && /<[^>]+>/.test(tool.fullDescription) ? (
                    <div dangerouslySetInnerHTML={{ __html: tool.fullDescription }} />
                  ) : (
                    formattedDescription.map((item, index) => {
                      if (item.type === 'heading') {
                        return <h3 key={index} className="desc-heading">{item.text}</h3>;
                      } else if (item.type === 'list') {
                        return (
                          <ul key={index} className="desc-list">
                            {item.items.map((listItem, i) => (
                              <li key={i}>{listItem.replace(/^[-*\d+.]\s*/, '')}</li>
                            ))}
                          </ul>
                        );
                      } else {
                        return <p key={index} className="desc-paragraph">{item.text}</p>;
                      }
                    })
                  )}
                </div>

                {videoData && (
                  <div className="video-container">
                    <h3>Demo Video</h3>
                    {videoData.type === 'youtube' && (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoData.id}`}
                        title={`${tool.name} demo`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    )}
                    {videoData.type === 'vimeo' && (
                      <iframe
                        src={`https://player.vimeo.com/video/${videoData.id}`}
                        title={`${tool.name} demo`}
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    )}
                  </div>
                )}

                {tool.featureTags && tool.featureTags.length > 0 && (
                  <div className="feature-tags-section">
                    <h3>Key Features</h3>
                    <div className="feature-tags">
                      {tool.featureTags.map((tag, index) => (
                        <span key={index} className="feature-tag">
                          {getFeatureTagLabel(tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tool.platforms && tool.platforms.length > 0 && (
                  <div className="platforms-section">
                    <h3>Available On</h3>
                    <div className="platforms">
                      {tool.platforms.map((platform, index) => (
                        <span key={index} className="platform-badge">
                          {getPlatformLabel(platform)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && tool.features && (
              <div className="tab-content">
                <h2>Features</h2>
                <ul className="features-list">
                  {tool.features.map((feature, index) => (
                    <li key={index}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && tool.pricingDetails && (
              <div className="tab-content">
                <h2>Pricing Plans</h2>
                <div className="pricing-grid">
                  {Object.entries(tool.pricingDetails).map(([planName, planDetails]) => (
                    <div key={planName} className="pricing-card">
                      <h3>{planName.charAt(0).toUpperCase() + planName.slice(1)}</h3>
                      {typeof planDetails === 'string' ? (
                        <p>{planDetails}</p>
                      ) : (
                        <>
                          <div className="price">{planDetails.price}</div>
                          {planDetails.features && (
                            <ul>
                              {planDetails.features.map((feature, index) => (
                                <li key={index}>{feature}</li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Screenshots Tab */}
            {activeTab === 'screenshots' && tool.screenshots && (
              <div className="tab-content">
                <h2>Screenshots</h2>
                <div className="screenshots-grid">
                  {tool.screenshots.map((screenshot, index) => (
                    <div key={index} className="screenshot-item">
                      <img 
                        src={screenshot} 
                        alt={`${tool.name} screenshot ${index + 1}`} 
                        width="800"
                        height="600"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="sidebar-content">
            {/* Tool Info Card - First */}
            <div className="info-card">
              <h3>Tool Information</h3>
              <div className="info-item">
                <span className="info-label">Pricing</span>
                <span className="info-value">{getPricingLabel(tool.pricing_model || tool.pricingModel)}</span>
              </div>
              {category && (
                <div className="info-item">
                  <span className="info-label">Category</span>
                  <span className="info-value">{category.name}</span>
                </div>
              )}
              {tool.platforms && tool.platforms.length > 0 && (
                <div className="info-item">
                  <span className="info-label">Platforms</span>
                  <span className="info-value">
                    {tool.platforms.map(p => getPlatformLabel(p)).join(', ')}
                  </span>
                </div>
              )}
              {tool.created_at && (
                <div className="info-item">
                  <span className="info-label">Added</span>
                  <span className="info-value">
                    {new Date(tool.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Related Tools - After Tool Information */}
            {similarTools.length > 0 && (
              <div className="info-card">
                <h3>Related Tools</h3>
                <div className="similar-tools">
                  {similarTools.map(similarTool => (
                    <Link 
                      key={similarTool.id} 
                      to={`/tool/${similarTool.slug || similarTool.id}`}
                      className="similar-tool-item"
                    >
                      <img 
                        src={similarTool.logo_url || similarTool.logoUrl} 
                        alt={similarTool.name} 
                        width="60"
                        height="60"
                        loading="lazy"
                      />
                      <div className="similar-tool-info">
                        <h4>{similarTool.name}</h4>
                        <p>{(similarTool.short_description || similarTool.shortDescription || similarTool.description || '').substring(0, 60)}...</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {tool.socialLinks && Object.keys(tool.socialLinks).length > 0 && (
              <div className="info-card">
                <h3>Connect</h3>
                <div className="social-links">
                  {Object.entries(tool.socialLinks).map(([key, value]) => (
                    value && (
                      <a 
                        key={key} 
                        href={value.startsWith('http') ? value : `https://${key}.com/${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link"
                      >
                        <span className="social-icon">{getSocialIcon(key)}</span>
                        <span className="social-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

      </section>

      {/* Comments Section */}
      <section className="tool-comments-section">
        <div className="tool-detail-container">
          <CommentsSection toolId={tool.id} />
        </div>
      </section>
    </div>
  );
}

export default ToolDetailPage;
