// Executive Dashboard Component
// Story: 4.6 - Advanced Reporting & Business Intelligence

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity, 
  Shield, 
  Brain,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import type { 
  ExecutiveDashboardMetrics, 
  ExecutiveDashboardSummary,
  ROIAnalysisData 
} from '@/types/reporting';

interface ExecutiveDashboardProps {
  organizationId?: string;
  className?: string;
}

interface ExecutiveKPIs {
  total_metrics: number;
  active_organizations: number;
  average_metric_value: number;
  top_metric_types: Array<{ type: string; count: number }>;
  healthcare_compliance_score: number;
  ai_insights_accuracy: number;
  engagement_trend: 'up' | 'down' | 'stable';
  predictive_confidence: number;
}

export function ExecutiveDashboard({ organizationId = 'default-org', className = '' }: ExecutiveDashboardProps) {
  const [metrics, setMetrics] = useState<ExecutiveDashboardMetrics[]>([]);
  const [summary, setSummary] = useState<ExecutiveDashboardSummary[]>([]);
  const [kpis, setKpis] = useState<ExecutiveKPIs | null>(null);
  const [roiData, setRoiData] = useState<ROIAnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [organizationId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load executive metrics
      const metricsResponse = await fetch(`/api/admin/analytics/executive?organizationId=${organizationId}`);
      if (!metricsResponse.ok) throw new Error('Failed to load executive metrics');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData.metrics || []);
      setKpis(metricsData.kpis || null);

      // Load ROI analysis
      const roiResponse = await fetch(`/api/admin/analytics/roi?organizationId=${organizationId}`);
      if (!roiResponse.ok) throw new Error('Failed to load ROI analysis');
      const roiData = await roiResponse.json();
      setRoiData(roiData.roi_analysis || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
          <Button 
            onClick={loadDashboardData} 
            variant="outline" 
            size="sm" 
            className="mt-3"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Executive Dashboard</h1>
        <p className="text-gray-600">Healthcare platform performance and business intelligence overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Metrics"
          value={kpis?.total_metrics || 0}
          icon={<BarChart3 className="h-5 w-5" />}
          trend={kpis?.total_metrics && kpis.total_metrics > 0 ? 'up' : 'stable'}
        />
        <KPICard
          title="Compliance Score"
          value={`${Math.round((kpis?.healthcare_compliance_score || 0) * 100)}%`}
          icon={<Shield className="h-5 w-5" />}
          trend={kpis?.healthcare_compliance_score && kpis.healthcare_compliance_score > 0.8 ? 'up' : 'stable'}
        />
        <KPICard
          title="AI Accuracy"
          value={`${Math.round((kpis?.ai_insights_accuracy || 0) * 100)}%`}
          icon={<Brain className="h-5 w-5" />}
          trend={kpis?.ai_insights_accuracy && kpis.ai_insights_accuracy > 0.8 ? 'up' : 'stable'}
        />
        <KPICard
          title="Engagement Trend"
          value={kpis?.engagement_trend || 'stable'}
          icon={<Users className="h-5 w-5" />}
          trend={kpis?.engagement_trend || 'stable'}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ROIAnalysisCard roiData={roiData} />
        <PatientEngagementCard metrics={metrics} />
      </div>

      {/* Healthcare Professional Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <HealthcareProductivityCard metrics={metrics} />
        <PlatformAdoptionCard metrics={metrics} />
      </div>

      {/* Compliance Reporting */}
      <ComplianceReportingCard metrics={metrics} />
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
}

function KPICard({ title, value, icon, trend }: KPICardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className={`flex items-center mt-1 ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-sm ml-1 capitalize">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ROIAnalysisCardProps {
  roiData: ROIAnalysisData[];
}

function ROIAnalysisCard({ roiData }: ROIAnalysisCardProps) {
  const totalInvestment = roiData.reduce((sum, item) => 
    sum + (item.cost_benefit_analysis?.implementation_cost || 0), 0
  );
  const totalSavings = roiData.reduce((sum, item) => 
    sum + (item.cost_benefit_analysis?.expected_savings || 0), 0
  );
  const roi = totalInvestment > 0 ? ((totalSavings / totalInvestment) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          ROI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Investment</span>
            <span className="font-semibold">${totalInvestment.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Expected Savings</span>
            <span className="font-semibold text-green-600">${totalSavings.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">ROI</span>
            <span className={`font-semibold ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roi.toFixed(1)}%
            </span>
          </div>
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500">
              Based on {roiData.length} analysis{roiData.length !== 1 ? 'es' : ''}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PatientEngagementCardProps {
  metrics: ExecutiveDashboardMetrics[];
}

function PatientEngagementCard({ metrics }: PatientEngagementCardProps) {
  const engagementMetrics = metrics.filter(m => 
    m.healthcare_context?.user_type === 'patient' && m.engagement_metrics
  );

  const avgPageViews = engagementMetrics.length > 0 
    ? engagementMetrics.reduce((sum, m) => sum + (m.engagement_metrics?.page_views || 0), 0) / engagementMetrics.length
    : 0;

  const avgTimeOnPage = engagementMetrics.length > 0
    ? engagementMetrics.reduce((sum, m) => sum + (m.engagement_metrics?.time_on_page || 0), 0) / engagementMetrics.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Patient Engagement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Avg Page Views</span>
            <span className="font-semibold">{avgPageViews.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Avg Time on Page</span>
            <span className="font-semibold">{avgTimeOnPage.toFixed(1)}s</span>
          </div>
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500">
              Based on {engagementMetrics.length} patient metric{engagementMetrics.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface HealthcareProductivityCardProps {
  metrics: ExecutiveDashboardMetrics[];
}

function HealthcareProductivityCard({ metrics }: HealthcareProductivityCardProps) {
  const productivityMetrics = metrics.filter(m => 
    m.healthcare_context?.user_type === 'professional' && m.metric_type === 'productivity'
  );

  const avgProductivity = productivityMetrics.length > 0
    ? productivityMetrics.reduce((sum, m) => sum + (m.metric_value || 0), 0) / productivityMetrics.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Healthcare Professional Productivity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Average Productivity Score</span>
            <span className="font-semibold">{(avgProductivity * 100).toFixed(1)}%</span>
          </div>
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500">
              Based on {productivityMetrics.length} professional metric{productivityMetrics.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PlatformAdoptionCardProps {
  metrics: ExecutiveDashboardMetrics[];
}

function PlatformAdoptionCard({ metrics }: PlatformAdoptionCardProps) {
  const adoptionMetrics = metrics.filter(m => m.metric_type === 'adoption');
  const totalUsers = metrics.length;
  const activeUsers = metrics.filter(m => 
    m.engagement_metrics?.page_views && m.engagement_metrics.page_views > 0
  ).length;
  const adoptionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PieChart className="h-5 w-5 mr-2" />
          Platform Adoption
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Adoption Rate</span>
            <span className="font-semibold">{adoptionRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Active Users</span>
            <span className="font-semibold">{activeUsers}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Users</span>
            <span className="font-semibold">{totalUsers}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ComplianceReportingCardProps {
  metrics: ExecutiveDashboardMetrics[];
}

function ComplianceReportingCard({ metrics }: ComplianceReportingCardProps) {
  const complianceMetrics = metrics.filter(m => m.metric_type === 'compliance');
  const avgCompliance = complianceMetrics.length > 0
    ? complianceMetrics.reduce((sum, m) => sum + (m.metric_value || 0), 0) / complianceMetrics.length
    : 0;

  const complianceLevel = avgCompliance > 0.9 ? 'high' : avgCompliance > 0.7 ? 'medium' : 'low';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Compliance Reporting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Compliance Score</span>
            <div className="flex items-center">
              <span className="font-semibold mr-2">{(avgCompliance * 100).toFixed(1)}%</span>
              <Badge variant={complianceLevel === 'high' ? 'default' : complianceLevel === 'medium' ? 'secondary' : 'destructive'}>
                {complianceLevel.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500">
              Based on {complianceMetrics.length} compliance metric{complianceMetrics.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
