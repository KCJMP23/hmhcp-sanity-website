'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogPost } from '@/types/content';
import { BlogPostList } from './blog-post-list';
import { BlogPostEditor } from './blog-post-editor';
import { BlogFilterSidebar } from './blog-filter-sidebar';
import { BulkOperationsToolbar } from './bulk-operations-toolbar';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('BlogManagementInterface');

interface BlogManagementInterfaceProps {
  blogPosts: BlogPost[];
  onPostUpdate: (post: BlogPost) => void;
  onPostCreate: (post: BlogPost) => void;
  onPostDelete: (postId: string) => void;
}

export function BlogManagementInterface({
  blogPosts,
  onPostUpdate,
  onPostCreate,
  onPostDelete
}: BlogManagementInterfaceProps) {
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    author: 'all',
    dateRange: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'published_at' | 'author'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Filter and sort blog posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = blogPosts.filter(post => {
      // Status filter
      if (filters.status !== 'all' && post.status !== filters.status) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && post.category_id !== filters.category) {
        return false;
      }

      // Author filter
      if (filters.author !== 'all' && post.author_id !== filters.author) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const postDate = new Date(post.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (filters.dateRange) {
          case 'today':
            if (daysDiff > 0) return false;
            break;
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
          case 'year':
            if (daysDiff > 365) return false;
            break;
        }
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(searchLower);
        const matchesContent = post.content?.toString().toLowerCase().includes(searchLower) || false;
        const matchesTags = post.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesTitle && !matchesContent && !matchesTags) {
          return false;
        }
      }

      return true;
    });

    // Sort posts
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'published_at':
          aValue = a.published_at ? new Date(a.published_at).getTime() : 0;
          bValue = b.published_at ? new Date(b.published_at).getTime() : 0;
          break;
        case 'author':
          aValue = a.author_id;
          bValue = b.author_id;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [blogPosts, filters, sortBy, sortOrder]);

  const handleSelectPost = (postId: string, selected: boolean) => {
    setSelectedPosts(prev => 
      selected 
        ? [...prev, postId]
        : prev.filter(id => id !== postId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedPosts(selected ? filteredAndSortedPosts.map(post => post.id) : []);
  };

  const handleBulkOperation = async (action: string, parameters?: any) => {
    if (selectedPosts.length === 0) {
      logger.warn('No posts selected for bulk operation');
      return;
    }

    try {
      logger.info(`Performing bulk operation: ${action}`, { 
        postCount: selectedPosts.length,
        postIds: selectedPosts 
      });

      const response = await fetch('/api/admin/content/blog/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          postIds: selectedPosts,
          parameters
        }),
      });

      if (!response.ok) {
        throw new Error(`Bulk operation failed: ${response.statusText}`);
      }

      const result = await response.json();
      logger.info('Bulk operation completed successfully', { result });

      // Refresh the posts list
      window.location.reload();
    } catch (error) {
      logger.error('Bulk operation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setIsCreating(false);
  };

  const handleCreatePost = () => {
    setEditingPost(null);
    setIsCreating(true);
  };

  const handleCloseEditor = () => {
    setEditingPost(null);
    setIsCreating(false);
  };

  const handleSavePost = async (postData: Partial<BlogPost>) => {
    try {
      const isUpdate = editingPost !== null;
      const url = isUpdate 
        ? `/api/admin/content/blog/${editingPost.id}`
        : '/api/admin/content/blog';
      
      const method = isUpdate ? 'PUT' : 'POST';

      logger.info(`${isUpdate ? 'Updating' : 'Creating'} blog post`, { 
        postId: editingPost?.id,
        title: postData.title 
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`${isUpdate ? 'Update' : 'Create'} failed: ${response.statusText}`);
      }

      const savedPost = await response.json();
      
      if (isUpdate) {
        onPostUpdate(savedPost);
      } else {
        onPostCreate(savedPost);
      }

      handleCloseEditor();
      logger.info(`Blog post ${isUpdate ? 'updated' : 'created'} successfully`, { postId: savedPost.id });
    } catch (error) {
      logger.error(`Failed to ${editingPost ? 'update' : 'create'} blog post`, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  return (
    <div className="flex h-full">
      {/* Filter Sidebar */}
      <div className="w-80 flex-shrink-0">
        <BlogFilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Blog Posts ({filteredAndSortedPosts.length})
              </h2>
              <button
                onClick={handleCreatePost}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Post
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Operations Toolbar */}
        {selectedPosts.length > 0 && (
          <BulkOperationsToolbar
            selectedCount={selectedPosts.length}
            onBulkOperation={handleBulkOperation}
            onClearSelection={() => setSelectedPosts([])}
          />
        )}

        {/* Blog Post List */}
        <div className="flex-1 overflow-auto">
          <BlogPostList
            posts={filteredAndSortedPosts}
            viewMode={viewMode}
            selectedPosts={selectedPosts}
            onSelectPost={handleSelectPost}
            onSelectAll={handleSelectAll}
            onEditPost={handleEditPost}
            onDeletePost={onPostDelete}
          />
        </div>
      </div>

      {/* Post Editor Modal */}
      <AnimatePresence>
        {(editingPost || isCreating) && (
          <BlogPostEditor
            post={editingPost}
            isCreating={isCreating}
            onSave={handleSavePost}
            onClose={handleCloseEditor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
