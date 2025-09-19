'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('ContentAnalytics');

interface AnalyticsData {
  postId: string;
  title: string;
  publishedAt: string;
  views: number;
  uniqueViews: number;
  timeOnPage: number;
  bounceRate: number;
  engagementScore: number;
  socialShares: {
    facebook: number;
    twitter: number;
    linkedin: number;
    email: number;
  };
  trafficSources: {
    organic: number;
    direct: number;
    social: number;
    referral: number;
    email: number;
  };
  demographics: {
    ageGroups: { [key: string]: number };
    genders: { [key: string]: number };
    locations: { [key: string]: number };
  };
  medicalTopics: {
    topic: string;
    engagement: number;
    searchVolume: number;
  }[];
  performanceMetrics: {
    seoScore: number;
    readabilityScore: number;
    medicalAccuracyScore: number;
    accessibilityScore: number;
  };
  trends: {
    date: string;
    views: number;
    engagement: number;
  }[];
}

interface ContentAnalyticsProps {
  postId?: string;
  onClose?: () => void;
  isOpen: boolean;
}

export function ContentAnalytics({
  postId,
  onClose,
  isOpen
}: ContentAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [selectedPost, setSelectedPost] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<string>('views');

  useEffect(() => {
    if (isOpen) {
      fetchAnalyticsData();
    }
  }, [isOpen, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      logger.info('Fetching content analytics', { postId, timeRange });

      // In production, this would fetch from the analytics API
      const mockData: AnalyticsData[] = [
        {
          postId: '1',
          title: 'Understanding Diabetes Management in Modern Healthcare',
          publishedAt: '2025-01-15T10:00:00Z',
          views: 1250,
          uniqueViews: 980,
          timeOnPage: 4.2,
          bounceRate: 0.35,
          engagementScore: 8.5,
          socialShares: {
            facebook: 45,
            twitter: 32,
            linkedin: 28,
            email: 15
          },
          trafficSources: {
            organic: 650,
            direct: 320,
            social: 180,
            referral: 80,
            email: 20
          },
          demographics: {
            ageGroups: {
              '18-24': 120,
              '25-34': 280,
              '35-44': 350,
              '45-54': 300,
              '55-64': 150,
              '65+': 50
            },
            genders: {
              'female': 680,
              'male': 300
            },
            locations: {
              'United States': 450,
              'Canada': 180,
              'United Kingdom': 120,
              'Australia': 90,
              'Germany': 60,
              'Other': 350
            }
          },
          medicalTopics: [
            { topic: 'diabetes management', engagement: 9.2, searchVolume: 12000 },
            { topic: 'blood glucose monitoring', engagement: 8.8, searchVolume: 8500 },
            { topic: 'insulin therapy', engagement: 8.5, searchVolume: 9200 },
            { topic: 'diabetic complications', engagement: 8.1, searchVolume: 6800 }
          ],
          performanceMetrics: {
            seoScore: 92,
            readabilityScore: 88,
            medicalAccuracyScore: 95,
            accessibilityScore: 90
          },
          trends: [
            { date: '2025-01-15', views: 45, engagement: 7.2 },
            { date: '2025-01-16', views: 78, engagement: 8.1 },
            { date: '2025-01-17', views: 92, engagement: 8.5 },
            { date: '2025-01-18', views: 85, engagement: 8.3 },
            { date: '2025-01-19', views: 103, engagement: 8.7 },
            { date: '2025-01-20', views: 115, engagement: 9.0 },
            { date: '2025-01-21', views: 128, engagement: 9.2 }
          ]
        },
        {
          postId: '2',
          title: 'Cardiovascular Health: Prevention and Treatment Strategies',
          publishedAt: '2025-01-10T14:30:00Z',
          views: 2100,
          uniqueViews: 1650,
          timeOnPage: 5.8,
          bounceRate: 0.28,
          engagementScore: 9.2,
          socialShares: {
            facebook: 78,
            twitter: 45,
            linkedin: 52,
            email: 23
          },
          trafficSources: {
            organic: 1200,
            direct: 450,
            social: 280,
            referral: 120,
            email: 50
          },
          demographics: {
            ageGroups: {
              '18-24': 180,
              '25-34': 420,
              '35-44': 580,
              '45-54': 520,
              '55-64': 280,
              '65+': 120
            },
            genders: {
              'female': 1150,
              'male': 500
            },
            locations: {
              'United States': 800,
              'Canada': 320,
              'United Kingdom': 200,
              'Australia': 150,
              'Germany': 100,
              'Other': 530
            }
          },
          medicalTopics: [
            { topic: 'cardiovascular disease', engagement: 9.5, searchVolume: 15000 },
            { topic: 'heart health', engagement: 9.1, searchVolume: 12000 },
            { topic: 'blood pressure', engagement: 8.9, searchVolume: 11000 },
            { topic: 'cholesterol management', engagement: 8.7, searchVolume: 9500 }
          ],
          performanceMetrics: {
            seoScore: 95,
            readabilityScore: 92,
            medicalAccuracyScore: 97,
            accessibilityScore: 93
          },
          trends: [
            { date: '2025-01-10', views: 65, engagement: 8.5 },
            { date: '2025-01-11', views: 89, engagement: 8.8 },
            { date: '2025-01-12', views: 112, engagement: 9.1 },
            { date: '2025-01-13', views: 98, engagement: 8.9 },
            { date: '2025-01-14', views: 125, engagement: 9.3 },
            { date: '2025-01-15', views: 145, engagement: 9.5 },
            { date: '2025-01-16', views: 158, engagement: 9.6 }
          ]
        }
      ];

      setAnalyticsData(mockData);
      if (postId) {
        const post = mockData.find(p => p.postId === postId);
        setSelectedPost(post || null);
      }
      
      logger.info('Analytics data fetched successfully', { count: mockData.length });
    } catch (error) {
      logger.error('Failed to fetch analytics data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeRangeLabel = (range: string) => {
    const labels = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
      '1y': 'Last year'
    };
    return labels[range as keyof typeof labels] || range;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getEngagementColor = (score: number) => {
    if (score >= 9) return 'text-green-600 bg-green-100';
    if (score >= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
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
        className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Content Analytics</h2>
            <p className="text-sm text-gray-600">
              Performance metrics and engagement data for your blog posts
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading analytics...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Views</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatNumber(analyticsData.reduce((acc, post) => acc + post.views, 0))}
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Engagement Score</p>
                      <p className="text-2xl font-bold text-green-900">
                        {(analyticsData.reduce((acc, post) => acc + post.engagementScore, 0) / analyticsData.length).toFixed(1)}
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Social Shares</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatNumber(analyticsData.reduce((acc, post) => 
                          acc + post.socialShares.facebook + post.socialShares.twitter + 
                          post.socialShares.linkedin + post.socialShares.email, 0
                        ))}
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Avg. Time on Page</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {(analyticsData.reduce((acc, post) => acc + post.timeOnPage, 0) / analyticsData.length).toFixed(1)}m
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Posts List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Blog Posts Performance</h3>
                {analyticsData.map((post) => (
                  <motion.div
                    key={post.postId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Views:</span>
                            <span className="ml-2 font-medium">{formatNumber(post.views)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Engagement:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getEngagementColor(post.engagementScore)}`}>
                              {post.engagementScore}/10
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Time on Page:</span>
                            <span className="ml-2 font-medium">{post.timeOnPage}m</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Bounce Rate:</span>
                            <span className="ml-2 font-medium">{(post.bounceRate * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Selected Post Details */}
              {selectedPost && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Detailed Analytics</h3>
                    <button
                      onClick={() => setSelectedPost(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Performance Metrics */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Performance Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">SEO Score</span>
                          <span className={`text-sm font-medium ${getPerformanceColor(selectedPost.performanceMetrics.seoScore)}`}>
                            {selectedPost.performanceMetrics.seoScore}/100
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Readability</span>
                          <span className={`text-sm font-medium ${getPerformanceColor(selectedPost.performanceMetrics.readabilityScore)}`}>
                            {selectedPost.performanceMetrics.readabilityScore}/100
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Medical Accuracy</span>
                          <span className={`text-sm font-medium ${getPerformanceColor(selectedPost.performanceMetrics.medicalAccuracyScore)}`}>
                            {selectedPost.performanceMetrics.medicalAccuracyScore}/100
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Accessibility</span>
                          <span className={`text-sm font-medium ${getPerformanceColor(selectedPost.performanceMetrics.accessibilityScore)}`}>
                            {selectedPost.performanceMetrics.accessibilityScore}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Traffic Sources */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Traffic Sources</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedPost.trafficSources).map(([source, count]) => (
                          <div key={source} className="flex justify-between">
                            <span className="text-sm text-gray-600 capitalize">{source}</span>
                            <span className="text-sm font-medium">{formatNumber(count)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Medical Topics */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Medical Topics</h4>
                      <div className="space-y-2">
                        {selectedPost.medicalTopics.map((topic, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-sm text-gray-600">{topic.topic}</span>
                            <span className="text-sm font-medium">{topic.engagement}/10</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
