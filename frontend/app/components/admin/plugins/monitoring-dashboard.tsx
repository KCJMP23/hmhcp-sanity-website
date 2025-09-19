'use client';

/**
 * Monitoring Dashboard Component
 * 
 * Real-time monitoring dashboard for developer usage, API performance,
 * plugin marketplace metrics, and enterprise integration health.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Users, 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  Download,
  Globe,
  Shield,
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface MonitoringDashboardProps {
  className?: string;
}

interface RealTimeMetrics {
  activeUsers: number;
  currentRequests: number;
  averageResponseTime: number;
  errorRate: number;
  systemHealth: number;
  alerts: Alert[];
}

interface Alert {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  resolved: boolean;
}

interface DeveloperAnalytics {
  totalDevelopers: number;
  activeDevelopers: number;
  newDevelopers: number;
  developerGrowth: number;
  topSpecializations: SpecializationStats[];
  geographicDistribution: GeographicStats[];
  engagementMetrics: EngagementMetrics;
  skillLevelDistribution: SkillLevelStats[];
}

interface SpecializationStats {
  specialization: string;
  count: number;
  growth: number;
  averageRating: number;
}

interface GeographicStats {
  region: string;
  country: string;
  developerCount: number;
  growth: number;
  averageActivity: number;
}

interface EngagementMetrics {
  averageSessionDuration: number;
  averageSessionsPerWeek: number;
  averagePluginsPerDeveloper: number;
  averageCodeSnippetsPerDeveloper: number;
  forumParticipationRate: number;
  documentationUsageRate: number;
}

interface SkillLevelStats {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  count: number;
  percentage: number;
  averageContribution: number;
}

interface APIUsageAnalytics {
  totalRequests: number;
  requestsPerHour: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: EndpointStats[];
  usageByDeveloper: DeveloperUsageStats[];
  peakUsageHours: HourlyStats[];
  complianceMetrics: ComplianceMetrics;
}

interface EndpointStats {
  endpoint: string;
  method: string;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  successRate: number;
  lastUsed: Date;
}

interface DeveloperUsageStats {
  developerId: string;
  developerName: string;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  mostUsedEndpoints: string[];
  lastActivity: Date;
}

interface HourlyStats {
  hour: number;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
}

interface ComplianceMetrics {
  totalValidations: number;
  validationSuccessRate: number;
  frameworkBreakdown: FrameworkStats[];
  violationTrends: ViolationTrend[];
  complianceScore: number;
}

interface FrameworkStats {
  framework: string;
  validations: number;
  successRate: number;
  averageScore: number;
  commonViolations: string[];
}

interface ViolationTrend {
  date: Date;
  violations: number;
  framework: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function MonitoringDashboard({ className }: MonitoringDashboardProps) {
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [developerAnalytics, setDeveloperAnalytics] = useState<DeveloperAnalytics | null>(null);
  const [apiAnalytics, setApiAnalytics] = useState<APIUsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadMonitoringData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      
      // Load real-time metrics
      const realTimeResponse = await fetch('/api/plugins/developer/monitoring/realtime');
      const realTimeData = await realTimeResponse.json();
      setRealTimeMetrics(realTimeData);

      // Load developer analytics
      const devResponse = await fetch(`/api/plugins/developer/monitoring/developers?range=${selectedTimeRange}`);
      const devData = await devResponse.json();
      setDeveloperAnalytics(devData);

      // Load API analytics
      const apiResponse = await fetch(`/api/plugins/developer/monitoring/api?range=${selectedTimeRange}`);
      const apiData = await apiResponse.json();
      setApiAnalytics(apiData);

      setError(null);
    } catch (err) {
      setError('Failed to load monitoring data');
      console.error('Monitoring data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (health: number) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthStatusIcon = (health: number) => {
    if (health >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (health >= 70) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getAlertSeverityColor = (type: string) => {
    if (type.includes('critical') || type.includes('error')) return 'bg-red-100 text-red-800';
    if (type.includes('warning') || type.includes('degraded')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading && !realTimeMetrics) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-red-600">
              <AlertTriangle className="h-6 w-6 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoring Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring and analytics for the developer platform</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button onClick={loadMonitoringData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      {realTimeMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{realTimeMetrics.activeUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{realTimeMetrics.currentRequests}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{realTimeMetrics.averageResponseTime}ms</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <div className="flex items-center space-x-2">
                    <p className={`text-2xl font-bold ${getHealthStatusColor(realTimeMetrics.systemHealth)}`}>
                      {realTimeMetrics.systemHealth}%
                    </p>
                    {getHealthStatusIcon(realTimeMetrics.systemHealth)}
                  </div>
                </div>
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {realTimeMetrics && realTimeMetrics.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Active Alerts</span>
              <Badge variant="destructive">{realTimeMetrics.alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {realTimeMetrics.alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={getAlertSeverityColor(alert.type)}>
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium">{alert.data.description || alert.type}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="developers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="developers">Developers</TabsTrigger>
          <TabsTrigger value="api">API Usage</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        {/* Developer Analytics */}
        <TabsContent value="developers" className="space-y-6">
          {developerAnalytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Developers</p>
                        <p className="text-2xl font-bold text-gray-900">{developerAnalytics.totalDevelopers}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Developers</p>
                        <p className="text-2xl font-bold text-gray-900">{developerAnalytics.activeDevelopers}</p>
                      </div>
                      <Activity className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">New Developers</p>
                        <p className="text-2xl font-bold text-gray-900">{developerAnalytics.newDevelopers}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{developerAnalytics.developerGrowth}%</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Specializations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {developerAnalytics.topSpecializations.map((spec, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{spec.specialization}</p>
                            <p className="text-sm text-gray-600">{spec.count} developers</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{spec.averageRating.toFixed(1)} ⭐</p>
                            <p className="text-sm text-green-600">+{spec.growth}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {developerAnalytics.geographicDistribution.map((geo, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{geo.country}</p>
                            <p className="text-sm text-gray-600">{geo.region}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{geo.developerCount}</p>
                            <p className="text-sm text-green-600">+{geo.growth}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* API Usage Analytics */}
        <TabsContent value="api" className="space-y-6">
          {apiAnalytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Requests</p>
                        <p className="text-2xl font-bold text-gray-900">{apiAnalytics.totalRequests.toLocaleString()}</p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Requests/Hour</p>
                        <p className="text-2xl font-bold text-gray-900">{apiAnalytics.requestsPerHour}</p>
                      </div>
                      <Zap className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                        <p className="text-2xl font-bold text-gray-900">{apiAnalytics.averageResponseTime}ms</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Error Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{apiAnalytics.errorRate.toFixed(2)}%</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Endpoints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {apiAnalytics.topEndpoints.map((endpoint, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{endpoint.method} {endpoint.endpoint}</p>
                            <p className="text-sm text-gray-600">{endpoint.requestCount} requests</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{endpoint.averageResponseTime}ms</p>
                            <p className="text-sm text-red-600">{endpoint.errorRate.toFixed(1)}% errors</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Validations</span>
                        <span className="text-sm">{apiAnalytics.complianceMetrics.totalValidations}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Success Rate</span>
                        <span className="text-sm text-green-600">
                          {apiAnalytics.complianceMetrics.validationSuccessRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Compliance Score</span>
                        <span className="text-sm font-bold text-blue-600">
                          {apiAnalytics.complianceMetrics.complianceScore.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Marketplace Analytics */}
        <TabsContent value="marketplace" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <Download className="h-12 w-12 mx-auto mb-4" />
                <p>Marketplace analytics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Analytics */}
        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <Globe className="h-12 w-12 mx-auto mb-4" />
                <p>Integration analytics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

