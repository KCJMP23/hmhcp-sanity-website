'use client';

// Real-Time Monitoring Component
// Created: 2025-01-27
// Purpose: Real-time email campaign monitoring and alerts

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Users, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Bell,
  Settings,
  Zap,
  Globe,
  Server
} from 'lucide-react';
import type { EmailCampaign, EmailAnalytics } from '@/types/email-campaigns';

interface RealTimeMonitoringProps {
  campaigns: EmailCampaign[];
  analytics: EmailAnalytics[];
  onRefresh: () => Promise<void>;
}

interface MonitoringAlert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  campaign_id?: string;
  resolved: boolean;
}

interface SystemStatus {
  email_service: 'operational' | 'degraded' | 'down';
  database: 'operational' | 'degraded' | 'down';
  api: 'operational' | 'degraded' | 'down';
  webhooks: 'operational' | 'degraded' | 'down';
  last_updated: string;
}

interface CampaignStatus {
  campaign_id: string;
  campaign_name: string;
  status: string;
  progress: number;
  sent_count: number;
  target_count: number;
  rate_per_minute: number;
  estimated_completion: string;
  errors: number;
  warnings: number;
}

const ALERT_TYPES = {
  success: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  error: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  info: { icon: Bell, color: 'text-blue-600', bgColor: 'bg-blue-50' }
};

