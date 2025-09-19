'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('RevisionRestore');

interface Revision {
  id: string;
  version: number;
  title: string;
  content: string;
  excerpt: string;
  author: {
    name: string;
    email: string;
  };
  createdAt: string;
  wordCount: number;
  tags: string[];
  categories: string[];
}

interface RevisionRestoreProps {
  revision: Revision;
  currentRevision: Revision;
  onRestore: (revision: Revision) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function RevisionRestore({
  revision,
  currentRevision,
  onRestore,
  onClose,
  isOpen
}: RevisionRestoreProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreOptions, setRestoreOptions] = useState({
    restoreTitle: true,
    restoreContent: true,
    restoreExcerpt: true,
    restoreTags: true,
    restoreCategories: true,
    createBackup: true,
    notifyAuthor: false
  });

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      logger.info('Starting revision restore', {
        fromVersion: currentRevision.version,
        toVersion: revision.version,
        options: restoreOptions
      });

      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 2000));

      onRestore(revision);
      
      logger.info('Revision restored successfully', {
        restoredVersion: revision.version
      });
    } catch (error) {
      logger.error('Revision restore failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const getChangeSummary = () => {
    const changes = [];
    
    if (revision.title !== currentRevision.title) {
      changes.push('Title');
    }
    if (revision.content !== currentRevision.content) {
      changes.push('Content');
    }
    if (revision.excerpt !== currentRevision.excerpt) {
      changes.push('Excerpt');
    }
    if (JSON.stringify(revision.tags) !== JSON.stringify(currentRevision.tags)) {
      changes.push('Tags');
    }
    if (JSON.stringify(revision.categories) !== JSON.stringify(currentRevision.categories)) {
      changes.push('Categories');
    }

    return changes;
  };

  const changes = getChangeSummary();

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
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Restore Revision</h2>
            <p className="text-sm text-gray-600">
              Restore version {revision.version} of this blog post
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
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Revision Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Version {revision.version} Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700"><strong>Author:</strong> {revision.author.name}</p>
                <p className="text-blue-700"><strong>Created:</strong> {new Date(revision.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-700"><strong>Word Count:</strong> {revision.wordCount}</p>
                <p className="text-blue-700"><strong>Tags:</strong> {revision.tags.join(', ')}</p>
              </div>
            </div>
          </div>

          {/* Changes Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Changes to Restore</h3>
            <div className="space-y-2">
              {changes.map((change, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">{change}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Restore Options */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Restore Options</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={restoreOptions.restoreTitle}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreTitle: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Title</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={restoreOptions.restoreContent}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreContent: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Content</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={restoreOptions.restoreExcerpt}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreExcerpt: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Excerpt</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={restoreOptions.restoreTags}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreTags: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Tags</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={restoreOptions.restoreCategories}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, restoreCategories: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Categories</span>
                </label>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Options</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={restoreOptions.createBackup}
                  onChange={(e) => setRestoreOptions(prev => ({ ...prev, createBackup: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Create backup of current version</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={restoreOptions.notifyAuthor}
                  onChange={(e) => setRestoreOptions(prev => ({ ...prev, notifyAuthor: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Notify original author ({revision.author.name})</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{revision.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{revision.excerpt}</p>
              <div className="flex flex-wrap gap-1">
                {revision.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This action will overwrite the current version of the blog post. 
                  {restoreOptions.createBackup ? ' A backup will be created automatically.' : ' No backup will be created.'}
                </p>
              </div>
            </div>
          </div>
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
            onClick={handleRestore}
            disabled={isRestoring}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestoring ? 'Restoring...' : 'Restore Revision'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
