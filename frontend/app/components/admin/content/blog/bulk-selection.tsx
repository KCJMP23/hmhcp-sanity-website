'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('BulkSelection');

interface BulkSelectionProps {
  totalItems: number;
  selectedItems: string[];
  onSelectionChange: (selectedItems: string[]) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectPage: () => void;
  onInvertSelection: () => void;
  onBulkOperation: () => void;
  isSelectAllVisible?: boolean;
  isBulkOperationsVisible?: boolean;
}

export function BulkSelection({
  totalItems,
  selectedItems,
  onSelectionChange,
  onSelectAll,
  onSelectNone,
  onSelectPage,
  onInvertSelection,
  onBulkOperation,
  isSelectAllVisible = true,
  isBulkOperationsVisible = true
}: BulkSelectionProps) {
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const selectedCount = selectedItems.length;
  const isAllSelected = selectedCount === totalItems;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalItems;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectNone();
      logger.info('Deselected all items');
    } else {
      onSelectAll();
      logger.info('Selected all items', { totalItems });
    }
  };

  const handleSelectPage = () => {
    onSelectPage();
    logger.info('Selected current page items');
  };

  const handleInvertSelection = () => {
    onInvertSelection();
    logger.info('Inverted selection', { 
      previousCount: selectedCount,
      newCount: totalItems - selectedCount
    });
  };

  const handleBulkOperation = () => {
    if (selectedCount > 0) {
      onBulkOperation();
      logger.info('Opening bulk operations', { selectedCount });
    }
  };

  const getSelectionStatus = () => {
    if (isAllSelected) {
      return 'All items selected';
    } else if (isPartiallySelected) {
      return `${selectedCount} of ${totalItems} items selected`;
    } else {
      return 'No items selected';
    }
  };

  const getSelectionIcon = () => {
    if (isAllSelected) {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    } else if (isPartiallySelected) {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Selection Controls */}
        <div className="flex items-center space-x-4">
          {/* Main Selection Checkbox */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = isPartiallySelected;
                }
              }}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </span>
          </label>

          {/* Selection Status */}
          <div className="flex items-center space-x-2">
            {getSelectionIcon()}
            <span className="text-sm text-gray-600">{getSelectionStatus()}</span>
          </div>

          {/* Selection Menu */}
          {selectedCount > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSelectionMenu(!showSelectionMenu)}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <span>More</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {showSelectionMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleSelectPage();
                          setShowSelectionMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Select Current Page
                      </button>
                      <button
                        onClick={() => {
                          handleInvertSelection();
                          setShowSelectionMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Invert Selection
                      </button>
                      <button
                        onClick={() => {
                          onSelectNone();
                          setShowSelectionMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Bulk Operations */}
        {selectedCount > 0 && (
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              {selectedCount} selected
            </div>
            <button
              onClick={handleBulkOperation}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Bulk Actions
            </button>
          </div>
        )}
      </div>

      {/* Selection Progress Bar */}
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3"
        >
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(selectedCount / totalItems) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">
              {Math.round((selectedCount / totalItems) * 100)}%
            </span>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-3 flex items-center space-x-2"
        >
          <span className="text-xs text-gray-500">Quick actions:</span>
          <button
            onClick={() => {
              // Quick publish action
              logger.info('Quick publish action', { selectedCount });
            }}
            className="text-xs text-green-600 hover:text-green-800 font-medium"
          >
            Publish
          </button>
          <span className="text-xs text-gray-300">•</span>
          <button
            onClick={() => {
              // Quick unpublish action
              logger.info('Quick unpublish action', { selectedCount });
            }}
            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
          >
            Unpublish
          </button>
          <span className="text-xs text-gray-300">•</span>
          <button
            onClick={() => {
              // Quick delete action
              logger.info('Quick delete action', { selectedCount });
            }}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        </motion.div>
      )}
    </div>
  );
}
