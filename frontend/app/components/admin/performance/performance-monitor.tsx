'use client';

import React, { useState, useEffect } from 'react';
import { useCoreIntegration } from '@/hooks/use-core-integration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppleButton } from '@/components/ui/apple-button';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  Database, 
  HardDrive, 
  Network, 
  Server, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: number;
  timestamp: string;
}

interface SystemHealth {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  lastCheck: string;
  responseTime: number;
  uptime: number;
}

const PerformanceMonitor: React.FC = () => {
  const { systemMonitoring, analytics } = useCoreIntegration();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Mock performance data
  const mockMetrics: PerformanceMetric[] = [
    {
      id: 'cpu_usage',
      name: 'CPU Usage',
      value: 45.2,
      unit: '%',
      threshold: 80,
      status: 'normal',
      trend: 'up',
      change: 2.1,
      timestamp: new Date().toISOString()
    },
    {
      id: 'memory_usage',
      name: 'Memory Usage',
      value: 67.8,
      unit: '%',
      threshold: 85,
      status: 'normal',
      trend: 'stable',
      change: 0.5,
      timestamp: new Date().toISOString()
    },
    {
      id: 'disk_usage',
      name: 'Disk Usage',
      value: 78.3,
      unit: '%',
      threshold: 90,
      status: 'warning',
      trend: 'up',
      change: 1.2,
      timestamp: new Date().toISOString()
    },
    {
      id: 'network_latency',
      name: 'Network Latency',
      value: 12.5,
      unit: 'ms',
      threshold: 50,
      status: 'normal',
      trend: 'down',
      change: -3.2,
      timestamp: new Date().toISOString()
    },
    {
      id: 'database_connections',
      name: 'Database Connections',
      value: 23,
      unit: '',
      threshold: 100,
      status: 'normal',
      trend: 'stable',
      change: 0,
      timestamp: new Date().toISOString()
    },
    {
      id: 'api_response_time',
      name: 'API Response Time',
      value: 245,
      unit: 'ms',
      threshold: 500,
      status: 'normal',
      trend: 'down',
      change: -15.3,
      timestamp: new Date().toISOString()
    }
  ];

  const mockSystemHealth: SystemHealth[] = [
    {
      component: 'Web Server',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: 45,
      uptime: 99.98
    },
    {
      component: 'Database',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: 12,
      uptime: 99.99
    },
    {
      component: 'File Storage',
      status: 'warning',
      lastCheck: new Date().toISOString(),
      responseTime: 89,
      uptime: 99.95
    },
    {
      component: 'AI Services',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: 156,
      uptime: 99.92
    },
    {
      component: 'Email Service',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: 23,
      uptime: 99.97
    }
  ];

  useEffect(() => {
    setMetrics(mockMetrics);
    setSystemHealth(mockSystemHealth);
    
    // Track page view
    analytics.trackPageView('/admin/performance-monitor');
    analytics.trackEvent('performance_monitor_viewed', { section: 'system_monitoring' });
  }, [analytics]);

  const refreshMetrics = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update metrics with slight variations
      const updatedMetrics = mockMetrics.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 5,
        timestamp: new Date().toISOString()
      }));
      
      setMetrics(updatedMetrics);
      setLastUpdate(new Date());
      
      // Log system metric
      await systemMonitoring.logMetric('performance_refresh', 1, 'admin');
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPerformanceScore = () => {
    const healthyComponents = systemHealth.filter(h => h.status === 'healthy').length;
    const totalComponents = systemHealth.length;
    return Math.round((healthyComponents / totalComponents) * 100);
  };

  const getOptimizationSuggestions = () => {
    const suggestions = [];
    
    const diskUsage = metrics.find(m => m.id === 'disk_usage')?.value;
    if (diskUsage && diskUsage > 75) {
      suggestions.push('Consider disk cleanup or expansion');
    }
    
    const memoryUsage = metrics.find(m => m.id === 'memory_usage')?.value;
    if (memoryUsage && memoryUsage > 70) {
      suggestions.push('Monitor memory usage and consider optimization');
    }
    
    const apiResponseTime = metrics.find(m => m.id === 'api_response_time')?.value;
    if (apiResponseTime && apiResponseTime > 200) {
      suggestions.push('API response times could be optimized');
    }
    
    return suggestions.length > 0 ? suggestions : ['All systems performing optimally'];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="display" className="text-gray-900">Performance Monitor</Typography>
          <Typography variant="body" className="text-gray-600">Real-time system performance monitoring and optimization insights</Typography>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <AppleButton onClick={refreshMetrics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </AppleButton>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPerformanceScore()}%</div>
            <Progress value={getPerformanceScore()} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {systemHealth.filter(h => h.status === 'healthy').length} of {systemHealth.length} components healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Across all monitored services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.min(...systemHealth.map(h => h.uptime)).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Lowest component uptime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Real-time system performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <div key={metric.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{metric.name}</h3>
                  <Badge className={getStatusColor(metric.status)}>
                    {getStatusIcon(metric.status)}
                    <span className="ml-1">{metric.status}</span>
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold">
                    {metric.value.toFixed(1)}{metric.unit}
                  </div>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-xs ${
                      metric.trend === 'up' ? 'text-red-500' : 
                      metric.trend === 'down' ? 'text-green-500' : 'text-gray-500'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Current</span>
                    <span>Threshold: {metric.threshold}{metric.unit}</span>
                  </div>
                  <Progress 
                    value={(metric.value / metric.threshold) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Status</CardTitle>
          <CardDescription>Component-level health monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemHealth.map((component, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    component.status === 'healthy' ? 'bg-green-100' :
                    component.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {getStatusIcon(component.status)}
                  </div>
                  <div>
                    <h3 className="font-medium">{component.component}</h3>
                    <p className="text-sm text-gray-500">
                      Last check: {new Date(component.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">Response Time</p>
                      <p className="font-medium">{component.responseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Uptime</p>
                      <p className="font-medium">{component.uptime.toFixed(2)}%</p>
                    </div>
                    <Badge className={getStatusColor(component.status)}>
                      {component.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Suggestions</CardTitle>
          <CardDescription>AI-powered recommendations for system improvement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getOptimizationSuggestions().map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p className="text-sm text-blue-800">{suggestion}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Historical performance data and patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Performance trend charts and historical analysis coming soon...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;
