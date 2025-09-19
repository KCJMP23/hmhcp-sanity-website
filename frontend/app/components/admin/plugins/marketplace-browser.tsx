// Plugin Marketplace Browser Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Download, Eye, Shield, Heart } from 'lucide-react';
import { PluginDefinition, PluginSearchFilters, PluginCategory } from '@/types/plugins/marketplace';

interface MarketplaceBrowserProps {
  onPluginSelect?: (plugin: PluginDefinition) => void;
  onPluginInstall?: (plugin: PluginDefinition) => void;
  organizationId: string;
}

export default function MarketplaceBrowser({ 
  onPluginSelect, 
  onPluginInstall, 
  organizationId 
}: MarketplaceBrowserProps) {
  const [plugins, setPlugins] = useState<PluginDefinition[]>([]);
  const [categories, setCategories] = useState<PluginCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState<PluginSearchFilters>({
    query: '',
    categories: [],
    plugin_types: [],
    healthcare_specialties: [],
    min_rating: 0,
    sort_by: 'rating',
    sort_order: 'desc',
    page: 1,
    limit: 20
  });
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Load initial data
  useEffect(() => {
    loadCategories();
    searchPlugins();
  }, []);

  // Search plugins when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlugins();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/plugins/marketplace/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const searchPlugins = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.query) params.append('q', filters.query);
      if (filters.categories?.length) params.append('categories', filters.categories.join(','));
      if (filters.plugin_types?.length) params.append('types', filters.plugin_types.join(','));
      if (filters.healthcare_specialties?.length) params.append('specialties', filters.healthcare_specialties.join(','));
      if (filters.min_rating) params.append('min_rating', filters.min_rating.toString());
      if (filters.max_rating) params.append('max_rating', filters.max_rating.toString());
      if (filters.author) params.append('author', filters.author);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/plugins/marketplace/search?${params}`);
      const data = await response.json();
      
      setPlugins(data.plugins || []);
      setTotal(data.total || 0);
      setHasMore(data.has_more || false);
    } catch (error) {
      console.error('Failed to search plugins:', error);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query, page: 1 }));
  };

  const handleCategoryFilter = (categorySlug: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories?.includes(categorySlug)
        ? prev.categories.filter(c => c !== categorySlug)
        : [...(prev.categories || []), categorySlug],
      page: 1
    }));
  };

  const handleTypeFilter = (type: string) => {
    setFilters(prev => ({
      ...prev,
      plugin_types: prev.plugin_types?.includes(type as any)
        ? prev.plugin_types.filter(t => t !== type)
        : [...(prev.plugin_types || []), type as any],
      page: 1
    }));
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sort_by: sortBy as any, sort_order: sortOrder, page: 1 }));
  };

  const handleInstall = async (plugin: PluginDefinition) => {
    try {
      const response = await fetch('/api/plugins/installations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plugin_id: plugin.id,
          organization_id: organizationId
        })
      });

      if (response.ok) {
        onPluginInstall?.(plugin);
        // Refresh the plugins list
        searchPlugins();
      } else {
        const error = await response.json();
        console.error('Installation failed:', error);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderPluginCard = (plugin: PluginDefinition) => (
    <div
      key={plugin.id}
      className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onPluginSelect?.(plugin)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {plugin.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            by {plugin.author}
          </p>
          <p className="text-sm text-gray-700 line-clamp-2">
            {plugin.description}
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <div className="flex items-center">
            {renderStars(plugin.rating)}
            <span className="ml-1 text-sm text-gray-600">
              ({plugin.rating.toFixed(1)})
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {plugin.plugin_type.replace('_', ' ')}
          </span>
          <span className="text-sm text-gray-500">
            {plugin.installation_count} installs
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {plugin.healthcare_compliance?.hipaa && (
            <Shield className="w-4 h-4 text-green-500" title="HIPAA Compliant" />
          )}
          {plugin.healthcare_compliance?.fda && (
            <Shield className="w-4 h-4 text-blue-500" title="FDA Compliant" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPluginSelect?.(plugin);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleInstall(plugin);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-1" />
            Install
          </button>
        </div>
        <button className="p-1 text-gray-400 hover:text-red-500">
          <Heart className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search plugins..."
                value={filters.query || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={filters.sort_by || 'rating'}
              onChange={(e) => handleSort(e.target.value, filters.sort_order || 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="rating">Rating</option>
              <option value="installation_count">Downloads</option>
              <option value="created_at">Newest</option>
              <option value="name">Name</option>
            </select>
            
            <select
              value={filters.sort_order || 'desc'}
              onChange={(e) => handleSort(filters.sort_by || 'rating', e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryFilter(category.slug)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.categories?.includes(category.slug)
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filters */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {['ai_agent', 'integration', 'ui_component', 'workflow_extension'].map((type) => (
              <button
                key={type}
                onClick={() => handleTypeFilter(type)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.plugin_types?.includes(type as any)
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {searching ? 'Searching...' : `${total} plugins found`}
          </h2>
        </div>

        {searching ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : plugins.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plugins.map(renderPluginCard)}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No plugins found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or browse all plugins.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
