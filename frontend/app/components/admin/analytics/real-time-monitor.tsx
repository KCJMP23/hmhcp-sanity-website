'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, RefreshCw, Users, Eye, Target, AlertTriangle } from 'lucide-react';
import { RealTimeAnalyticsData } from '@/types/analytics';

interface RealTimeMonitorProps {
  data: RealTimeAnalyticsData | null;
  loading?: boolean;
  error?: string;
}

export function RealTimeMonitor({ data, loading = false, error }: RealTimeMonitorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    if (data) {
      setIsConnected(true);
      setLastUpdate(new Date().toLocaleString());
    }
  }, [data]);

  const getStatusColor = (value: number, threshold: number) => {
    return value > threshold ? 'text-red-600' : 'text-green-600';
  };

  const getStatusIcon = (value: number, threshold: number) => {
    return value > threshold ? (
      <AlertTriangle className="h-3 w-3" />
    ) : (
      <Activity className="h-3 w-3" />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Real-time Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">Connection Error</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-time Activity
          <div className={`ml-auto w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </CardTitle>
        {lastUpdate && (
          <p className="text-xs text-gray-500">Last updated: {lastUpdate}</p>
        )}
      </CardHeader>
      <CardContent>
        {data ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                <Users className="h-3 w-3" />
                Active Users
              </span>
              <span className="font-semibold text-green-600">{data.activeUsers}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Page Views (1h)
              </span>
              <span className="font-semibold">{data.pageViews}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                <Target className="h-3 w-3" />
                Conversion Events
              </span>
              <span className="font-semibold text-blue-600">{data.conversionEvents}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                {getStatusIcon(data.errorRate, 5)}
                Error Rate
              </span>
              <span className={`font-semibold ${getStatusColor(data.errorRate, 5)}`}>
                {data.errorRate}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Response Time</span>
              <span className={`font-semibold ${getStatusColor(data.averageResponseTime, 2000)}`}>
                {data.averageResponseTime}ms
              </span>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between text-xs text-gray-500">
                <span>HCP Sessions: {data.healthcareProfessionalSessions}</span>
                <span>Patient Sessions: {data.patientSessions}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Connecting to real-time data...</p>
            <p className="text-xs text-gray-400 mt-1">Establishing WebSocket connection</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RealTimeMetricsProps {
  data: RealTimeAnalyticsData | null;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

export function RealTimeMetrics({ data, loading, error, onRefresh }: RealTimeMetricsProps) {
  return (
    <div className="space-y-6">
      <RealTimeMonitor data={data} loading={loading} error={error} />
      
      {onRefresh && (
        <div className="text-center">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            <RefreshCw className={`h-3 w-3 inline mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
}
