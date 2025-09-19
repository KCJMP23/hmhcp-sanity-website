'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('BlogFilterSidebar');

interface BlogFilterSidebarProps {
  filters: {
    status: string;
    category: string;
    author: string;
    dateRange: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (viewMode: 'list' | 'grid') => void;
}

export function BlogFilterSidebar({
  filters,
  onFiltersChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange
}: BlogFilterSidebarProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
    logger.info('Filter changed', { key, value });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
    logger.info('Search query changed', { query: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      category: 'all',
      author: 'all',
      dateRange: 'all',
      search: ''
    });
    logger.info('All filters cleared');
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all' && value !== '');

  return (
    <div className="bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search posts..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="cardiology">Cardiology</option>
            <option value="oncology">Oncology</option>
            <option value="neurology">Neurology</option>
            <option value="pediatrics">Pediatrics</option>
            <option value="surgery">Surgery</option>
            <option value="research">Research</option>
            <option value="technology">Technology</option>
          </select>
        </div>

        {/* Author Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Author
          </label>
          <select
            value={filters.author}
            onChange={(e) => handleFilterChange('author', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Authors</option>
            <option value="dr-smith">Dr. Smith</option>
            <option value="dr-johnson">Dr. Johnson</option>
            <option value="dr-williams">Dr. Williams</option>
            <option value="dr-brown">Dr. Brown</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* Sort Options */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="space-y-2">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at">Created Date</option>
              <option value="published_at">Published Date</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
            </select>
            <div className="flex space-x-2">
              <button
                onClick={() => onSortOrderChange('asc')}
                className={`flex-1 px-3 py-2 text-sm rounded-md ${
                  sortOrder === 'asc'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ascending
              </button>
              <button
                onClick={() => onSortOrderChange('desc')}
                className={`flex-1 px-3 py-2 text-sm rounded-md ${
                  sortOrder === 'desc'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Descending
              </button>
            </div>
          </div>
        </div>

        {/* View Mode */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            View Mode
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex-1 px-3 py-2 text-sm rounded-md ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex-1 px-3 py-2 text-sm rounded-md ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <h3 className="text-sm font-medium text-blue-800 mb-2">Active Filters</h3>
            <div className="space-y-1">
              {filters.status !== 'all' && (
                <div className="text-xs text-blue-700">
                  Status: {filters.status}
                </div>
              )}
              {filters.category !== 'all' && (
                <div className="text-xs text-blue-700">
                  Category: {filters.category}
                </div>
              )}
              {filters.author !== 'all' && (
                <div className="text-xs text-blue-700">
                  Author: {filters.author}
                </div>
              )}
              {filters.dateRange !== 'all' && (
                <div className="text-xs text-blue-700">
                  Date: {filters.dateRange}
                </div>
              )}
              {filters.search && (
                <div className="text-xs text-blue-700">
                  Search: "{filters.search}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
