// Performance Widget Component
// Story 4.5: Real-Time Analytics & Monitoring

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  HardDrive, 
  Database, 
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';

import { PerformanceWidgetProps, ResourceType } from '@/types/monitoring';

export function PerformanceWidget({ 
  resourceType, 
  utilizationData, 
  threshold 
}: PerformanceWidgetProps) {
  const performanceStats = useMemo(() => {
    if (!utilizationData || utilizationData.length === 0) {
      return {
        current: 0,
        average: 0,
        max: 0,
        min: 0,
        trend: 'stable' as const,
        status: 'normal' as const
      };
    }

    const values = utilizationData.map(d => d.utilization_percentage);
    const current = values[0] || 0;
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midPoint);
    const secondHalf = values.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg + 5) trend = 'up';
    else if (secondHalfAvg < firstHalfAvg - 5) trend = 'down';

    // Determine status based on threshold
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (current >= threshold * 0.9) status = 'critical';
    else if (current >= threshold * 0.7) status = 'warning';

    return {
      current,
      average,
      max,
      min,
      trend,
      status
    };
  }, [utilizationData, threshold]);

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case ResourceType.CPU:
        return <Cpu className="w-5 h-5" />;
      case ResourceType.MEMORY:
        return <HardDrive className="w-5 h-5" />;
      case ResourceType.DATABASE:
        return <Database className="w-5 h-5" />;
      case ResourceType.API:
        return <Zap className="w-5 h-5" />;
      case ResourceType.STORAGE:
        return <HardDrive className="w-5 h-5" />;
      default:
        return <Cpu className="w-5 h-5" />;
    }
  };

  const getResourceColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="outline" className="bg-green-100 text-green-800">Normal</Badge>;
    }
  };

  const getTrendIcon = () => {
    switch (performanceStats.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={getResourceColor(performanceStats.status)}>
            {getResourceIcon(resourceType)}
          </div>
          <h3 className="text-sm font-medium text-gray-700 capitalize">
            {resourceType.replace('_', ' ')} Utilization
          </h3>
        </div>
        {getStatusBadge(performanceStats.status)}
      </div>

      {/* Current Value */}
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {performanceStats.current.toFixed(1)}%
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <span>Current</span>
          {getTrendIcon()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(performanceStats.status)}`}
          style={{ width: `${Math.min(performanceStats.current, 100)}%` }}
        />
      </div>

      {/* Threshold Indicator */}
      <div className="relative">
        <div className="text-xs text-gray-500 mb-1">Threshold: {threshold}%</div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className="h-1 rounded-full bg-gray-400"
            style={{ width: `${Math.min(threshold, 100)}%` }}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Average</div>
          <div className="font-medium text-gray-900">
            {performanceStats.average.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-gray-500">Peak</div>
          <div className="font-medium text-gray-900">
            {performanceStats.max.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Recent Data Points */}
      {utilizationData && utilizationData.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-2">Recent Values</div>
          <div className="flex space-x-1">
            {utilizationData.slice(0, 10).map((data, index) => (
              <div
                key={index}
                className={`h-8 w-2 rounded-sm ${
                  data.utilization_percentage >= threshold * 0.9
                    ? 'bg-red-500'
                    : data.utilization_percentage >= threshold * 0.7
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{
                  height: `${Math.max((data.utilization_percentage / 100) * 32, 4)}px`
                }}
                title={`${data.utilization_percentage.toFixed(1)}%`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Alert if approaching threshold */}
      {performanceStats.status !== 'normal' && (
        <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-xs text-yellow-800">
            {performanceStats.status === 'critical' 
              ? 'Resource utilization is critical'
              : 'Resource utilization is high'
            }
          </span>
        </div>
      )}
    </div>
  );
}
