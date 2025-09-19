'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Edit2, 
  Trash2, 
  Folder, 
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Save,
  AlertCircle
} from 'lucide-react';
import { MediaFolder } from '@/types/media';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

interface MediaFolderManagerProps {
  isOpen: boolean;
  onClose: () => void;
  folders: MediaFolder[];
  onFoldersChange: (folders: MediaFolder[]) => void;
}

const HEALTHCARE_CATEGORIES = [
  'anatomy',
  'procedures', 
  'equipment',
  'conditions',
  'medications',
  'research',
  'education'
];

export function MediaFolderManager({ isOpen, onClose, onFoldersChange, folders }: MediaFolderManagerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolder, setNewFolder] = useState({
    name: '',
    healthcare_category: 'anatomy',
    description: ''
  });
  const [editFolder, setEditFolder] = useState({
    name: '',
    healthcare_category: 'anatomy',
    description: ''
  });
  const [error, setError] = useState<string | null>(null);
  const logger = new HealthcareAILogger('MediaFolderManager');

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const startCreating = () => {
    setIsCreating(true);
    setNewFolder({ name: '', healthcare_category: 'anatomy', description: '' });
    setError(null);
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewFolder({ name: '', healthcare_category: 'anatomy', description: '' });
    setError(null);
  };

  const startEditing = (folder: MediaFolder) => {
    setEditingFolder(folder.id);
    setEditFolder({
      name: folder.name,
      healthcare_category: folder.healthcare_category,
      description: folder.description || ''
    });
    setError(null);
  };

  const cancelEditing = () => {
    setEditingFolder(null);
    setEditFolder({ name: '', healthcare_category: 'anatomy', description: '' });
    setError(null);
  };

  const validateFolder = (folder: { name: string; healthcare_category: string }) => {
    if (!folder.name.trim()) {
      return 'Folder name is required';
    }
    if (folder.name.length > 50) {
      return 'Folder name must be less than 50 characters';
    }
    if (!HEALTHCARE_CATEGORIES.includes(folder.healthcare_category)) {
      return 'Invalid healthcare category';
    }
    return null;
  };

  const createFolder = () => {
    const validationError = validateFolder(newFolder);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check for duplicate names
    const existingFolder = folders.find(f => 
      f.name.toLowerCase() === newFolder.name.toLowerCase()
    );
    if (existingFolder) {
      setError('A folder with this name already exists');
      return;
    }

    const folder: MediaFolder = {
      id: Math.random().toString(36).substr(2, 9),
      name: newFolder.name.trim(),
      healthcare_category: newFolder.healthcare_category,
      description: newFolder.description.trim(),
      created_by: 'admin', // TODO: Get from auth context
      created_at: new Date().toISOString(),
      media_count: 0
    };

    onFoldersChange([...folders, folder]);
    logger.log('Folder created', { folderId: folder.id, context: 'media_management' });
    cancelCreating();
  };

  const updateFolder = (folderId: string) => {
    const validationError = validateFolder(editFolder);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check for duplicate names (excluding current folder)
    const existingFolder = folders.find(f => 
      f.id !== folderId && f.name.toLowerCase() === editFolder.name.toLowerCase()
    );
    if (existingFolder) {
      setError('A folder with this name already exists');
      return;
    }

    const updatedFolders = folders.map(folder => 
      folder.id === folderId
        ? {
            ...folder,
            name: editFolder.name.trim(),
            healthcare_category: editFolder.healthcare_category,
            description: editFolder.description.trim()
          }
        : folder
    );

    onFoldersChange(updatedFolders);
    logger.log('Folder updated', { folderId, context: 'media_management' });
    cancelEditing();
  };

  const deleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    if (folder.media_count > 0) {
      setError('Cannot delete folder with media files. Move or delete files first.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
      const updatedFolders = folders.filter(f => f.id !== folderId);
      onFoldersChange(updatedFolders);
      logger.log('Folder deleted', { folderId, context: 'media_management' });
    }
  };

  const getCategoryDisplayName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Manage Folders</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Create Folder Button */}
            <div className="mb-6">
              <button
                onClick={startCreating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Folder
              </button>
            </div>

            {/* Create Folder Form */}
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-gray-50 rounded-lg"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Folder</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Folder Name
                    </label>
                    <input
                      type="text"
                      value={newFolder.name}
                      onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter folder name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Healthcare Category
                    </label>
                    <select
                      value={newFolder.healthcare_category}
                      onChange={(e) => setNewFolder({ ...newFolder, healthcare_category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {HEALTHCARE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {getCategoryDisplayName(category)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newFolder.description}
                      onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Enter folder description"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={createFolder}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Create Folder
                    </button>
                    <button
                      onClick={cancelCreating}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Folders List */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Folders</h3>
              {folders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No folders created yet</p>
              ) : (
                folders.map((folder) => (
                  <div key={folder.id} className="border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
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
                        
                        {expandedFolders.has(folder.id) ? (
                          <FolderOpen className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Folder className="h-5 w-5 text-blue-500" />
                        )}
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {editingFolder === folder.id ? (
                              <input
                                type="text"
                                value={editFolder.name}
                                onChange={(e) => setEditFolder({ ...editFolder, name: e.target.value })}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                                autoFocus
                              />
                            ) : (
                              folder.name
                            )}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {folder.media_count} files • {getCategoryDisplayName(folder.healthcare_category)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {editingFolder === folder.id ? (
                          <>
                            <button
                              onClick={() => updateFolder(folder.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Save changes"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-600 hover:text-gray-800"
                              title="Cancel editing"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(folder)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit folder"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteFolder(folder.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete folder"
                              disabled={folder.media_count > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded Folder Details */}
                    {expandedFolders.has(folder.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4 border-t border-gray-100"
                      >
                        <div className="pt-4 space-y-3">
                          {editingFolder === folder.id ? (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Healthcare Category
                                </label>
                                <select
                                  value={editFolder.healthcare_category}
                                  onChange={(e) => setEditFolder({ ...editFolder, healthcare_category: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  {HEALTHCARE_CATEGORIES.map((category) => (
                                    <option key={category} value={category}>
                                      {getCategoryDisplayName(category)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description
                                </label>
                                <textarea
                                  value={editFolder.description}
                                  onChange={(e) => setEditFolder({ ...editFolder, description: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  rows={2}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="text-sm font-medium text-gray-700">Category:</span>
                                <span className="ml-2 text-sm text-gray-600">
                                  {getCategoryDisplayName(folder.healthcare_category)}
                                </span>
                              </div>
                              
                              {folder.description && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Description:</span>
                                  <p className="mt-1 text-sm text-gray-600">{folder.description}</p>
                                </div>
                              )}
                              
                              <div>
                                <span className="text-sm font-medium text-gray-700">Created:</span>
                                <span className="ml-2 text-sm text-gray-600">
                                  {new Date(folder.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
