'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, Clock, BarChart3 } from 'lucide-react';
import { WidgetProps } from '@/types/admin/dashboard';
import { useDashboard } from '../dashboard-provider';

export function ContentPerformanceWidget({ widget, isCustomizing }: WidgetProps) {
  const { state } = useDashboard();
  const { contentMetrics } = state.realTimeData;

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  return (
    <motion.div
      layout
      className={`bg-white rounded-lg border border-gray-200 p-6 h-full ${
        isCustomizing ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Content Performance</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Total Views</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {contentMetrics ? formatNumber(contentMetrics.totalViews) : '0'}
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Engagement</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {contentMetrics ? formatPercentage(contentMetrics.engagementRate) : '0%'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">Top Content</span>
          </div>
          <p className="text-sm text-gray-900 font-medium">
            {contentMetrics?.topContent || 'No data available'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">This Week</p>
            <p className="text-sm font-semibold text-gray-900">+12%</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">This Month</p>
            <p className="text-sm font-semibold text-gray-900">+8%</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Trend</p>
            <p className="text-sm font-semibold text-green-600">↗</p>
          </div>
        </div>
      </div>

      {contentMetrics?.lastUpdated && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last updated: {new Date(contentMetrics.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      )}
    </motion.div>
  );
}
