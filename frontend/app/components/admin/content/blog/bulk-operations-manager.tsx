'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('BulkOperationsManager');

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiresConfirmation: boolean;
  destructive: boolean;
  maxItems?: number;
}

interface BulkOperationsManagerProps {
  selectedItems: string[];
  onOperationComplete: (operation: string, results: any) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BulkOperationsManager({
  selectedItems,
  onOperationComplete,
  onClose,
  isOpen
}: BulkOperationsManagerProps) {
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionResults, setExecutionResults] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const bulkOperations: BulkOperation[] = [
    {
      id: 'publish',
      name: 'Publish Posts',
      description: 'Publish selected blog posts immediately',
      icon: '📢',
      color: 'text-green-600 bg-green-100',
      requiresConfirmation: true,
      destructive: false
    },
    {
      id: 'unpublish',
      name: 'Unpublish Posts',
      description: 'Unpublish selected blog posts',
      icon: '🔒',
      color: 'text-gray-600 bg-gray-100',
      requiresConfirmation: true,
      destructive: false
    },
    {
      id: 'schedule',
      name: 'Schedule Posts',
      description: 'Schedule selected posts for future publication',
      icon: '⏰',
      color: 'text-blue-600 bg-blue-100',
      requiresConfirmation: true,
      destructive: false
    },
    {
      id: 'delete',
      name: 'Delete Posts',
      description: 'Permanently delete selected blog posts',
      icon: '🗑️',
      color: 'text-red-600 bg-red-100',
      requiresConfirmation: true,
      destructive: true
    },
    {
      id: 'assign_category',
      name: 'Assign Category',
      description: 'Assign a category to selected posts',
      icon: '📁',
      color: 'text-purple-600 bg-purple-100',
      requiresConfirmation: false,
      destructive: false
    },
    {
      id: 'assign_tags',
      name: 'Assign Tags',
      description: 'Assign tags to selected posts',
      icon: '🏷️',
      color: 'text-orange-600 bg-orange-100',
      requiresConfirmation: false,
      destructive: false
    },
    {
      id: 'export',
      name: 'Export Posts',
      description: 'Export selected posts as JSON or CSV',
      icon: '📤',
      color: 'text-indigo-600 bg-indigo-100',
      requiresConfirmation: false,
      destructive: false
    },
    {
      id: 'duplicate',
      name: 'Duplicate Posts',
      description: 'Create copies of selected posts',
      icon: '📋',
      color: 'text-cyan-600 bg-cyan-100',
      requiresConfirmation: true,
      destructive: false
    }
  ];

  const handleOperationSelect = (operationId: string) => {
    const operation = bulkOperations.find(op => op.id === operationId);
    if (!operation) return;

    setSelectedOperation(operationId);

    if (operation.requiresConfirmation) {
      setShowConfirmation(true);
    } else {
      executeOperation(operationId);
    }
  };

  const executeOperation = async (operationId: string) => {
    try {
      setIsExecuting(true);
      setExecutionProgress(0);
      setExecutionResults(null);

      logger.info('Starting bulk operation', {
        operation: operationId,
        itemCount: selectedItems.length
      });

      // Simulate operation execution with progress
      const operation = bulkOperations.find(op => op.id === operationId);
      if (!operation) return;

      const totalSteps = 5;
      for (let step = 1; step <= totalSteps; step++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setExecutionProgress((step / totalSteps) * 100);
      }

      // Simulate operation results
      const results = {
        operation: operation.name,
        totalItems: selectedItems.length,
        successful: Math.floor(selectedItems.length * 0.9),
        failed: Math.floor(selectedItems.length * 0.1),
        errors: selectedItems.length > 5 ? ['Some items could not be processed'] : [],
        completedAt: new Date().toISOString()
      };

      setExecutionResults(results);
      onOperationComplete(operationId, results);

      logger.info('Bulk operation completed', {
        operation: operationId,
        results
      });
    } catch (error) {
      logger.error('Bulk operation failed', {
        operation: operationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleConfirmOperation = () => {
    setShowConfirmation(false);
    if (selectedOperation) {
      executeOperation(selectedOperation);
    }
  };

  const handleCancelOperation = () => {
    setShowConfirmation(false);
    setSelectedOperation(null);
  };

  const getOperationIcon = (operation: BulkOperation) => {
    return operation.icon;
  };

  const getOperationColor = (operation: BulkOperation) => {
    return operation.color;
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
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Operations</h2>
            <p className="text-sm text-gray-600">
              Perform operations on {selectedItems.length} selected items
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
          {isExecuting ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Executing Operation
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {bulkOperations.find(op => op.id === selectedOperation)?.name}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{Math.round(executionProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${executionProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${executionProgress >= 20 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Validating items</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${executionProgress >= 40 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Preparing operation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${executionProgress >= 60 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Processing items</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${executionProgress >= 80 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Updating database</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${executionProgress >= 100 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Finalizing operation</span>
                </div>
              </div>
            </div>
          ) : executionResults ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Operation Completed
                </h3>
                <p className="text-sm text-gray-600">
                  {executionResults.operation} completed successfully
                </p>
              </div>

              {/* Results Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Results Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Items:</span>
                    <span className="ml-2 font-medium">{executionResults.totalItems}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Successful:</span>
                    <span className="ml-2 font-medium text-green-600">{executionResults.successful}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Failed:</span>
                    <span className="ml-2 font-medium text-red-600">{executionResults.failed}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Completed:</span>
                    <span className="ml-2 font-medium">
                      {new Date(executionResults.completedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {executionResults.errors && executionResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Errors</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {executionResults.errors.map((error: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 mt-2"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select an Operation
                </h3>
                <p className="text-sm text-gray-600">
                  Choose what you want to do with the {selectedItems.length} selected items
                </p>
              </div>

              {/* Operations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bulkOperations.map((operation) => (
                  <motion.button
                    key={operation.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOperationSelect(operation.id)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      operation.destructive
                        ? 'border-red-200 hover:border-red-300 hover:bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getOperationIcon(operation)}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {operation.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {operation.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOperationColor(operation)}`}>
                            {operation.destructive ? 'Destructive' : 'Safe'}
                          </span>
                          {operation.requiresConfirmation && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              Requires Confirmation
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          {executionResults ? (
            <button
              onClick={() => {
                setExecutionResults(null);
                setSelectedOperation(null);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Perform Another Operation
            </button>
          ) : !isExecuting && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {showConfirmation && selectedOperation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-md w-full"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">
                      {getOperationIcon(bulkOperations.find(op => op.id === selectedOperation)!)}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Confirm Operation
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to {bulkOperations.find(op => op.id === selectedOperation)?.name.toLowerCase()} {selectedItems.length} selected items?
                  </p>

                  {bulkOperations.find(op => op.id === selectedOperation)?.destructive && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start space-x-2">
                        <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-sm text-red-700">
                          This operation cannot be undone. Please make sure you have a backup if needed.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCancelOperation}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmOperation}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                        bulkOperations.find(op => op.id === selectedOperation)?.destructive
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
