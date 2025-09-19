'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Zap,
  FileImage,
  Clock,
  TrendingDown
} from 'lucide-react';
import { MediaFile } from '@/types/media';
import { ImageOptimizer, ImageOptimizationSettings, OptimizedImageResult } from '@/lib/admin/media/image-optimizer';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

interface ImageOptimizationInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  mediaFiles: MediaFile[];
  onOptimizationComplete: (results: OptimizedImageResult[]) => void;
}

export function ImageOptimizationInterface({ 
  isOpen, 
  onClose, 
  mediaFiles, 
  onOptimizationComplete 
}: ImageOptimizationInterfaceProps) {
  const [settings, setSettings] = useState<ImageOptimizationSettings>({
    quality: 85,
    maxWidth: 2048,
    maxHeight: 2048,
    formats: ['webp', 'avif', 'jpeg'],
    compressionLevel: 6,
    generateThumbnails: true,
    thumbnailSizes: [150, 300, 600, 1200]
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizedImageResult[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const optimizer = new ImageOptimizer();
  const logger = new HealthcareAILogger('ImageOptimizationInterface');

  const handleOptimize = async () => {
    if (mediaFiles.length === 0) return;

    setIsOptimizing(true);
    setProgress(0);
    setOptimizationResults([]);
    logger.log('Starting image optimization', { 
      fileCount: mediaFiles.length, 
      context: 'image_optimization' 
    });

    try {
      // Convert MediaFile objects to File objects for optimization
      const imageFiles: File[] = [];
      
      for (const mediaFile of mediaFiles) {
        if (mediaFile.file_type === 'image') {
          try {
            // In a real implementation, you would fetch the actual file
            // For now, we'll create a mock file
            const response = await fetch(mediaFile.url);
            const blob = await response.blob();
            const file = new File([blob], mediaFile.filename, { type: mediaFile.mime_type });
            imageFiles.push(file);
          } catch (error) {
            logger.warn('Failed to load image file', { 
              fileId: mediaFile.id, 
              error: error instanceof Error ? error.message : 'Unknown error',
              context: 'image_optimization' 
            });
          }
        }
      }

      if (imageFiles.length === 0) {
        logger.warn('No valid image files found for optimization', { context: 'image_optimization' });
        setIsOptimizing(false);
        return;
      }

      // Optimize images
      const results = await optimizer.batchOptimizeImages(imageFiles, settings);
      
      setOptimizationResults(results);
      onOptimizationComplete(results);
      
      logger.log('Image optimization completed', { 
        fileCount: imageFiles.length,
        resultsCount: results.length,
        context: 'image_optimization' 
      });
    } catch (error) {
      logger.error('Image optimization failed', error, { context: 'image_optimization' });
    } finally {
      setIsOptimizing(false);
      setCurrentFile(null);
    }
  };

  const handleDownloadOptimized = (result: OptimizedImageResult) => {
    const link = document.createElement('a');
    link.href = result.optimized.url;
    link.download = `optimized_${result.original.url.split('/').pop()}`;
    link.click();
  };

  const handleDownloadAll = () => {
    optimizationResults.forEach((result, index) => {
      setTimeout(() => {
        handleDownloadOptimized(result);
      }, index * 500); // Stagger downloads
    });
  };

  const getTotalSavings = (): { size: number; percentage: number } => {
    const totalOriginal = optimizationResults.reduce((sum, result) => sum + result.original.size, 0);
    const totalOptimized = optimizationResults.reduce((sum, result) => sum + result.optimized.size, 0);
    const savings = totalOriginal - totalOptimized;
    const percentage = Math.round((savings / totalOriginal) * 100);
    
    return { size: savings, percentage };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">Image Optimization</h2>
              <span className="text-sm text-gray-500">
                {mediaFiles.filter(f => f.file_type === 'image').length} images selected
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex h-[calc(95vh-80px)]">
            {/* Settings Panel */}
            {showSettings && (
              <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Optimization Settings</h3>
                
                <div className="space-y-6">
                  {/* Quality */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality: {settings.quality}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.quality}
                      onChange={(e) => setSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Higher quality = larger file size
                    </p>
                  </div>

                  {/* Max Dimensions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Width: {settings.maxWidth}px
                    </label>
                    <input
                      type="range"
                      min="800"
                      max="4096"
                      step="100"
                      value={settings.maxWidth}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxWidth: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Height: {settings.maxHeight}px
                    </label>
                    <input
                      type="range"
                      min="600"
                      max="4096"
                      step="100"
                      value={settings.maxHeight}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxHeight: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  {/* Formats */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Output Formats
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'webp', label: 'WebP (Modern)' },
                        { value: 'avif', label: 'AVIF (Next-gen)' },
                        { value: 'jpeg', label: 'JPEG (Compatible)' },
                        { value: 'png', label: 'PNG (Lossless)' }
                      ].map((format) => (
                        <label key={format.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.formats.includes(format.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSettings(prev => ({
                                  ...prev,
                                  formats: [...prev.formats, format.value]
                                }));
                              } else {
                                setSettings(prev => ({
                                  ...prev,
                                  formats: prev.formats.filter(f => f !== format.value)
                                }));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{format.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnails */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.generateThumbnails}
                        onChange={(e) => setSettings(prev => ({ ...prev, generateThumbnails: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Generate Thumbnails</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {optimizationResults.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to Optimize Images
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Optimize your healthcare images for better performance and compliance.
                  </p>
                  <button
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isOptimizing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    {isOptimizing ? 'Optimizing...' : 'Start Optimization'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {optimizationResults.length}
                        </div>
                        <div className="text-sm text-gray-500">Images Optimized</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatFileSize(getTotalSavings().size)}
                        </div>
                        <div className="text-sm text-gray-500">Size Saved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {getTotalSavings().percentage}%
                        </div>
                        <div className="text-sm text-gray-500">Compression</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {optimizationResults.reduce((sum, result) => sum + result.thumbnails.length, 0)}
                        </div>
                        <div className="text-sm text-gray-500">Thumbnails</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={handleDownloadAll}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download All Optimized
                      </button>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="space-y-4">
                    {optimizationResults.map((result, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <FileImage className="h-8 w-8 text-blue-500" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {result.original.url.split('/').pop()}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {result.original.width} × {result.original.height}px
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {formatFileSize(result.original.size)} → {formatFileSize(result.optimized.size)}
                              </div>
                              <div className="text-xs text-green-600">
                                {result.optimized.compressionRatio}% smaller
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {result.metadata.healthcareCompliant ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              )}
                              <span className="text-xs text-gray-500">
                                {result.metadata.optimizationLevel}
                              </span>
                            </div>
                            
                            <button
                              onClick={() => handleDownloadOptimized(result)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Thumbnails */}
                        {result.thumbnails.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-700 mb-2">Generated Thumbnails:</p>
                            <div className="flex space-x-2">
                              {result.thumbnails.map((thumb, thumbIndex) => (
                                <div key={thumbIndex} className="text-center">
                                  <img
                                    src={thumb.url}
                                    alt={`Thumbnail ${thumb.width}x${thumb.height}`}
                                    className="w-16 h-16 object-cover rounded border border-gray-200"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    {thumb.width}×{thumb.height}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
