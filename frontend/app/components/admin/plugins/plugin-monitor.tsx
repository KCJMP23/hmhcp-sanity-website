// Plugin Monitoring Dashboard Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle, Clock, Cpu, Memory, Zap } from 'lucide-react';

interface PluginMonitorProps {
  installationId?: string;
  organizationId: string;
}

interface QueueStatus {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  processingItems: string[];
}

interface QueueStatistics {
  averageWaitTime: number;
  averageExecutionTime: number;
  successRate: number;
  failureRate: number;
  throughput: number;
}

interface HealthStatistics {
  totalInstallations: number;
  healthyInstallations: number;
  degradedInstallations: number;
  unhealthyInstallations: number;
  averageUptime: number;
  averageResponseTime: number;
  totalIssues: number;
  criticalIssues: number;
}

interface ResourceStatistics {
  totalInstallations: number;
  totalExecutions: number;
  averageExecutionTime: number;
  totalMemoryUsage: number;
  averageErrorRate: number;
  activeInstallations: number;
}

export default function PluginMonitor({ installationId, organizationId }: PluginMonitorProps) {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStatistics | null>(null);
  const [healthStats, setHealthStats] = useState<HealthStatistics | null>(null);
  const [resourceStats, setResourceStats] = useState<ResourceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [installationId]);

  const loadMonitoringData = async () => {
    try {
      const url = installationId 
        ? `/api/plugins/execute?installation_id=${installationId}`
        : '/api/plugins/execute';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setQueueStatus(data.queue_status);
        setQueueStats(data.queue_statistics);
        setHealthStats(data.health_statistics);
        setResourceStats(data.resource_statistics);
        setError(null);
      } else {
        setError(data.error || 'Failed to load monitoring data');
      }
    } catch (error) {
      setError('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'unhealthy': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Status */}
      {queueStatus && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Queue</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{queueStatus.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{queueStatus.queued}</div>
              <div className="text-sm text-gray-500">Queued</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{queueStatus.processing}</div>
              <div className="text-sm text-gray-500">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{queueStatus.completed}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{queueStatus.failed}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
          </div>
        </div>
      )}

      {/* Health Statistics */}
      {healthStats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plugin Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{healthStats.healthyInstallations}</div>
              <div className="text-sm text-gray-500">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{healthStats.degradedInstallations}</div>
              <div className="text-sm text-gray-500">Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{healthStats.unhealthyInstallations}</div>
              <div className="text-sm text-gray-500">Unhealthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{healthStats.criticalIssues}</div>
              <div className="text-sm text-gray-500">Critical Issues</div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(healthStats.averageUptime * 100)}%
              </div>
              <div className="text-sm text-gray-500">Average Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(healthStats.averageResponseTime)}ms
              </div>
              <div className="text-sm text-gray-500">Average Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {healthStats.totalIssues}
              </div>
              <div className="text-sm text-gray-500">Total Issues</div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Statistics */}
      {resourceStats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Usage</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{resourceStats.totalInstallations}</div>
              <div className="text-sm text-gray-500">Total Installations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{resourceStats.totalExecutions}</div>
              <div className="text-sm text-gray-500">Total Executions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.round(resourceStats.totalMemoryUsage)}MB</div>
              <div className="text-sm text-gray-500">Memory Usage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{resourceStats.activeInstallations}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(resourceStats.averageExecutionTime)}ms
              </div>
              <div className="text-sm text-gray-500">Average Execution Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(resourceStats.averageErrorRate * 100)}%
              </div>
              <div className="text-sm text-gray-500">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(resourceStats.totalExecutions / Math.max(resourceStats.totalInstallations, 1))}
              </div>
              <div className="text-sm text-gray-500">Executions per Plugin</div>
            </div>
          </div>
        </div>
      )}

      {/* Queue Statistics */}
      {queueStats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(queueStats.averageWaitTime)}ms
              </div>
              <div className="text-sm text-gray-500">Average Wait Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(queueStats.averageExecutionTime)}ms
              </div>
              <div className="text-sm text-gray-500">Average Execution Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(queueStats.successRate * 100)}%
              </div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(queueStats.failureRate * 100)}%
              </div>
              <div className="text-sm text-gray-500">Failure Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {queueStats.throughput}
              </div>
              <div className="text-sm text-gray-500">Throughput (exec/min)</div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Items */}
      {queueStatus && queueStatus.processingItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Currently Processing</h3>
          <div className="space-y-2">
            {queueStatus.processingItems.map((itemId, index) => (
              <div key={itemId} className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Queue Item {index + 1}</span>
                </div>
                <span className="text-xs text-gray-500">{itemId}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={loadMonitoringData}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Zap className="w-4 h-4 mr-2" />
          Refresh Data
        </button>
      </div>
    </div>
  );
}
