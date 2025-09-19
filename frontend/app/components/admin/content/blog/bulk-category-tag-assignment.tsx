'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('BulkCategoryTagAssignment');

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  category?: string;
}

interface BulkCategoryTagAssignmentProps {
  selectedPostIds: string[];
  onAssignmentComplete: () => void;
  onClose: () => void;
}

export function BulkCategoryTagAssignment({
  selectedPostIds,
  onAssignmentComplete,
  onClose
}: BulkCategoryTagAssignmentProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      logger.info('Fetching categories and tags for bulk assignment');

      // Fetch categories and tags in parallel
      const [categoriesResponse, tagsResponse] = await Promise.all([
        fetch('/api/admin/content/blog/categories'),
        fetch('/api/admin/content/blog/tags')
      ]);

      const categoriesData = await categoriesResponse.json();
      const tagsData = await tagsResponse.json();

      if (categoriesData.success) {
        setCategories(categoriesData.categories);
      }

      if (tagsData.success) {
        setTags(tagsData.tags);
      }

      logger.info('Categories and tags fetched successfully', {
        categoryCount: categoriesData.categories?.length || 0,
        tagCount: tagsData.tags?.length || 0
      });
    } catch (error) {
      logger.error('Failed to fetch categories and tags', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    logger.debug('Category selected for bulk assignment', { categoryId });
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      
      logger.debug('Tag toggled for bulk assignment', { tagId, selected: !prev.includes(tagId) });
      return newTags;
    });
  };

  const handleAssign = async () => {
    if (selectedPostIds.length === 0) {
      logger.warn('No posts selected for bulk assignment');
      return;
    }

    try {
      setIsAssigning(true);
      logger.info('Starting bulk assignment', {
        postCount: selectedPostIds.length,
        categoryId: selectedCategory,
        tagCount: selectedTags.length
      });

      // Assign category
      if (selectedCategory) {
        await fetch('/api/admin/content/blog/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'assign_category',
            postIds: selectedPostIds,
            parameters: { category_id: selectedCategory }
          }),
        });
      }

      // Assign tags
      if (selectedTags.length > 0) {
        await fetch('/api/admin/content/blog/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'assign_tag',
            postIds: selectedPostIds,
            parameters: { tags: selectedTags }
          }),
        });
      }

      logger.info('Bulk assignment completed successfully');
      onAssignmentComplete();
    } catch (error) {
      logger.error('Failed to complete bulk assignment', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === selectedCategory);
  };

  const getSelectedTagsData = () => {
    return tags.filter(tag => selectedTags.includes(tag.id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading categories and tags...</span>
        </div>
      </div>
    );
  }

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
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Assignment</h2>
            <p className="text-sm text-gray-600">
              Assign category and tags to {selectedPostIds.length} selected posts
            </p>
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

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Category Assignment */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedCategory === category.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={category.id}
                    checked={selectedCategory === category.id}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{category.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-sm text-gray-600">{category.slug}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Tag Assignment */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => handleTagToggle(tag.id)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></span>
                    <div>
                      <p className="font-medium text-gray-900">{tag.name}</p>
                      <p className="text-sm text-gray-600">{tag.category}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          {(selectedCategory || selectedTags.length > 0) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Assignment Summary</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Posts:</strong> {selectedPostIds.length} selected</p>
                {selectedCategory && (
                  <p><strong>Category:</strong> {getSelectedCategory()?.name}</p>
                )}
                {selectedTags.length > 0 && (
                  <p><strong>Tags:</strong> {getSelectedTagsData().map(tag => tag.name).join(', ')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={isAssigning || (!selectedCategory && selectedTags.length === 0)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssigning ? 'Assigning...' : 'Assign to Posts'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
