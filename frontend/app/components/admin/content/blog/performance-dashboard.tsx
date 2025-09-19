'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('PerformanceDashboard');

interface PerformanceData {
  date: string;
  views: number;
  uniqueViews: number;
  engagement: number;
  socialShares: number;
  timeOnPage: number;
  bounceRate: number;
}

interface PerformanceDashboardProps {
  postId: string;
  timeRange: '7d' | '30d' | '90d' | '1y';
}

export function PerformanceDashboard({
  postId,
  timeRange
}: PerformanceDashboardProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'engagement' | 'socialShares' | 'timeOnPage'>('views');

  useEffect(() => {
    fetchPerformanceData();
  }, [postId, timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true);
      logger.info('Fetching performance data', { postId, timeRange });

      // In production, this would fetch from the analytics API
      const mockData: PerformanceData[] = generateMockPerformanceData(timeRange);
      setPerformanceData(mockData);
      
      logger.info('Performance data fetched successfully', { count: mockData.length });
    } catch (error) {
      logger.error('Failed to fetch performance data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockPerformanceData = (range: string): PerformanceData[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data: PerformanceData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 200) + 50,
        uniqueViews: Math.floor(Math.random() * 150) + 40,
        engagement: Math.random() * 3 + 7,
        socialShares: Math.floor(Math.random() * 20) + 5,
        timeOnPage: Math.random() * 2 + 3,
        bounceRate: Math.random() * 0.3 + 0.2
      });
    }
    
    return data;
  };

  const getMetricLabel = (metric: string) => {
    const labels = {
      views: 'Views',
      engagement: 'Engagement Score',
      socialShares: 'Social Shares',
      timeOnPage: 'Time on Page (min)'
    };
    return labels[metric as keyof typeof labels] || metric;
  };

  const getMetricColor = (metric: string) => {
    const colors = {
      views: 'text-blue-600',
      engagement: 'text-green-600',
      socialShares: 'text-purple-600',
      timeOnPage: 'text-orange-600'
    };
    return colors[metric as keyof typeof colors] || 'text-gray-600';
  };

  const getMetricValue = (data: PerformanceData, metric: string) => {
    switch (metric) {
      case 'views':
        return data.views;
      case 'engagement':
        return data.engagement;
      case 'socialShares':
        return data.socialShares;
      case 'timeOnPage':
        return data.timeOnPage;
      default:
        return 0;
    }
  };

  const getMaxValue = (metric: string) => {
    return Math.max(...performanceData.map(data => getMetricValue(data, metric)));
  };

  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case 'views':
      case 'socialShares':
        return value.toLocaleString();
      case 'engagement':
        return value.toFixed(1);
      case 'timeOnPage':
        return value.toFixed(1) + 'm';
      default:
        return value.toString();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading performance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Selector */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Show:</span>
        <div className="flex space-x-2">
          {(['views', 'engagement', 'socialShares', 'timeOnPage'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedMetric === metric
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {getMetricLabel(metric)}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {getMetricLabel(selectedMetric)} Over Time
        </h3>
        
        <div className="h-64 flex items-end space-x-1">
          {performanceData.map((data, index) => {
            const value = getMetricValue(data, selectedMetric);
            const maxValue = getMaxValue(selectedMetric);
            const height = (value / maxValue) * 100;
            
            return (
              <motion.div
                key={data.date}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: index * 0.02 }}
                className={`flex-1 ${getMetricColor(selectedMetric).replace('text-', 'bg-').replace('-600', '-200')} rounded-t`}
                title={`${data.date}: ${formatValue(value, selectedMetric)}`}
              />
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {performanceData.filter((_, index) => index % Math.ceil(performanceData.length / 7) === 0).map((data) => (
            <span key={data.date}>
              {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Views</p>
              <p className="text-2xl font-bold text-blue-900">
                {performanceData.reduce((acc, data) => acc + data.views, 0).toLocaleString()}
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
              <p className="text-sm font-medium text-green-600">Avg. Engagement</p>
              <p className="text-2xl font-bold text-green-900">
                {(performanceData.reduce((acc, data) => acc + data.engagement, 0) / performanceData.length).toFixed(1)}
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
                {performanceData.reduce((acc, data) => acc + data.socialShares, 0).toLocaleString()}
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
                {(performanceData.reduce((acc, data) => acc + data.timeOnPage, 0) / performanceData.length).toFixed(1)}m
              </p>
            </div>
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Recent Performance Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Social Shares
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time on Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bounce Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceData.slice(-10).reverse().map((data) => (
                <tr key={data.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(data.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {data.views.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      data.engagement >= 8 ? 'bg-green-100 text-green-800' :
                      data.engagement >= 6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {data.engagement.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {data.socialShares}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {data.timeOnPage.toFixed(1)}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      data.bounceRate <= 0.3 ? 'bg-green-100 text-green-800' :
                      data.bounceRate <= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(data.bounceRate * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
