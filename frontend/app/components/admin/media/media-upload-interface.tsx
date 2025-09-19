'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  FileImage, 
  FileVideo, 
  FileText,
  File,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { MediaFolder } from '@/types/media';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

interface MediaUploadInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  folders: MediaFolder[];
}

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  preview?: string;
}

const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 20;

export function MediaUploadInterface({ isOpen, onClose, onUploadComplete, folders }: MediaUploadInterfaceProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logger = new HealthcareAILogger('MediaUploadInterface');

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="h-8 w-8 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="h-8 w-8 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <File className="h-8 w-8 text-green-500" />;
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`;
    }

    // Check file type
    const isValidType = Object.values(ALLOWED_FILE_TYPES).flat().includes(file.type);
    if (!isValidType) {
      return 'File type not supported';
    }

    return null;
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve('');
      }
    });
  };

  const handleFileSelect = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Check total file count
    if (uploadFiles.length + fileArray.length > MAX_FILES) {
      logger.error('Too many files selected', new Error('File limit exceeded'), { 
        current: uploadFiles.length, 
        selected: fileArray.length, 
        max: MAX_FILES 
      });
      return;
    }

    const newUploadFiles: UploadFile[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      const preview = await createPreview(file);

      const uploadFile: UploadFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: validationError ? 'error' : 'pending',
        progress: 0,
        error: validationError || undefined,
        preview
      };

      newUploadFiles.push(uploadFile);
    }

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
    logger.log('Files selected for upload', { 
      count: newUploadFiles.length, 
      context: 'media_upload' 
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryUpload = (fileId: string) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'pending', error: undefined, progress: 0 }
        : f
    ));
  };

  const validateHealthcareCompliance = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
    // Simulate healthcare compliance validation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check if it's an image file
        if (file.type.startsWith('image/')) {
          // Simulate medical accuracy validation
          const isValid = Math.random() > 0.05; // 95% pass rate
          resolve({
            isValid,
            error: isValid ? undefined : 'Image does not meet medical accuracy standards'
          });
        } else {
          // Non-image files pass by default
          resolve({ isValid: true });
        }
      }, 1000);
    });
  };

  const simulateUpload = async (file: UploadFile): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        // First, validate healthcare compliance
        const complianceCheck = await validateHealthcareCompliance(file.file);
        if (!complianceCheck.isValid) {
          setUploadFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { 
                  ...f, 
                  status: 'error',
                  error: complianceCheck.error
                }
              : f
          ));
          reject(new Error(complianceCheck.error));
          return;
        }

        // Simulate upload progress
        const duration = Math.random() * 3000 + 1000; // 1-4 seconds
        const interval = 100;
        const steps = duration / interval;
        let currentStep = 0;

        const timer = setInterval(() => {
          currentStep++;
          const progress = Math.min((currentStep / steps) * 100, 100);
          
          setUploadFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, progress }
              : f
          ));

          if (currentStep >= steps) {
            clearInterval(timer);
            
            // Simulate success/failure
            const success = Math.random() > 0.1; // 90% success rate
            
            setUploadFiles(prev => prev.map(f => 
              f.id === file.id 
                ? { 
                    ...f, 
                    status: success ? 'success' : 'error',
                    progress: 100,
                    error: success ? undefined : 'Upload failed'
                  }
                : f
            ));

            if (success) {
              resolve();
            } else {
              reject(new Error('Upload failed'));
            }
          }
        }, interval);
      } catch (error) {
        reject(error);
      }
    });
  };

  const startUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    logger.log('Starting bulk upload', { 
      fileCount: uploadFiles.length, 
      context: 'media_upload' 
    });

    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    
    // Process files in batches of 3 for better performance
    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      batches.push(pendingFiles.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      // Process batch in parallel
      const batchPromises = batch.map(async (file) => {
        setUploadFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'uploading' }
            : f
        ));

        try {
          await simulateUpload(file);
          logger.log('File uploaded successfully', { 
            filename: file.file.name, 
            context: 'media_upload' 
          });
        } catch (error) {
          logger.error('File upload failed', error, { 
            filename: file.file.name, 
            context: 'media_upload' 
          });
        }
      });

      // Wait for all files in this batch to complete
      await Promise.allSettled(batchPromises);
      
      // Small delay between batches to prevent overwhelming the server
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsUploading(false);
    
    // Check if all files are successful
    const allSuccessful = uploadFiles.every(f => f.status === 'success');
    if (allSuccessful) {
      setTimeout(() => {
        onUploadComplete();
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setUploadFiles([]);
    setSelectedFolder('');
    setIsUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Upload Media Files</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Folder Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload to Folder
              </label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a folder (optional)</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name} ({folder.healthcare_category})
                  </option>
                ))}
              </select>
            </div>

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to browse
              </h3>
              <p className="text-gray-600 mb-4">
                Upload images, videos, documents, or audio files up to 10MB each
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={Object.values(ALLOWED_FILE_TYPES).flat().join(',')}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* File List */}
            {uploadFiles.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    Files to Upload ({uploadFiles.length})
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const allPending = uploadFiles.filter(f => f.status === 'pending');
                        setUploadFiles(prev => prev.map(f => 
                          allPending.some(pf => pf.id === f.id) 
                            ? { ...f, status: 'pending' }
                            : f
                        ));
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Reset All
                    </button>
                    <button
                      onClick={() => {
                        const errorFiles = uploadFiles.filter(f => f.status === 'error');
                        errorFiles.forEach(file => retryUpload(file.id));
                      }}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      Retry Failed ({uploadFiles.filter(f => f.status === 'error').length})
                    </button>
                  </div>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {uploadFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center p-3 bg-gray-50 rounded-lg"
                    >
                      {/* File Preview/Icon */}
                      <div className="flex-shrink-0 mr-3">
                        {file.preview ? (
                          <img
                            src={file.preview}
                            alt={file.file.name}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          getFileIcon(file.file.type)
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        
                        {/* Progress Bar */}
                        {file.status === 'uploading' && (
                          <div className="mt-1">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Error Message */}
                        {file.error && (
                          <p className="text-xs text-red-600 mt-1">{file.error}</p>
                        )}
                      </div>

                      {/* Status Icon */}
                      <div className="flex-shrink-0 ml-3">
                        {file.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        {file.status === 'uploading' && (
                          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 ml-3 flex space-x-2">
                        {file.status === 'error' && (
                          <button
                            onClick={() => retryUpload(file.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Retry upload"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={startUpload}
                disabled={uploadFiles.length === 0 || isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : `Upload ${uploadFiles.length} Files`}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
