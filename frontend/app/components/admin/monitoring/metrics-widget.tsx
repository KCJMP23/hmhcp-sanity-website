// Metrics Widget Component
// Story 4.5: Real-Time Analytics & Monitoring

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

import { MetricsWidgetProps, MetricType, AlertSeverity } from '@/types/monitoring';

export function MetricsWidget({ 
  metricType, 
  title, 
  value, 
  threshold, 
  trend = 'stable',
  lastUpdated 
}: MetricsWidgetProps) {
  const formatValue = (val: number, type: MetricType): string => {
    switch (type) {
      case MetricType.RESPONSE_TIME:
        return `${val}ms`;
      case MetricType.ERROR_RATE:
        return `${val}%`;
      case MetricType.UPTIME:
        return `${val}%`;
      case MetricType.USER_ACTIVITY:
        return val.toString();
      case MetricType.CPU_USAGE:
        return `${val}%`;
      case MetricType.MEMORY_USAGE:
        return `${val}%`;
      case MetricType.DATABASE_CONNECTIONS:
        return `${val}%`;
      case MetricType.API_CALLS:
        return val.toString();
      default:
        return val.toString();
    }
  };

  const getAlertLevel = (val: number, type: MetricType): AlertSeverity | null => {
    if (!threshold) return null;

    switch (type) {
      case MetricType.RESPONSE_TIME:
        if (val >= threshold.responseTime.critical) return AlertSeverity.CRITICAL;
        if (val >= threshold.responseTime.warning) return AlertSeverity.MEDIUM;
        break;
      case MetricType.ERROR_RATE:
        if (val >= threshold.errorRate.critical) return AlertSeverity.CRITICAL;
        if (val >= threshold.errorRate.warning) return AlertSeverity.MEDIUM;
        break;
      case MetricType.CPU_USAGE:
        if (val >= threshold.cpuUsage.critical) return AlertSeverity.CRITICAL;
        if (val >= threshold.cpuUsage.warning) return AlertSeverity.MEDIUM;
        break;
      case MetricType.MEMORY_USAGE:
        if (val >= threshold.memoryUsage.critical) return AlertSeverity.CRITICAL;
        if (val >= threshold.memoryUsage.warning) return AlertSeverity.MEDIUM;
        break;
      case MetricType.DATABASE_CONNECTIONS:
        if (val >= threshold.databaseConnections.critical) return AlertSeverity.CRITICAL;
        if (val >= threshold.databaseConnections.warning) return AlertSeverity.MEDIUM;
        break;
    }

    return null;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertIcon = (severity: AlertSeverity | null) => {
    if (!severity) return <CheckCircle className="w-4 h-4 text-green-500" />;
    
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case AlertSeverity.HIGH:
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case AlertSeverity.MEDIUM:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case AlertSeverity.LOW:
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getAlertColor = (severity: AlertSeverity | null): string => {
    if (!severity) return 'bg-green-50 border-green-200';
    
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'bg-red-50 border-red-200';
      case AlertSeverity.HIGH:
        return 'bg-orange-50 border-orange-200';
      case AlertSeverity.MEDIUM:
        return 'bg-yellow-50 border-yellow-200';
      case AlertSeverity.LOW:
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const alertLevel = getAlertLevel(value, metricType);

  return (
    <Card className={`transition-all duration-200 ${getAlertColor(alertLevel)}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            {getAlertIcon(alertLevel)}
          </div>
        </div>
        
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {formatValue(value, metricType)}
        </div>
        
        {alertLevel && (
          <Badge 
            variant={alertLevel === AlertSeverity.CRITICAL ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {alertLevel.toUpperCase()} ALERT
          </Badge>
        )}
        
        {lastUpdated && (
          <div className="text-xs text-gray-500 mt-2">
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
