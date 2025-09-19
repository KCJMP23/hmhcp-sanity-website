// Sitemap Management Dashboard Component
// Created: 2025-01-27
// Purpose: Comprehensive sitemap management interface

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  SitemapIndex,
  SitemapSubmission,
  SitemapPerformance,
  SitemapHealthCheck,
  SitemapGenerationConfig
} from '@/types/seo';

interface SitemapManagementDashboardProps {
  organizationId: string;
}

export default function SitemapManagementDashboard({ organizationId }: SitemapManagementDashboardProps) {
  const [sitemapStatus, setSitemapStatus] = useState<{
    sitemaps: any[];
    submissions: SitemapSubmission[];
    performance: SitemapPerformance[];
    lastGenerated: Date;
  } | null>(null);
  const [healthCheck, setHealthCheck] = useState<SitemapHealthCheck | null>(null);
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'generate' | 'submit' | 'monitor' | 'analytics'>('overview');
  const [generationConfig, setGenerationConfig] = useState<SitemapGenerationConfig>({
    organizationId,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
    includeImages: true,
    includeVideos: true,
    includeNews: false,
    maxUrlsPerSitemap: 50000,
    healthcarePrioritization: true,
    contentTypes: ['service', 'condition', 'treatment', 'provider', 'location', 'article'],
    medicalSpecialties: ['cardiology', 'oncology', 'neurology', 'dermatology'],
    targetAudiences: ['patients', 'providers', 'researchers'],
    excludePatterns: ['/admin', '/api', '/_next'],
    customPriorities: {
      '/services': 0.9,
      '/providers': 0.8,
      '/locations': 0.7,
      '/articles': 0.6
    }
  });

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load sitemap status
      const statusResponse = await fetch(`/api/admin/seo/sitemaps?organizationId=${organizationId}&type=status`);
      if (!statusResponse.ok) throw new Error('Failed to load sitemap status');
      const statusData = await statusResponse.json();
      setSitemapStatus(statusData.status);

      // Load generation config
      const configResponse = await fetch(`/api/admin/seo/sitemaps?organizationId=${organizationId}&type=sitemap-config`);
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setGenerationConfig(configData.config);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSitemap = async () => {
    try {
      const response = await fetch('/api/admin/seo/sitemaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-sitemap',
          organizationId,
          config: generationConfig
        })
      });

      if (!response.ok) throw new Error('Failed to generate sitemap');

      const data = await response.json();
      
      // Reload status
      await loadData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sitemap');
    }
  };

  const handleSubmitSitemap = async (sitemapUrl: string) => {
    try {
      const response = await fetch('/api/admin/seo/sitemaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submit-sitemap',
          organizationId,
          sitemapUrl,
          searchEngines: ['google', 'bing']
        })
      });

      if (!response.ok) throw new Error('Failed to submit sitemap');

      const data = await response.json();
      
      // Reload status
      await loadData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit sitemap');
    }
  };

  const handleHealthCheck = async (sitemapUrl: string) => {
    try {
      const response = await fetch('/api/admin/seo/sitemaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'health-check',
          organizationId,
          sitemapUrl
        })
      });

      if (!response.ok) throw new Error('Failed to perform health check');

      const data = await response.json();
      setHealthCheck(data.healthCheck);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform health check');
    }
  };

  const handleGenerateReport = async (sitemapUrl: string) => {
    try {
      const response = await fetch('/api/admin/seo/sitemaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-report',
          organizationId,
          sitemapUrl
        })
      });

      if (!response.ok) throw new Error('Failed to generate performance report');

      const data = await response.json();
      setPerformanceReport(data.report);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate performance report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-red-100 text-red-800';
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
          <p className="mt-2 text-sm text-gray-600">Loading sitemap data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sitemap Management</h2>
          <p className="text-gray-600">Generate, submit, and monitor sitemaps</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleGenerateSitemap}
            variant="outline"
          >
            Generate Sitemap
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
            { id: 'generate', name: 'Generate' },
            { id: 'submit', name: 'Submit' },
            { id: 'monitor', name: 'Monitor' },
            { id: 'analytics', name: 'Analytics' }
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sitemaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sitemapStatus?.sitemaps.length || 0}</div>
                <p className="text-xs text-gray-600">Generated sitemaps</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sitemapStatus?.submissions.length || 0}</div>
                <p className="text-xs text-gray-600">Search engine submissions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last Generated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {sitemapStatus?.lastGenerated 
                    ? new Date(sitemapStatus.lastGenerated).toLocaleDateString()
                    : 'Never'
                  }
                </div>
                <p className="text-xs text-gray-600">Sitemap generation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Health Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${getStatusColor(healthCheck?.status || 'unknown')}`}>
                  {healthCheck?.status || 'Unknown'}
                </div>
                <p className="text-xs text-gray-600">Overall health</p>
              </CardContent>
            </Card>
          </div>

          {/* Sitemaps List */}
          {sitemapStatus?.sitemaps && sitemapStatus.sitemaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Sitemaps</CardTitle>
                <CardDescription>Manage your sitemap files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sitemapStatus.sitemaps.map((sitemap, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{sitemap.loc}</h4>
                          <p className="text-sm text-gray-600">
                            {sitemap.urlCount} URLs • {sitemap.type} • {(sitemap.size / 1024).toFixed(1)}KB
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusBadgeColor(sitemap.status || 'unknown')}>
                            {sitemap.status || 'Unknown'}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitSitemap(sitemap.loc)}
                          >
                            Submit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleHealthCheck(sitemap.loc)}
                          >
                            Health Check
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Last modified: {new Date(sitemap.lastmod).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Generation Configuration</CardTitle>
              <CardDescription>Configure sitemap generation settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    value={generationConfig.baseUrl}
                    onChange={(e) => setGenerationConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="maxUrls">Max URLs per Sitemap</Label>
                  <Input
                    id="maxUrls"
                    type="number"
                    value={generationConfig.maxUrlsPerSitemap}
                    onChange={(e) => setGenerationConfig(prev => ({ ...prev, maxUrlsPerSitemap: parseInt(e.target.value) }))}
                    placeholder="50000"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <Label>Content Types</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['service', 'condition', 'treatment', 'provider', 'location', 'article'].map((type) => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={generationConfig.contentTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setGenerationConfig(prev => ({
                                  ...prev,
                                  contentTypes: [...prev.contentTypes, type]
                                }));
                              } else {
                                setGenerationConfig(prev => ({
                                  ...prev,
                                  contentTypes: prev.contentTypes.filter(t => t !== type)
                                }));
                              }
                            }}
                          />
                          <span className="text-sm capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <Label>Medical Specialties</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['cardiology', 'oncology', 'neurology', 'dermatology', 'orthopedics', 'pediatrics'].map((specialty) => (
                        <label key={specialty} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={generationConfig.medicalSpecialties.includes(specialty)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setGenerationConfig(prev => ({
                                  ...prev,
                                  medicalSpecialties: [...prev.medicalSpecialties, specialty]
                                }));
                              } else {
                                setGenerationConfig(prev => ({
                                  ...prev,
                                  medicalSpecialties: prev.medicalSpecialties.filter(s => s !== specialty)
                                }));
                              }
                            }}
                          />
                          <span className="text-sm capitalize">{specialty}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={generationConfig.includeImages}
                        onChange={(e) => setGenerationConfig(prev => ({ ...prev, includeImages: e.target.checked }))}
                      />
                      <span className="text-sm">Include Images</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={generationConfig.includeVideos}
                        onChange={(e) => setGenerationConfig(prev => ({ ...prev, includeVideos: e.target.checked }))}
                      />
                      <span className="text-sm">Include Videos</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={generationConfig.healthcarePrioritization}
                        onChange={(e) => setGenerationConfig(prev => ({ ...prev, healthcarePrioritization: e.target.checked }))}
                      />
                      <span className="text-sm">Healthcare Prioritization</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={handleGenerateSitemap} className="w-full">
                  Generate Sitemap
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monitor Tab */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          {/* Health Check Results */}
          {healthCheck && (
            <Card>
              <CardHeader>
                <CardTitle>Health Check Results</CardTitle>
                <CardDescription>Latest sitemap health analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Overall Status</span>
                    <Badge className={getStatusBadgeColor(healthCheck.status)}>
                      {healthCheck.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Response Time:</span> {healthCheck.responseTime}ms
                    </div>
                    <div>
                      <span className="text-gray-600">Status Code:</span> {healthCheck.statusCode}
                    </div>
                    <div>
                      <span className="text-gray-600">Content Length:</span> {(healthCheck.contentLength / 1024).toFixed(1)}KB
                    </div>
                    <div>
                      <span className="text-gray-600">Issues:</span> {healthCheck.issues.length}
                    </div>
                  </div>
                  
                  {healthCheck.issues.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Issues Found</h4>
                      <div className="space-y-2">
                        {healthCheck.issues.map((issue, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium">{issue.title}</h5>
                              <Badge className={getPriorityColor(issue.severity)}>
                                {issue.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                            <p className="text-xs text-blue-600">{issue.fix}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {healthCheck.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <div className="space-y-2">
                        {healthCheck.recommendations.map((rec, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium">{rec.title}</h5>
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                            <p className="text-xs text-blue-600">{rec.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Report */}
          {performanceReport && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Report</CardTitle>
                <CardDescription>Comprehensive sitemap performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getStatusColor(performanceReport.overallScore > 80 ? 'healthy' : performanceReport.overallScore > 60 ? 'warning' : 'critical')}`}>
                      {performanceReport.overallScore}
                    </div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold">{performanceReport.analytics.metrics.totalRequests}</div>
                      <div className="text-xs text-gray-600">Total Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{performanceReport.analytics.metrics.averageResponseTime}ms</div>
                      <div className="text-xs text-gray-600">Avg Response Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{performanceReport.analytics.metrics.uniqueVisitors}</div>
                      <div className="text-xs text-gray-600">Unique Visitors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{performanceReport.analytics.metrics.searchEngineCrawls}</div>
                      <div className="text-xs text-gray-600">Search Engine Crawls</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Analytics</CardTitle>
              <CardDescription>Performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600">Analytics data will be displayed here</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    if (sitemapStatus?.sitemaps.length > 0) {
                      handleGenerateReport(sitemapStatus.sitemaps[0].loc);
                    }
                  }}
                >
                  Generate Analytics Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
