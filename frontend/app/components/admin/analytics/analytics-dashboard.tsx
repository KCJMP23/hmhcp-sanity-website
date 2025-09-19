'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HealthcareKPIMetrics, 
  BlogPostAnalytics, 
  SEOPerformanceData,
  ConversionFunnelData,
  ABTestData,
  AnalyticsAlert,
  RealTimeAnalyticsData
} from '@/types/analytics';
import { 
  BarChart3, 
  RefreshCw,
  Download,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { KPIMetricCard } from './kpi-widget';
import { RealTimeMonitor } from './real-time-monitor';
import { ComplianceStatus } from './compliance-status';

interface AnalyticsDashboardProps {
  kpiMetrics: HealthcareKPIMetrics | null;
  blogAnalytics: BlogPostAnalytics[];
  seoData: SEOPerformanceData[];
  conversionData: ConversionFunnelData[];
  abTests: ABTestData[];
  alerts: AnalyticsAlert[];
  realTimeData: RealTimeAnalyticsData | null;
  isLoading: boolean;
  lastUpdated: string;
  healthcareCompliance: boolean;
  onRefresh: () => void;
}

export function AnalyticsDashboard({
  kpiMetrics,
  blogAnalytics,
  seoData,
  conversionData,
  abTests,
  alerts,
  realTimeData,
  isLoading,
  lastUpdated,
  healthcareCompliance,
  onRefresh
}: AnalyticsDashboardProps) {
  // Healthcare Professional vs Patient Segmentation
  const AudienceSegmentation = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">👥</span>
          Audience Segmentation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Healthcare Professionals</span>
            <span className="text-sm text-blue-600 font-semibold">
              {kpiMetrics?.healthcareProfessionalViews || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Patients</span>
            <span className="text-sm text-green-600 font-semibold">
              {kpiMetrics?.patientViews || 0}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ 
                width: `${((kpiMetrics?.healthcareProfessionalViews || 0) / 
                  ((kpiMetrics?.healthcareProfessionalViews || 0) + (kpiMetrics?.patientViews || 0))) * 100}%` 
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading healthcare analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Analytics</h1>
            <p className="text-gray-600 mt-1">
              Healthcare-specific performance monitoring and optimization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
        
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Active Alerts</h3>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="text-sm text-yellow-700">
                  <strong>{alert.title}:</strong> {alert.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPIMetricCard
          title="Total Content Views"
          value={kpiMetrics?.totalContentViews?.toLocaleString() || '0'}
          change={12}
          icon={() => <span className="text-blue-600">👁️</span>}
          healthcareContext="Healthcare content engagement"
          trend="up"
        />
        <KPIMetricCard
          title="Average Engagement Time"
          value={`${kpiMetrics?.averageEngagementTime || 0}m`}
          change={8}
          icon={() => <span className="text-blue-600">⏱️</span>}
          healthcareContext="Time spent on medical content"
          trend="up"
        />
        <KPIMetricCard
          title="Conversion Rate"
          value={`${kpiMetrics?.conversionRate || 0}%`}
          change={-2}
          icon={() => <span className="text-blue-600">🎯</span>}
          healthcareContext="Consultation inquiries"
          trend="down"
        />
        <KPIMetricCard
          title="SEO Ranking Score"
          value={kpiMetrics?.seoRankingScore || 0}
          change={15}
          icon={() => <span className="text-blue-600">📈</span>}
          healthcareContext="Healthcare keyword performance"
          trend="up"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="seo">SEO Analytics</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Tracking</TabsTrigger>
          <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AudienceSegmentation />
            </div>
            <div className="space-y-6">
              <RealTimeMonitor data={realTimeData} />
              <ComplianceStatus 
                hipaaCompliance={95}
                dataAnonymization={90}
                auditLogging={100}
                userConsent={85}
                overallScore={healthcareCompliance ? 95 : 60}
                lastAudit={new Date().toISOString()}
                violations={[]}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blog Post Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blogAnalytics.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-semibold">{post.title}</h3>
                      <p className="text-sm text-gray-600">
                        {post.category} • {post.author} • {new Date(post.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{post.views.toLocaleString()} views</div>
                      <div className="text-sm text-gray-600">{post.engagementTime}m avg</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Performance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seoData.map((keyword) => (
                  <div key={keyword.keyword} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-semibold">{keyword.keyword}</h3>
                      <p className="text-sm text-gray-600">
                        Search Volume: {keyword.searchVolume.toLocaleString()} • 
                        Difficulty: {keyword.difficulty}/100
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">Rank #{keyword.currentRanking}</div>
                      <div className={`text-sm ${keyword.trend === 'up' ? 'text-green-600' : keyword.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        {keyword.trend === 'up' ? '↗' : keyword.trend === 'down' ? '↘' : '→'} 
                        {keyword.previousRanking !== keyword.currentRanking && 
                          ` (${keyword.previousRanking > keyword.currentRanking ? '+' : ''}${keyword.previousRanking - keyword.currentRanking})`
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionData.map((stage, index) => (
                  <div key={stage.stage} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{stage.stage}</h3>
                      <p className="text-sm text-gray-600">
                        {stage.visitors.toLocaleString()} visitors • {stage.conversions.toLocaleString()} conversions
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{stage.conversionRate}%</div>
                      <div className="text-sm text-gray-600">
                        HCP: {stage.healthcareProfessionalRate}% • Patient: {stage.patientRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ab-testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {abTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-semibold">{test.name}</h3>
                      <p className="text-sm text-gray-600">
                        Variant {test.variant} • {test.views.toLocaleString()} views • 
                        {test.status === 'active' ? ' Active' : test.status === 'completed' ? ' Completed' : ' Paused'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{test.conversionRate}% conversion</div>
                      <div className="text-sm text-gray-600">
                        {test.confidence}% confidence
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Builder</h3>
                <p className="text-gray-600 mb-4">
                  Create custom healthcare analytics reports with compliance considerations
                </p>
                <Button>Create New Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}