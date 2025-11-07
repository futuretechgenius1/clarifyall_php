import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import api from '../services/api';
import '../styles/ToolCard.css';

function ToolCard({ tool }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [viewCount, setViewCount] = useState(tool.view_count || tool.viewCount || 0);
  const [saveCount, setSaveCount] = useState(tool.save_count || tool.saveCount || 0);
  const [loading, setLoading] = useState(false);

  // Check if tool is saved when component mounts
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (isAuthenticated && tool.id) {
        try {
          const response = await userService.checkSavedTool(tool.id);
          setIsSaved(response.isSaved);
        } catch (error) {
          console.error('Error checking saved status:', error);
        }
      }
    };
    checkSavedStatus();
  }, [isAuthenticated, tool.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is logged in
    if (!isAuthenticated) {
      // Redirect to login
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    setLoading(true);
    
    try {
      if (isSaved) {
        // Unsave the tool
        await userService.unsaveTool(tool.id);
        setIsSaved(false);
        setSaveCount(prev => Math.max(0, prev - 1));
      } else {
        // Save the tool
        await userService.saveTool(tool.id);
        setIsSaved(true);
        setSaveCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error saving/unsaving tool:', error);
      // Revert the state if there was an error
      setIsSaved(!isSaved);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitWebsite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the website URL
    let websiteUrl = tool.website_url || tool.websiteUrl;
    
    // Check if URL exists
    if (!websiteUrl) {
      console.warn('No website URL available for this tool');
      return;
    }
    
    // Ensure URL has protocol
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl;
    }
    
    // Open website immediately (don't wait for API call)
    window.open(websiteUrl, '_blank', 'noopener,noreferrer');
    
    // Increment view count in background (non-blocking)
    api.post(`/tools/${tool.id}/view`)
      .then(() => {
        setViewCount(prev => prev + 1);
      })
      .catch(error => {
        console.error('Error incrementing view count:', error);
      });
  };

  const getPricingBadgeClass = (pricing) => {
    const classes = {
      'FREE': 'pricing-free',
      'FREEMIUM': 'pricing-freemium',
      'FREE_TRIAL': 'pricing-trial',
      'PAID': 'pricing-paid'
    };
    return classes[pricing] || 'pricing-default';
  };

  const getPricingLabel = (pricing) => {
    const labels = {
      'FREE': 'Free',
      'FREEMIUM': 'Freemium',
      'FREE_TRIAL': 'Free Trial',
      'PAID': 'Paid'
    };
    return labels[pricing] || pricing;
  };

  const defaultLogo = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23667eea" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle"%3E' + (tool.name ? tool.name.charAt(0) : 'A') + '%3C/text%3E%3C/svg%3E';

  return (
    <Link to={`/tool/${tool.slug || tool.id}`} className="tool-card-link">
      <div className="tool-card">
        <div className="tool-card-header">
          <div className="tool-logo-wrapper">
            <img 
              src={imageError ? defaultLogo : (tool.logo_url || tool.logoUrl || defaultLogo)}
              alt={`${tool.name} logo`}
              className="tool-logo"
              width="80"
              height="80"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </div>
          
          <div className="tool-header-info">
            <h3 className="tool-name">{tool.name}</h3>
            <span className={`pricing-badge ${getPricingBadgeClass(tool.pricing_model || tool.pricingModel)}`}>
              {getPricingLabel(tool.pricing_model || tool.pricingModel)}
            </span>
          </div>
          
          <button 
            className={`save-button ${isSaved ? 'saved' : ''}`}
            onClick={handleSave}
            aria-label={isSaved ? 'Unsave tool' : 'Save tool'}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke={isSaved ? 'none' : 'currentColor'} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <div className="tool-card-body">
          <p className="tool-description" title={tool.short_description || tool.shortDescription || tool.description}>
            {tool.short_description || tool.shortDescription || tool.description}
          </p>
          
          <div className="tool-categories">
            {tool.categories && tool.categories.slice(0, 2).map((category, index) => (
              <span key={index} className="category-tag">
                {category.name}
              </span>
            ))}
            {tool.categories && tool.categories.length > 2 && (
              <span className="category-tag category-more">
                +{tool.categories.length - 2}
              </span>
            )}
          </div>
        </div>

        <div className="tool-card-footer">
          <div className="tool-card-stats">
            <div className="stat" title="Views">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{viewCount}</span>
            </div>
            <div className="stat" title="Saves">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{saveCount}</span>
            </div>
          </div>
          
          {(tool.website_url || tool.websiteUrl) && (
            <button 
              className="visit-website-btn"
              onClick={handleVisitWebsite}
              title={`Visit ${tool.name}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Visit Website
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ToolCard;
