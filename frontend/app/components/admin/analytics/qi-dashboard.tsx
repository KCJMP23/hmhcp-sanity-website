'use client';

// QI Analytics Dashboard Component
// Story 4.4: Quality Improvement Studies Tracking

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QIAnalyticsSummary, 
  QITrendData, 
  QIBenchmarkData,
  QualityImprovementStudy 
} from '@/types/qi-studies';

interface QIDashboardProps {
  organizationId: string;
  className?: string;
}

export function QIDashboard({ organizationId, className }: QIDashboardProps) {
  const [analyticsSummary, setAnalyticsSummary] = useState<QIAnalyticsSummary | null>(null);
  const [trendData, setTrendData] = useState<QITrendData[]>([]);
  const [benchmarkData, setBenchmarkData] = useState<QIBenchmarkData[]>([]);
  const [recentStudies, setRecentStudies] = useState<QualityImprovementStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [organizationId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics summary
      const summaryResponse = await fetch(`/api/admin/analytics/qi/summary?organization_id=${organizationId}`);
      if (summaryResponse.ok) {
        const summary = await summaryResponse.json();
        setAnalyticsSummary(summary);
      }

      // Fetch trend data
      const trendResponse = await fetch(`/api/admin/analytics/qi/trends?organization_id=${organizationId}&period=12_months`);
      if (trendResponse.ok) {
        const trends = await trendResponse.json();
        setTrendData(trends);
      }

      // Fetch benchmark data
      const benchmarkResponse = await fetch(`/api/admin/analytics/qi/benchmarks?organization_id=${organizationId}`);
      if (benchmarkResponse.ok) {
        const benchmarks = await benchmarkResponse.json();
        setBenchmarkData(benchmarks);
      }

      // Fetch recent studies
      const studiesResponse = await fetch(`/api/admin/qi-studies?organization_id=${organizationId}&page=1&page_size=5`);
      if (studiesResponse.ok) {
        const studiesData = await studiesResponse.json();
        setRecentStudies(studiesData.studies);
      }

    } catch (err) {
      console.error('Error fetching QI analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'implementation': return 'bg-blue-100 text-blue-800';
      case 'analysis': return 'bg-yellow-100 text-yellow-800';
      case 'design': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchAnalyticsData} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Studies</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📊</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsSummary?.total_studies || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsSummary?.active_studies || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">💰</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(analyticsSummary?.average_roi || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cost savings: {formatCurrency(analyticsSummary?.total_cost_savings || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Improvements</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">🛡️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsSummary?.safety_improvements || 0}</div>
            <p className="text-xs text-muted-foreground">
              Patient safety metrics improved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">✅</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(analyticsSummary?.compliance_rate || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Regulatory compliance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle>QI Study Trends</CardTitle>
            <CardDescription>Study activity and outcomes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-4xl mb-2">📈</div>
                <p>Trend visualization will be implemented</p>
                <p className="text-sm">Data points: {trendData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benchmark Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Benchmarks</CardTitle>
            <CardDescription>Comparison with industry standards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {benchmarkData.slice(0, 3).map((benchmark, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{benchmark.metric_name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(benchmark.percentile_rank, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {benchmark.percentile_rank}th percentile
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Studies */}
      <Card>
        <CardHeader>
          <CardTitle>Recent QI Studies</CardTitle>
          <CardDescription>Latest quality improvement initiatives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentStudies.map((study) => (
              <div key={study.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{study.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {study.study_type.replace('_', ' ')} • {study.healthcare_specialty}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Started: {study.start_date ? new Date(study.start_date).toLocaleDateString() : 'TBD'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(study.status)}>
                    {study.status}
                  </Badge>
                  {study.budget_allocated && (
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(study.budget_allocated)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
