'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  BarChart3, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Download,
  RefreshCw,
  Settings,
  FileText,
  Code,
  Zap,
  Clock,
  HardDrive,
  Network,
  Monitor,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppleButton } from '@/components/ui/apple-button';

interface BundleStats {
  totalSize: string;
  gzippedSize: string;
  brotliSize: string;
  savingsPercentage: number;
  totalChunks: number;
  totalModules: number;
  buildTime: number;
  lastBuild: Date;
}

interface BundleChunk {
  id: string;
  name: string;
  size: string;
  gzippedSize: string;
  brotliSize: string;
  savings: string;
  savingsPercentage: number;
  modules: number;
  dependencies: number;
  status: 'optimized' | 'warning' | 'critical';
  recommendations: string[];
}

interface ModuleAnalysis {
  name: string;
  size: string;
  percentage: number;
  type: 'vendor' | 'app' | 'shared' | 'runtime';
  duplicates: number;
  treeShaking: boolean;
}

export default function BundleAnalysis() {
  const [bundleStats, setBundleStats] = useState<BundleStats>({
    totalSize: '0 MB',
    gzippedSize: '0 MB',
    brotliSize: '0 MB',
    savingsPercentage: 0,
    totalChunks: 0,
    totalModules: 0,
    buildTime: 0,
    lastBuild: new Date()
  });

  const [chunks, setChunks] = useState<BundleChunk[]>([]);
  const [modules, setModules] = useState<ModuleAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedView, setSelectedView] = useState<'chunks' | 'modules' | 'trends'>('chunks');

  // Mock data for demonstration
  useEffect(() => {
    const mockStats: BundleStats = {
      totalSize: '2.8 MB',
      gzippedSize: '1.1 MB',
      brotliSize: '0.9 MB',
      savingsPercentage: 67.9,
      totalChunks: 12,
      totalModules: 847,
      buildTime: 45.2,
      lastBuild: new Date(Date.now() - 1800000) // 30 minutes ago
    };

    const mockChunks: BundleChunk[] = [
      {
        id: '1',
        name: 'main.js',
        size: '1.2 MB',
        gzippedSize: '450 KB',
        brotliSize: '380 KB',
        savings: '820 KB',
        savingsPercentage: 68.3,
        modules: 156,
        dependencies: 23,
        status: 'optimized',
        recommendations: ['Consider code splitting for large modules', 'Tree-shaking is working well']
      },
      {
        id: '2',
        name: 'vendor.js',
        size: '980 KB',
        gzippedSize: '380 KB',
        brotliSize: '320 KB',
        savings: '660 KB',
        savingsPercentage: 67.3,
        modules: 234,
        dependencies: 45,
        status: 'warning',
        recommendations: ['Some dependencies could be lazy loaded', 'Consider using dynamic imports']
      },
      {
        id: '3',
        name: 'admin.js',
        size: '420 KB',
        gzippedSize: '180 KB',
        brotliSize: '150 KB',
        savings: '270 KB',
        savingsPercentage: 64.3,
        modules: 89,
        dependencies: 12,
        status: 'optimized',
        recommendations: ['Good chunk separation', 'Efficient module bundling']
      },
      {
        id: '4',
        name: 'analytics.js',
        size: '180 KB',
        gzippedSize: '75 KB',
        brotliSize: '65 KB',
        savings: '115 KB',
        savingsPercentage: 63.9,
        modules: 34,
        dependencies: 8,
        status: 'optimized',
        recommendations: ['Analytics properly separated', 'Good compression ratio']
      }
    ];

    const mockModules: ModuleAnalysis[] = [
      { name: 'react', size: '120 KB', percentage: 4.3, type: 'vendor', duplicates: 0, treeShaking: true },
      { name: 'lodash', size: '85 KB', percentage: 3.0, type: 'vendor', duplicates: 0, treeShaking: true },
      { name: 'framer-motion', size: '95 KB', percentage: 3.4, type: 'vendor', duplicates: 0, treeShaking: true },
      { name: 'lucide-react', size: '45 KB', percentage: 1.6, type: 'vendor', duplicates: 0, treeShaking: true },
      { name: 'components/ui', size: '180 KB', percentage: 6.4, type: 'shared', duplicates: 0, treeShaking: true },
      { name: 'hooks', size: '75 KB', percentage: 2.7, type: 'app', duplicates: 0, treeShaking: true },
      { name: 'utils', size: '55 KB', percentage: 2.0, type: 'app', duplicates: 0, treeShaking: true }
    ];

    setBundleStats(mockStats);
    setChunks(mockChunks);
    setModules(mockModules);
  }, []);

  const getStatusBadge = (status: BundleChunk['status']) => {
    switch (status) {
      case 'optimized':
        return <Badge variant="default">Optimized</Badge>;
      case 'warning':
        return <Badge variant="secondary">Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: BundleChunk['status']) => {
    switch (status) {
      case 'optimized':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: ModuleAnalysis['type']) => {
    switch (type) {
      case 'vendor':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'app':
        return <Code className="h-4 w-4 text-green-600" />;
      case 'shared':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'runtime':
        return <Zap className="h-4 w-4 text-orange-600" />;
      default:
        return <Code className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: ModuleAnalysis['type']) => {
    switch (type) {
      case 'vendor':
        return 'text-blue-600';
      case 'app':
        return 'text-green-600';
      case 'shared':
        return 'text-purple-600';
      case 'runtime':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsAnalyzing(false);
    
    // Update last build time
    setBundleStats(prev => ({
      ...prev,
      lastBuild: new Date(),
      buildTime: Math.random() * 20 + 35 // Random build time between 35-55s
    }));
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getSizeColor = (size: string) => {
    const sizeInMB = parseFloat(size.replace(' MB', ''));
    if (sizeInMB > 1) return 'text-red-600';
    if (sizeInMB > 0.5) return 'text-yellow-600';
    return 'text-green-600';
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
          <Typography variant="display" className="text-gray-900">Bundle Analysis</Typography>
          <Typography variant="body" className="text-gray-600">
            Analyze and optimize your JavaScript bundle for better performance
          </Typography>
        </div>
        <div className="flex space-x-3">
          <AppleButton variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </AppleButton>
          <AppleButton 
            onClick={startAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Bundle'}
          </AppleButton>
        </div>
      </motion.div>

      {/* Bundle Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Package className="h-8 w-8 text-blue-600" />
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className={`text-3xl font-light mb-2 ${getSizeColor(bundleStats.totalSize)}`}>
              {bundleStats.totalSize}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Bundle Size</Typography>
            <Progress value={100} className="h-2" />
            <Typography variant="small" className="text-blue-600 mt-2">
              Uncompressed size
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Network className="h-8 w-8 text-green-600" />
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {bundleStats.gzippedSize}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Gzipped Size</Typography>
            <Progress value={75} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              With gzip compression
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Zap className="h-8 w-8 text-purple-600" />
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {bundleStats.brotliSize}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Brotli Size</Typography>
            <Progress value={85} className="h-2" />
            <Typography variant="small" className="text-purple-600 mt-2">
              With Brotli compression
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingDown className="h-8 w-8 text-orange-600" />
              <ArrowDown className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {bundleStats.savingsPercentage.toFixed(1)}%
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Size Reduction</Typography>
            <Progress value={bundleStats.savingsPercentage} className="h-2" />
            <Typography variant="small" className="text-orange-600 mt-2">
              Compression savings
            </Typography>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Bundle Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Bundle Overview
        </Typography>
        <FrostedCard>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Typography variant="heading4" className="text-gray-900 mb-2">
                  Build Time
                </Typography>
                <Typography variant="display" className="text-2xl font-light text-gray-700">
                  {bundleStats.buildTime}s
                </Typography>
                <Typography variant="small" className="text-gray-500">
                  Last build duration
                </Typography>
              </div>
              
              <div className="text-center">
                <Typography variant="heading4" className="text-gray-900 mb-2">
                  Total Chunks
                </Typography>
                <Typography variant="display" className="text-2xl font-light text-gray-700">
                  {bundleStats.totalChunks}
                </Typography>
                <Typography variant="small" className="text-gray-500">
                  JavaScript chunks
                </Typography>
              </div>
              
              <div className="text-center">
                <Typography variant="heading4" className="text-gray-900 mb-2">
                  Total Modules
                </Typography>
                <Typography variant="display" className="text-2xl font-light text-gray-700">
                  {bundleStats.totalModules}
                </Typography>
                <Typography variant="small" className="text-gray-500">
                  Individual modules
                </Typography>
              </div>
              
              <div className="text-center">
                <Typography variant="heading4" className="text-gray-900 mb-2">
                  Last Build
                </Typography>
                <Typography variant="display" className="text-2xl font-light text-gray-700">
                  {formatDate(bundleStats.lastBuild)}
                </Typography>
                <Typography variant="small" className="text-gray-500">
                  Build timestamp
                </Typography>
              </div>
            </div>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex space-x-1 p-1 bg-gray-100 rounded-2xl">
          {[
            { id: 'chunks', name: 'Chunks', icon: <Package className="h-4 w-4" /> },
            { id: 'modules', name: 'Modules', icon: <Code className="h-4 w-4" /> },
            { id: 'trends', name: 'Trends', icon: <TrendingUp className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                selectedView === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={selectedView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {selectedView === 'chunks' && (
          <div className="space-y-4">
            <Typography variant="heading3" className="text-gray-900 mb-4">
              Bundle Chunks Analysis
            </Typography>
            
            {chunks.map((chunk, index) => (
              <motion.div
                key={chunk.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <FrostedCard className="hover:shadow-lg transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(chunk.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <Typography variant="heading4" className="text-gray-900">
                              {chunk.name}
                            </Typography>
                            {getStatusBadge(chunk.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <span className="text-sm text-gray-500">Original: </span>
                              <span className="font-medium">{chunk.size}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Gzipped: </span>
                              <span className="font-medium">{chunk.gzippedSize}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Brotli: </span>
                              <span className="font-medium">{chunk.brotliSize}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Savings: </span>
                              <span className="font-medium text-green-600">
                                {chunk.savings} ({chunk.savingsPercentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Modules: {chunk.modules}</span>
                            <span>Dependencies: {chunk.dependencies}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recommendations */}
                    <div className="mt-4 pt-4 border-t border-gray-200/50">
                      <Typography variant="label" className="text-gray-700 mb-2">
                        Recommendations:
                      </Typography>
                      <div className="space-y-1">
                        {chunk.recommendations.map((rec, recIndex) => (
                          <div key={recIndex} className="flex items-start space-x-2">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <Typography variant="small" className="text-gray-600">
                              {rec}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </FrostedCard>
              </motion.div>
            ))}
          </div>
        )}

        {selectedView === 'modules' && (
          <div className="space-y-4">
            <Typography variant="heading3" className="text-gray-900 mb-4">
              Module Analysis
            </Typography>
            
            <div className="space-y-3">
              {modules.map((module, index) => (
                <motion.div
                  key={module.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <FrostedCard className="hover:shadow-md transition-all duration-200">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gray-100 ${getTypeColor(module.type)}`}>
                            {getTypeIcon(module.type)}
                          </div>
                          
                          <div>
                            <Typography variant="label" className="text-gray-900">
                              {module.name}
                            </Typography>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 ${getTypeColor(module.type)}`}>
                                {module.type}
                              </span>
                              <span>{module.size}</span>
                              <span>({module.percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Duplicates: {module.duplicates}</span>
                          <span className={`flex items-center space-x-1 ${module.treeShaking ? 'text-green-600' : 'text-red-600'}`}>
                            {module.treeShaking ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            <span>Tree-shaking</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </FrostedCard>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {selectedView === 'trends' && (
          <div className="space-y-4">
            <Typography variant="heading3" className="text-gray-900 mb-4">
              Bundle Size Trends
            </Typography>
            
            <FrostedCard>
              <div className="p-6">
                <div className="text-center">
                  <Typography variant="heading4" className="text-gray-900 mb-4">
                    Bundle Size Over Time
                  </Typography>
                  <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                      <Typography variant="body" className="text-gray-500">
                        Chart visualization would be implemented here
                      </Typography>
                      <Typography variant="small" className="text-gray-400">
                        Showing bundle size trends over the last 30 days
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </FrostedCard>
          </div>
        )}
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
              <Zap className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Optimize Bundle
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Apply automatic optimizations and code splitting
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Optimize
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Settings className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Build Settings
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Configure webpack and build optimization options
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Download className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Export Report
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Generate detailed bundle analysis report
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </AppleButton>
            </div>
          </FrostedCard>
        </div>
      </motion.div>
    </div>
  );
}
