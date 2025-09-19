'use client';

import React, { useState } from 'react';
import { WorkflowTemplate } from '@/types/workflows/templates';

interface WorkflowTemplatesProps {
  onSelect: (template: WorkflowTemplate) => void;
  onClose: () => void;
}

const mockTemplates: WorkflowTemplate[] = [
  {
    id: '1',
    name: 'Blog Content Pipeline',
    description: 'Research → Write → SEO → Publish workflow for healthcare content',
    category: 'content',
    definition: {
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    },
    tags: ['content', 'blog', 'seo', 'healthcare'],
    created_by: 'system',
    created_at: new Date(),
    updated_at: new Date(),
    usage_count: 45,
    rating: 4.8,
    reviews: [],
    version: '1.0.0',
    status: 'published',
    featured: true,
    downloads: 120,
    compatibility: ['v1.0+'],
    requirements: []
  },
  {
    id: '2',
    name: 'Clinical Trial Update',
    description: 'Data fetch → Analysis → Report → Notify workflow',
    category: 'healthcare',
    definition: {
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    },
    tags: ['clinical', 'trial', 'data', 'analysis'],
    created_by: 'system',
    created_at: new Date(),
    updated_at: new Date(),
    usage_count: 23,
    rating: 4.6,
    reviews: [],
    version: '1.0.0',
    status: 'published',
    featured: true,
    downloads: 67,
    compatibility: ['v1.0+'],
    requirements: []
  },
  {
    id: '3',
    name: 'Patient Outreach',
    description: 'Segment → Personalize → Send → Track workflow',
    category: 'healthcare',
    definition: {
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    },
    tags: ['patient', 'outreach', 'communication', 'tracking'],
    created_by: 'system',
    created_at: new Date(),
    updated_at: new Date(),
    usage_count: 18,
    rating: 4.4,
    reviews: [],
    version: '1.0.0',
    status: 'published',
    featured: false,
    downloads: 34,
    compatibility: ['v1.0+'],
    requirements: []
  },
  {
    id: '4',
    name: 'Compliance Check',
    description: 'Scan → Validate → Report → Archive workflow',
    category: 'compliance',
    definition: {
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    },
    tags: ['compliance', 'validation', 'reporting', 'archive'],
    created_by: 'system',
    created_at: new Date(),
    updated_at: new Date(),
    usage_count: 31,
    rating: 4.7,
    reviews: [],
    version: '1.0.0',
    status: 'published',
    featured: true,
    downloads: 89,
    compatibility: ['v1.0+'],
    requirements: []
  },
  {
    id: '5',
    name: 'Research Synthesis',
    description: 'Collect → Analyze → Summarize → Publish workflow',
    category: 'analytics',
    definition: {
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    },
    tags: ['research', 'analysis', 'synthesis', 'publishing'],
    created_by: 'system',
    created_at: new Date(),
    updated_at: new Date(),
    usage_count: 12,
    rating: 4.5,
    reviews: [],
    version: '1.0.0',
    status: 'published',
    featured: false,
    downloads: 28,
    compatibility: ['v1.0+'],
    requirements: []
  }
];

const categoryColors = {
  healthcare: 'bg-blue-100 text-blue-800',
  content: 'bg-green-100 text-green-800',
  analytics: 'bg-purple-100 text-purple-800',
  compliance: 'bg-red-100 text-red-800',
  integration: 'bg-yellow-100 text-yellow-800'
};

export const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({ onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'downloads' | 'usage'>('name');

  const filteredTemplates = mockTemplates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        case 'usage':
          return b.usage_count - a.usage_count;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const categories = Array.from(new Set(mockTemplates.map(template => template.category)));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Workflow Templates</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Category and Sort Filters */}
          <div className="flex space-x-4">
            {/* Categories */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="rating">Rating</option>
                <option value="downloads">Downloads</option>
                <option value="usage">Usage</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelect(template)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      categoryColors[template.category as keyof typeof categoryColors]
                    }`}>
                      {template.category}
                    </span>
                    {template.featured && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">{template.rating}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    +{template.tags.length - 3} more
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{template.downloads} downloads</span>
                <span>{template.usage_count} uses</span>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
