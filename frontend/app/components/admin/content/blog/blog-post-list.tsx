'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BlogPost } from '@/types/content';
import { BlogPostCard } from './blog-post-card';
import { BlogPostListItem } from './blog-post-list-item';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('BlogPostList');

interface BlogPostListProps {
  posts: BlogPost[];
  viewMode: 'list' | 'grid';
  selectedPosts: string[];
  onSelectPost: (postId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
}

export function BlogPostList({
  posts,
  viewMode,
  selectedPosts,
  onSelectPost,
  onSelectAll,
  onEditPost,
  onDeletePost
}: BlogPostListProps) {
  const allSelected = posts.length > 0 && selectedPosts.length === posts.length;
  const someSelected = selectedPosts.length > 0 && selectedPosts.length < posts.length;

  const handleSelectAllChange = (checked: boolean) => {
    onSelectAll(checked);
    logger.info('Select all posts', { selected: checked, count: posts.length });
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No blog posts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new blog post.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Header for list view */}
      {viewMode === 'list' && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="px-6 py-3">
            <div className="flex items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => handleSelectAllChange(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">
                  Select All ({posts.length})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className={viewMode === 'grid' ? 'p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'divide-y divide-gray-200'}>
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {viewMode === 'grid' ? (
              <BlogPostCard
                post={post}
                isSelected={selectedPosts.includes(post.id)}
                onSelect={(selected) => onSelectPost(post.id, selected)}
                onEdit={() => onEditPost(post)}
                onDelete={() => onDeletePost(post.id)}
              />
            ) : (
              <BlogPostListItem
                post={post}
                isSelected={selectedPosts.includes(post.id)}
                onSelect={(selected) => onSelectPost(post.id, selected)}
                onEdit={() => onEditPost(post)}
                onDelete={() => onDeletePost(post.id)}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
