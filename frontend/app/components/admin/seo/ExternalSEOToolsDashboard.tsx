// External SEO Tools Dashboard Component
// Created: 2025-01-27
// Purpose: External SEO tools integration and monitoring interface

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ExternalDataSummary,
  SyncStatus,
  HealthcareComplianceReport
} from '@/types/seo';

interface ExternalSEOToolsDashboardProps {
  organizationId: string;
}

export default function ExternalSEOToolsDashboard({ organizationId }: ExternalSEOToolsDashboardProps) {
  const [dataSummary, setDataSummary] = useState<ExternalDataSummary | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [complianceReport, setComplianceReport] = useState<HealthcareComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'competitors' | 'compliance' | 'settings'>('overview');
  const [keywords, setKeywords] = useState<string>('');
  const [competitors, setCompetitors] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load external tools status
      const statusResponse = await fetch(`/api/admin/seo/external-tools?organizationId=${organizationId}&type=status`);
      if (!statusResponse.ok) throw new Error('Failed to load external tools status');
      const statusData = await statusResponse.json();
      setDataSummary(statusData.data);
      setSyncStatus(statusData.data.syncStatus);

      // Load compliance report
      const complianceResponse = await fetch(`/api/admin/seo/external-tools?organizationId=${organizationId}&type=compliance-report`);
      if (complianceResponse.ok) {
        const complianceData = await complianceResponse.json();
        setComplianceReport(complianceData.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncData = async () => {
    try {
      const response = await fetch('/api/admin/seo/external-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync-all-data',
          organizationId
        })
      });

      if (!response.ok) throw new Error('Failed to sync data');

      const data = await response.json();
      
      // Reload data
      await loadData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync data');
    }
  };

  const handleGetKeywordData = async () => {
    if (!keywords.trim()) return;

    try {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
      
      const response = await fetch('/api/admin/seo/external-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-keyword-data',
          organizationId,
          keywords: keywordList
        })
      });

      if (!response.ok) throw new Error('Failed to get keyword data');

      const data = await response.json();
      console.log('Keyword data:', data.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get keyword data');
    }
  };

  const handleGetCompetitorAnalysis = async () => {
    if (!competitors.trim()) return;

    try {
      const competitorList = competitors.split(',').map(c => c.trim()).filter(c => c);
      
      const response = await fetch('/api/admin/seo/external-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-competitor-analysis',
          organizationId,
          competitors: competitorList
        })
      });

      if (!response.ok) throw new Error('Failed to get competitor analysis');

      const data = await response.json();
      console.log('Competitor analysis:', data.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get competitor analysis');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
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
          <p className="mt-2 text-sm text-gray-600">Loading external tools data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">External SEO Tools</h2>
          <p className="text-gray-600">Integrate and monitor external SEO tools</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleSyncData}
            variant="outline"
          >
            Sync All Data
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
            { id: 'keywords', name: 'Keywords' },
            { id: 'competitors', name: 'Competitors' },
            { id: 'compliance', name: 'Compliance' },
            { id: 'settings', name: 'Settings' }
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
                <CardTitle className="text-sm font-medium">Total Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dataSummary?.totalKeywords || 0}</div>
                <p className="text-xs text-gray-600">From external tools</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dataSummary?.totalRankings || 0}</div>
                <p className="text-xs text-gray-600">Tracked positions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {dataSummary?.lastUpdated 
                    ? new Date(dataSummary.lastUpdated).toLocaleDateString()
                    : 'Never'
                  }
                </div>
                <p className="text-xs text-gray-600">Data sync</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Health Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${getStatusColor(dataSummary?.healthStatus?.googleSearchConsole || 'unknown')}`}>
                  {dataSummary?.healthStatus?.googleSearchConsole || 'Unknown'}
                </div>
                <p className="text-xs text-gray-600">Overall health</p>
              </CardContent>
            </Card>
          </div>

          {/* Sync Status */}
          {syncStatus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sync Status</CardTitle>
                <CardDescription>External tool synchronization status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syncStatus.map((status, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium capitalize">{status.tool.replace('_', ' ')}</h4>
                          <p className="text-sm text-gray-600">
                            {status.recordsSynced} records synced • Last sync: {new Date(status.lastSync).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusBadgeColor(status.status)}>
                            {status.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Next: {new Date(status.nextSync).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {status.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-red-600">Errors:</p>
                          <ul className="text-xs text-red-600 list-disc list-inside">
                            {status.errors.map((error, errorIndex) => (
                              <li key={errorIndex}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Keywords Tab */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Research</CardTitle>
              <CardDescription>Get keyword data from external tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="healthcare, medical, treatment, doctor"
                  />
                </div>
                <Button onClick={handleGetKeywordData} disabled={!keywords.trim()}>
                  Get Keyword Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Competitors Tab */}
      {activeTab === 'competitors' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
              <CardDescription>Analyze competitor performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="competitors">Competitors (comma-separated)</Label>
                  <Input
                    id="competitors"
                    value={competitors}
                    onChange={(e) => setCompetitors(e.target.value)}
                    placeholder="competitor1.com, competitor2.com, competitor3.com"
                  />
                </div>
                <Button onClick={handleGetCompetitorAnalysis} disabled={!competitors.trim()}>
                  Analyze Competitors
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && complianceReport && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Healthcare Compliance Report</CardTitle>
              <CardDescription>Compliance analysis for external data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{complianceReport.totalUrls}</div>
                    <div className="text-sm text-gray-600">Total URLs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{complianceReport.compliantUrls}</div>
                    <div className="text-sm text-gray-600">Compliant</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{complianceReport.nonCompliantUrls}</div>
                    <div className="text-sm text-gray-600">Non-Compliant</div>
                  </div>
                </div>

                {complianceReport.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Compliance Issues</h4>
                    <div className="space-y-2">
                      {complianceReport.issues.map((issue, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-medium capitalize">{issue.type.replace('_', ' ')}</h5>
                            <Badge className={getPriorityColor(issue.severity)}>
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{issue.description}</p>
                          <p className="text-xs text-gray-500">Affected URLs: {issue.count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {complianceReport.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <div className="space-y-2">
                      {complianceReport.recommendations.map((rec, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-medium">{rec.action}</h5>
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{rec.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>External Tools Configuration</CardTitle>
              <CardDescription>Configure external SEO tool integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Google Search Console</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={dataSummary?.config?.googleSearchConsole?.enabled} readOnly />
                        <span className="text-sm">Enabled</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={dataSummary?.config?.googleSearchConsole?.configured} readOnly />
                        <span className="text-sm">Configured</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">DataForSEO</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={dataSummary?.config?.dataForSEO?.enabled} readOnly />
                        <span className="text-sm">Enabled</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={dataSummary?.config?.dataForSEO?.configured} readOnly />
                        <span className="text-sm">Configured</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Configuration is managed through environment variables. Contact your administrator to update settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
