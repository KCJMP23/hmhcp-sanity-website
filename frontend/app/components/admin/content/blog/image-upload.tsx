'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';
import { imageOptimizationService, ImageOptimizationOptions, HealthcareComplianceCheck } from '@/lib/services/image-optimization-service';

const logger = new HealthcareAILogger('ImageUpload');

interface ImageUploadProps {
  onImageUploaded: (imageData: {
    file: File;
    optimizedImage: any;
    compliance: HealthcareComplianceCheck;
    altText: string;
    caption: string;
  }) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function ImageUpload({ onImageUploaded, onClose, isOpen }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'optimize' | 'compliance' | 'metadata'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [optimizedImage, setOptimizedImage] = useState<any>(null);
  const [compliance, setCompliance] = useState<HealthcareComplianceCheck | null>(null);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [isGeneratingAltText, setIsGeneratingAltText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);
      setCurrentStep('upload');
      
      logger.info('Starting image upload process', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      setUploadedFile(file);
      setUploadProgress(25);
      setCurrentStep('optimize');

      // Optimize image
      const optimizationOptions: ImageOptimizationOptions = {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 85,
        format: 'webp',
        progressive: true,
        stripMetadata: true
      };

      const optimized = await imageOptimizationService.optimizeImage(file, optimizationOptions);
      setOptimizedImage(optimized);
      setUploadProgress(50);
      setCurrentStep('compliance');

      // Check healthcare compliance
      const complianceCheck = await imageOptimizationService.checkHealthcareCompliance(file, altText, caption);
      setCompliance(complianceCheck);
      setUploadProgress(75);
      setCurrentStep('metadata');

      // Generate alt text if not provided
      if (!altText) {
        setIsGeneratingAltText(true);
        const generatedAltText = await imageOptimizationService.generateAltText(file, 'healthcare blog post');
        setAltText(generatedAltText);
        setIsGeneratingAltText(false);
      }

      setUploadProgress(100);
      
      logger.info('Image upload process completed', {
        fileName: file.name,
        optimizedSize: optimized.optimizedSize,
        compressionRatio: optimized.compressionRatio,
        isCompliant: complianceCheck.isCompliant
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      logger.error('Image upload failed', { error: errorMessage });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinish = () => {
    if (uploadedFile && optimizedImage && compliance) {
      onImageUploaded({
        file: uploadedFile,
        optimizedImage,
        compliance,
        altText,
        caption
      });
    }
  };

  const handleRetry = () => {
    setError(null);
    setUploadedFile(null);
    setOptimizedImage(null);
    setCompliance(null);
    setAltText('');
    setCaption('');
    setCurrentStep('upload');
    setUploadProgress(0);
  };

  const getStepIcon = (step: string, currentStep: string) => {
    if (step === currentStep) {
      return (
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    } else if (['upload', 'optimize', 'compliance', 'metadata'].indexOf(step) < ['upload', 'optimize', 'compliance', 'metadata'].indexOf(currentStep)) {
      return (
        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium">
            {['upload', 'optimize', 'compliance', 'metadata'].indexOf(step) + 1}
          </span>
        </div>
      );
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
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upload Featured Image</h2>
            <p className="text-sm text-gray-600">
              Upload and optimize an image for your blog post
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

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[
              { key: 'upload', label: 'Upload' },
              { key: 'optimize', label: 'Optimize' },
              { key: 'compliance', label: 'Compliance' },
              { key: 'metadata', label: 'Metadata' }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                {getStepIcon(step.key, currentStep)}
                <span className={`ml-2 text-sm font-medium ${
                  step.key === currentStep ? 'text-blue-600' : 
                  ['upload', 'optimize', 'compliance', 'metadata'].indexOf(step.key) < ['upload', 'optimize', 'compliance', 'metadata'].indexOf(currentStep) ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < 3 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    ['upload', 'optimize', 'compliance', 'metadata'].indexOf(step.key) < ['upload', 'optimize', 'compliance', 'metadata'].indexOf(currentStep) ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {currentStep === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Upload Area */}
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {isDragging ? 'Drop your image here' : 'Upload an image'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Drag and drop an image file, or click to select
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports JPEG, PNG, WebP, AVIF (max 10MB)
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Choose File
                  </button>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="ml-2 text-sm text-red-700">{error}</p>
                    </div>
                    <button
                      onClick={handleRetry}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 'optimize' && optimizedImage && (
              <motion.div
                key="optimize"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-medium text-gray-900">Image Optimization</h3>
                
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="ml-2 text-sm text-green-700">Image optimized successfully!</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Original</h4>
                    <p className="text-sm text-gray-600">
                      {Math.round(optimizedImage.originalSize / 1024)} KB
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Optimized</h4>
                    <p className="text-sm text-gray-600">
                      {Math.round(optimizedImage.optimizedSize / 1024)} KB
                      <span className="text-green-600 ml-1">
                        ({optimizedImage.compressionRatio}% smaller)
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <img
                    src={optimizedImage.url}
                    alt="Optimized preview"
                    className="max-w-full h-48 object-contain mx-auto rounded-lg border border-gray-200"
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 'compliance' && compliance && (
              <motion.div
                key="compliance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-medium text-gray-900">Healthcare Compliance Check</h3>
                
                <div className={`border rounded-md p-4 ${
                  compliance.isCompliant ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                }`}>
                  <div className="flex items-center">
                    <svg className={`w-5 h-5 ${compliance.isCompliant ? 'text-green-400' : 'text-yellow-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className={`ml-2 text-sm font-medium ${
                      compliance.isCompliant ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {compliance.isCompliant ? 'Compliant with healthcare standards' : 'Review required for compliance'}
                    </p>
                  </div>
                </div>

                {/* Compliance Scores */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{compliance.altTextScore}</div>
                    <div className="text-sm text-gray-600">Alt Text Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{compliance.accessibilityScore}</div>
                    <div className="text-sm text-gray-600">Accessibility</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{compliance.medicalAccuracyScore}</div>
                    <div className="text-sm text-gray-600">Medical Accuracy</div>
                  </div>
                </div>

                {/* Issues and Recommendations */}
                {compliance.issues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-700 mb-2">Issues to Address:</h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      {compliance.issues.map((issue, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 mt-2"></span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {compliance.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-700 mb-2">Recommendations:</h4>
                    <ul className="text-sm text-blue-600 space-y-1">
                      {compliance.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-2"></span>
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 'metadata' && (
              <motion.div
                key="metadata"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-medium text-gray-900">Image Metadata</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alt Text *
                  </label>
                  <div className="flex space-x-2">
                    <textarea
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      rows={3}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the image for accessibility..."
                    />
                    <button
                      onClick={async () => {
                        if (uploadedFile) {
                          setIsGeneratingAltText(true);
                          const generated = await imageOptimizationService.generateAltText(uploadedFile, 'healthcare blog post');
                          setAltText(generated);
                          setIsGeneratingAltText(false);
                        }
                      }}
                      disabled={isGeneratingAltText || !uploadedFile}
                      className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
                    >
                      {isGeneratingAltText ? 'Generating...' : 'Auto-generate'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Alt text is required for accessibility compliance
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption (Optional)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a caption for the image..."
                  />
                </div>

                {optimizedImage && (
                  <div className="text-center">
                    <img
                      src={optimizedImage.url}
                      alt={altText}
                      className="max-w-full h-48 object-contain mx-auto rounded-lg border border-gray-200"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      {optimizedImage.width} × {optimizedImage.height} • {optimizedImage.format.toUpperCase()}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {isUploading && `Step ${['upload', 'optimize', 'compliance', 'metadata'].indexOf(currentStep) + 1} of 4`}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            {currentStep === 'metadata' && (
              <button
                onClick={handleFinish}
                disabled={!altText.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Image
              </button>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </motion.div>
    </motion.div>
  );
}
