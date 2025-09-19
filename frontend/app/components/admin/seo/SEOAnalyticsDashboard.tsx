// SEO Analytics Dashboard Component
// Created: 2025-01-27
// Purpose: Comprehensive SEO analytics and reporting interface

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  SEOAnalyticsData,
  SEOReport,
  SEOAlert,
  ReportTemplate
} from '@/types/seo';

interface SEOAnalyticsDashboardProps {
  organizationId: string;
}

export default function SEOAnalyticsDashboard({ organizationId }: SEOAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<SEOAnalyticsData | null>(null);
  const [alerts, setAlerts] = useState<SEOAlert[]>([]);
  const [reports, setReports] = useState<SEOReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'reports' | 'alerts' | 'trends'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, [organizationId, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard data
      const response = await fetch(`/api/admin/seo/analytics?organizationId=${organizationId}&type=dashboard-data&period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to load dashboard data');
      const data = await response.json();
      
      setAnalyticsData(data.data.analytics);
      setAlerts(data.data.alerts);
      setTemplates(data.data.templates);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch('/api/admin/seo/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-report',
          organizationId,
          templateId: selectedTemplate,
          period: selectedPeriod
        })
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      
      // Reload data
      await loadDashboardData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/seo/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resolve-alert',
          organizationId,
          data: { alertId }
        })
      });

      if (!response.ok) throw new Error('Failed to resolve alert');

      // Reload alerts
      const alertsResponse = await fetch(`/api/admin/seo/analytics?organizationId=${organizationId}&type=alerts`);
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve alert');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      case 'improving': return 'text-green-600';
      case 'stable': return 'text-blue-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      case 'improving': return 'bg-green-100 text-green-800';
      case 'stable': return 'bg-blue-100 text-blue-800';
      case 'declining': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">SEO Analytics & Reporting</h2>
          <p className="text-gray-600">Comprehensive SEO analytics and reporting dashboard</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <Button
            onClick={loadDashboardData}
            variant="outline"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'analytics', name: 'Analytics' },
            { id: 'reports', name: 'Reports' },
            { id: 'alerts', name: 'Alerts' },
            { id: 'trends', name: 'Trends' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analyticsData && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.metrics.totalKeywords}</div>
                <p className="text-xs text-gray-600">
                  {analyticsData.trends.keywordGrowth > 0 ? '+' : ''}{analyticsData.trends.keywordGrowth.toFixed(1)}% growth
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Traffic</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.metrics.totalTraffic.toLocaleString()}</div>
                <p className="text-xs text-gray-600">
                  {analyticsData.trends.trafficGrowth > 0 ? '+' : ''}{analyticsData.trends.trafficGrowth.toFixed(1)}% growth
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.compliance.complianceScore.toFixed(1)}%</div>
                <p className="text-xs text-gray-600">
                  {analyticsData.compliance.compliantUrls}/{analyticsData.compliance.totalUrls} URLs
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${getStatusColor(analyticsData.trends.performanceTrend)}`}>
                  {analyticsData.trends.performanceTrend}
                </div>
                <p className="text-xs text-gray-600">Overall performance</p>
              </CardContent>
            </Card>
          </div>

          {/* Healthcare Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Healthcare SEO Metrics</CardTitle>
              <CardDescription>Healthcare-specific SEO performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analyticsData.healthcareMetrics.medicalKeywords}</div>
                  <div className="text-sm text-gray-600">Medical Keywords</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analyticsData.healthcareMetrics.healthcareComplianceScore.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Compliance Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analyticsData.healthcareMetrics.medicalAccuracyScore.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Medical Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analyticsData.healthcareMetrics.patientFacingContent}</div>
                  <div className="text-sm text-gray-600">Patient Content</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Technical and user experience performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analyticsData.performance.pageSpeedScore.toFixed(0)}</div>
                  <div className="text-sm text-gray-600">Page Speed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analyticsData.performance.mobileUsabilityScore.toFixed(0)}</div>
                  <div className="text-sm text-gray-600">Mobile Usability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analyticsData.performance.accessibilityScore.toFixed(0)}</div>
                  <div className="text-sm text-gray-600">Accessibility</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analyticsData.metrics.averageCtr.toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">Average CTR</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analyticsData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analytics</CardTitle>
              <CardDescription>Comprehensive SEO analytics breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">General Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Pages</span>
                      <span className="font-medium">{analyticsData.metrics.totalPages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Backlinks</span>
                      <span className="font-medium">{analyticsData.metrics.totalBacklinks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Position</span>
                      <span className="font-medium">{analyticsData.metrics.averagePosition.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Clicks</span>
                      <span className="font-medium">{analyticsData.metrics.totalClicks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Impressions</span>
                      <span className="font-medium">{analyticsData.metrics.totalImpressions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">User Experience</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bounce Rate</span>
                      <span className="font-medium">{analyticsData.metrics.bounceRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Session Duration</span>
                      <span className="font-medium">{Math.floor(analyticsData.metrics.averageSessionDuration / 60)}m {Math.floor(analyticsData.metrics.averageSessionDuration % 60)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pages per Session</span>
                      <span className="font-medium">{analyticsData.metrics.pagesPerSession.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Conversion Rate</span>
                      <span className="font-medium">{analyticsData.metrics.conversionRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Organic Traffic</span>
                      <span className="font-medium">{analyticsData.metrics.organicTraffic.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
              <CardDescription>Create and schedule SEO reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template">Report Template</Label>
                  <select
                    id="template"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </option>
                    ))}
                  </select>
                </div>
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={!selectedTemplate}
                  className="w-full"
                >
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Monitor and manage SEO alerts</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {alert.healthcareSpecific && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Healthcare
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No active alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && analyticsData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
              <CardDescription>SEO performance trends and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Growth Trends</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Keyword Growth</span>
                      <span className={`font-medium ${analyticsData.trends.keywordGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsData.trends.keywordGrowth > 0 ? '+' : ''}{analyticsData.trends.keywordGrowth.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Traffic Growth</span>
                      <span className={`font-medium ${analyticsData.trends.trafficGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsData.trends.trafficGrowth > 0 ? '+' : ''}{analyticsData.trends.trafficGrowth.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Backlink Growth</span>
                      <span className={`font-medium ${analyticsData.trends.backlinkGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsData.trends.backlinkGrowth > 0 ? '+' : ''}{analyticsData.trends.backlinkGrowth.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Compliance Improvement</span>
                      <span className={`font-medium ${analyticsData.trends.complianceImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsData.trends.complianceImprovement > 0 ? '+' : ''}{analyticsData.trends.complianceImprovement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Competitor Comparison</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ranking Comparison</span>
                      <span className={`font-medium ${analyticsData.trends.competitorComparison.rankingComparison > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsData.trends.competitorComparison.rankingComparison > 0 ? '+' : ''}{analyticsData.trends.competitorComparison.rankingComparison.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Traffic Comparison</span>
                      <span className={`font-medium ${analyticsData.trends.competitorComparison.trafficComparison > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsData.trends.competitorComparison.trafficComparison > 0 ? '+' : ''}{analyticsData.trends.competitorComparison.trafficComparison.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Backlink Comparison</span>
                      <span className={`font-medium ${analyticsData.trends.competitorComparison.backlinkComparison > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsData.trends.competitorComparison.backlinkComparison > 0 ? '+' : ''}{analyticsData.trends.competitorComparison.backlinkComparison.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
