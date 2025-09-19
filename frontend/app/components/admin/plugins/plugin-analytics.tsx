// Plugin Analytics Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Users,
  Database,
  Cpu,
  Memory,
  RefreshCw,
  Download,
  Calendar,
  Filter
} from 'lucide-react';

interface PluginAnalyticsProps {
  installationId?: string;
  organizationId: string;
  timeRange?: '24h' | '7d' | '30d' | '90d';
}

interface AnalyticsData {
  executions: {
    total: number;
    successful: number;
    failed: number;
    average_time: number;
    peak_time: string;
  };
  performance: {
    average_memory: number;
    peak_memory: number;
    average_cpu: number;
    peak_cpu: number;
  };
  health: {
    uptime_percentage: number;
    error_rate: number;
    critical_issues: number;
    warnings: number;
  };
  usage: {
    unique_users: number;
    total_requests: number;
    peak_concurrent: number;
    daily_average: number;
  };
  trends: {
    execution_trend: Array<{ date: string; count: number }>;
    performance_trend: Array<{ date: string; memory: number; cpu: number }>;
    error_trend: Array<{ date: string; errors: number }>;
  };
}

export default function PluginAnalytics({ 
  installationId, 
  organizationId, 
  timeRange = '7d' 
}: PluginAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  useEffect(() => {
    loadAnalytics();
  }, [installationId, organizationId, selectedTimeRange]);

  const loadAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        organization_id: organizationId,
        time_range: selectedTimeRange
      });
      
      if (installationId) {
        params.append('installation_id', installationId);
      }

      const response = await fetch(`/api/plugins/analytics?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
      } else {
        setError(data.error || 'Failed to load analytics');
      }
    } catch (error) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return bytes + ' B';
  };

  const formatDuration = (ms: number) => {
    if (ms >= 1000) {
      return (ms / 1000).toFixed(1) + 's';
    }
    return ms + 'ms';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error || 'Failed to load analytics'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Plugin Analytics</h2>
          <p className="text-gray-600">Performance and usage insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Executions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(analytics.executions.total)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.executions.total > 0 
                  ? Math.round((analytics.executions.successful / analytics.executions.total) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(analytics.executions.average_time)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unique Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(analytics.usage.unique_users)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Memory className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Memory Usage</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {formatBytes(analytics.performance.average_memory)}
                </div>
                <div className="text-xs text-gray-500">
                  Peak: {formatBytes(analytics.performance.peak_memory)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Cpu className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {analytics.performance.average_cpu.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  Peak: {analytics.performance.peak_cpu.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Uptime</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {analytics.health.uptime_percentage.toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Error Rate</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {analytics.health.error_rate.toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Issues</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {analytics.health.critical_issues} critical, {analytics.health.warnings} warnings
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(analytics.usage.total_requests)}
            </div>
            <div className="text-sm text-gray-500">Total Requests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {analytics.usage.peak_concurrent}
            </div>
            <div className="text-sm text-gray-500">Peak Concurrent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(analytics.usage.daily_average)}
            </div>
            <div className="text-sm text-gray-500">Daily Average</div>
          </div>
        </div>
      </div>

      {/* Execution Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Trends</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <p>Chart visualization would be implemented here</p>
            <p className="text-sm">Using a charting library like Chart.js or Recharts</p>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage Trend</h3>
          <div className="h-48 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Memory className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Memory usage chart</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CPU Usage Trend</h3>
          <div className="h-48 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Cpu className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">CPU usage chart</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
            <p className="text-sm text-gray-500">Download analytics data for further analysis</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
