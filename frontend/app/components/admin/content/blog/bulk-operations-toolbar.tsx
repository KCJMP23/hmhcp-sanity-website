'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('BulkOperationsToolbar');

interface BulkOperationsToolbarProps {
  selectedCount: number;
  onBulkOperation: (action: string, parameters?: any) => void;
  onClearSelection: () => void;
}

export function BulkOperationsToolbar({
  selectedCount,
  onBulkOperation,
  onClearSelection
}: BulkOperationsToolbarProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);

  const handleBulkAction = (action: string, parameters?: any) => {
    if (action === 'delete') {
      setShowConfirmDialog(action);
    } else {
      onBulkOperation(action, parameters);
    }
  };

  const confirmAction = (action: string) => {
    onBulkOperation(action);
    setShowConfirmDialog(null);
  };

  const cancelAction = () => {
    setShowConfirmDialog(null);
  };

  const bulkActions = [
    {
      id: 'publish',
      label: 'Publish',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      className: 'bg-green-600 hover:bg-green-700 text-white'
    },
    {
      id: 'unpublish',
      label: 'Unpublish',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      ),
      className: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l4 4m0 0l4-4m-4 4V3" />
        </svg>
      ),
      className: 'bg-gray-600 hover:bg-gray-700 text-white'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      className: 'bg-red-600 hover:bg-red-700 text-white'
    }
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-blue-50 border-b border-blue-200 px-6 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} post{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              {bulkActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleBulkAction(action.id)}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md ${action.className} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onClearSelection}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
      </motion.div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirm {showConfirmDialog === 'delete' ? 'Deletion' : 'Action'}
                  </h3>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  {showConfirmDialog === 'delete' 
                    ? `Are you sure you want to delete ${selectedCount} post${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`
                    : `Are you sure you want to ${showConfirmDialog} ${selectedCount} post${selectedCount !== 1 ? 's' : ''}?`
                  }
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelAction}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmAction(showConfirmDialog)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    showConfirmDialog === 'delete'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {showConfirmDialog === 'delete' ? 'Delete' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
