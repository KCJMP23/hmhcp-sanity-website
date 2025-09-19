/**
 * Analytics Dashboard Component
 * 
 * This component provides a comprehensive analytics dashboard for monitoring
 * the Advanced Customization & Theming Framework.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

interface AnalyticsDashboardProps {
  organizationId: string;
  initialDateRange?: {
    from: Date;
    to: Date;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  description 
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase': return 'text-green-600';
      case 'decrease': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase': return '↗';
      case 'decrease': return '↘';
      default: return '→';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getChangeColor()}`}>
            <span className="mr-1">{getChangeIcon()}</span>
            <span>{Math.abs(change)}%</span>
            <span className="ml-1">from last period</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  organizationId,
  initialDateRange
}) => {
  const [dateRange, setDateRange] = useState(initialDateRange || {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [selectedComponent, setSelectedComponent] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - in real implementation, this would come from the analytics service
  const [analyticsData, setAnalyticsData] = useState({
    themeAnalytics: {
      totalThemes: 12,
      activeThemes: 8,
      themeUsage: 1250,
      averageLoadTime: 1.2,
      userSatisfaction: 4.5
    },
    dashboardAnalytics: {
      totalDashboards: 25,
      activeDashboards: 18,
      totalViews: 5420,
      averageTimeSpent: 8.5,
      mostUsedWidget: 'Patient Summary'
    },
    fieldAnalytics: {
      totalFields: 156,
      activeFields: 142,
      totalUses: 8940,
      completionRate: 94.2,
      errorRate: 2.1
    },
    workflowAnalytics: {
      totalWorkflows: 8,
      activeWorkflows: 6,
      totalExecutions: 2340,
      successRate: 96.8,
      averageExecutionTime: 45.2
    },
    systemPerformance: {
      cpuUsage: 45.2,
      memoryUsage: 67.8,
      responseTime: 180,
      errorRate: 0.8,
      uptime: 99.9
    }
  });

  // Mock chart data
  const usageOverTimeData = [
    { date: '2025-01-01', themes: 120, dashboards: 450, fields: 890, workflows: 45 },
    { date: '2025-01-02', themes: 135, dashboards: 520, fields: 920, workflows: 52 },
    { date: '2025-01-03', themes: 142, dashboards: 480, fields: 850, workflows: 48 },
    { date: '2025-01-04', themes: 158, dashboards: 600, fields: 1100, workflows: 65 },
    { date: '2025-01-05', themes: 165, dashboards: 580, fields: 1050, workflows: 58 },
    { date: '2025-01-06', themes: 172, dashboards: 620, fields: 1200, workflows: 72 },
    { date: '2025-01-07', themes: 180, dashboards: 650, fields: 1250, workflows: 75 }
  ];

  const performanceData = [
    { time: '00:00', cpu: 35, memory: 45, response: 120 },
    { time: '04:00', cpu: 30, memory: 42, response: 110 },
    { time: '08:00', cpu: 55, memory: 65, response: 180 },
    { time: '12:00', cpu: 70, memory: 75, response: 220 },
    { time: '16:00', cpu: 65, memory: 70, response: 200 },
    { time: '20:00', cpu: 45, memory: 55, response: 150 },
    { time: '24:00', cpu: 40, memory: 50, response: 130 }
  ];

  const complianceData = [
    { name: 'HIPAA', score: 95, color: '#10B981' },
    { name: 'Accessibility', score: 88, color: '#3B82F6' },
    { name: 'Performance', score: 92, color: '#F59E0B' },
    { name: 'Security', score: 96, color: '#EF4444' }
  ];

  const topThemesData = [
    { name: 'Healthcare Blue', usage: 450, satisfaction: 4.8 },
    { name: 'Medical Green', usage: 320, satisfaction: 4.6 },
    { name: 'Clinical White', usage: 280, satisfaction: 4.4 },
    { name: 'Emergency Red', usage: 150, satisfaction: 4.2 },
    { name: 'Pediatric Pink', usage: 120, satisfaction: 4.7 }
  ];

  const alerts = [
    {
      id: '1',
      type: 'performance',
      severity: 'high',
      title: 'High CPU Usage Detected',
      description: 'CPU usage has exceeded 80% for the past 15 minutes',
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: '2',
      type: 'compliance',
      severity: 'medium',
      title: 'Accessibility Score Below Threshold',
      description: 'Theme accessibility score is 88%, below recommended 90%',
      timestamp: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: '3',
      type: 'usage',
      severity: 'low',
      title: 'Low Dashboard Engagement',
      description: 'Dashboard views have decreased by 15% this week',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📊';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor performance, usage, and compliance across your customization framework
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Select value={selectedComponent} onValueChange={setSelectedComponent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select component" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Components</SelectItem>
              <SelectItem value="themes">Themes</SelectItem>
              <SelectItem value="dashboards">Dashboards</SelectItem>
              <SelectItem value="fields">Custom Fields</SelectItem>
              <SelectItem value="workflows">Workflows</SelectItem>
              <SelectItem value="white-label">White-Label</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setLoading(true)}>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Active Alerts</h3>
          {alerts.map((alert) => (
            <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>{getSeverityIcon(alert.severity)}</span>
                  <div>
                    <AlertDescription className="font-medium">
                      {alert.title}
                    </AlertDescription>
                    <p className="text-sm opacity-80">{alert.description}</p>
                  </div>
                </div>
                <div className="text-xs opacity-60">
                  {alert.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Themes"
          value={analyticsData.themeAnalytics.totalThemes}
          change={12}
          changeType="increase"
          description="Active themes in your organization"
        />
        <MetricCard
          title="Dashboard Views"
          value={analyticsData.dashboardAnalytics.totalViews.toLocaleString()}
          change={8}
          changeType="increase"
          description="Total views this month"
        />
        <MetricCard
          title="Custom Fields"
          value={analyticsData.fieldAnalytics.totalFields}
          change={5}
          changeType="increase"
          description="Fields created and configured"
        />
        <MetricCard
          title="System Uptime"
          value={`${analyticsData.systemPerformance.uptime}%`}
          change={0.1}
          changeType="increase"
          description="System availability"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Usage Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usageOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="themes" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="dashboards" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="fields" stroke="#F59E0B" strokeWidth={2} />
                    <Line type="monotone" dataKey="workflows" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Themes */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topThemesData.map((theme, index) => (
                    <div key={theme.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{theme.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {theme.usage} uses • {theme.satisfaction}★
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {theme.usage} uses
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="cpu" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="memory" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="response" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${analyticsData.systemPerformance.cpuUsage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {analyticsData.systemPerformance.cpuUsage}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${analyticsData.systemPerformance.memoryUsage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {analyticsData.systemPerformance.memoryUsage}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(analyticsData.systemPerformance.responseTime / 1000) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {analyticsData.systemPerformance.responseTime}ms
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Error Rate</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${analyticsData.systemPerformance.errorRate * 10}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {analyticsData.systemPerformance.errorRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Usage by Component */}
            <Card>
              <CardHeader>
                <CardTitle>Usage by Component</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Themes', usage: analyticsData.themeAnalytics.themeUsage },
                    { name: 'Dashboards', usage: analyticsData.dashboardAnalytics.totalViews },
                    { name: 'Fields', usage: analyticsData.fieldAnalytics.totalUses },
                    { name: 'Workflows', usage: analyticsData.workflowAnalytics.totalExecutions }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Daily Active Users</span>
                    <span className="text-2xl font-bold">1,234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weekly Active Users</span>
                    <span className="text-2xl font-bold">4,567</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Active Users</span>
                    <span className="text-2xl font-bold">12,345</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">User Retention</span>
                    <span className="text-2xl font-bold">87%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Compliance Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={complianceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="score"
                    >
                      {complianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Compliance Details */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              width: `${item.score}%`,
                              backgroundColor: item.color 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{item.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                        💡
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900">Performance Optimization Opportunity</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Theme loading times have increased by 15% this week. Consider optimizing image assets and implementing lazy loading to improve user experience.
                        </p>
                        <div className="mt-2">
                          <Button size="sm" variant="outline" className="text-blue-700 border-blue-300">
                            View Recommendations
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                        📈
                      </div>
                      <div>
                        <h4 className="font-medium text-green-900">High User Engagement</h4>
                        <p className="text-sm text-green-700 mt-1">
                          Dashboard usage has increased by 25% this month. Users are spending an average of 8.5 minutes per session, indicating strong engagement.
                        </p>
                        <div className="mt-2">
                          <Button size="sm" variant="outline" className="text-green-700 border-green-300">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm">
                        ⚠️
                      </div>
                      <div>
                        <h4 className="font-medium text-yellow-900">Compliance Attention Needed</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Accessibility score is 88%, below the recommended 90% threshold. Review WCAG compliance and consider accessibility improvements.
                        </p>
                        <div className="mt-2">
                          <Button size="sm" variant="outline" className="text-yellow-700 border-yellow-300">
                            Fix Issues
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
