'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { RealTimeAnalytics, WebSocketAnalyticsEvent } from '@/types/analytics';

interface RealTimeMonitorProps {
  data: RealTimeAnalytics;
  onRefresh?: () => void;
  className?: string;
}

export function RealTimeMonitor({ data, onRefresh, className = '' }: RealTimeMonitorProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [events, setEvents] = useState<WebSocketAnalyticsEvent[]>([]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Simulate new events
      if (Math.random() > 0.7) {
        const newEvent: WebSocketAnalyticsEvent = {
          type: 'real_time_update',
          data: {
            userId: `user_${Math.floor(Math.random() * 1000)}`,
            action: 'page_view',
            timestamp: new Date()
          },
          timestamp: new Date(),
          organizationId: 'default'
        };
        setEvents(prev => [newEvent, ...prev.slice(0, 9)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getSystemStatusColor = () => {
    if (data.systemPerformance.errorRate > 5) return 'text-red-500';
    if (data.systemPerformance.errorRate > 2) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getSystemStatusIcon = () => {
    if (data.systemPerformance.errorRate > 5) return <AlertTriangle className="h-4 w-4" />;
    if (data.systemPerformance.errorRate > 2) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Real-Time Monitor</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Active Users</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {data.activeUsers}
            </div>
            <div className="text-xs text-gray-500">
              Currently online
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Sessions</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {data.currentSessions}
            </div>
            <div className="text-xs text-gray-500">
              Active sessions
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              {getSystemStatusIcon()}
              <span className="text-sm font-medium">System Status</span>
            </div>
            <div className={`text-2xl font-bold ${getSystemStatusColor()}`}>
              {data.systemPerformance.errorRate > 5 ? 'Critical' : 
               data.systemPerformance.errorRate > 2 ? 'Warning' : 'Healthy'}
            </div>
            <div className="text-xs text-gray-500">
              Error rate: {data.systemPerformance.errorRate}%
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Performance Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Response Time</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {data.systemPerformance.responseTime}ms
                </span>
                <Badge 
                  variant={data.systemPerformance.responseTime < 200 ? "default" : 
                          data.systemPerformance.responseTime < 500 ? "secondary" : "destructive"}
                >
                  {data.systemPerformance.responseTime < 200 ? "Fast" : 
                   data.systemPerformance.responseTime < 500 ? "Good" : "Slow"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Throughput</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {data.systemPerformance.throughput} req/s
                </span>
                <Badge 
                  variant={data.systemPerformance.throughput > 100 ? "default" : 
                          data.systemPerformance.throughput > 50 ? "secondary" : "destructive"}
                >
                  {data.systemPerformance.throughput > 100 ? "High" : 
                   data.systemPerformance.throughput > 50 ? "Medium" : "Low"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Live Events Feed */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Live Events</h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {events.length > 0 ? (
              events.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600">
                      {event.data.action || 'Event'} from {event.data.userId}
                    </span>
                  </div>
                  <span className="text-gray-400">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No recent events
              </div>
            )}
          </div>
        </div>

        {/* Compliance Alerts */}
        {data.complianceAlerts.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Compliance Alerts</h4>
            <div className="space-y-2">
              {data.complianceAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-800">{alert.message}</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Update */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized components for different monitoring aspects
export function UserActivityMonitor({ 
  activeUsers, 
  currentSessions 
}: {
  activeUsers: number;
  currentSessions: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>User Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{activeUsers}</div>
            <div className="text-sm text-gray-500">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{currentSessions}</div>
            <div className="text-sm text-gray-500">Current Sessions</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SystemHealthMonitor({ 
  responseTime, 
  errorRate, 
  throughput 
}: {
  responseTime: number;
  errorRate: number;
  throughput: number;
}) {
  const getHealthStatus = () => {
    if (errorRate > 5 || responseTime > 2000) return { status: 'Critical', color: 'text-red-600' };
    if (errorRate > 2 || responseTime > 1000) return { status: 'Warning', color: 'text-yellow-600' };
    return { status: 'Healthy', color: 'text-green-600' };
  };

  const health = getHealthStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>System Health</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <span className={`font-medium ${health.color}`}>{health.status}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Response Time</span>
            <span className="font-medium">{responseTime}ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Error Rate</span>
            <span className="font-medium">{errorRate}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Throughput</span>
            <span className="font-medium">{throughput} req/s</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
