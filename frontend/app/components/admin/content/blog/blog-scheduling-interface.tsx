'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('BlogSchedulingInterface');

interface ScheduledPost {
  id: string;
  title: string;
  scheduledAt: string;
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  author: string;
  category: string;
  createdAt: string;
  errorMessage?: string;
}

interface BlogSchedulingInterfaceProps {
  onSchedulePost: (postId: string, scheduledAt: string) => void;
  onCancelSchedule: (postId: string) => void;
  onPublishNow: (postId: string) => void;
}

export function BlogSchedulingInterface({
  onSchedulePost,
  onCancelSchedule,
  onPublishNow
}: BlogSchedulingInterfaceProps) {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      setIsLoading(true);
      logger.info('Fetching scheduled posts');
      
      // In production, this would fetch from the API
      const mockScheduledPosts: ScheduledPost[] = [
        {
          id: '1',
          title: 'Advances in Cardiac Surgery Techniques',
          scheduledAt: '2025-01-28T09:00:00Z',
          status: 'scheduled',
          author: 'Dr. Smith',
          category: 'Cardiology',
          createdAt: '2025-01-27T10:00:00Z'
        },
        {
          id: '2',
          title: 'AI-Powered Diagnostic Tools in Oncology',
          scheduledAt: '2025-01-29T14:30:00Z',
          status: 'scheduled',
          author: 'Dr. Johnson',
          category: 'Oncology',
          createdAt: '2025-01-27T11:00:00Z'
        },
        {
          id: '3',
          title: 'Pediatric Neurology Research Breakthrough',
          scheduledAt: '2025-01-30T08:00:00Z',
          status: 'publishing',
          author: 'Dr. Williams',
          category: 'Pediatrics',
          createdAt: '2025-01-27T12:00:00Z'
        }
      ];

      setScheduledPosts(mockScheduledPosts);
      logger.info('Scheduled posts fetched successfully', { count: mockScheduledPosts.length });
    } catch (error) {
      logger.error('Failed to fetch scheduled posts', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedPost || !scheduledDateTime) return;

    try {
      logger.info('Scheduling blog post', { postId: selectedPost, scheduledAt: scheduledDateTime });
      
      await onSchedulePost(selectedPost, scheduledDateTime);
      
      // Update local state
      setScheduledPosts(prev => 
        prev.map(post => 
          post.id === selectedPost 
            ? { ...post, scheduledAt: scheduledDateTime, status: 'scheduled' }
            : post
        )
      );
      
      setShowScheduleModal(false);
      setSelectedPost(null);
      setScheduledDateTime('');
      
      logger.info('Blog post scheduled successfully', { postId: selectedPost });
    } catch (error) {
      logger.error('Failed to schedule blog post', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const handleCancelSchedule = async (postId: string) => {
    try {
      logger.info('Canceling scheduled post', { postId });
      
      await onCancelSchedule(postId);
      
      // Update local state
      setScheduledPosts(prev => prev.filter(post => post.id !== postId));
      
      logger.info('Scheduled post canceled successfully', { postId });
    } catch (error) {
      logger.error('Failed to cancel scheduled post', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const handlePublishNow = async (postId: string) => {
    try {
      logger.info('Publishing post immediately', { postId });
      
      await onPublishNow(postId);
      
      // Update local state
      setScheduledPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, status: 'published' }
            : post
        )
      );
      
      logger.info('Post published immediately', { postId });
    } catch (error) {
      logger.error('Failed to publish post immediately', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'publishing':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'publishing':
        return (
          <div className="w-4 h-4 border-2 border-yellow-200 border-t-yellow-600 rounded-full animate-spin"></div>
        );
      case 'published':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading scheduled posts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Scheduled Posts</h2>
          <p className="text-sm text-gray-600">
            Manage your scheduled blog posts and publishing queue
          </p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Schedule New Post
        </button>
      </div>

      {/* Scheduled Posts List */}
      {scheduledPosts.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled posts</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by scheduling your first blog post.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {scheduledPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                      {getStatusIcon(post.status)}
                      <span className="ml-1">{post.status.charAt(0).toUpperCase() + post.status.slice(1)}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Scheduled for:</span>
                      <p>{formatDateTime(post.scheduledAt)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Author:</span>
                      <p>{post.author}</p>
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>
                      <p>{post.category}</p>
                    </div>
                  </div>

                  {post.errorMessage && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        <strong>Error:</strong> {post.errorMessage}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {post.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handlePublishNow(post.id)}
                        className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                      >
                        Publish Now
                      </button>
                      <button
                        onClick={() => handleCancelSchedule(post.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {post.status === 'failed' && (
                    <button
                      onClick={() => handlePublishNow(post.id)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <ScheduleModal
            isOpen={showScheduleModal}
            onClose={() => setShowScheduleModal(false)}
            onSchedule={handleSchedulePost}
            scheduledDateTime={scheduledDateTime}
            onDateTimeChange={setScheduledDateTime}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: () => void;
  scheduledDateTime: string;
  onDateTimeChange: (dateTime: string) => void;
}

function ScheduleModal({
  isOpen,
  onClose,
  onSchedule,
  scheduledDateTime,
  onDateTimeChange
}: ScheduleModalProps) {
  const [selectedPost, setSelectedPost] = useState<string>('');
  const [availablePosts, setAvailablePosts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      // In production, this would fetch available posts for scheduling
      setAvailablePosts([
        { id: '1', title: 'Sample Post 1', status: 'draft' },
        { id: '2', title: 'Sample Post 2', status: 'draft' }
      ]);
    }
  }, [isOpen]);

  const handleSchedule = () => {
    if (selectedPost && scheduledDateTime) {
      onSchedule();
    }
  };

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
            Schedule Blog Post
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Post
              </label>
              <select
                value={selectedPost}
                onChange={(e) => setSelectedPost(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a post to schedule</option>
                {availablePosts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => onDateTimeChange(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
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
              onClick={handleSchedule}
              disabled={!selectedPost || !scheduledDateTime}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Schedule Post
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
