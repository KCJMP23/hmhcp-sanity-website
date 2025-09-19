'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('FeaturedImageManager');

interface ImageMetadata {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  uploadedAt: string;
  isOptimized: boolean;
  healthcareCompliant: boolean;
  complianceIssues: string[];
}

interface FeaturedImageManagerProps {
  currentImage?: ImageMetadata | null;
  onImageSelect: (image: ImageMetadata) => void;
  onImageRemove: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export function FeaturedImageManager({
  currentImage,
  onImageSelect,
  onImageRemove,
  onClose,
  isOpen
}: FeaturedImageManagerProps) {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByCompliance, setFilterByCompliance] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.info('Fetching featured images');

      // In production, this would fetch from the API
      const mockImages: ImageMetadata[] = [
        {
          id: '1',
          filename: 'medical-team-consultation.jpg',
          originalName: 'medical-team-consultation.jpg',
          url: '/images/blog/medical-team-consultation.jpg',
          alt: 'Medical team discussing patient care in modern hospital setting',
          caption: 'Our medical team collaborating on patient treatment plans',
          width: 1200,
          height: 800,
          size: 245760,
          mimeType: 'image/jpeg',
          uploadedAt: '2025-01-20T10:00:00Z',
          isOptimized: true,
          healthcareCompliant: true,
          complianceIssues: []
        },
        {
          id: '2',
          filename: 'heart-surgery-procedure.jpg',
          originalName: 'heart-surgery-procedure.jpg',
          url: '/images/blog/heart-surgery-procedure.jpg',
          alt: 'Cardiac surgery in progress with medical equipment',
          caption: 'Advanced cardiac surgery procedure using latest technology',
          width: 1600,
          height: 1067,
          size: 512000,
          mimeType: 'image/jpeg',
          uploadedAt: '2025-01-19T14:30:00Z',
          isOptimized: true,
          healthcareCompliant: true,
          complianceIssues: []
        },
        {
          id: '3',
          filename: 'patient-consultation-room.jpg',
          originalName: 'patient-consultation-room.jpg',
          url: '/images/blog/patient-consultation-room.jpg',
          alt: 'Doctor and patient in consultation room',
          caption: 'Comfortable consultation room for patient discussions',
          width: 1000,
          height: 667,
          size: 180000,
          mimeType: 'image/jpeg',
          uploadedAt: '2025-01-18T09:15:00Z',
          isOptimized: true,
          healthcareCompliant: true,
          complianceIssues: []
        },
        {
          id: '4',
          filename: 'medical-research-lab.jpg',
          originalName: 'medical-research-lab.jpg',
          url: '/images/blog/medical-research-lab.jpg',
          alt: 'Medical research laboratory with advanced equipment',
          caption: 'State-of-the-art medical research facility',
          width: 1400,
          height: 933,
          size: 320000,
          mimeType: 'image/jpeg',
          uploadedAt: '2025-01-17T16:45:00Z',
          isOptimized: true,
          healthcareCompliant: true,
          complianceIssues: []
        },
        {
          id: '5',
          filename: 'pediatric-care-unit.jpg',
          originalName: 'pediatric-care-unit.jpg',
          url: '/images/blog/pediatric-care-unit.jpg',
          alt: 'Child-friendly pediatric care unit with colorful design',
          caption: 'Specialized pediatric care unit designed for children',
          width: 1200,
          height: 800,
          size: 280000,
          mimeType: 'image/jpeg',
          uploadedAt: '2025-01-16T11:20:00Z',
          isOptimized: true,
          healthcareCompliant: true,
          complianceIssues: []
        },
        {
          id: '6',
          filename: 'medical-equipment-sterile.jpg',
          originalName: 'medical-equipment-sterile.jpg',
          url: '/images/blog/medical-equipment-sterile.jpg',
          alt: 'Sterile medical equipment in operating room',
          caption: 'Sterilized medical equipment ready for surgical procedures',
          width: 1100,
          height: 733,
          size: 220000,
          mimeType: 'image/jpeg',
          uploadedAt: '2025-01-15T13:10:00Z',
          isOptimized: true,
          healthcareCompliant: true,
          complianceIssues: []
        }
      ];

      setImages(mockImages);
      logger.info('Images fetched successfully', { count: mockImages.length });
    } catch (error) {
      logger.error('Failed to fetch images', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, fetchImages]);

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      logger.warn('Invalid file type uploaded', { fileType: file.type });
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      logger.warn('File too large', { fileSize: file.size });
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      logger.info('Starting image upload', { fileName: file.name, fileSize: file.size });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // In production, this would upload to a cloud storage service
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create image metadata
      const newImage: ImageMetadata = {
        id: Date.now().toString(),
        filename: file.name,
        originalName: file.name,
        url: URL.createObjectURL(file),
        alt: '',
        caption: '',
        width: 0, // Would be calculated from actual image
        height: 0, // Would be calculated from actual image
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        isOptimized: false,
        healthcareCompliant: false,
        complianceIssues: ['Needs compliance review']
      };

      setImages(prev => [newImage, ...prev]);
      setUploadProgress(100);
      
      clearInterval(progressInterval);
      logger.info('Image uploaded successfully', { imageId: newImage.id });
    } catch (error) {
      logger.error('Image upload failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageSelect = (image: ImageMetadata) => {
    setSelectedImage(image);
    onImageSelect(image);
    logger.info('Image selected', { imageId: image.id, imageName: image.filename });
  };

  const handleImageRemove = () => {
    onImageRemove();
    setSelectedImage(null);
    logger.info('Image removed');
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = image.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         image.alt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompliance = !filterByCompliance || image.healthcareCompliant;
    return matchesSearch && matchesCompliance;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getComplianceStatus = (image: ImageMetadata) => {
    if (image.healthcareCompliant) {
      return { label: 'Compliant', color: 'text-green-600', bg: 'bg-green-100' };
    }
    return { label: 'Review Needed', color: 'text-yellow-600', bg: 'bg-yellow-100' };
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
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Featured Image Manager</h2>
            <p className="text-sm text-gray-600">
              Select or upload a featured image for your blog post
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

        {/* Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search images..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filterByCompliance}
                  onChange={(e) => setFilterByCompliance(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Compliant Only</span>
              </label>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading images...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredImages.map((image) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                    selectedImage?.id === image.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleImageSelect(image)}
                >
                  {/* Image */}
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-t-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-t-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-white rounded-full p-2">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {image.filename}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {image.width} × {image.height} • {formatFileSize(image.size)}
                    </p>
                    
                    {/* Compliance Status */}
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getComplianceStatus(image).bg} ${getComplianceStatus(image).color}`}>
                        {getComplianceStatus(image).label}
                      </span>
                    </div>

                    {/* Alt Text */}
                    {image.alt && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        Alt: {image.alt}
                      </p>
                    )}
                  </div>

                  {/* Selected Indicator */}
                  {selectedImage?.id === image.id && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-blue-600 text-white rounded-full p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredImages.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try a different search term' : 'Upload your first image to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            {currentImage && (
              <div className="flex items-center space-x-2">
                <img
                  src={currentImage.url}
                  alt={currentImage.alt}
                  className="w-12 h-12 object-cover rounded"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{currentImage.filename}</p>
                  <p className="text-xs text-gray-500">Currently selected</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            {currentImage && (
              <button
                onClick={handleImageRemove}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200"
              >
                Remove Image
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {currentImage ? 'Done' : 'Cancel'}
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
          className="hidden"
        />
      </motion.div>
    </motion.div>
  );
}
