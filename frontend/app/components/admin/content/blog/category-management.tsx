'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('CategoryManagement');

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  children?: Category[];
  post_count: number;
  created_at: string;
  updated_at: string;
  color?: string;
  icon?: string;
}

interface CategoryManagementProps {
  onCategorySelect?: (category: Category) => void;
  selectedCategoryId?: string;
}

export function CategoryManagement({
  onCategorySelect,
  selectedCategoryId
}: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      logger.info('Fetching categories');
      
      // In production, this would fetch from the API
      const mockCategories: Category[] = [
        {
          id: '1',
          name: 'Cardiology',
          slug: 'cardiology',
          description: 'Heart and cardiovascular system health',
          post_count: 15,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#ef4444',
          icon: '❤️'
        },
        {
          id: '2',
          name: 'Oncology',
          slug: 'oncology',
          description: 'Cancer research and treatment',
          post_count: 12,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#8b5cf6',
          icon: '🎗️'
        },
        {
          id: '3',
          name: 'Neurology',
          slug: 'neurology',
          description: 'Brain and nervous system disorders',
          post_count: 8,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#06b6d4',
          icon: '🧠'
        },
        {
          id: '4',
          name: 'Pediatrics',
          slug: 'pediatrics',
          description: 'Child and adolescent health',
          post_count: 20,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#10b981',
          icon: '👶'
        },
        {
          id: '5',
          name: 'Surgery',
          slug: 'surgery',
          description: 'Surgical procedures and techniques',
          post_count: 18,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#f59e0b',
          icon: '⚕️'
        },
        {
          id: '6',
          name: 'Research',
          slug: 'research',
          description: 'Medical research and clinical trials',
          post_count: 25,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#6366f1',
          icon: '🔬'
        },
        {
          id: '7',
          name: 'Technology',
          slug: 'technology',
          description: 'Healthcare technology and innovation',
          post_count: 14,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
          color: '#8b5cf6',
          icon: '💻'
        }
      ];

      setCategories(mockCategories);
      logger.info('Categories fetched successfully', { count: mockCategories.length });
    } catch (error) {
      logger.error('Failed to fetch categories', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
      logger.info('Category selected', { categoryId: category.id, categoryName: category.name });
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setShowCreateModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCreateModal(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        logger.info('Deleting category', { categoryId });
        
        // In production, this would delete from the database
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        
        logger.info('Category deleted successfully', { categoryId });
      } catch (error) {
        logger.error('Failed to delete category', { 
          categoryId,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading categories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-600">
            Manage healthcare blog categories and taxonomy
          </p>
        </div>
        <button
          onClick={handleCreateCategory}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Category
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-200">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 hover:bg-gray-50 transition-colors ${
                selectedCategoryId === category.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{category.post_count}</p>
                    <p className="text-xs text-gray-500">posts</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCategoryClick(category)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    >
                      {selectedCategoryId === category.id ? 'Selected' : 'Select'}
                    </button>
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit category"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete category"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Stats */}
              <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></span>
                  <span>Color: {category.color}</span>
                </div>
                <div>
                  <span>Slug: {category.slug}</span>
                </div>
                <div>
                  <span>Created: {new Date(category.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create/Edit Category Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CategoryModal
            category={editingCategory}
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSave={(categoryData) => {
              if (editingCategory) {
                // Update existing category
                setCategories(prev => 
                  prev.map(cat => cat.id === editingCategory.id ? { ...cat, ...categoryData } : cat)
                );
              } else {
                // Create new category
                const newCategory: Category = {
                  id: Date.now().toString(),
                  ...categoryData,
                  post_count: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                setCategories(prev => [newCategory, ...prev]);
              }
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface CategoryModalProps {
  category?: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: Partial<Category>) => void;
}

function CategoryModal({ category, isOpen, onClose, onSave }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
    icon: '📁'
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        color: category.color || '#3b82f6',
        icon: category.icon || '📁'
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        color: '#3b82f6',
        icon: '📁'
      });
    }
  }, [category]);

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

  const healthcareIcons = ['❤️', '🎗️', '🧠', '👶', '⚕️', '🔬', '💻', '🏥', '💊', '🩺', '📊', '🔍'];

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
            {category ? 'Edit Category' : 'Create New Category'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter category name..."
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
                placeholder="category-slug"
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
                placeholder="Enter category description..."
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
                  Icon
                </label>
                <div className="flex flex-wrap gap-1">
                  {healthcareIcons.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => handleInputChange('icon', icon)}
                      className={`w-8 h-8 text-lg rounded border ${
                        formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
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
              {category ? 'Update' : 'Create'} Category
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
