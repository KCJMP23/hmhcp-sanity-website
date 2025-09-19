'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';
import { MediaFile } from '@/types/media';
import { MediaUsage } from '@/types/media';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

interface UsageTrackingDashboardProps {
  mediaFiles: MediaFile[];
  onRefresh: () => void;
}

interface UsageAnalytics {
  totalFiles: number;
  usedFiles: number;
  unusedFiles: number;
  brokenLinks: number;
  mostUsedFiles: MediaFile[];
  recentlyUsedFiles: MediaFile[];
  usageByContentType: Record<string, number>;
  orphanedFiles: MediaFile[];
}

export function UsageTrackingDashboard({ mediaFiles, onRefresh }: UsageTrackingDashboardProps) {
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [usageData, setUsageData] = useState<MediaUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'used' | 'unused' | 'broken' | 'orphaned'>('all');
  const logger = new HealthcareAILogger('UsageTrackingDashboard');

  useEffect(() => {
    loadUsageData();
  }, [mediaFiles]);

  const loadUsageData = async () => {
    try {
      setIsLoading(true);
      logger.log('Loading usage tracking data', { context: 'usage_tracking' });

      // Simulate usage data loading
      const mockUsageData: MediaUsage[] = [
        {
          id: '1',
          media_file_id: '1',
          content_type: 'blog_post',
          content_id: 'blog-1',
          content_title: 'Cardiology Best Practices',
          usage_context: 'Featured image in article header',
          created_at: '2025-01-27T10:00:00Z',
          updated_at: '2025-01-27T10:00:00Z'
        },
        {
          id: '2',
          media_file_id: '1',
          content_type: 'page',
          content_id: 'services-cardiology',
          content_title: 'Cardiology Services',
          usage_context: 'Service illustration in hero section',
          created_at: '2025-01-26T15:30:00Z',
          updated_at: '2025-01-26T15:30:00Z'
        },
        {
          id: '3',
          media_file_id: '2',
          content_type: 'blog_post',
          content_id: 'blog-2',
          content_title: 'Surgical Procedures Guide',
          usage_context: 'Step-by-step procedure illustration',
          created_at: '2025-01-25T14:20:00Z',
          updated_at: '2025-01-25T14:20:00Z'
        }
      ];

      setUsageData(mockUsageData);

      // Calculate analytics
      const analyticsData = calculateAnalytics(mediaFiles, mockUsageData);
      setAnalytics(analyticsData);

      logger.log('Usage data loaded successfully', { 
        fileCount: mediaFiles.length,
        usageCount: mockUsageData.length,
        context: 'usage_tracking'
      });
    } catch (error) {
      logger.error('Failed to load usage data', error, { context: 'usage_tracking' });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnalytics = (files: MediaFile[], usage: MediaUsage[]): UsageAnalytics => {
    const usedFileIds = new Set(usage.map(u => u.media_file_id));
    const usedFiles = files.filter(f => usedFileIds.has(f.id));
    const unusedFiles = files.filter(f => !usedFileIds.has(f.id));
    
    // Simulate broken links detection
    const brokenLinks = Math.floor(usedFiles.length * 0.1); // 10% broken links
    
    // Most used files (by usage count)
    const mostUsedFiles = files
      .filter(f => f.usage_count > 0)
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 5);

    // Recently used files
    const recentlyUsedFiles = files
      .filter(f => f.last_used_at)
      .sort((a, b) => new Date(b.last_used_at!).getTime() - new Date(a.last_used_at!).getTime())
      .slice(0, 5);

    // Usage by content type
    const usageByContentType = usage.reduce((acc, u) => {
      acc[u.content_type] = (acc[u.content_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Orphaned files (unused for more than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const orphanedFiles = files.filter(f => 
      !f.last_used_at || new Date(f.last_used_at) < thirtyDaysAgo
    );

    return {
      totalFiles: files.length,
      usedFiles: usedFiles.length,
      unusedFiles: unusedFiles.length,
      brokenLinks,
      mostUsedFiles,
      recentlyUsedFiles,
      usageByContentType,
      orphanedFiles
    };
  };

  const getUsageForFile = (fileId: string): MediaUsage[] => {
    return usageData.filter(u => u.media_file_id === fileId);
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'blog_post':
        return '📝';
      case 'page':
        return '📄';
      case 'component':
        return '🧩';
      default:
        return '📎';
    }
  };

  const getContentTypeColor = (contentType: string) => {
    switch (contentType) {
      case 'blog_post':
        return 'bg-blue-100 text-blue-800';
      case 'page':
        return 'bg-green-100 text-green-800';
      case 'component':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = searchQuery === '' || 
      file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.alt_text?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (filterType) {
      case 'used':
        return file.usage_count > 0;
      case 'unused':
        return file.usage_count === 0;
      case 'broken':
        return file.usage_count > 0 && Math.random() < 0.1; // Simulate broken links
      case 'orphaned':
        return analytics?.orphanedFiles.some(f => f.id === file.id) || false;
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium">Loading usage analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load usage data</h3>
        <p className="text-gray-600 mb-4">There was an error loading the usage tracking information.</p>
        <button
          onClick={loadUsageData}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usage Tracking Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor where your media files are used across the platform
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Files</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalFiles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Used Files</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.usedFiles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unused Files</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.unusedFiles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Broken Links</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.brokenLinks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage by Content Type */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage by Content Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(analytics.usageByContentType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getContentTypeIcon(type)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">{count} usages</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">File Usage Details</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Files</option>
              <option value="used">Used Files</option>
              <option value="unused">Unused Files</option>
              <option value="broken">Broken Links</option>
              <option value="orphaned">Orphaned Files</option>
            </select>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-3">
          {filteredFiles.map((file) => {
            const fileUsage = getUsageForFile(file.id);
            return (
              <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {file.thumbnail_url ? (
                          <img
                            src={file.thumbnail_url}
                            alt={file.alt_text || file.filename}
                            className="h-full w-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-400">📁</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {file.filename}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Used {file.usage_count} times
                        {file.last_used_at && (
                          <span className="ml-2">
                            • Last used {new Date(file.last_used_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {file.usage_count > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        In Use
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Unused
                      </span>
                    )}
                    
                    <button
                      onClick={() => {/* TODO: Implement view usage details */}}
                      className="text-gray-400 hover:text-gray-600"
                      title="View usage details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Usage Details */}
                {fileUsage.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-700 mb-2">Used in:</p>
                    <div className="space-y-2">
                      {fileUsage.map((usage) => (
                        <div key={usage.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getContentTypeColor(usage.content_type)}`}>
                              {getContentTypeIcon(usage.content_type)} {usage.content_type.replace('_', ' ')}
                            </span>
                            <span className="text-gray-900">{usage.content_title}</span>
                            <span className="text-gray-500">• {usage.usage_context}</span>
                          </div>
                          <button
                            onClick={() => {/* TODO: Navigate to content */}}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredFiles.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No files found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
