'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, 
  X, 
  Calendar, 
  FileType, 
  Folder, 
  Shield,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { MediaFolder } from '@/types/media';

interface FilterState {
  fileType: string[];
  dateRange: { start: string; end: string };
  usage: 'all' | 'used' | 'unused';
  metadata: string;
  healthcareCategory: string[];
  complianceStatus: string[];
}

interface MediaFilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  folders: MediaFolder[];
}

const FILE_TYPES = [
  { value: 'image', label: 'Images', count: 0 },
  { value: 'video', label: 'Videos', count: 0 },
  { value: 'document', label: 'Documents', count: 0 },
  { value: 'audio', label: 'Audio', count: 0 }
];

const HEALTHCARE_CATEGORIES = [
  { value: 'anatomy', label: 'Anatomy', count: 0 },
  { value: 'procedures', label: 'Procedures', count: 0 },
  { value: 'equipment', label: 'Equipment', count: 0 },
  { value: 'conditions', label: 'Conditions', count: 0 },
  { value: 'medications', label: 'Medications', count: 0 },
  { value: 'research', label: 'Research', count: 0 },
  { value: 'education', label: 'Education', count: 0 }
];

const COMPLIANCE_STATUSES = [
  { value: 'validated', label: 'Validated', count: 0 },
  { value: 'pending', label: 'Pending', count: 0 },
  { value: 'failed', label: 'Failed', count: 0 }
];

export function MediaFilterSidebar({ filters, onFiltersChange, folders }: MediaFilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    fileType: true,
    dateRange: true,
    usage: true,
    healthcareCategory: true,
    complianceStatus: true,
    folders: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleFileTypeChange = (fileType: string, checked: boolean) => {
    const newFileTypes = checked
      ? [...filters.fileType, fileType]
      : filters.fileType.filter(type => type !== fileType);
    updateFilter('fileType', newFileTypes);
  };

  const handleHealthcareCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.healthcareCategory, category]
      : filters.healthcareCategory.filter(cat => cat !== category);
    updateFilter('healthcareCategory', newCategories);
  };

  const handleComplianceStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...filters.complianceStatus, status]
      : filters.complianceStatus.filter(s => s !== status);
    updateFilter('complianceStatus', newStatuses);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      fileType: [],
      dateRange: { start: '', end: '' },
      usage: 'all',
      metadata: '',
      healthcareCategory: [],
      complianceStatus: []
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.fileType.length > 0 ||
      filters.dateRange.start ||
      filters.dateRange.end ||
      filters.usage !== 'all' ||
      filters.metadata ||
      filters.healthcareCategory.length > 0 ||
      filters.complianceStatus.length > 0
    );
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h2>
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* File Type Filter */}
        <div>
          <button
            onClick={() => toggleSection('fileType')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span className="flex items-center">
              <FileType className="h-4 w-4 mr-2" />
              File Type
            </span>
            {expandedSections.fileType ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.fileType && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {FILE_TYPES.map((type) => (
                <label key={type.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.fileType.includes(type.value)}
                    onChange={(e) => handleFileTypeChange(type.value, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {type.label}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">
                    ({type.count})
                  </span>
                </label>
              ))}
            </motion.div>
          )}
        </div>

        {/* Date Range Filter */}
        <div>
          <button
            onClick={() => toggleSection('dateRange')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </span>
            {expandedSections.dateRange ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.dateRange && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Usage Filter */}
        <div>
          <button
            onClick={() => toggleSection('usage')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span className="flex items-center">
              <FileType className="h-4 w-4 mr-2" />
              Usage
            </span>
            {expandedSections.usage ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.usage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {[
                { value: 'all', label: 'All files' },
                { value: 'used', label: 'Used files' },
                { value: 'unused', label: 'Unused files' }
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="usage"
                    value={option.value}
                    checked={filters.usage === option.value}
                    onChange={(e) => updateFilter('usage', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {option.label}
                  </span>
                </label>
              ))}
            </motion.div>
          )}
        </div>

        {/* Healthcare Category Filter */}
        <div>
          <button
            onClick={() => toggleSection('healthcareCategory')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span className="flex items-center">
              <Folder className="h-4 w-4 mr-2" />
              Healthcare Category
            </span>
            {expandedSections.healthcareCategory ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.healthcareCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {HEALTHCARE_CATEGORIES.map((category) => (
                <label key={category.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.healthcareCategory.includes(category.value)}
                    onChange={(e) => handleHealthcareCategoryChange(category.value, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {category.label}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">
                    ({category.count})
                  </span>
                </label>
              ))}
            </motion.div>
          )}
        </div>

        {/* Compliance Status Filter */}
        <div>
          <button
            onClick={() => toggleSection('complianceStatus')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Compliance Status
            </span>
            {expandedSections.complianceStatus ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.complianceStatus && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {COMPLIANCE_STATUSES.map((status) => (
                <label key={status.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.complianceStatus.includes(status.value)}
                    onChange={(e) => handleComplianceStatusChange(status.value, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {status.label}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">
                    ({status.count})
                  </span>
                </label>
              ))}
            </motion.div>
          )}
        </div>

        {/* Folders Filter */}
        <div>
          <button
            onClick={() => toggleSection('folders')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span className="flex items-center">
              <Folder className="h-4 w-4 mr-2" />
              Folders
            </span>
            {expandedSections.folders ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.folders && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => {}}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Unorganized
                </span>
              </label>
              {folders.map((folder) => (
                <label key={folder.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => {}}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {folder.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">
                    ({folder.media_count})
                  </span>
                </label>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
