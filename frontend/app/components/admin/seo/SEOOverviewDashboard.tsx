/**
 * SEO Overview Dashboard Component
 * 
 * Comprehensive SEO management dashboard for healthcare content optimization.
 * Provides real-time metrics, keyword tracking, audit results, and integration
 * status monitoring specifically designed for healthcare organizations.
 * 
 * Features:
 * - Real-time SEO metrics overview with healthcare-specific KPIs
 * - Keyword tracking with compliance validation indicators
 * - Recent audit results with healthcare compliance scoring
 * - External tool integration status monitoring
 * - Responsive design optimized for healthcare workflows
 * 
 * @author Healthcare SEO Team
 * @created 2025-01-27
 * @version 2.0.0
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  SEOOverviewMetrics, 
  SEOKeywordTracking, 
  SEOAuditResult,
  IntegrationStatus 
} from '@/types/seo';

/**
 * Props for the SEO Overview Dashboard component
 */
interface SEOOverviewDashboardProps {
  /** Unique identifier for the healthcare organization */
  organizationId: string;
}

/**
 * SEO Overview Dashboard Component
 * 
 * Main dashboard component for healthcare SEO management providing comprehensive
 * metrics overview, keyword tracking, audit results, and integration monitoring.
 * 
 * @param props - Component props containing organization ID
 * @returns JSX.Element - Rendered SEO dashboard interface
 * 
 * @example
 * ```tsx
 * <SEOOverviewDashboard organizationId="org_123" />
 * ```
 */
export default function SEOOverviewDashboard({ organizationId }: SEOOverviewDashboardProps) {
  // State management for dashboard data
  const [metrics, setMetrics] = useState<SEOOverviewMetrics | null>(null);
  const [keywords, setKeywords] = useState<SEOKeywordTracking[]>([]);
  const [recentAudits, setRecentAudits] = useState<SEOAuditResult[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load dashboard data when component mounts or organization changes
   */
  useEffect(() => {
    loadDashboardData();
  }, [organizationId]);

  /**
   * Load comprehensive dashboard data from multiple API endpoints
   * 
   * Fetches SEO metrics, keyword tracking data, recent audit results, and
   * integration status in parallel for optimal performance. Handles errors
   * gracefully and provides user feedback.
   * 
   * @async
   * @function loadDashboardData
   * @throws {Error} When API requests fail or data is invalid
   */
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all dashboard data in parallel
      const [metricsRes, keywordsRes, auditsRes, integrationRes] = await Promise.all([
        fetch(`/api/admin/seo/metrics?organizationId=${organizationId}`),
        fetch(`/api/admin/seo/keywords?organizationId=${organizationId}&limit=10`),
        fetch(`/api/admin/seo/audits?organizationId=${organizationId}&limit=5`),
        fetch(`/api/admin/seo/integrations/status?organizationId=${organizationId}`)
      ]);

      if (!metricsRes.ok || !keywordsRes.ok || !auditsRes.ok || !integrationRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const [metricsData, keywordsData, auditsData, integrationData] = await Promise.all([
        metricsRes.json(),
        keywordsRes.json(),
        auditsRes.json(),
        integrationRes.json()
      ]);

      setMetrics(metricsData);
      setKeywords(keywordsData.keywords || []);
      setRecentAudits(auditsData.audits || []);
      setIntegrationStatus(integrationData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  /**
   * Refresh dashboard data manually
   * 
   * Provides a way for users to manually refresh all dashboard data.
   * Useful for getting the latest metrics and audit results.
   */
  const refreshData = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Memoized metrics cards for performance optimization
   */
  const metricsCards = useMemo(() => {
    if (!metrics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keywords</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_keywords}</div>
            <p className="text-xs text-muted-foreground">
              Healthcare keywords tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Ranking</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.average_ranking}</div>
            <p className="text-xs text-muted-foreground">
              Average search position
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Score</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.audit_score}/100</div>
            <p className="text-xs text-muted-foreground">
              Overall SEO health score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Local Listings</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.local_listings}</div>
            <p className="text-xs text-muted-foreground">
              Active local business listings
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading SEO dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={refreshData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Management Dashboard</h1>
          <p className="text-gray-600">Healthcare content optimization and compliance monitoring</p>
        </div>
        <Button onClick={refreshData} variant="outline">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Metrics Overview */}
      {metricsCards}

      {/* Integration Status */}
      {integrationStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>External SEO tool connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${integrationStatus.gsc_connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium">Google Search Console</span>
                </div>
                <Badge variant={integrationStatus.gsc_connected ? 'default' : 'destructive'}>
                  {integrationStatus.gsc_connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${integrationStatus.dataforseo_connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium">DataForSEO</span>
                </div>
                <Badge variant={integrationStatus.dataforseo_connected ? 'default' : 'destructive'}>
                  {integrationStatus.dataforseo_connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </div>
            {integrationStatus.last_sync && (
              <p className="text-xs text-muted-foreground mt-2">
                Last sync: {new Date(integrationStatus.last_sync).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Keywords */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Keywords</CardTitle>
          <CardDescription>Top performing healthcare keywords</CardDescription>
        </CardHeader>
        <CardContent>
          {keywords.length > 0 ? (
            <div className="space-y-3">
              {keywords.map((keyword) => (
                <div key={keyword.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{keyword.keyword}</span>
                      <Badge variant="outline">{keyword.healthcare_category}</Badge>
                      {keyword.compliance_approved && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Compliant
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Position: {keyword.ranking_position || 'Not ranked'} | 
                      Volume: {keyword.search_volume || 'N/A'} | 
                      Difficulty: {keyword.difficulty_score || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No keywords tracked yet</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Audits */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audits</CardTitle>
          <CardDescription>Latest SEO audit results</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAudits.length > 0 ? (
            <div className="space-y-3">
              {recentAudits.map((audit) => (
                <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{audit.page_url}</span>
                      <Badge variant="outline">{audit.audit_type}</Badge>
                      <Badge 
                        variant={audit.audit_score && audit.audit_score >= 80 ? 'default' : 
                               audit.audit_score && audit.audit_score >= 60 ? 'secondary' : 'destructive'}
                      >
                        {audit.audit_score}/100
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {audit.issues_found.length} issues found | 
                      {audit.recommendations.length} recommendations
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(audit.audit_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No audits performed yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
