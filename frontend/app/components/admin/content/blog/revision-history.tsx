'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('RevisionHistory');

interface Revision {
  id: string;
  version: number;
  title: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  changeType: 'create' | 'update' | 'publish' | 'unpublish' | 'schedule' | 'unschedule';
  changeDescription: string;
  wordCount: number;
  characterCount: number;
  isPublished: boolean;
  isScheduled: boolean;
  scheduledAt?: string;
  tags: string[];
  categories: string[];
  seoMetadata?: {
    title: string;
    description: string;
    keywords: string[];
  };
  featuredImage?: {
    id: string;
    url: string;
    alt: string;
  };
}

interface RevisionHistoryProps {
  postId: string;
  currentRevision?: Revision;
  onRevisionSelect?: (revision: Revision) => void;
  onRevisionRestore?: (revision: Revision) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export function RevisionHistory({
  postId,
  currentRevision,
  onRevisionSelect,
  onRevisionRestore,
  onClose,
  isOpen
}: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRevisions, setSelectedRevisions] = useState<Revision[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByType, setFilterByType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'version' | 'author'>('date');

  useEffect(() => {
    if (isOpen && postId) {
      fetchRevisions();
    }
  }, [isOpen, postId]);

  const fetchRevisions = async () => {
    try {
      setIsLoading(true);
      logger.info('Fetching revision history', { postId });

      // In production, this would fetch from the API
      const mockRevisions: Revision[] = [
        {
          id: '1',
          version: 1,
          title: 'Understanding Diabetes Management in Modern Healthcare',
          content: 'Diabetes management has evolved significantly in recent years...',
          excerpt: 'A comprehensive guide to modern diabetes management approaches.',
          author: {
            id: '1',
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@hospital.com',
            avatar: '/avatars/sarah-johnson.jpg'
          },
          createdAt: '2025-01-20T10:00:00Z',
          updatedAt: '2025-01-20T10:00:00Z',
          changeType: 'create',
          changeDescription: 'Initial version created',
          wordCount: 1250,
          characterCount: 7500,
          isPublished: false,
          isScheduled: false,
          tags: ['diabetes', 'management', 'healthcare'],
          categories: ['Endocrinology'],
          seoMetadata: {
            title: 'Diabetes Management Guide - Healthcare Blog',
            description: 'Learn about modern diabetes management approaches in healthcare.',
            keywords: ['diabetes', 'management', 'healthcare', 'treatment']
          }
        },
        {
          id: '2',
          version: 2,
          title: 'Understanding Diabetes Management in Modern Healthcare',
          content: 'Diabetes management has evolved significantly in recent years with new treatment protocols...',
          excerpt: 'A comprehensive guide to modern diabetes management approaches and treatment options.',
          author: {
            id: '2',
            name: 'Dr. Michael Chen',
            email: 'michael.chen@hospital.com',
            avatar: '/avatars/michael-chen.jpg'
          },
          createdAt: '2025-01-20T14:30:00Z',
          updatedAt: '2025-01-20T14:30:00Z',
          changeType: 'update',
          changeDescription: 'Added new treatment protocols section',
          wordCount: 1450,
          characterCount: 8900,
          isPublished: false,
          isScheduled: false,
          tags: ['diabetes', 'management', 'healthcare', 'treatment'],
          categories: ['Endocrinology'],
          seoMetadata: {
            title: 'Diabetes Management Guide - Healthcare Blog',
            description: 'Learn about modern diabetes management approaches and treatment options in healthcare.',
            keywords: ['diabetes', 'management', 'healthcare', 'treatment', 'protocols']
          }
        },
        {
          id: '3',
          version: 3,
          title: 'Understanding Diabetes Management in Modern Healthcare',
          content: 'Diabetes management has evolved significantly in recent years with new treatment protocols and advanced monitoring techniques...',
          excerpt: 'A comprehensive guide to modern diabetes management approaches, treatment options, and monitoring techniques.',
          author: {
            id: '1',
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@hospital.com',
            avatar: '/avatars/sarah-johnson.jpg'
          },
          createdAt: '2025-01-20T16:45:00Z',
          updatedAt: '2025-01-20T16:45:00Z',
          changeType: 'update',
          changeDescription: 'Added monitoring techniques and case studies',
          wordCount: 1850,
          characterCount: 11200,
          isPublished: false,
          isScheduled: true,
          scheduledAt: '2025-01-21T09:00:00Z',
          tags: ['diabetes', 'management', 'healthcare', 'treatment', 'monitoring'],
          categories: ['Endocrinology'],
          seoMetadata: {
            title: 'Diabetes Management Guide - Healthcare Blog',
            description: 'Learn about modern diabetes management approaches, treatment options, and monitoring techniques in healthcare.',
            keywords: ['diabetes', 'management', 'healthcare', 'treatment', 'protocols', 'monitoring']
          },
          featuredImage: {
            id: '1',
            url: '/images/blog/diabetes-management.jpg',
            alt: 'Diabetes management tools and monitoring equipment'
          }
        },
        {
          id: '4',
          version: 4,
          title: 'Understanding Diabetes Management in Modern Healthcare',
          content: 'Diabetes management has evolved significantly in recent years with new treatment protocols, advanced monitoring techniques, and personalized care approaches...',
          excerpt: 'A comprehensive guide to modern diabetes management approaches, treatment options, monitoring techniques, and personalized care.',
          author: {
            id: '3',
            name: 'Dr. Emily Rodriguez',
            email: 'emily.rodriguez@hospital.com',
            avatar: '/avatars/emily-rodriguez.jpg'
          },
          createdAt: '2025-01-21T08:15:00Z',
          updatedAt: '2025-01-21T08:15:00Z',
          changeType: 'update',
          changeDescription: 'Added personalized care section and updated statistics',
          wordCount: 2100,
          characterCount: 12800,
          isPublished: true,
          isScheduled: false,
          tags: ['diabetes', 'management', 'healthcare', 'treatment', 'monitoring', 'personalized'],
          categories: ['Endocrinology'],
          seoMetadata: {
            title: 'Diabetes Management Guide - Healthcare Blog',
            description: 'Learn about modern diabetes management approaches, treatment options, monitoring techniques, and personalized care in healthcare.',
            keywords: ['diabetes', 'management', 'healthcare', 'treatment', 'protocols', 'monitoring', 'personalized']
          },
          featuredImage: {
            id: '1',
            url: '/images/blog/diabetes-management.jpg',
            alt: 'Diabetes management tools and monitoring equipment'
          }
        }
      ];

      setRevisions(mockRevisions);
      logger.info('Revision history fetched successfully', { count: mockRevisions.length });
    } catch (error) {
      logger.error('Failed to fetch revision history', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRevisions = revisions.filter(revision => {
    const matchesSearch = revision.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         revision.changeDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         revision.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterByType === 'all' || revision.changeType === filterByType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'version':
        return b.version - a.version;
      case 'author':
        return a.author.name.localeCompare(b.author.name);
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handleRevisionSelect = (revision: Revision) => {
    if (selectedRevisions.length === 0) {
      setSelectedRevisions([revision]);
      onRevisionSelect?.(revision);
    } else if (selectedRevisions.length === 1) {
      const newSelection = [...selectedRevisions, revision];
      setSelectedRevisions(newSelection);
      setShowDiff(true);
    } else {
      setSelectedRevisions([revision]);
      setShowDiff(false);
    }
  };

  const handleRevisionRestore = (revision: Revision) => {
    if (window.confirm(`Are you sure you want to restore version ${revision.version}? This will overwrite the current content.`)) {
      onRevisionRestore?.(revision);
      logger.info('Revision restored', { revisionId: revision.id, version: revision.version });
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    const icons = {
      create: '📝',
      update: '✏️',
      publish: '📢',
      unpublish: '🔒',
      schedule: '⏰',
      unschedule: '❌'
    };
    return icons[changeType as keyof typeof icons] || '📝';
  };

  const getChangeTypeColor = (changeType: string) => {
    const colors = {
      create: 'text-green-600 bg-green-100',
      update: 'text-blue-600 bg-blue-100',
      publish: 'text-purple-600 bg-purple-100',
      unpublish: 'text-gray-600 bg-gray-100',
      schedule: 'text-orange-600 bg-orange-100',
      unschedule: 'text-red-600 bg-red-100'
    };
    return colors[changeType as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

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
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Revision History</h2>
            <p className="text-sm text-gray-600">
              View and manage content revisions for this blog post
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

        {/* Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search revisions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={filterByType}
                onChange={(e) => setFilterByType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="create">Created</option>
                <option value="update">Updated</option>
                <option value="publish">Published</option>
                <option value="unpublish">Unpublished</option>
                <option value="schedule">Scheduled</option>
                <option value="unschedule">Unscheduled</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="version">Sort by Version</option>
                <option value="author">Sort by Author</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading revisions...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRevisions.map((revision) => (
                <motion.div
                  key={revision.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedRevisions.some(r => r.id === revision.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleRevisionSelect(revision)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg">{getChangeTypeIcon(revision.changeType)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">{revision.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(revision.changeType)}`}>
                          {revision.changeType}
                        </span>
                        {revision.isPublished && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Published
                          </span>
                        )}
                        {revision.isScheduled && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            Scheduled
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{revision.changeDescription}</p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <img
                            src={revision.author.avatar || '/avatars/default.jpg'}
                            alt={revision.author.name}
                            className="w-5 h-5 rounded-full"
                          />
                          <span>{revision.author.name}</span>
                        </div>
                        <span>Version {revision.version}</span>
                        <span>{formatDate(revision.createdAt)}</span>
                        <span>{revision.wordCount} words</span>
                      </div>

                      {/* Tags and Categories */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {revision.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {revision.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{revision.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {selectedRevisions.some(r => r.id === revision.id) && (
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevisionRestore(revision);
                        }}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredRevisions.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No revisions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try a different search term' : 'No revision history available for this post'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedRevisions.length > 0 && (
              <span>
                {selectedRevisions.length} revision{selectedRevisions.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            {selectedRevisions.length === 2 && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                {showDiff ? 'Hide' : 'Show'} Diff
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
