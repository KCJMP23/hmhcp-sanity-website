'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BlogPost } from '@/types/content';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('BlogPostCard');

interface BlogPostCardProps {
  post: BlogPost;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function BlogPostCard({
  post,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: BlogPostCardProps) {
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
      day: 'numeric'
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
      whileHover={{ y: -2 }}
      className={`relative bg-white rounded-lg border-2 transition-all duration-200 ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Selection checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelect}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      {/* Featured image */}
      {post.featured_image && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={post.featured_image}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        {/* Status badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit post"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete post"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {post.title}
        </h3>

        {/* Content preview */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {post.content ? 
            (typeof post.content === 'string' ? post.content : JSON.stringify(post.content))
              .replace(/<[^>]*>/g, '')
              .substring(0, 150) + '...' 
            : 'No content available'
          }
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
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
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <span>By {post.author_id}</span>
            <span>•</span>
            <span>{formatDate(post.created_at)}</span>
          </div>
          {post.published_at && (
            <span>Published {formatDate(post.published_at)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
