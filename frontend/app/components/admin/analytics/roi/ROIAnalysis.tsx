// ROI Analysis Component
// Story: 4.6 - Advanced Reporting & Business Intelligence

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart
} from 'lucide-react';
import type { ROIAnalysisData } from '@/types/reporting';

interface ROIAnalysisProps {
  organizationId?: string;
  className?: string;
}

interface ROISummary {
  total_analyses: number;
  average_roi: number;
  total_investment: number;
  total_savings: number;
  total_revenue: number;
  average_payback_period: number;
  high_confidence_predictions: number;
  recommended_actions_count: number;
}

export function ROIAnalysis({ organizationId = 'default-org', className = '' }: ROIAnalysisProps) {
  const [roiData, setRoiData] = useState<ROIAnalysisData[]>([]);
  const [summary, setSummary] = useState<ROISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  useEffect(() => {
    loadROIData();
  }, [organizationId, selectedPeriod]);

  const loadROIData = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = selectedPeriod === 'all' 
        ? `/api/admin/analytics/roi?organizationId=${organizationId}`
        : `/api/admin/analytics/roi?organizationId=${organizationId}&forecastPeriod=${selectedPeriod}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load ROI analysis');
      
      const data = await response.json();
      setRoiData(data.roi_analysis || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ROI analysis');
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
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-red-800 font-medium">Error Loading ROI Analysis</h3>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
          <Button 
            onClick={loadROIData} 
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ROI Analysis</h1>
        <p className="text-gray-600">Healthcare technology investment returns and cost-benefit analysis</p>
      </div>

      {/* Period Filter */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {['all', '7_days', '30_days', '90_days', '1_year'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === 'all' ? 'All Periods' : period.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ROICard
            title="Total Investment"
            value={`$${summary.total_investment.toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5" />}
            trend="neutral"
          />
          <ROICard
            title="Expected Savings"
            value={`$${summary.total_savings.toLocaleString()}`}
            icon={<TrendingUp className="h-5 w-5" />}
            trend="up"
          />
          <ROICard
            title="Average ROI"
            value={`${summary.average_roi.toFixed(1)}%`}
            icon={<Target className="h-5 w-5" />}
            trend={summary.average_roi > 0 ? 'up' : 'down'}
          />
          <ROICard
            title="Payback Period"
            value={`${summary.average_payback_period.toFixed(1)} months`}
            icon={<Clock className="h-5 w-5" />}
            trend="neutral"
          />
        </div>
      )}

      {/* ROI Analysis Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CostBenefitAnalysisCard roiData={roiData} />
        <HealthcareImpactCard roiData={roiData} />
      </div>

      {/* Recommended Actions */}
      <RecommendedActionsCard roiData={roiData} />

      {/* Analysis History */}
      <AnalysisHistoryCard roiData={roiData} />
    </div>
  );
}

interface ROICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

function ROICard({ title, value, icon, trend }: ROICardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
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

interface CostBenefitAnalysisCardProps {
  roiData: ROIAnalysisData[];
}

function CostBenefitAnalysisCard({ roiData }: CostBenefitAnalysisCardProps) {
  const totalInvestment = roiData.reduce((sum, item) => 
    sum + (item.cost_benefit_analysis?.implementation_cost || 0), 0
  );
  const totalSavings = roiData.reduce((sum, item) => 
    sum + (item.cost_benefit_analysis?.expected_savings || 0), 0
  );
  const netBenefit = totalSavings - totalInvestment;
  const roi = totalInvestment > 0 ? ((totalSavings / totalInvestment) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Cost-Benefit Analysis
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
            <span className="text-sm text-gray-600">Net Benefit</span>
            <span className={`font-semibold ${netBenefit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netBenefit.toLocaleString()}
            </span>
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

interface HealthcareImpactCardProps {
  roiData: ROIAnalysisData[];
}

function HealthcareImpactCard({ roiData }: HealthcareImpactCardProps) {
  const avgPatientOutcomes = roiData.reduce((sum, item) => 
    sum + (item.healthcare_impact_metrics?.patient_outcomes_improvement || 0), 0
  ) / Math.max(roiData.length, 1);

  const avgClinicalEfficiency = roiData.reduce((sum, item) => 
    sum + (item.healthcare_impact_metrics?.clinical_efficiency_gain || 0), 0
  ) / Math.max(roiData.length, 1);

  const avgComplianceImprovement = roiData.reduce((sum, item) => 
    sum + (item.healthcare_impact_metrics?.compliance_score_improvement || 0), 0
  ) / Math.max(roiData.length, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Healthcare Impact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Patient Outcomes</span>
            <span className="font-semibold text-green-600">+{avgPatientOutcomes.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Clinical Efficiency</span>
            <span className="font-semibold text-blue-600">+{avgClinicalEfficiency.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Compliance Score</span>
            <span className="font-semibold text-purple-600">+{avgComplianceImprovement.toFixed(1)}%</span>
          </div>
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500">
              Average improvement across all analyses
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RecommendedActionsCardProps {
  roiData: ROIAnalysisData[];
}

function RecommendedActionsCard({ roiData }: RecommendedActionsCardProps) {
  const allActions = roiData.flatMap(item => item.recommended_actions || []);
  const highPriorityActions = allActions.filter(action => action.priority === 'high');
  const mediumPriorityActions = allActions.filter(action => action.priority === 'medium');
  const lowPriorityActions = allActions.filter(action => action.priority === 'low');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Recommended Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {highPriorityActions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-600 mb-2">High Priority</h4>
              <div className="space-y-2">
                {highPriorityActions.slice(0, 3).map((action, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">{action.action}</p>
                      <p className="text-gray-500">Impact: {action.estimated_impact}% | Timeline: {action.timeline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mediumPriorityActions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-600 mb-2">Medium Priority</h4>
              <div className="space-y-2">
                {mediumPriorityActions.slice(0, 2).map((action, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">{action.action}</p>
                      <p className="text-gray-500">Impact: {action.estimated_impact}% | Timeline: {action.timeline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allActions.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>No recommended actions available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AnalysisHistoryCardProps {
  roiData: ROIAnalysisData[];
}

function AnalysisHistoryCard({ roiData }: AnalysisHistoryCardProps) {
  const sortedData = [...roiData].sort((a, b) => 
    new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Analysis History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>No ROI analyses available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedData.slice(0, 5).map((analysis) => (
              <div key={analysis.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{analysis.analysis_name}</h4>
                  <Badge variant="outline">{analysis.forecast_period.replace('_', ' ')}</Badge>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Generated: {new Date(analysis.generated_at).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500">
                  Model: {analysis.model_version} | 
                  Actions: {analysis.recommended_actions?.length || 0} | 
                  Confidence: {analysis.confidence_intervals?.high_confidence?.length || 0} high
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
