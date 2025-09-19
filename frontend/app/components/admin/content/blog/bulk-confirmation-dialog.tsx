'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('BulkConfirmationDialog');

interface BulkConfirmationDialogProps {
  operation: {
    id: string;
    name: string;
    description: string;
    icon: string;
    destructive: boolean;
  };
  selectedItems: string[];
  onConfirm: (operation: string, parameters?: any) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function BulkConfirmationDialog({
  operation,
  selectedItems,
  onConfirm,
  onCancel,
  isOpen
}: BulkConfirmationDialogProps) {
  const [parameters, setParameters] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      logger.info('Confirming bulk operation', {
        operation: operation.id,
        itemCount: selectedItems.length,
        parameters
      });

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      
      onConfirm(operation.id, parameters);
    } catch (error) {
      logger.error('Failed to confirm operation', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderOperationSpecificFields = () => {
    switch (operation.id) {
      case 'schedule':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Date & Time
              </label>
              <input
                type="datetime-local"
                value={parameters.scheduledAt || ''}
                onChange={(e) => setParameters(prev => ({ ...prev, scheduledAt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Zone
              </label>
              <select
                value={parameters.timeZone || 'UTC'}
                onChange={(e) => setParameters(prev => ({ ...prev, timeZone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>
        );

      case 'assign_category':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category
              </label>
              <select
                value={parameters.categoryId || ''}
                onChange={(e) => setParameters(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Choose a category</option>
                <option value="endocrinology">Endocrinology</option>
                <option value="cardiology">Cardiology</option>
                <option value="neurology">Neurology</option>
                <option value="oncology">Oncology</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="surgery">Surgery</option>
                <option value="mental-health">Mental Health</option>
                <option value="preventive-care">Preventive Care</option>
              </select>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={parameters.replaceExisting || false}
                  onChange={(e) => setParameters(prev => ({ ...prev, replaceExisting: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Replace existing category</span>
              </label>
            </div>
          </div>
        );

      case 'assign_tags':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={parameters.tags || ''}
                onChange={(e) => setParameters(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                }))}
                placeholder="diabetes, management, healthcare"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-gray-600">
              <p>Popular healthcare tags:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {['diabetes', 'management', 'healthcare', 'treatment', 'prevention', 'research', 'clinical', 'patient-care'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      const currentTags = parameters.tags || [];
                      if (!currentTags.includes(tag)) {
                        setParameters(prev => ({ 
                          ...prev, 
                          tags: [...currentTags, tag]
                        }));
                      }
                    }}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={parameters.replaceExisting || false}
                  onChange={(e) => setParameters(prev => ({ ...prev, replaceExisting: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Replace existing tags</span>
              </label>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <select
                value={parameters.format || 'json'}
                onChange={(e) => setParameters(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="xml">XML</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={parameters.includeImages || false}
                  onChange={(e) => setParameters(prev => ({ ...prev, includeImages: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include featured images</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={parameters.includeMetadata || false}
                  onChange={(e) => setParameters(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include SEO metadata</span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
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
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          operation.destructive ? 'border-red-200 bg-red-50' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{operation.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {operation.name}
              </h2>
              <p className="text-sm text-gray-600">
                {operation.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Warning for destructive operations */}
          {operation.destructive && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800">Warning</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This operation cannot be undone. Please make sure you have a backup if needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selected Items Summary */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Selected Items ({selectedItems.length})
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="text-sm text-gray-600">
                {selectedItems.length <= 5 ? (
                  selectedItems.map((id, index) => (
                    <div key={id} className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Post {id}</span>
                    </div>
                  ))
                ) : (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Post {selectedItems[0]}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Post {selectedItems[1]}</span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      ... and {selectedItems.length - 2} more items
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Operation-specific fields */}
          {renderOperationSpecificFields()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${
              operation.destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
