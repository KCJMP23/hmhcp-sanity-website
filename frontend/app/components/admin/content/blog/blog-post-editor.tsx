'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogPost } from '@/types/content';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';
import { HealthcareRichEditor } from './healthcare-rich-editor';
import { HealthcareContentTemplates } from './healthcare-content-templates';
import { MedicalTerminologyAutocomplete } from './medical-terminology-autocomplete';
import { HealthcareComplianceValidator } from './healthcare-compliance-validator';

const logger = new HealthcareAILogger('BlogPostEditor');

interface BlogPostEditorProps {
  post: BlogPost | null;
  isCreating: boolean;
  onSave: (postData: Partial<BlogPost>) => void;
  onClose: () => void;
}

export function BlogPostEditor({
  post,
  isCreating,
  onSave,
  onClose
}: BlogPostEditorProps) {
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    content: '',
    status: 'draft',
    category_id: '',
    tags: [],
    seo_title: '',
    seo_description: '',
    featured_image: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMedicalTerms, setShowMedicalTerms] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [complianceIssues, setComplianceIssues] = useState<any[]>([]);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        status: post.status || 'draft',
        category_id: post.category_id || '',
        tags: post.tags || [],
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || '',
        featured_image: post.featured_image || ''
      });
    } else {
      setFormData({
        title: '',
        content: '',
        status: 'draft',
        category_id: '',
        tags: [],
        seo_title: '',
        seo_description: '',
        featured_image: ''
      });
    }
  }, [post]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleInputChange('tags', tags);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content) {
      newErrors.content = 'Content is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      logger.warn('Form validation failed', { errors });
      return;
    }

    setIsSaving(true);
    try {
      logger.info('Saving blog post', { 
        isCreating, 
        postId: post?.id,
        title: formData.title 
      });
      
      await onSave(formData);
    } catch (error) {
      logger.error('Failed to save blog post', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  return (
    <AnimatePresence>
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
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreating ? 'Create New Blog Post' : 'Edit Blog Post'}
            </h2>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter blog post title..."
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                    Content *
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowTemplates(true)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    >
                      Templates
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMedicalTerms(true)}
                      className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                    >
                      Medical Terms
                    </button>
                  </div>
                </div>
                
                <HealthcareRichEditor
                  value={typeof formData.content === 'string' ? formData.content : ''}
                  onChange={(value) => handleInputChange('content', value)}
                  placeholder="Write your healthcare blog post content here..."
                  className={errors.content ? 'border-red-300' : ''}
                />
                
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}

                {/* Healthcare Compliance Validator */}
                {formData.content && (
                  <div className="mt-4">
                    <HealthcareComplianceValidator
                      content={typeof formData.content === 'string' ? formData.content : ''}
                      onValidationComplete={setComplianceIssues}
                    />
                  </div>
                )}
              </div>

              {/* Status and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status || 'draft'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    value={formData.category_id || ''}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.category_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="oncology">Oncology</option>
                    <option value="neurology">Neurology</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="surgery">Surgery</option>
                    <option value="research">Research</option>
                    <option value="technology">Technology</option>
                  </select>
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter tags separated by commas..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Separate tags with commas (e.g., healthcare, technology, research)
                </p>
              </div>

              {/* SEO Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">SEO Settings</h3>
                
                <div>
                  <label htmlFor="seo_title" className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    id="seo_title"
                    value={formData.seo_title || ''}
                    onChange={(e) => handleInputChange('seo_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter SEO title..."
                  />
                </div>

                <div>
                  <label htmlFor="seo_description" className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    id="seo_description"
                    value={formData.seo_description || ''}
                    onChange={(e) => handleInputChange('seo_description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter SEO description..."
                  />
                </div>
              </div>

              {/* Featured Image */}
              <div>
                <label htmlFor="featured_image" className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image URL
                </label>
                <input
                  type="url"
                  id="featured_image"
                  value={formData.featured_image || ''}
                  onChange={(e) => handleInputChange('featured_image', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter featured image URL..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : (isCreating ? 'Create Post' : 'Save Changes')}
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Healthcare Content Templates Modal */}
      <HealthcareContentTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onTemplateSelect={(template) => {
          handleInputChange('content', template);
          setShowTemplates(false);
        }}
      />

      {/* Medical Terminology Autocomplete Modal */}
      <MedicalTerminologyAutocomplete
        isOpen={showMedicalTerms}
        onClose={() => setShowMedicalTerms(false)}
        searchQuery={searchQuery}
        onTermSelect={(term) => {
          const currentContent = typeof formData.content === 'string' ? formData.content : '';
          const newContent = currentContent + ` <strong>${term.term}</strong>`;
          handleInputChange('content', newContent);
          setShowMedicalTerms(false);
        }}
      />
    </AnimatePresence>
  );
}
