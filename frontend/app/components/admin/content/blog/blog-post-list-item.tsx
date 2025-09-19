'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BlogPost } from '@/types/content';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('BlogPostListItem');

interface BlogPostListItemProps {
  post: BlogPost;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function BlogPostListItem({
  post,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: BlogPostListItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(e.target.checked);
    logger.info('Post selection changed', { postId: post.id, selected: e.target.checked });
  };

  const handleEdit = () => {
    logger.info('Edit post requested', { postId: post.id });
    onEdit();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      logger.info('Delete post requested', { postId: post.id });
      onDelete();
    }
  };

  return (
    <motion.div
      whileHover={{ backgroundColor: '#f9fafb' }}
      className={`px-6 py-4 transition-colors duration-200 ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center space-x-4">
        {/* Selection checkbox */}
        <div className="flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        {/* Featured image thumbnail */}
        {post.featured_image && (
          <div className="flex-shrink-0">
            <img
              src={post.featured_image}
              alt={post.title}
              className="h-16 w-24 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {post.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {post.content ? 
                  (typeof post.content === 'string' ? post.content : JSON.stringify(post.content))
                    .replace(/<[^>]*>/g, '')
                    .substring(0, 200) + '...' 
                  : 'No content available'
                }
              </p>
            </div>

            {/* Status and actions */}
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEdit}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Tags and metadata */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>By {post.author_id}</span>
              <span>•</span>
              <span>Created {formatDate(post.created_at)}</span>
              {post.published_at && (
                <>
                  <span>•</span>
                  <span>Published {formatDate(post.published_at)}</span>
                </>
              )}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    +{post.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
