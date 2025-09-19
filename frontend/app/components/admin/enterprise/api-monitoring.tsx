/**
 * Enterprise API Monitoring Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Shield,
  Clock,
  DollarSign,
  BarChart3,
  Zap
} from 'lucide-react';

interface HealthcareMetrics {
  organizationId: string;
  timeRange: {
    start: string;
    end: string;
  };
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  healthcareRequests: number;
  complianceViolations: number;
  averageResponseTime: number;
  errorRate: number;
  availability: number;
  topEndpoints: any[];
  errorBreakdown: any[];
  complianceStatus: {
    hipaaCompliance: number;
    fhirCompliance: number;
    auditLogging: number;
    dataEncryption: number;
    accessControl: number;
    overallScore: number;
  };
  performanceTrends: any[];
}

interface Alert {
  id: string;
  ruleId: string;
  organizationId: string;
  severity: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  healthcareImpact: boolean;
  complianceFlags: string[];
}

export default function APIMonitoringComponent() {
  const [metrics, setMetrics] = useState<HealthcareMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadMetrics();
    loadAlerts();
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/enterprise/monitoring/metrics?organizationId=org-123&type=healthcare&timeRange=${timeRange}`);
      const data = await response.json();
      
      if (data) {
        setMetrics(data);
      } else {
        // Mock data for now
        setMetrics({
          organizationId: 'org-123',
          timeRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          },
          totalRequests: 15420,
          successfulRequests: 14850,
          failedRequests: 570,
          healthcareRequests: 8920,
          complianceViolations: 12,
          averageResponseTime: 245,
          errorRate: 3.7,
          availability: 96.3,
          topEndpoints: [
            { endpoint: '/api/enterprise/fhir/Patient', method: 'GET', requestCount: 4500, averageResponseTime: 180, errorRate: 2.1, healthcarePriority: true, complianceScore: 98 },
            { endpoint: '/api/enterprise/graph/users', method: 'GET', requestCount: 3200, averageResponseTime: 220, errorRate: 1.8, healthcarePriority: true, complianceScore: 95 },
            { endpoint: '/api/enterprise/sso/auth', method: 'POST', requestCount: 2800, averageResponseTime: 350, errorRate: 4.2, healthcarePriority: true, complianceScore: 92 }
          ],
          errorBreakdown: [
            { statusCode: 429, count: 250, percentage: 43.9, description: 'Too Many Requests', healthcareImpact: true },
            { statusCode: 500, count: 180, percentage: 31.6, description: 'Internal Server Error', healthcareImpact: true },
            { statusCode: 401, count: 90, percentage: 15.8, description: 'Unauthorized', healthcareImpact: false },
            { statusCode: 404, count: 50, percentage: 8.7, description: 'Not Found', healthcareImpact: false }
          ],
          complianceStatus: {
            hipaaCompliance: 98.5,
            fhirCompliance: 96.2,
            auditLogging: 99.1,
            dataEncryption: 100,
            accessControl: 97.8,
            overallScore: 98.3
          },
          performanceTrends: []
        });
      }
    } catch (err) {
      setError('Failed to load monitoring metrics');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      // Mock data for now
      setAlerts([
        {
          id: '1',
          ruleId: 'rule-1',
          organizationId: 'org-123',
          severity: 'high',
          message: 'High error rate detected on FHIR endpoints',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          resolved: false,
          healthcareImpact: true,
          complianceFlags: ['HIPAA_AUDIT_REQUIRED']
        },
        {
          id: '2',
          ruleId: 'rule-2',
          organizationId: 'org-123',
          severity: 'medium',
          message: 'Response time exceeded threshold',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved: true,
          healthcareImpact: false,
          complianceFlags: []
        }
      ]);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (value: number, threshold: number = 95) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold - 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Monitoring</h2>
          <p className="text-gray-600">Real-time monitoring and analytics for healthcare APIs</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.totalRequests.toLocaleString()}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600">+12.5%</span>
                  <span className="text-gray-500 ml-1">from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Availability</p>
                    <p className={`text-2xl font-bold ${getStatusColor(metrics?.availability || 0)}`}>
                      {metrics?.availability.toFixed(1)}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600">+0.3%</span>
                  <span className="text-gray-500 ml-1">from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Error Rate</p>
                    <p className={`text-2xl font-bold ${getStatusColor(100 - (metrics?.errorRate || 0))}`}>
                      {metrics?.errorRate.toFixed(1)}%
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600">-0.8%</span>
                  <span className="text-gray-500 ml-1">from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Response Time</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.averageResponseTime}ms</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600">-15ms</span>
                  <span className="text-gray-500 ml-1">from last period</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Healthcare Specific Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Healthcare Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Healthcare Priority</span>
                    <span className="text-sm font-bold text-green-600">
                      {metrics?.healthcareRequests.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${((metrics?.healthcareRequests || 0) / (metrics?.totalRequests || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {(((metrics?.healthcareRequests || 0) / (metrics?.totalRequests || 1)) * 100).toFixed(1)}% of total requests
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  Compliance Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Violations</span>
                    <span className="text-sm font-bold text-red-600">
                      {metrics?.complianceViolations}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(((metrics?.complianceViolations || 0) / (metrics?.totalRequests || 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {(((metrics?.complianceViolations || 0) / (metrics?.totalRequests || 1)) * 100).toFixed(3)}% of total requests
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Endpoints</CardTitle>
              <CardDescription>Most frequently used API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.topEndpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{endpoint.method}</Badge>
                      <code className="text-sm font-mono">{endpoint.endpoint}</code>
                      {endpoint.healthcarePriority && (
                        <Badge variant="outline" className="text-green-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Healthcare
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{endpoint.requestCount.toLocaleString()}</p>
                        <p className="text-gray-500">Requests</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{endpoint.averageResponseTime}ms</p>
                        <p className="text-gray-500">Avg Time</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-medium ${getStatusColor(100 - endpoint.errorRate)}`}>
                          {endpoint.errorRate.toFixed(1)}%
                        </p>
                        <p className="text-gray-500">Error Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{endpoint.complianceScore.toFixed(0)}%</p>
                        <p className="text-gray-500">Compliance</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>Healthcare compliance metrics and scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">HIPAA Compliance</span>
                      <span className={`text-sm font-bold ${getStatusColor(metrics?.complianceStatus.hipaaCompliance || 0)}`}>
                        {metrics?.complianceStatus.hipaaCompliance.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${metrics?.complianceStatus.hipaaCompliance || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">FHIR Compliance</span>
                      <span className={`text-sm font-bold ${getStatusColor(metrics?.complianceStatus.fhirCompliance || 0)}`}>
                        {metrics?.complianceStatus.fhirCompliance.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${metrics?.complianceStatus.fhirCompliance || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Audit Logging</span>
                      <span className={`text-sm font-bold ${getStatusColor(metrics?.complianceStatus.auditLogging || 0)}`}>
                        {metrics?.complianceStatus.auditLogging.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${metrics?.complianceStatus.auditLogging || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Data Encryption</span>
                      <span className={`text-sm font-bold ${getStatusColor(metrics?.complianceStatus.dataEncryption || 0)}`}>
                        {metrics?.complianceStatus.dataEncryption.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${metrics?.complianceStatus.dataEncryption || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Overall Compliance Score</span>
                    <span className={`text-2xl font-bold ${getStatusColor(metrics?.complianceStatus.overallScore || 0)}`}>
                      {metrics?.complianceStatus.overallScore.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                    <div 
                      className="bg-green-600 h-3 rounded-full" 
                      style={{ width: `${metrics?.complianceStatus.overallScore || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {alert.healthcareImpact && (
                        <Badge variant="outline" className="text-red-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Healthcare Impact
                        </Badge>
                      )}
                      {alert.resolved ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline">
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}