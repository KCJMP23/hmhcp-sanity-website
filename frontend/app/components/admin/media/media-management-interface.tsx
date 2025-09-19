'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Copy,
  Move,
  Tag,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { MediaFile } from '@/types/media';
import { MediaFolder } from '@/types/media';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';
import { ImageEditingModal } from './image-editing-modal';
import { MetadataEditingModal } from './metadata-editing-modal';

interface MediaManagementInterfaceProps {
  mediaFiles: MediaFile[];
  viewMode: 'grid' | 'list';
  selectedFiles: string[];
  onFileSelection: (fileId: string, selected: boolean) => void;
  onBulkSelection: (selectAll: boolean) => void;
  folders: MediaFolder[];
}

export function MediaManagementInterface({
  mediaFiles,
  viewMode,
  selectedFiles,
  onFileSelection,
  onBulkSelection,
  folders
}: MediaManagementInterfaceProps) {
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [isBulkMetadataEdit, setIsBulkMetadataEdit] = useState(false);
  const logger = new HealthcareAILogger('MediaManagementInterface');

  const getFolderName = (folderId?: string) => {
    if (!folderId) return 'Unorganized';
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || 'Unknown Folder';
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFileAction = (action: string, fileId: string) => {
    logger.log(`File action: ${action}`, { fileId, context: 'media_management' });
    
    const file = mediaFiles.find(f => f.id === fileId);
    if (!file) return;

    switch (action) {
      case 'edit':
        if (file.file_type === 'image') {
          setEditingFile(file);
          setIsEditingModalOpen(true);
        } else {
          logger.warn('Cannot edit non-image file', { fileId, fileType: file.file_type });
        }
        break;
      case 'metadata':
        setEditingFile(file);
        setIsBulkMetadataEdit(false);
        setIsMetadataModalOpen(true);
        break;
      case 'view':
        // TODO: Implement view functionality
        break;
      case 'download':
        // TODO: Implement download functionality
        break;
      case 'more':
        // TODO: Implement more actions menu
        break;
      default:
        logger.warn('Unknown file action', { action, fileId });
    }
  };

  const handleEditSave = (editedFile: MediaFile) => {
    logger.log('Image edited and saved', { fileId: editedFile.id, context: 'media_management' });
    // TODO: Update the media file in the parent component
    setIsEditingModalOpen(false);
    setEditingFile(null);
  };

  const handleEditClose = () => {
    setIsEditingModalOpen(false);
    setEditingFile(null);
  };

  const handleMetadataSave = (updatedFile: MediaFile) => {
    logger.log('Metadata updated', { fileId: updatedFile.id, context: 'media_management' });
    // TODO: Update the media file in the parent component
    setIsMetadataModalOpen(false);
    setEditingFile(null);
  };

  const handleMetadataClose = () => {
    setIsMetadataModalOpen(false);
    setEditingFile(null);
  };

  const handleBulkMetadataEdit = () => {
    if (selectedFiles.length === 0) return;
    setIsBulkMetadataEdit(true);
    setIsMetadataModalOpen(true);
  };

  const getSelectedFiles = (): MediaFile[] => {
    return mediaFiles.filter(file => selectedFiles.includes(file.id));
  };

  if (mediaFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No media files found</h3>
        <p className="text-gray-600 mb-4">
          Upload some media files to get started with your healthcare media library.
        </p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="space-y-6">
        {/* Bulk Selection Header */}
        {mediaFiles.length > 0 && (
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
            <div className="flex items-center space-x-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedFiles.length === mediaFiles.length && mediaFiles.length > 0}
                  onChange={(e) => onBulkSelection(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Select all ({mediaFiles.length} files)
                </span>
              </label>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedFiles.length} selected
                </span>
                <div className="flex space-x-1">
                  <button className="p-1 text-gray-600 hover:text-gray-900">
                    <Move className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={handleBulkMetadataEdit}
                    className="p-1 text-gray-600 hover:text-gray-900"
                    title="Edit metadata"
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Grid View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {mediaFiles.map((file) => (
            <motion.div
              key={file.id}
              className="relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              onMouseEnter={() => setHoveredFile(file.id)}
              onMouseLeave={() => setHoveredFile(null)}
              whileHover={{ y: -2 }}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={(e) => onFileSelection(file.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
              </div>

              {/* Compliance Status */}
              <div className="absolute top-2 right-2 z-10">
                {getComplianceIcon(file.compliance_status)}
              </div>

              {/* File Preview */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {file.thumbnail_url ? (
                  <img
                    src={file.thumbnail_url}
                    alt={file.alt_text || file.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400">
                    <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
                  {file.filename}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(file.file_size)} • {formatDate(file.uploaded_at)}
                </p>
                <p className="text-xs text-gray-500">
                  {getFolderName(file.folder_id)}
                </p>
                
                {/* Medical Tags */}
                {file.medical_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {file.medical_tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {file.medical_tags.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{file.medical_tags.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Hover Actions */}
              {hoveredFile === file.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-2"
                >
                  <button
                    onClick={() => handleFileAction('view', file.id)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFileAction('edit', file.id)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                    title="Edit Image"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFileAction('metadata', file.id)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                    title="Edit Metadata"
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFileAction('download', file.id)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Bulk Selection Header */}
      {mediaFiles.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedFiles.length === mediaFiles.length && mediaFiles.length > 0}
                onChange={(e) => onBulkSelection(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Select all ({mediaFiles.length} files)
              </span>
            </label>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedFiles.length} selected
              </span>
              <div className="flex space-x-1">
                <button className="p-1 text-gray-600 hover:text-gray-900">
                  <Move className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-gray-900">
                  <Tag className="h-4 w-4" />
                </button>
                <button className="p-1 text-red-600 hover:text-red-900">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {mediaFiles.map((file) => (
            <li key={file.id} className="hover:bg-gray-50">
              <div className="flex items-center px-6 py-4">
                {/* Selection Checkbox */}
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={(e) => onFileSelection(file.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                {/* File Preview */}
                <div className="flex-shrink-0 ml-4">
                  <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {file.thumbnail_url ? (
                      <img
                        src={file.thumbnail_url}
                        alt={file.alt_text || file.filename}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* File Details */}
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {file.filename}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.file_size)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(file.uploaded_at)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getFolderName(file.folder_id)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Used {file.usage_count} times
                        </p>
                      </div>
                    </div>
                    
                    {/* Compliance Status */}
                    <div className="flex items-center space-x-2">
                      {getComplianceIcon(file.compliance_status)}
                      <span className="text-xs text-gray-500 capitalize">
                        {file.compliance_status}
                      </span>
                    </div>
                  </div>

                  {/* Medical Tags */}
                  {file.medical_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {file.medical_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleFileAction('view', file.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFileAction('edit', file.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Edit Image"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFileAction('metadata', file.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Edit Metadata"
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFileAction('download', file.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFileAction('more', file.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="More actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Image Editing Modal */}
      <ImageEditingModal
        isOpen={isEditingModalOpen}
        onClose={handleEditClose}
        mediaFile={editingFile}
        onSave={handleEditSave}
      />

      {/* Metadata Editing Modal */}
      <MetadataEditingModal
        isOpen={isMetadataModalOpen}
        onClose={handleMetadataClose}
        mediaFile={isBulkMetadataEdit ? null : editingFile}
        onSave={handleMetadataSave}
        isBulkEdit={isBulkMetadataEdit}
        selectedFiles={isBulkMetadataEdit ? getSelectedFiles() : []}
      />
    </div>
  );
}
