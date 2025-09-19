'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('SEOMetadataEditor');

interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  focus_keyword: string;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  schema_markup: string;
  robots: string;
  noindex: boolean;
  nofollow: boolean;
}

interface HealthcareKeywordSuggestion {
  keyword: string;
  search_volume: number;
  difficulty: number;
  relevance_score: number;
  category: string;
  related_terms: string[];
}

interface SEOMetadataEditorProps {
  initialData?: Partial<SEOMetadata>;
  onSave: (metadata: SEOMetadata) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function SEOMetadataEditor({
  initialData = {},
  onSave,
  onClose,
  isOpen
}: SEOMetadataEditorProps) {
  const [metadata, setMetadata] = useState<SEOMetadata>({
    title: '',
    description: '',
    keywords: [],
    focus_keyword: '',
    meta_title: '',
    meta_description: '',
    canonical_url: '',
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    schema_markup: '',
    robots: 'index,follow',
    noindex: false,
    nofollow: false,
    ...initialData
  });

  const [keywordSuggestions, setKeywordSuggestions] = useState<HealthcareKeywordSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'social' | 'advanced'>('basic');
  const [seoScore, setSeoScore] = useState(0);
  const [seoIssues, setSeoIssues] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      calculateSEOScore();
    }
  }, [metadata, isOpen]);

  const calculateSEOScore = () => {
    let score = 0;
    const issues: string[] = [];

    // Title optimization (25 points)
    if (metadata.title.length > 0) {
      score += 10;
      if (metadata.title.length >= 30 && metadata.title.length <= 60) {
        score += 15;
      } else if (metadata.title.length < 30) {
        issues.push('Title is too short (recommended: 30-60 characters)');
      } else {
        issues.push('Title is too long (recommended: 30-60 characters)');
      }
    } else {
      issues.push('Title is required');
    }

    // Meta description optimization (25 points)
    if (metadata.meta_description.length > 0) {
      score += 10;
      if (metadata.meta_description.length >= 120 && metadata.meta_description.length <= 160) {
        score += 15;
      } else if (metadata.meta_description.length < 120) {
        issues.push('Meta description is too short (recommended: 120-160 characters)');
      } else {
        issues.push('Meta description is too long (recommended: 120-160 characters)');
      }
    } else {
      issues.push('Meta description is required');
    }

    // Focus keyword (20 points)
    if (metadata.focus_keyword.length > 0) {
      score += 20;
    } else {
      issues.push('Focus keyword is recommended');
    }

    // Keywords (15 points)
    if (metadata.keywords.length > 0) {
      score += 15;
    } else {
      issues.push('Keywords are recommended');
    }

    // Social media optimization (15 points)
    if (metadata.og_title && metadata.og_description) {
      score += 15;
    } else {
      issues.push('Social media metadata is recommended');
    }

    setSeoScore(Math.min(score, 100));
    setSeoIssues(issues);
  };

  const fetchKeywordSuggestions = async (query: string) => {
    if (query.length < 2) {
      setKeywordSuggestions([]);
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      logger.info('Fetching healthcare keyword suggestions', { query });

      // In production, this would call a healthcare keyword API
      const mockSuggestions: HealthcareKeywordSuggestion[] = [
        {
          keyword: 'diabetes management',
          search_volume: 12000,
          difficulty: 65,
          relevance_score: 95,
          category: 'Endocrinology',
          related_terms: ['type 2 diabetes', 'blood sugar', 'insulin therapy']
        },
        {
          keyword: 'heart disease prevention',
          search_volume: 8500,
          difficulty: 70,
          relevance_score: 90,
          category: 'Cardiology',
          related_terms: ['cardiovascular health', 'cholesterol', 'blood pressure']
        },
        {
          keyword: 'cancer treatment options',
          search_volume: 15000,
          difficulty: 80,
          relevance_score: 88,
          category: 'Oncology',
          related_terms: ['chemotherapy', 'radiation therapy', 'immunotherapy']
        },
        {
          keyword: 'mental health awareness',
          search_volume: 22000,
          difficulty: 45,
          relevance_score: 85,
          category: 'Psychiatry',
          related_terms: ['depression', 'anxiety', 'therapy']
        },
        {
          keyword: 'pediatric care guidelines',
          search_volume: 6800,
          difficulty: 55,
          relevance_score: 92,
          category: 'Pediatrics',
          related_terms: ['child health', 'vaccination', 'development']
        }
      ];

      const filteredSuggestions = mockSuggestions.filter(suggestion =>
        suggestion.keyword.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.related_terms.some(term => term.toLowerCase().includes(query.toLowerCase()))
      );

      setKeywordSuggestions(filteredSuggestions);
      logger.info('Keyword suggestions fetched', { count: filteredSuggestions.length });
    } catch (error) {
      logger.error('Failed to fetch keyword suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleInputChange = (field: keyof SEOMetadata, value: string | boolean | string[]) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const handleKeywordAdd = (keyword: string) => {
    if (!metadata.keywords.includes(keyword)) {
      setMetadata(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
    }
  };

  const handleKeywordRemove = (keyword: string) => {
    setMetadata(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleSuggestionClick = (suggestion: HealthcareKeywordSuggestion) => {
    handleKeywordAdd(suggestion.keyword);
    if (!metadata.focus_keyword) {
      setMetadata(prev => ({ ...prev, focus_keyword: suggestion.keyword }));
    }
  };

  const generateMetaDescription = () => {
    if (metadata.description.length > 0) {
      const truncated = metadata.description.substring(0, 160);
      setMetadata(prev => ({ ...prev, meta_description: truncated }));
    }
  };

  const generateSocialTitles = () => {
    if (metadata.title.length > 0) {
      setMetadata(prev => ({
        ...prev,
        og_title: prev.title,
        twitter_title: prev.title
      }));
    }
  };

  const generateSocialDescriptions = () => {
    if (metadata.meta_description.length > 0) {
      setMetadata(prev => ({
        ...prev,
        og_description: prev.meta_description,
        twitter_description: prev.meta_description
      }));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">SEO Metadata Editor</h2>
            <p className="text-sm text-gray-600">
              Optimize your content for search engines and social media
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* SEO Score */}
            <div className={`px-3 py-1 rounded-full ${getScoreBgColor(seoScore)}`}>
              <span className={`text-sm font-medium ${getScoreColor(seoScore)}`}>
                SEO Score: {seoScore}/100
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'basic', label: 'Basic SEO', icon: '🔍' },
              { id: 'social', label: 'Social Media', icon: '📱' },
              { id: 'advanced', label: 'Advanced', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {activeTab === 'basic' && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                    <span className="text-gray-500 ml-2">({metadata.title.length}/60)</span>
                  </label>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your page title..."
                  />
                  {metadata.title.length > 60 && (
                    <p className="text-sm text-red-600 mt-1">Title is too long</p>
                  )}
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description *
                    <span className="text-gray-500 ml-2">({metadata.meta_description.length}/160)</span>
                  </label>
                  <textarea
                    value={metadata.meta_description}
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your meta description..."
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-sm text-gray-500">
                      {metadata.meta_description.length < 120 ? 'Too short' : 
                       metadata.meta_description.length > 160 ? 'Too long' : 'Good length'}
                    </p>
                    <button
                      onClick={generateMetaDescription}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Generate from content
                    </button>
                  </div>
                </div>

                {/* Focus Keyword */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Focus Keyword
                  </label>
                  <input
                    type="text"
                    value={metadata.focus_keyword}
                    onChange={(e) => handleInputChange('focus_keyword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your primary keyword..."
                  />
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {metadata.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {keyword}
                        <button
                          onClick={() => handleKeywordRemove(keyword)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add keywords..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const keyword = e.currentTarget.value.trim();
                        if (keyword) {
                          handleKeywordAdd(keyword);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>

                {/* Healthcare Keyword Suggestions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Healthcare Keyword Suggestions
                  </label>
                  <input
                    type="text"
                    placeholder="Search for healthcare keywords..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => fetchKeywordSuggestions(e.target.value)}
                  />
                  
                  {isLoadingSuggestions && (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  )}

                  {keywordSuggestions.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {keywordSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{suggestion.keyword}</p>
                              <p className="text-sm text-gray-600">{suggestion.category}</p>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <p>Volume: {suggestion.search_volume.toLocaleString()}</p>
                              <p>Difficulty: {suggestion.difficulty}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'social' && (
              <motion.div
                key="social"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Open Graph */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Open Graph (Facebook)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG Title
                      </label>
                      <input
                        type="text"
                        value={metadata.og_title}
                        onChange={(e) => handleInputChange('og_title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter Open Graph title..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG Description
                      </label>
                      <textarea
                        value={metadata.og_description}
                        onChange={(e) => handleInputChange('og_description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter Open Graph description..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG Image URL
                      </label>
                      <input
                        type="url"
                        value={metadata.og_image}
                        onChange={(e) => handleInputChange('og_image', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter Open Graph image URL..."
                      />
                    </div>
                  </div>
                </div>

                {/* Twitter */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Twitter Cards</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter Title
                      </label>
                      <input
                        type="text"
                        value={metadata.twitter_title}
                        onChange={(e) => handleInputChange('twitter_title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter Twitter title..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter Description
                      </label>
                      <textarea
                        value={metadata.twitter_description}
                        onChange={(e) => handleInputChange('twitter_description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter Twitter description..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter Image URL
                      </label>
                      <input
                        type="url"
                        value={metadata.twitter_image}
                        onChange={(e) => handleInputChange('twitter_image', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter Twitter image URL..."
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={generateSocialTitles}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    Generate from Title
                  </button>
                  <button
                    onClick={generateSocialDescriptions}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    Generate from Meta Description
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'advanced' && (
              <motion.div
                key="advanced"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Canonical URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Canonical URL
                  </label>
                  <input
                    type="url"
                    value={metadata.canonical_url}
                    onChange={(e) => handleInputChange('canonical_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter canonical URL..."
                  />
                </div>

                {/* Robots */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Robots Meta
                  </label>
                  <input
                    type="text"
                    value={metadata.robots}
                    onChange={(e) => handleInputChange('robots', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="index,follow"
                  />
                </div>

                {/* No Index/No Follow */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={metadata.noindex}
                      onChange={(e) => handleInputChange('noindex', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">No Index</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={metadata.nofollow}
                      onChange={(e) => handleInputChange('nofollow', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">No Follow</span>
                  </label>
                </div>

                {/* Schema Markup */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schema Markup (JSON-LD)
                  </label>
                  <textarea
                    value={metadata.schema_markup}
                    onChange={(e) => handleInputChange('schema_markup', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder='{"@context": "https://schema.org", "@type": "Article", ...}'
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SEO Issues */}
        {seoIssues.length > 0 && (
          <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-200">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">SEO Issues to Address:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {seoIssues.map((issue, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(metadata)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Save SEO Metadata
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
