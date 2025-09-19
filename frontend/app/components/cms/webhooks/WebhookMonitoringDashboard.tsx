'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
  BarChart,
  Clock
} from 'lucide-react';
import { WebhookAnalytics } from '@/types/webhooks';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

interface WebhookMonitoringDashboardProps {
  webhookId?: string;
}

export function WebhookMonitoringDashboard({ webhookId }: WebhookMonitoringDashboardProps) {
  const [analytics, setAnalytics] = useState<WebhookAnalytics | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('24h');

  useEffect(() => {
    loadAnalytics();
    loadLogs();
  }, [webhookId, dateRange]);

  const loadAnalytics = async () => {
    try {
      const url = webhookId 
        ? `/api/cms/webhooks/${webhookId}/analytics?range=${dateRange}`
        : `/api/cms/webhooks/analytics?range=${dateRange}`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      logger.error('Failed to load analytics:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const url = webhookId 
        ? `/api/cms/webhooks/${webhookId}/logs?range=${dateRange}`
        : `/api/cms/webhooks/logs?range=${dateRange}`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      logger.error('Failed to load logs:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `webhook-logs-${dateRange}-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getStatusIcon = (status: number | undefined) => {
    if (!status) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    if (status >= 200 && status < 300) return <CheckCircle className="h-4 w-4 text-blue-600" />;
    if (status >= 400 && status < 500) return <XCircle className="h-4 w-4 text-blue-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (!analytics) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Webhook Analytics
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => { loadAnalytics(); loadLogs(); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Deliveries</p>
                <p className="text-2xl font-bold">{analytics.totalCalls}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
                <p className="text-2xl font-bold">{analytics.errorRate.toFixed(1)}%</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response</p>
                <p className="text-2xl font-bold">{analytics.averageDuration.toFixed(0)}ms</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Provider Breakdown */}
      {analytics.by_provider && Object.keys(analytics.by_provider).length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Provider Performance</h3>
            <div className="space-y-3">
              {Object.entries(analytics.by_provider).map(([provider, stats]) => (
                <div key={provider} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="font-medium capitalize">{provider}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.total} requests • {((stats.successful / stats.total) * 100).toFixed(1)}% success
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{stats.avg_response_time_ms}ms</p>
                    <p className="text-xs text-gray-500">avg response</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Recent Errors */}
      {analytics.recent_errors && analytics.recent_errors.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-blue-400">Recent Errors</h3>
            <div className="space-y-2">
              {analytics.recent_errors.slice(0, 5).map((error, index) => (
                <div key={index} className="p-3 bg-red-50 dark:bg-blue-900/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{error.config_name}</p>
                      <p className="text-sm text-red-600 dark:text-blue-400">{error.error_message}</p>
                      {error.status_code && (
                        <Badge variant="outline" className="mt-1">
                          HTTP {error.status_code}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(error.timestamp), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Activity Log */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Activity Log</h3>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No activity in the selected time range</div>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 20).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.response_status)}
                    <div>
                      <p className="font-medium text-sm">{log.webhook_config?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {log.submission_id} • Attempt {log.attempt_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{log.duration_ms}ms</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(log.created_at), 'HH:mm:ss')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}