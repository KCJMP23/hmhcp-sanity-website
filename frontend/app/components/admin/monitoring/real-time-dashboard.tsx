// Real-Time Monitoring Dashboard Component
// Story 4.5: Real-Time Analytics & Monitoring

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Wifi,
  WifiOff,
  Smartphone,
  Monitor
} from 'lucide-react';

import { useRealTimeMonitoring, useResponsiveLayout, useTouchGestures } from '@/hooks/use-real-time-monitoring';
import { MetricsWidget } from './metrics-widget';
import { UserActivityWidget } from './user-activity-widget';
import { PerformanceWidget } from './performance-widget';
import { AlertsWidget } from './alerts-widget';
import { RealTimeDashboardProps, ConnectionState, AlertThresholds } from '@/types/monitoring';

export function RealTimeDashboard({ 
  organizationId, 
  refreshInterval = 5000,
  alertThresholds 
}: RealTimeDashboardProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('1h');
  
  const {
    connectionState,
    isConnected,
    isReconnecting,
    dashboardData,
    lastUpdated,
    connect,
    disconnect,
    error,
    clearError,
    fallbackMode,
    retryConnection,
    performanceMetrics
  } = useRealTimeMonitoring({
    organizationId,
    refreshInterval,
    alertThresholds,
    autoConnect: true
  });

  const screenSize = useResponsiveLayout();
  const touchGestures = useTouchGestures();

  // Handle touch gestures
  useEffect(() => {
    if (touchGestures.swipe?.direction === 'left' && screenSize === 'mobile') {
      // Switch to next time range
      const ranges: ('1h' | '24h' | '7d')[] = ['1h', '24h', '7d'];
      const currentIndex = ranges.indexOf(selectedTimeRange);
      const nextIndex = (currentIndex + 1) % ranges.length;
      setSelectedTimeRange(ranges[nextIndex]);
    }
  }, [touchGestures.swipe, selectedTimeRange, screenSize]);

  // Handle long press for fullscreen on mobile
  useEffect(() => {
    if (touchGestures.longPress && screenSize === 'mobile') {
      setIsFullscreen(!isFullscreen);
    }
  }, [touchGestures.longPress, screenSize, isFullscreen]);

  const getConnectionStatus = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return { icon: Wifi, color: 'text-green-500', text: 'Connected' };
      case ConnectionState.CONNECTING:
        return { icon: RefreshCw, color: 'text-yellow-500', text: 'Connecting...' };
      case ConnectionState.RECONNECTING:
        return { icon: RefreshCw, color: 'text-yellow-500', text: 'Reconnecting...' };
      case ConnectionState.ERROR:
        return { icon: WifiOff, color: 'text-red-500', text: 'Connection Error' };
      default:
        return { icon: WifiOff, color: 'text-gray-500', text: 'Disconnected' };
    }
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  return (
    <div className={`min-h-screen bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Real-Time Monitoring
            </h1>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              <StatusIcon className={`w-3 h-3 mr-1 ${connectionStatus.color}`} />
              {connectionStatus.text}
            </Badge>
            {fallbackMode && (
              <Badge variant="outline" className="text-yellow-600">
                Fallback Mode
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as '1h' | '24h' | '7d')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>

            {/* Connection Controls */}
            {!isConnected && !isReconnecting && (
              <Button onClick={connect} size="sm" variant="outline">
                <Wifi className="w-4 h-4 mr-1" />
                Connect
              </Button>
            )}
            
            {isConnected && (
              <Button onClick={disconnect} size="sm" variant="outline">
                <WifiOff className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            )}

            {isReconnecting && (
              <Button onClick={retryConnection} size="sm" variant="outline">
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Retry
              </Button>
            )}

            {/* Mobile Fullscreen Toggle */}
            {screenSize === 'mobile' && (
              <Button
                onClick={() => setIsFullscreen(!isFullscreen)}
                size="sm"
                variant="outline"
              >
                {isFullscreen ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-sm text-gray-500 mt-1">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-4 py-2">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button onClick={clearError} size="sm" variant="outline">
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="p-4 space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsWidget
            metricType="response_time"
            title="Response Time"
            value={performanceMetrics.avgResponseTime}
            threshold={alertThresholds}
            lastUpdated={lastUpdated || ''}
          />
          <MetricsWidget
            metricType="error_rate"
            title="Error Rate"
            value={performanceMetrics.errorRate}
            threshold={alertThresholds}
            lastUpdated={lastUpdated || ''}
          />
          <MetricsWidget
            metricType="uptime"
            title="Uptime"
            value={performanceMetrics.uptime}
            threshold={alertThresholds}
            lastUpdated={lastUpdated || ''}
          />
          <MetricsWidget
            metricType="user_activity"
            title="Active Users"
            value={performanceMetrics.activeConnections}
            threshold={alertThresholds}
            lastUpdated={lastUpdated || ''}
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                User Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserActivityWidget
                userType="healthcare_professional"
                activityData={dashboardData?.user_activity || []}
                timeRange={selectedTimeRange}
              />
            </CardContent>
          </Card>

          {/* System Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="w-5 h-5 mr-2" />
                System Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceWidget
                resourceType="cpu"
                utilizationData={dashboardData?.system_resources || []}
                threshold={70}
              />
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Healthcare Compliance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsWidget
              alerts={dashboardData?.compliance_alerts || []}
              severity="critical"
              maxAlerts={10}
            />
          </CardContent>
        </Card>

        {/* AI Agent Performance */}
        {dashboardData?.ai_performance && dashboardData.ai_performance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                AI Agent Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.ai_performance.slice(0, 5).map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{agent.agent_name}</div>
                      <div className="text-sm text-gray-500">
                        Execution: {agent.execution_time_ms}ms | 
                        Cost: ${agent.cost_usd} | 
                        Success: {agent.success_rate}%
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={agent.healthcare_compliance_score >= 90 ? 'default' : 'destructive'}>
                        {agent.healthcare_compliance_score}% Compliant
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Touch Instructions */}
      {screenSize === 'mobile' && (
        <div className="fixed bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded-lg">
          <div className="text-center">
            Swipe left/right to change time range • Long press for fullscreen
          </div>
        </div>
      )}
    </div>
  );
}
