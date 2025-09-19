'use client';

import React, { useState, useEffect } from 'react';
import { WorkflowTemplate, WorkflowCategory } from '../../../types/workflow/workflow-template-types';

interface WorkflowMarketplaceProps {
  onSelectTemplate?: (template: WorkflowTemplate) => void;
  className?: string;
}

export function WorkflowMarketplace({
  onSelectTemplate,
  className = ''
}: WorkflowMarketplaceProps) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WorkflowCategory | ''>('');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const categories: WorkflowCategory[] = [
    'patient_admission',
    'patient_discharge',
    'medication_management',
    'lab_results_review',
    'imaging_review',
    'surgical_procedures',
    'emergency_protocols',
    'quality_assurance',
    'compliance_audit',
    'staff_training',
    'incident_management',
    'patient_safety',
    'clinical_documentation',
    'referral_management',
    'insurance_verification',
    'custom'
  ];

  const complexityLevels = [
    { value: '', label: 'All Levels' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'expert', label: 'Expert' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'updated_at', label: 'Last Updated' },
    { value: 'created_at', label: 'Created' },
    { value: 'complexity_level', label: 'Complexity' }
  ];

  useEffect(() => {
    loadTemplates();
  }, [searchQuery, selectedCategory, selectedComplexity, sortBy, sortOrder]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        search_query: searchQuery,
        category: selectedCategory,
        complexity_level: selectedComplexity,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: '50',
        offset: '0'
      });

      const response = await fetch(`/api/admin/workflow-templates/marketplace?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load templates');
      }

      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  const formatCategoryName = (category: WorkflowCategory): string => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getComplexityColor = (level: string): string => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Workflow Template Marketplace</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Templates
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name, description, or tags..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as WorkflowCategory | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {formatCategoryName(category)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complexity Level
            </label>
            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {complexityLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading templates...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
          <button
            onClick={loadTemplates}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {template.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(template.metadata.complexity_level)}`}>
                    {template.metadata.complexity_level.toUpperCase()}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {template.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {formatCategoryName(template.category)}
                  </span>
                  {template.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      +{template.tags.length - 2} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>v{template.version}</span>
                  <span>{new Date(template.updated_at).toLocaleDateString()}</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {template.usage_stats.total_executions} executions
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {Math.round((template.usage_stats.successful_executions / Math.max(template.usage_stats.total_executions, 1)) * 100)}% success
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && templates.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or check back later for new templates.
          </p>
        </div>
      )}
    </div>
  );
}
