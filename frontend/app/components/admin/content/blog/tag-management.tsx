'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('TagManagement');

interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  post_count: number;
  created_at: string;
  updated_at: string;
  color?: string;
  category?: string;
}

interface MedicalTopicSuggestion {
  term: string;
  category: string;
  description: string;
  relatedTerms: string[];
}

interface TagManagementProps {
  onTagSelect?: (tag: Tag) => void;
  selectedTagIds?: string[];
  onTagsChange?: (tags: Tag[]) => void;
}

export function TagManagement({
  onTagSelect,
  selectedTagIds = [],
  onTagsChange
}: TagManagementProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MedicalTopicSuggestion[]>([]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      logger.info('Fetching tags');
      
      // In production, this would fetch from the API
      const mockTags: Tag[] = [
        {
          id: '1',
          name: 'Hypertension',
          slug: 'hypertension',
          description: 'High blood pressure management',
          post_count: 8,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#ef4444',
          category: 'Cardiology'
        },
        {
          id: '2',
          name: 'Diabetes Management',
          slug: 'diabetes-management',
          description: 'Type 1 and Type 2 diabetes care',
          post_count: 12,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#10b981',
          category: 'Endocrinology'
        },
        {
          id: '3',
          name: 'Cancer Treatment',
          slug: 'cancer-treatment',
          description: 'Oncology treatment protocols',
          post_count: 15,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#8b5cf6',
          category: 'Oncology'
        },
        {
          id: '4',
          name: 'Pediatric Care',
          slug: 'pediatric-care',
          description: 'Child and adolescent healthcare',
          post_count: 20,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#06b6d4',
          category: 'Pediatrics'
        },
        {
          id: '5',
          name: 'Surgical Innovation',
          slug: 'surgical-innovation',
          description: 'Advanced surgical techniques',
          post_count: 18,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#f59e0b',
          category: 'Surgery'
        },
        {
          id: '6',
          name: 'Clinical Trials',
          slug: 'clinical-trials',
          description: 'Medical research and trials',
          post_count: 25,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#6366f1',
          category: 'Research'
        },
        {
          id: '7',
          name: 'AI in Healthcare',
          slug: 'ai-healthcare',
          description: 'Artificial intelligence applications',
          post_count: 14,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#8b5cf6',
          category: 'Technology'
        },
        {
          id: '8',
          name: 'Mental Health',
          slug: 'mental-health',
          description: 'Psychological and psychiatric care',
          post_count: 16,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#ec4899',
          category: 'Psychiatry'
        }
      ];

      setTags(mockTags);
      logger.info('Tags fetched successfully', { count: mockTags.length });
    } catch (error) {
      logger.error('Failed to fetch tags', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTagClick = (tag: Tag) => {
    if (onTagSelect) {
      onTagSelect(tag);
      logger.info('Tag selected', { tagId: tag.id, tagName: tag.name });
    }
  };

  const handleTagToggle = (tag: Tag) => {
    if (onTagsChange) {
      const isSelected = selectedTagIds.includes(tag.id);
      let newSelectedTags: Tag[];
      
      if (isSelected) {
        newSelectedTags = tags.filter(t => selectedTagIds.includes(t.id) && t.id !== tag.id);
      } else {
        newSelectedTags = [...tags.filter(t => selectedTagIds.includes(t.id)), tag];
      }
      
      onTagsChange(newSelectedTags);
      logger.info('Tag toggled', { tagId: tag.id, selected: !isSelected });
    }
  };

  const handleCreateTag = () => {
    setEditingTag(null);
    setShowCreateModal(true);
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setShowCreateModal(true);
  };

  const handleDeleteTag = async (tagId: string) => {
    if (window.confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
      try {
        logger.info('Deleting tag', { tagId });
        
        // In production, this would delete from the database
        setTags(prev => prev.filter(tag => tag.id !== tagId));
        
        logger.info('Tag deleted successfully', { tagId });
      } catch (error) {
        logger.error('Failed to delete tag', { 
          tagId,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    if (query.length > 2) {
      // Generate medical topic suggestions
      const medicalSuggestions: MedicalTopicSuggestion[] = [
        {
          term: 'Cardiovascular Disease',
          category: 'Cardiology',
          description: 'Heart and blood vessel disorders',
          relatedTerms: ['hypertension', 'heart attack', 'stroke', 'arrhythmia']
        },
        {
          term: 'Oncology Research',
          category: 'Oncology',
          description: 'Cancer research and treatment',
          relatedTerms: ['chemotherapy', 'radiation', 'immunotherapy', 'tumor']
        },
        {
          term: 'Neurological Disorders',
          category: 'Neurology',
          description: 'Brain and nervous system conditions',
          relatedTerms: ['alzheimer', 'parkinson', 'epilepsy', 'migraine']
        },
        {
          term: 'Pediatric Development',
          category: 'Pediatrics',
          description: 'Child growth and development',
          relatedTerms: ['vaccination', 'growth', 'development', 'nutrition']
        }
      ];
      
      const filteredSuggestions = medicalSuggestions.filter(suggestion =>
        suggestion.term.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.relatedTerms.some(term => term.toLowerCase().includes(query.toLowerCase()))
      );
      
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: MedicalTopicSuggestion) => {
    const newTag: Tag = {
      id: Date.now().toString(),
      name: suggestion.term,
      slug: suggestion.term.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: suggestion.description,
      post_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      color: '#3b82f6',
      category: suggestion.category
    };
    
    setTags(prev => [newTag, ...prev]);
    setSearchQuery('');
    setShowSuggestions(false);
    
    logger.info('Medical topic suggestion applied', { term: suggestion.term });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading tags...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tags</h2>
          <p className="text-sm text-gray-600">
            Manage healthcare blog tags and medical topics
          </p>
        </div>
        <button
          onClick={handleCreateTag}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Tag
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search tags or medical topics..."
        />
        
        {/* Medical Topic Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto"
            >
              <div className="p-2">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Medical Topic Suggestions</h4>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{suggestion.term}</p>
                        <p className="text-sm text-gray-600">{suggestion.description}</p>
                        <p className="text-xs text-blue-600">{suggestion.category}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTags.map((tag) => (
          <motion.div
            key={tag.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all ${
              selectedTagIds.includes(tag.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></span>
                  <h3 className="font-semibold text-gray-900">{tag.name}</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{tag.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{tag.post_count} posts</span>
                  {tag.category && (
                    <span className="px-2 py-1 bg-gray-100 rounded">{tag.category}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 ml-2">
                {onTagsChange && (
                  <button
                    onClick={() => handleTagToggle(tag)}
                    className={`p-1 rounded ${
                      selectedTagIds.includes(tag.id)
                        ? 'text-blue-600 bg-blue-100'
                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={selectedTagIds.includes(tag.id) ? 'Remove tag' : 'Add tag'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
                
                {onTagSelect && (
                  <button
                    onClick={() => handleTagClick(tag)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Select tag"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={() => handleEditTag(tag)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit tag"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete tag"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTags.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tags found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try a different search term' : 'Get started by creating your first tag'}
          </p>
        </div>
      )}

      {/* Create/Edit Tag Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <TagModal
            tag={editingTag}
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSave={(tagData) => {
              if (editingTag) {
                // Update existing tag
                setTags(prev => 
                  prev.map(tag => tag.id === editingTag.id ? { ...tag, ...tagData } : tag)
                );
              } else {
                // Create new tag
                const newTag: Tag = {
                  id: Date.now().toString(),
                  ...tagData,
                  post_count: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                setTags(prev => [newTag, ...prev]);
              }
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface TagModalProps {
  tag?: Tag | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tagData: Partial<Tag>) => void;
}

function TagModal({ tag, isOpen, onClose, onSave }: TagModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
    category: ''
  });

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name,
        slug: tag.slug,
        description: tag.description || '',
        color: tag.color || '#3b82f6',
        category: tag.category || ''
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        color: '#3b82f6',
        category: ''
      });
    }
  }, [tag]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    onSave(formData);
  };

  const healthcareCategories = [
    'Cardiology', 'Oncology', 'Neurology', 'Pediatrics', 'Surgery',
    'Research', 'Technology', 'Endocrinology', 'Psychiatry', 'Dermatology'
  ];

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
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {tag ? 'Edit Tag' : 'Create New Tag'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter tag name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="tag-slug"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter tag description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category</option>
                  {healthcareCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tag ? 'Update' : 'Create'} Tag
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
