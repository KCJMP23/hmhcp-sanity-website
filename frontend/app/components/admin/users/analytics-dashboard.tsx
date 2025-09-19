/**
 * User Activity Analytics Dashboard
 * Healthcare-compliant user activity monitoring and analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Activity, 
  Shield, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Download,
  RefreshCw
} from 'lucide-react';

interface UserActivityMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  loginActivity: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  roleDistribution: {
    admin: number;
    editor: number;
    viewer: number;
    healthcare_professional: number;
    content_manager: number;
    compliance_officer: number;
    system_administrator: number;
  };
  mfaAdoption: {
    enabled: number;
    disabled: number;
    percentage: number;
  };
  securityIncidents: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  complianceStatus: {
    compliant: number;
    nonCompliant: number;
    pending: number;
  };
}

interface ActivityTimeline {
  id: string;
  user: string;
  action: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  healthcare_sensitive: boolean;
  organization: string;
}

interface AnalyticsDashboardProps {
  organizationId: string;
  refreshInterval?: number; // in milliseconds
}

export function UserActivityAnalyticsDashboard({ 
  organizationId, 
  refreshInterval = 30000 
}: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<UserActivityMetrics | null>(null);
  const [activityTimeline, setActivityTimeline] = useState<ActivityTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/users/analytics?organization_id=${organizationId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data.metrics);
      setActivityTimeline(data.activityTimeline);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [organizationId, refreshInterval]);

  const exportAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/users/analytics/export?organization_id=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export analytics');
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">Error loading analytics: {error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAnalytics}
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Activity Analytics</h2>
          <p className="text-gray-600">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportAnalytics}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeUsers} active, {metrics.inactiveUsers} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newUsersToday}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.newUsersThisWeek} this week, {metrics.newUsersThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Login Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.loginActivity.today}</div>
            <p className="text-xs text-muted-foreground">
              Today • {metrics.loginActivity.thisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MFA Adoption</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.mfaAdoption.percentage}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.mfaAdoption.enabled} enabled, {metrics.mfaAdoption.disabled} disabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution and Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.roleDistribution).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {role.replace('_', ' ')}
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-600">Critical</span>
                <Badge variant="destructive">{metrics.securityIncidents.critical}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-600">Warning</span>
                <Badge variant="secondary">{metrics.securityIncidents.warning}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-600">Info</span>
                <Badge variant="outline">{metrics.securityIncidents.info}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <Badge variant="outline">{metrics.securityIncidents.total}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Healthcare Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.complianceStatus.compliant}
              </div>
              <p className="text-sm text-muted-foreground">Compliant</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.complianceStatus.nonCompliant}
              </div>
              <p className="text-sm text-muted-foreground">Non-Compliant</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.complianceStatus.pending}
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activityTimeline.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.severity === 'critical' ? 'bg-red-500' :
                    activity.severity === 'high' ? 'bg-orange-500' :
                    activity.severity === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{activity.user}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {activity.healthcare_sensitive && (
                    <Badge variant="outline" className="text-xs">
                      Healthcare
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