export default function RealTimeMonitoring({ 
  campaigns, 
  analytics, 
  onRefresh 
}: RealTimeMonitoringProps) {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    email_service: 'operational',
    database: 'operational',
    api: 'operational',
    webhooks: 'operational',
    last_updated: new Date().toISOString()
  });
  const [campaignStatuses, setCampaignStatuses] = useState<CampaignStatus[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simulate real-time updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      updateMonitoringData();
      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isMonitoring, campaigns, analytics]);

  const updateMonitoringData = useCallback(() => {
    // Simulate system status updates
    const statuses: Array<'operational' | 'degraded' | 'down'> = ['operational', 'degraded', 'down'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    setSystemStatus(prev => ({
      ...prev,
      email_service: Math.random() > 0.9 ? randomStatus : prev.email_service,
      database: Math.random() > 0.95 ? randomStatus : prev.database,
      api: Math.random() > 0.9 ? randomStatus : prev.api,
      webhooks: Math.random() > 0.9 ? randomStatus : prev.webhooks,
      last_updated: new Date().toISOString()
    }));

    // Update campaign statuses
    const activeCampaigns = campaigns.filter(c => c.status === 'sending');
    const updatedStatuses: CampaignStatus[] = activeCampaigns.map(campaign => {
      const campaignAnalytics = analytics.find(a => a.campaign_id === campaign.id);
      const sent_count = campaignAnalytics?.sent_count || campaign.sent_count || 0;
      const target_count = campaign.recipient_count || 0;
      const progress = target_count > 0 ? (sent_count / target_count) * 100 : 0;
      const rate_per_minute = Math.floor(Math.random() * 100) + 50; // Simulate sending rate
      const remaining = target_count - sent_count;
      const estimated_minutes = remaining / rate_per_minute;
      const estimated_completion = new Date(Date.now() + estimated_minutes * 60000).toISOString();
      
      return {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        status: campaign.status,
        progress: Math.min(progress, 100),
        sent_count,
        target_count,
        rate_per_minute,
        estimated_completion,
        errors: Math.floor(Math.random() * 5),
        warnings: Math.floor(Math.random() * 3)
      };
    });
    
    setCampaignStatuses(updatedStatuses);

    // Generate alerts based on system status
    generateAlerts();
  }, [campaigns, analytics]);

  const generateAlerts = () => {
    const newAlerts: MonitoringAlert[] = [];
    
    // Check for system issues
    if (systemStatus.email_service === 'down') {
      newAlerts.push({
        id: `alert_${Date.now()}_email_service`,
        type: 'error',
        title: 'Email Service Down',
        message: 'Email service is currently unavailable. Campaigns may be delayed.',
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }
    
    if (systemStatus.database === 'degraded') {
      newAlerts.push({
        id: `alert_${Date.now()}_database`,
        type: 'warning',
        title: 'Database Performance Degraded',
        message: 'Database response times are slower than usual. Monitoring continues.',
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }
    
    // Check for campaign issues
    campaignStatuses.forEach(campaign => {
      if (campaign.errors > 3) {
        newAlerts.push({
          id: `alert_${Date.now()}_${campaign.campaign_id}`,
          type: 'error',
          title: 'High Error Rate',
          message: `Campaign "${campaign.campaign_name}" has ${campaign.errors} errors.`,
          timestamp: new Date().toISOString(),
          campaign_id: campaign.campaign_id,
          resolved: false
        });
      }
      
      if (campaign.rate_per_minute < 10) {
        newAlerts.push({
          id: `alert_${Date.now()}_slow_${campaign.campaign_id}`,
          type: 'warning',
          title: 'Slow Sending Rate',
          message: `Campaign "${campaign.campaign_name}" is sending at ${campaign.rate_per_minute} emails/minute.`,
          timestamp: new Date().toISOString(),
          campaign_id: campaign.campaign_id,
          resolved: false
        });
      }
    });
    
    // Add new alerts (limit to 10 most recent)
    setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return CheckCircle;
      case 'degraded': return AlertTriangle;
      case 'down': return XCircle;
      default: return Clock;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-Time Monitoring</h2>
          <p className="text-gray-600">Live system status and campaign monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'Monitoring' : 'Paused'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Email Service</span>
              </div>
              <div className="flex items-center gap-2">
                {React.createElement(getStatusIcon(systemStatus.email_service), {
                  className: `h-4 w-4 ${getStatusColor(systemStatus.email_service)}`
                })}
                <span className={`text-sm font-medium ${getStatusColor(systemStatus.email_service)}`}>
                  {systemStatus.email_service}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-500" />
                <span className="font-medium">Database</span>
              </div>
              <div className="flex items-center gap-2">
                {React.createElement(getStatusIcon(systemStatus.database), {
                  className: `h-4 w-4 ${getStatusColor(systemStatus.database)}`
                })}
                <span className={`text-sm font-medium ${getStatusColor(systemStatus.database)}`}>
                  {systemStatus.database}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <span className="font-medium">API</span>
              </div>
              <div className="flex items-center gap-2">
                {React.createElement(getStatusIcon(systemStatus.api), {
                  className: `h-4 w-4 ${getStatusColor(systemStatus.api)}`
                })}
                <span className={`text-sm font-medium ${getStatusColor(systemStatus.api)}`}>
                  {systemStatus.api}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-500" />
                <span className="font-medium">Webhooks</span>
              </div>
              <div className="flex items-center gap-2">
                {React.createElement(getStatusIcon(systemStatus.webhooks), {
                  className: `h-4 w-4 ${getStatusColor(systemStatus.webhooks)}`
                })}
                <span className={`text-sm font-medium ${getStatusColor(systemStatus.webhooks)}`}>
                  {systemStatus.webhooks}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Last updated: {formatTime(systemStatus.last_updated)}
          </div>
        </CardContent>
      </Card>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Active Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaignStatuses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No active campaigns</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaignStatuses.map((campaign) => (
                <div key={campaign.campaign_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">{campaign.campaign_name}</h4>
                      <p className="text-sm text-gray-600">
                        {campaign.sent_count.toLocaleString()} of {campaign.target_count.toLocaleString()} sent
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{campaign.rate_per_minute}/min</Badge>
                      {campaign.errors > 0 && (
                        <Badge variant="destructive">{campaign.errors} errors</Badge>
                      )}
                      {campaign.warnings > 0 && (
                        <Badge variant="secondary">{campaign.warnings} warnings</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{campaign.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={campaign.progress} className="h-2" />
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Rate:</span>
                      <span className="ml-1 font-medium">{campaign.rate_per_minute}/min</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ETA:</span>
                      <span className="ml-1 font-medium">
                        {new Date(campaign.estimated_completion).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Errors:</span>
                      <span className="ml-1 font-medium text-red-600">{campaign.errors}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Warnings:</span>
                      <span className="ml-1 font-medium text-yellow-600">{campaign.warnings}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <p>No alerts</p>
              <p className="text-sm">All systems operating normally</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const alertConfig = ALERT_TYPES[alert.type];
                const Icon = alertConfig.icon;
                
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      alert.resolved ? 'opacity-50' : ''
                    } ${alertConfig.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 ${alertConfig.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{alert.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatDuration(alert.timestamp)}
                          </span>
                          {!alert.resolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      {alert.campaign_id && (
                        <p className="text-xs text-gray-500 mt-1">
                          Campaign ID: {alert.campaign_id}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {formatTime(lastUpdate.toISOString())}
      </div>
    </div>
  );
}
