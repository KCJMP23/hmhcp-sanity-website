'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FolderPlus, 
  FolderOpen, 
  Move, 
  Copy, 
  Trash2, 
  Tag, 
  Filter,
  Search,
  Grid3X3,
  List,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { MediaFile } from '@/types/media';
import { MediaFolder } from '@/types/media';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

interface MediaOrganizationToolsProps {
  mediaFiles: MediaFile[];
  folders: MediaFolder[];
  selectedFiles: string[];
  onFilesMove: (fileIds: string[], targetFolderId: string | null) => void;
  onFilesCopy: (fileIds: string[], targetFolderId: string | null) => void;
  onFilesDelete: (fileIds: string[]) => void;
  onFoldersChange: (folders: MediaFolder[]) => void;
  onBulkCategorize: (fileIds: string[], category: string) => void;
}

const HEALTHCARE_CATEGORIES = [
  { value: 'anatomy', label: 'Anatomy', icon: '🫀', color: 'blue' },
  { value: 'procedures', label: 'Procedures', icon: '⚕️', color: 'green' },
  { value: 'equipment', label: 'Equipment', icon: '🩺', color: 'purple' },
  { value: 'conditions', label: 'Conditions', icon: '⚠️', color: 'red' },
  { value: 'medications', label: 'Medications', icon: '💊', color: 'yellow' },
  { value: 'research', label: 'Research', icon: '🔬', color: 'indigo' },
  { value: 'education', label: 'Education', icon: '📚', color: 'pink' }
];

