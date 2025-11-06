import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

// Helper function to generate dynamic keywords from content
const generateKeywords = (baseKeywords, dynamicData = {}) => {
  const keywordArray = [];
  
  // Base keywords
  if (baseKeywords) {
    if (typeof baseKeywords === 'string') {
      keywordArray.push(...baseKeywords.split(',').map(k => k.trim()));
    } else if (Array.isArray(baseKeywords)) {
      keywordArray.push(...baseKeywords);
    }
  }
  
  // Add dynamic keywords from data
  if (dynamicData.category) {
    keywordArray.push(`${dynamicData.category} AI tools`);
    keywordArray.push(`best ${dynamicData.category} tools`);
  }
  
  if (dynamicData.name) {
    keywordArray.push(dynamicData.name);
    keywordArray.push(`${dynamicData.name} AI`);
    keywordArray.push(`${dynamicData.name} review`);
  }
  
  if (dynamicData.pricingModel) {
    keywordArray.push(`${dynamicData.pricingModel} AI tools`);
    keywordArray.push(`${dynamicData.pricingModel === 'FREE' ? 'free' : dynamicData.pricingModel.toLowerCase()} AI software`);
  }
  
  if (dynamicData.tags && Array.isArray(dynamicData.tags)) {
    keywordArray.push(...dynamicData.tags);
  }
  
  // Add common AI-related keywords
  keywordArray.push(
    'AI tools',
    'artificial intelligence',
    'AI directory',
    'AI software',
    'machine learning tools',
    '2024'
  );
  
  // Remove duplicates and return as comma-separated string
  return [...new Set(keywordArray)].join(', ');
};

// Helper to generate Schema.org structured data
const generateSchemaData = (type, data) => {
  const baseUrl = 'https://clarifyall.com';
  
  switch (type) {
    case 'website':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Clarifyall',
        url: baseUrl,
        description: 'Your comprehensive directory for discovering, comparing, and mastering the best AI tools for every task.',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/?search={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      };
      
    case 'tool':
      return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: data.name,
        description: data.description || data.shortDescription,
        applicationCategory: data.category?.name || 'AI Application',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: data.pricingModel === 'FREE' ? '0' : '0',
          priceCurrency: 'USD'
        },
        aggregateRating: data.rating ? {
          '@type': 'AggregateRating',
          ratingValue: data.rating,
          reviewCount: data.reviewCount || 0
        } : undefined,
        url: data.website_url || data.websiteUrl,
        image: data.logo_url || data.logoUrl
      };
      
    case 'article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.excerpt || data.summary,
        image: data.featured_image || data.featuredImageUrl,
        datePublished: data.published_at || data.created_at,
        dateModified: data.updated_at || data.published_at || data.created_at,
        author: {
          '@type': 'Organization',
          name: 'Clarifyall'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Clarifyall',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`
          }
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${baseUrl}/blog/${data.slug}`
        }
      };
      
    default:
      return null;
  }
};

function SEO({ 
  title, 
  description, 
  keywords, 
  dynamicKeywords, // New: data object for dynamic keyword generation
  ogTitle, 
  ogDescription, 
  ogImage,
  canonicalUrl,
  schemaType, // Type of schema: 'website', 'tool', 'article'
  schemaData, // Custom schema data (optional, will be generated if not provided)
  noindex = false
}) {
  const location = useLocation();
  const siteUrl = 'https://clarifyall.com';
  const defaultImage = `${siteUrl}/og-image.jpg`;
  
  // Generate dynamic keywords if dynamicKeywords prop is provided
  const finalKeywords = dynamicKeywords 
    ? generateKeywords(keywords, dynamicKeywords)
    : keywords;
  
  // Generate schema data if schemaType is provided
  const finalSchemaData = schemaData || (schemaType ? generateSchemaData(schemaType, dynamicKeywords || {}) : null);
  
  // Full canonical URL
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : `${siteUrl}${location.pathname}`;
  const fullOgImage = ogImage || defaultImage;

  // Ensure description is between 150-220 characters for SEO
  const optimizedDescription = description && description.length < 150 
    ? `${description} Browse our comprehensive AI tools directory, filter by pricing and category, and discover the perfect AI software for your needs.`
    : description;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={optimizedDescription || description} />
      {finalKeywords && <meta name="keywords" content={finalKeywords} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={schemaType === 'article' ? 'article' : 'website'} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Clarifyall" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={fullOgImage} />
      <meta name="twitter:creator" content="@clarifyall" />
      <meta name="twitter:site" content="@clarifyall" />
      
      {/* Additional SEO Tags */}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Clarifyall" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      
      {/* Mobile Optimization */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#667eea" />
      
      {/* Schema.org Structured Data */}
      {finalSchemaData && (
        <script type="application/ld+json">
          {JSON.stringify(finalSchemaData)}
        </script>
      )}
    </Helmet>
  );
}

export default SEO;
