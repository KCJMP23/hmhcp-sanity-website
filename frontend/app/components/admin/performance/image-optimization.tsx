'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, 
  Download, 
  Upload, 
  Settings, 
  BarChart3, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Eye,
  FileImage,
  HardDrive,
  Network,
  Monitor,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppleButton } from '@/components/ui/apple-button';

interface ImageStats {
  totalImages: number;
  optimizedImages: number;
  pendingOptimization: number;
  totalSize: string;
  optimizedSize: string;
  spaceSaved: string;
  savingsPercentage: number;
  avgOptimizationTime: number;
  lastOptimization: Date;
}

interface ImageItem {
  id: string;
  name: string;
  originalSize: string;
  optimizedSize: string;
  savings: string;
  savingsPercentage: number;
  status: 'pending' | 'optimizing' | 'completed' | 'failed';
  format: 'JPEG' | 'PNG' | 'WebP' | 'AVIF';
  dimensions: string;
  quality: number;
  lastModified: Date;
}

export default function ImageOptimization() {
  const [imageStats, setImageStats] = useState<ImageStats>({
    totalImages: 0,
    optimizedImages: 0,
    pendingOptimization: 0,
    totalSize: '0 MB',
    optimizedSize: '0 MB',
    spaceSaved: '0 MB',
    savingsPercentage: 0,
    avgOptimizationTime: 0,
    lastOptimization: new Date()
  });

  const [images, setImages] = useState<ImageItem[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  // Mock data for demonstration
  useEffect(() => {
    const mockStats: ImageStats = {
      totalImages: 1247,
      optimizedImages: 892,
      pendingOptimization: 355,
      totalSize: '2.4 GB',
      optimizedSize: '1.1 GB',
      spaceSaved: '1.3 GB',
      savingsPercentage: 54.2,
      avgOptimizationTime: 2.3,
      lastOptimization: new Date(Date.now() - 3600000) // 1 hour ago
    };

    const mockImages: ImageItem[] = [
      {
        id: '1',
        name: 'hero-banner-healthcare.jpg',
        originalSize: '2.8 MB',
        optimizedSize: '1.2 MB',
        savings: '1.6 MB',
        savingsPercentage: 57.1,
        status: 'completed',
        format: 'JPEG',
        dimensions: '1920x1080',
        quality: 85,
        lastModified: new Date(Date.now() - 86400000)
      },
      {
        id: '2',
        name: 'doctor-portrait.png',
        originalSize: '1.5 MB',
        optimizedSize: '0.8 MB',
        savings: '0.7 MB',
        savingsPercentage: 46.7,
        status: 'completed',
        format: 'PNG',
        dimensions: '800x600',
        quality: 90,
        lastModified: new Date(Date.now() - 172800000)
      },
      {
        id: '3',
        name: 'medical-equipment.webp',
        originalSize: '3.2 MB',
        optimizedSize: '1.8 MB',
        savings: '1.4 MB',
        savingsPercentage: 43.8,
        status: 'completed',
        format: 'WebP',
        dimensions: '1600x1200',
        quality: 80,
        lastModified: new Date(Date.now() - 259200000)
      },
      {
        id: '4',
        name: 'patient-care-team.jpg',
        originalSize: '4.1 MB',
        optimizedSize: '0 MB',
        savings: '0 MB',
        savingsPercentage: 0,
        status: 'pending',
        format: 'JPEG',
        dimensions: '2400x1600',
        quality: 0,
        lastModified: new Date(Date.now() - 432000000)
      },
      {
        id: '5',
        name: 'healthcare-facility.png',
        originalSize: '2.9 MB',
        optimizedSize: '0 MB',
        savings: '0 MB',
        savingsPercentage: 0,
        status: 'pending',
        format: 'PNG',
        dimensions: '1800x1200',
        quality: 0,
        lastModified: new Date(Date.now() - 518400000)
      }
    ];

    setImageStats(mockStats);
    setImages(mockImages);
  }, []);

  const getStatusBadge = (status: ImageItem['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Optimized</Badge>;
      case 'optimizing':
        return <Badge variant="secondary">Optimizing</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFormatIcon = (format: ImageItem['format']) => {
    switch (format) {
      case 'JPEG':
        return <FileImage className="h-4 w-4 text-blue-600" />;
      case 'PNG':
        return <FileImage className="h-4 w-4 text-green-600" />;
      case 'WebP':
        return <FileImage className="h-4 w-4 text-purple-600" />;
      case 'AVIF':
        return <FileImage className="h-4 w-4 text-orange-600" />;
      default:
        return <FileImage className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSavingsColor = (percentage: number) => {
    if (percentage >= 50) return 'text-green-600';
    if (percentage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const startOptimization = async () => {
    setIsOptimizing(true);
    
    // Simulate optimization process
    const pendingImages = images.filter(img => img.status === 'pending');
    
    for (let i = 0; i < pendingImages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setImages(prev => prev.map(img => 
        img.status === 'pending' 
          ? { ...img, status: 'optimizing' as const }
          : img
      ));
    }

    // Complete optimization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setImages(prev => prev.map(img => 
      img.status === 'optimizing' 
        ? { 
            ...img, 
            status: 'completed' as const,
            optimizedSize: `${(parseFloat(img.originalSize) * 0.6).toFixed(1)} MB`,
            savings: `${(parseFloat(img.originalSize) * 0.4).toFixed(1)} MB`,
            savingsPercentage: 40 + Math.random() * 20
          }
        : img
    ));

    setIsOptimizing(false);
    
    // Update stats
    setImageStats(prev => ({
      ...prev,
      optimizedImages: prev.optimizedImages + pendingImages.length,
      pendingOptimization: 0
    }));
  };

  const filteredImages = selectedFormat === 'all' 
    ? images 
    : images.filter(img => img.format === selectedFormat);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center"
      >
        <div>
          <Typography variant="display" className="text-gray-900">Image Optimization</Typography>
          <Typography variant="body" className="text-gray-600">
            Optimize images for better performance and faster loading
          </Typography>
        </div>
        <div className="flex space-x-3">
          <AppleButton variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Images
          </AppleButton>
          <AppleButton 
            onClick={startOptimization}
            disabled={isOptimizing || imageStats.pendingOptimization === 0}
          >
            {isOptimizing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {isOptimizing ? 'Optimizing...' : 'Start Optimization'}
          </AppleButton>
        </div>
      </motion.div>

      {/* Statistics Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Image className="h-8 w-8 text-blue-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {imageStats.totalImages}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Images</Typography>
            <Progress value={100} className="h-2" />
            <Typography variant="small" className="text-blue-600 mt-2">
              All images tracked
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {imageStats.optimizedImages}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Optimized Images</Typography>
            <Progress value={(imageStats.optimizedImages / imageStats.totalImages) * 100} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              {((imageStats.optimizedImages / imageStats.totalImages) * 100).toFixed(1)}% complete
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <HardDrive className="h-8 w-8 text-purple-600" />
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {imageStats.spaceSaved}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Space Saved</Typography>
            <Progress value={imageStats.savingsPercentage} className="h-2" />
            <Typography variant="small" className="text-purple-600 mt-2">
              {imageStats.savingsPercentage.toFixed(1)}% reduction
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-orange-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {imageStats.avgOptimizationTime}s
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Avg Time</Typography>
            <Progress value={75} className="h-2" />
            <Typography variant="small" className="text-orange-600 mt-2">
              Per image optimization
            </Typography>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Optimization Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Optimization Progress
        </Typography>
        <FrostedCard>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Typography variant="heading4" className="text-gray-900 mb-2">
                  Original Size
                </Typography>
                <Typography variant="display" className="text-2xl font-light text-gray-700">
                  {imageStats.totalSize}
                </Typography>
                <Typography variant="small" className="text-gray-500">
                  Total uncompressed size
                </Typography>
              </div>
              
              <div className="text-center">
                <Typography variant="heading4" className="text-gray-900 mb-2">
                  Optimized Size
                </Typography>
                <Typography variant="display" className="text-2xl font-light text-green-600">
                  {imageStats.optimizedSize}
                </Typography>
                <Typography variant="small" className="text-gray-500">
                  After compression
                </Typography>
              </div>
              
              <div className="text-center">
                <Typography variant="heading4" className="text-gray-900 mb-2">
                  Space Saved
                </Typography>
                <Typography variant="display" className="text-2xl font-light text-purple-600">
                  {imageStats.spaceSaved}
                </Typography>
                <Typography variant="small" className="text-gray-500">
                  {imageStats.savingsPercentage.toFixed(1)}% reduction
                </Typography>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <Typography variant="label" className="text-gray-700">
                  Overall Progress
                </Typography>
                <Typography variant="small" className="text-gray-500">
                  {((imageStats.optimizedImages / imageStats.totalImages) * 100).toFixed(1)}%
                </Typography>
              </div>
              <Progress 
                value={(imageStats.optimizedImages / imageStats.totalImages) * 100} 
                className="h-3" 
              />
            </div>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Image List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <Typography variant="heading2" className="text-gray-900">
            Image Library
          </Typography>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Formats</option>
              <option value="JPEG">JPEG</option>
              <option value="PNG">PNG</option>
              <option value="WebP">WebP</option>
              <option value="AVIF">AVIF</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <FrostedCard className="hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                        {getFormatIcon(image.format)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <Typography variant="heading4" className="text-gray-900 mb-1">
                          {image.name}
                        </Typography>
                        <div className="flex items-center space-x-4 mb-2">
                          {getStatusBadge(image.status)}
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            {getFormatIcon(image.format)}
                            <span>{image.format}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {image.dimensions}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Original: </span>
                            <span className="font-medium">{image.originalSize}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Optimized: </span>
                            <span className="font-medium">{image.optimizedSize}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Savings: </span>
                            <span className={`font-medium ${getSavingsColor(image.savingsPercentage)}`}>
                              {image.savings} ({image.savingsPercentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <AppleButton variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </AppleButton>
                      
                      {image.status === 'completed' && (
                        <AppleButton variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </AppleButton>
                      )}
                      
                      <AppleButton variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </AppleButton>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200/50">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Last modified: {formatDate(image.lastModified)}</span>
                      {image.status === 'completed' && (
                        <span>Quality: {image.quality}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </FrostedCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Quick Actions
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Upload className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Batch Upload
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Upload multiple images for bulk optimization
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <BarChart3 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Performance Report
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                View detailed optimization analytics
              </Typography>
              <AppleButton variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Report
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Settings className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Optimization Settings
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Configure compression and quality settings
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </AppleButton>
            </div>
          </FrostedCard>
        </div>
      </motion.div>
    </div>
  );
}