export function MediaOrganizationTools({
  mediaFiles,
  folders,
  selectedFiles,
  onFilesMove,
  onFilesCopy,
  onFilesDelete,
  onFoldersChange,
  onBulkCategorize
}: MediaOrganizationToolsProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const logger = new HealthcareAILogger('MediaOrganizationTools');

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleDragStart = (fileId: string) => {
    setDraggedFile(fileId);
    logger.log('Drag started', { fileId, context: 'media_organization' });
  };

  const handleDragEnd = () => {
    setDraggedFile(null);
    setDragOverFolder(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolder(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    
    if (!draggedFile) return;

    logger.log('File dropped', { 
      fileId: draggedFile, 
      targetFolderId, 
      context: 'media_organization' 
    });

    onFilesMove([draggedFile], targetFolderId);
    setDraggedFile(null);
    setDragOverFolder(null);
  };

  const handleBulkMove = (targetFolderId: string | null) => {
    if (selectedFiles.length === 0) return;
    
    logger.log('Bulk move files', { 
      fileCount: selectedFiles.length, 
      targetFolderId, 
      context: 'media_organization' 
    });
    
    onFilesMove(selectedFiles, targetFolderId);
  };

  const handleBulkCopy = (targetFolderId: string | null) => {
    if (selectedFiles.length === 0) return;
    
    logger.log('Bulk copy files', { 
      fileCount: selectedFiles.length, 
      targetFolderId, 
      context: 'media_organization' 
    });
    
    onFilesCopy(selectedFiles, targetFolderId);
  };

  const handleBulkDelete = () => {
    if (selectedFiles.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedFiles.length} files?`)) {
      logger.log('Bulk delete files', { 
        fileCount: selectedFiles.length, 
        context: 'media_organization' 
      });
      
      onFilesDelete(selectedFiles);
    }
  };

  const handleBulkCategorizeSubmit = () => {
    if (selectedFiles.length === 0 || !bulkCategory) return;
    
    logger.log('Bulk categorize files', { 
      fileCount: selectedFiles.length, 
      category: bulkCategory, 
      context: 'media_organization' 
    });
    
    onBulkCategorize(selectedFiles, bulkCategory);
    setBulkCategory('');
    setShowBulkActions(false);
  };

  const getFilesInFolder = (folderId: string | null): MediaFile[] => {
    return mediaFiles.filter(file => file.folder_id === folderId);
  };

  const getFolderStats = (folderId: string | null) => {
    const files = getFilesInFolder(folderId);
    const totalSize = files.reduce((sum, file) => sum + file.file_size, 0);
    const imageCount = files.filter(f => f.file_type === 'image').length;
    const videoCount = files.filter(f => f.file_type === 'video').length;
    const documentCount = files.filter(f => f.file_type === 'document').length;
    
    return { totalSize, imageCount, videoCount, documentCount, totalFiles: files.length };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    const cat = HEALTHCARE_CATEGORIES.find(c => c.value === category);
    return cat ? `text-${cat.color}-600` : 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      {selectedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedFiles.length} files selected
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showBulkActions ? 'Hide' : 'Show'} Actions
              </button>
            </div>
          </div>

          {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4"
            >
              {/* Move/Copy to Folder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Move/Copy to Folder
                </label>
                <div className="flex space-x-2">
                  <select
                    onChange={(e) => {
                      const folderId = e.target.value === 'unorganized' ? null : e.target.value;
                      handleBulkMove(folderId);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select folder...</option>
                    <option value="unorganized">Unorganized</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => {
                      const folderId = (document.querySelector('select') as HTMLSelectElement)?.value;
                      if (folderId) {
                        const targetFolderId = folderId === 'unorganized' ? null : folderId;
                        handleBulkCopy(targetFolderId);
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Bulk Categorize */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorize as
                </label>
                <div className="flex space-x-2">
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category...</option>
                    {HEALTHCARE_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={handleBulkCategorizeSubmit}
                    disabled={!bulkCategory}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Delete */}
              <div className="pt-2 border-t border-blue-200">
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected Files
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Folder Tree */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Media Organization</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {mediaFiles.length} files in {folders.length + 1} folders
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {/* Unorganized Files */}
          <div
            className={`p-3 rounded-lg border-2 border-dashed transition-colors ${
              dragOverFolder === null
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FolderOpen className="h-5 w-5 text-gray-500" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Unorganized Files</h4>
                  <p className="text-xs text-gray-500">
                    {getFilesInFolder(null).length} files • {formatFileSize(getFolderStats(null).totalSize)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {getFolderStats(null).imageCount} images
                  </span>
                  {getFolderStats(null).videoCount > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {getFolderStats(null).videoCount} videos
                    </span>
                  )}
                  {getFolderStats(null).documentCount > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {getFolderStats(null).documentCount} docs
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Organized Folders */}
          {folders.map((folder) => {
            const stats = getFolderStats(folder.id);
            const category = HEALTHCARE_CATEGORIES.find(c => c.value === folder.healthcare_category);
            
            return (
              <div
                key={folder.id}
                className={`p-3 rounded-lg border-2 border-dashed transition-colors ${
                  dragOverFolder === folder.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedFolders.has(folder.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <span className="text-lg">{category?.icon || '📁'}</span>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{folder.name}</h4>
                      <p className="text-xs text-gray-500">
                        {stats.totalFiles} files • {formatFileSize(stats.totalSize)}
                      </p>
                      {folder.description && (
                        <p className="text-xs text-gray-400 mt-1">{folder.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${getCategoryColor(folder.healthcare_category)}`}>
                      {category?.label || folder.healthcare_category}
                    </span>
                    
                    <div className="flex space-x-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {stats.imageCount} images
                      </span>
                      {stats.videoCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {stats.videoCount} videos
                        </span>
                      )}
                      {stats.documentCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {stats.documentCount} docs
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Folder Content */}
                {expandedFolders.has(folder.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-gray-100"
                  >
                    <div className="space-y-2">
                      {getFilesInFolder(folder.id).map((file) => (
                        <div
                          key={file.id}
                          draggable
                          onDragStart={() => handleDragStart(file.id)}
                          onDragEnd={handleDragEnd}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-move"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{file.filename}</span>
                            <span className="text-xs text-gray-400">
                              {formatFileSize(file.file_size)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {file.medical_tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {file.medical_tags.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{file.medical_tags.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {getFilesInFolder(folder.id).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No files in this folder
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
