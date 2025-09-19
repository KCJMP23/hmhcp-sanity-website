'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Filter, 
  FileText, 
  Users, 
  Database, 
  Globe, 
  Settings,
  Calendar,
  Tag,
  ArrowRight,
  Clock,
  Star,
  TrendingUp,
  Bookmark,
  History,
  Zap
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { AppleButton } from '@/components/ui/apple-button';

interface SearchResult {
  id: string;
  type: 'content' | 'user' | 'system' | 'analytics';
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  lastModified: Date;
  relevance: number;
  preview: string;
}

interface SearchFilter {
  type: string[];
  category: string[];
  dateRange: string;
  tags: string[];
}

export default function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<SearchFilter>({
    type: [],
    category: [],
    dateRange: 'all',
    tags: []
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mock data for demonstration
  useEffect(() => {
    setPopularSearches([
      'healthcare innovation',
      'patient care',
      'digital health',
      'AI in medicine',
      'telemedicine',
      'healthcare analytics'
    ]);
    
    setRecentSearches([
      'user management',
      'content templates',
      'security settings',
      'performance metrics'
    ]);
  }, []);

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    // Add to recent searches
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== query);
      return [query, ...filtered].slice(0, 10);
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock search results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'content',
        title: 'Healthcare Innovation Trends 2024',
        description: 'Comprehensive analysis of emerging healthcare technologies',
        url: '/admin/content/healthcare-innovation-trends',
        category: 'Blog Posts',
        tags: ['healthcare', 'innovation', 'technology', 'trends'],
        lastModified: new Date(Date.now() - 86400000), // 1 day ago
        relevance: 95,
        preview: 'This comprehensive guide explores the latest innovations in healthcare technology, including AI-powered diagnostics, telemedicine platforms, and patient engagement tools...'
      },
      {
        id: '2',
        type: 'user',
        title: 'Dr. Sarah Johnson',
        description: 'Healthcare Administrator - Cardiology Department',
        url: '/admin/users/dr-sarah-johnson',
        category: 'Users',
        tags: ['administrator', 'cardiology', 'healthcare'],
        lastModified: new Date(Date.now() - 3600000), // 1 hour ago
        relevance: 88,
        preview: 'Dr. Johnson is a healthcare administrator specializing in cardiology department management with expertise in patient care coordination...'
      },
      {
        id: '3',
        type: 'system',
        title: 'Database Performance Metrics',
        description: 'System performance and database optimization reports',
        url: '/admin/performance/database',
        category: 'System',
        tags: ['performance', 'database', 'optimization', 'metrics'],
        lastModified: new Date(Date.now() - 7200000), // 2 hours ago
        relevance: 82,
        preview: 'Current database performance metrics showing query response times, connection pool utilization, and optimization recommendations...'
      },
      {
        id: '4',
        type: 'analytics',
        title: 'User Engagement Report Q1 2024',
        description: 'Quarterly analysis of user engagement and platform usage',
        url: '/admin/analytics/user-engagement',
        category: 'Analytics',
        tags: ['analytics', 'engagement', 'Q1 2024', 'user behavior'],
        lastModified: new Date(Date.now() - 172800000), // 2 days ago
        relevance: 78,
        preview: 'Q1 2024 user engagement analysis showing increased platform usage, feature adoption rates, and user satisfaction metrics...'
      }
    ];

    setSearchResults(mockResults);
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const toggleFilter = (filterType: keyof SearchFilter, value: string) => {
    setActiveFilters(prev => {
      const current = prev[filterType] as string[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      return { ...prev, [filterType]: updated };
    });
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'content':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'user':
        return <Users className="h-5 w-5 text-green-600" />;
      case 'system':
        return <Settings className="h-5 w-5 text-purple-600" />;
      case 'analytics':
        return <TrendingUp className="h-5 w-5 text-orange-600" />;
      default:
        return <Search className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 90) return 'text-green-600';
    if (relevance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <Typography variant="display" className="text-gray-900 mb-4">
          Advanced Search
        </Typography>
        <Typography variant="body" className="text-gray-600">
          Find content, users, and system information across the platform
        </Typography>
      </motion.div>

      {/* Search Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for content, users, settings, analytics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-12 pr-20 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg shadow-sm"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {searchQuery && (
              <AppleButton
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </AppleButton>
            )}
            <AppleButton
              onClick={() => handleSearch()}
              disabled={!searchQuery.trim() || isSearching}
              className="px-6"
            >
              {isSearching ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </div>
              )}
            </AppleButton>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-4">
          <AppleButton
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </AppleButton>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Quick search:</span>
            <div className="flex space-x-2">
              {popularSearches.slice(0, 3).map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(search);
                    handleSearch(search);
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 overflow-hidden"
          >
            <FrostedCard>
              <div className="p-6">
                <Typography variant="heading4" className="mb-4 text-gray-900">
                  Search Filters
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Type Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Content Type
                    </label>
                    <div className="space-y-2">
                      {['content', 'user', 'system', 'analytics'].map((type) => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={activeFilters.type.includes(type)}
                            onChange={() => toggleFilter('type', type)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700 capitalize">
                            {type}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Category
                    </label>
                    <div className="space-y-2">
                      {['Blog Posts', 'Users', 'System', 'Analytics', 'Settings'].map((category) => (
                        <label key={category} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={activeFilters.category.includes(category)}
                            onChange={() => toggleFilter('category', category)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            {category}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Date Range
                    </label>
                    <select
                      value={activeFilters.dateRange}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>

                  {/* Tags Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Popular Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['healthcare', 'innovation', 'AI', 'analytics', 'security'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleFilter('tags', tag)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                            activeFilters.tags.includes(tag)
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FrostedCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <Typography variant="heading3" className="text-gray-900">
              Search Results ({searchResults.length})
            </Typography>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Sorted by relevance</span>
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-4">
            {searchResults.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <FrostedCard className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <Typography variant="heading4" className="text-gray-900 mb-1">
                              {result.title}
                            </Typography>
                            <Typography variant="body" className="text-gray-600 mb-2">
                              {result.description}
                            </Typography>
                          </div>
                          
                          <div className="flex items-center space-x-3 ml-4">
                            <div className="text-right">
                              <div className={`text-sm font-medium ${getRelevanceColor(result.relevance)}`}>
                                {result.relevance}% match
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(result.lastModified)}
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-3">
                          <Badge variant="secondary">{result.category}</Badge>
                          <span className="text-sm text-gray-500">
                            {getTypeIcon(result.type)}
                            <span className="ml-1 capitalize">{result.type}</span>
                          </span>
                        </div>

                        <Typography variant="small" className="text-gray-600 mb-3">
                          {result.preview}
                        </Typography>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {result.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <AppleButton
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('Navigate to:', result.url)}
                          >
                            View Details
                          </AppleButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </FrostedCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Searches */}
      {!searchQuery && searchResults.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Searches */}
            <FrostedCard>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <History className="h-5 w-5 text-blue-600" />
                  <Typography variant="heading4" className="text-gray-900">
                    Recent Searches
                  </Typography>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(search);
                        handleSearch(search);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-700">{search}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            </FrostedCard>

            {/* Popular Searches */}
            <FrostedCard>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <Typography variant="heading4" className="text-gray-900">
                    Popular Searches
                  </Typography>
                </div>
                <div className="space-y-2">
                  {popularSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(search);
                        handleSearch(search);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-700">{search}</span>
                      <Star className="h-4 w-4 text-yellow-500" />
                    </button>
                  ))}
                </div>
              </div>
            </FrostedCard>
          </div>
        </motion.div>
      )}
    </div>
  );
}
