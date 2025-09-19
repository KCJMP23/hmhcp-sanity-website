// Predictive Analytics Component
// Story: 4.6 - Advanced Reporting & Business Intelligence

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';
import { predictiveAnalyticsEngine } from '@/lib/analytics/predictive-models';
import type { 
  ExecutiveDashboardMetrics, 
  ROIAnalysisData,
  ROIPredictions,
  ConfidenceIntervals,
  RecommendedAction
} from '@/types/reporting';

interface PredictiveAnalyticsProps {
  organizationId?: string;
  className?: string;
}

export function PredictiveAnalytics({ organizationId = 'default-org', className = '' }: PredictiveAnalyticsProps) {
  const [metrics, setMetrics] = useState<ExecutiveDashboardMetrics[]>([]);
  const [roiData, setRoiData] = useState<ROIAnalysisData[]>([]);
  const [predictions, setPredictions] = useState<ROIPredictions | null>(null);
  const [confidenceIntervals, setConfidenceIntervals] = useState<ConfidenceIntervals | null>(null);
  const [recommendedActions, setRecommendedActions] = useState<RecommendedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7_days' | '30_days' | '90_days' | '1_year'>('30_days');

  useEffect(() => {
    loadDataAndGeneratePredictions();
  }, [organizationId, selectedPeriod]);

  const loadDataAndGeneratePredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load executive metrics
      const metricsResponse = await fetch(`/api/admin/analytics/executive?organizationId=${organizationId}`);
      if (!metricsResponse.ok) throw new Error('Failed to load metrics');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData.metrics || []);

      // Load ROI data
      const roiResponse = await fetch(`/api/admin/analytics/roi?organizationId=${organizationId}`);
      if (!roiResponse.ok) throw new Error('Failed to load ROI data');
      const roiData = await roiResponse.json();
      setRoiData(roiData.roi_analysis || []);

      // Generate predictions
      const predictions = await predictiveAnalyticsEngine.generateROIForecast(
        metricsData.metrics || [],
        selectedPeriod
      );
      setPredictions(predictions);

      // Generate confidence intervals
      const confidence = predictiveAnalyticsEngine.generateConfidenceIntervals(predictions);
      setConfidenceIntervals(confidence);

      // Generate recommended actions
      const actions = predictiveAnalyticsEngine.generateRecommendedActions(
        predictions,
        metricsData.metrics || []
      );
      setRecommendedActions(actions);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate predictions');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
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
            <h3 className="text-red-800 font-medium">Error Generating Predictions</h3>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
          <Button 
            onClick={loadDataAndGeneratePredictions} 
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Predictive Analytics</h1>
        <p className="text-gray-600">AI-powered forecasting and optimization recommendations</p>
      </div>

      {/* Period Selection */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {(['7_days', '30_days', '90_days', '1_year'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Prediction Cards */}
      {predictions && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <PredictionCard
            title="Engagement Forecast"
            value={predictions.content_performance.engagement_forecast}
            unit="page views"
            icon={<TrendingUp className="h-5 w-5" />}
            trend="up"
          />
          <PredictionCard
            title="Professional Interactions"
            value={predictions.content_performance.professional_interaction_prediction}
            unit="interactions"
            icon={<Activity className="h-5 w-5" />}
            trend="up"
          />
          <PredictionCard
            title="Patient Inquiries"
            value={predictions.content_performance.patient_inquiry_forecast}
            unit="inquiries"
            icon={<Target className="h-5 w-5" />}
            trend="up"
          />
          <PredictionCard
            title="User Growth"
            value={predictions.platform_adoption.user_growth_prediction}
            unit="users"
            icon={<BarChart3 className="h-5 w-5" />}
            trend="up"
          />
          <PredictionCard
            title="Feature Adoption"
            value={`${(predictions.platform_adoption.feature_adoption_rate * 100).toFixed(1)}%`}
            unit="adoption rate"
            icon={<PieChart className="h-5 w-5" />}
            trend="up"
          />
          <PredictionCard
            title="Retention Rate"
            value={`${(predictions.platform_adoption.retention_prediction * 100).toFixed(1)}%`}
            unit="retention"
            icon={<LineChart className="h-5 w-5" />}
            trend="up"
          />
        </div>
      )}

      {/* Confidence Intervals */}
      {confidenceIntervals && (
        <ConfidenceIntervalsCard confidenceIntervals={confidenceIntervals} />
      )}

      {/* Recommended Actions */}
      <RecommendedActionsCard actions={recommendedActions} />

      {/* AI Workflow Optimization */}
      {predictions && (
        <AIWorkflowOptimizationCard predictions={predictions} />
      )}
    </div>
  );
}

interface PredictionCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
}

function PredictionCard({ title, value, unit, icon, trend }: PredictionCardProps) {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="flex items-center mt-1 text-gray-600">
          {getTrendIcon()}
          <span className="text-sm ml-1">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ConfidenceIntervalsCardProps {
  confidenceIntervals: ConfidenceIntervals;
}

function ConfidenceIntervalsCard({ confidenceIntervals }: ConfidenceIntervalsCardProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          Prediction Confidence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium text-green-600 mb-2">High Confidence</h4>
            <div className="space-y-1">
              {confidenceIntervals.high_confidence.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm capitalize">{item.replace('_', ' ')}</span>
                </div>
              ))}
              {confidenceIntervals.high_confidence.length === 0 && (
                <p className="text-sm text-gray-500">No high confidence predictions</p>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-yellow-600 mb-2">Medium Confidence</h4>
            <div className="space-y-1">
              {confidenceIntervals.medium_confidence.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm capitalize">{item.replace('_', ' ')}</span>
                </div>
              ))}
              {confidenceIntervals.medium_confidence.length === 0 && (
                <p className="text-sm text-gray-500">No medium confidence predictions</p>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-2">Low Confidence</h4>
            <div className="space-y-1">
              {confidenceIntervals.low_confidence.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm capitalize">{item.replace('_', ' ')}</span>
                </div>
              ))}
              {confidenceIntervals.low_confidence.length === 0 && (
                <p className="text-sm text-gray-500">No low confidence predictions</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RecommendedActionsCardProps {
  actions: RecommendedAction[];
}

function RecommendedActionsCard({ actions }: RecommendedActionsCardProps) {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Recommended Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No specific recommendations at this time</p>
            <p className="text-sm">Continue monitoring for optimization opportunities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map((action, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getPriorityIcon(action.priority)}
                    <h4 className="font-medium">{action.action}</h4>
                  </div>
                  <Badge className={getPriorityColor(action.priority)}>
                    {action.priority.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Impact:</span> {action.estimated_impact}%
                  </div>
                  <div>
                    <span className="font-medium">Effort:</span> {action.implementation_effort}
                  </div>
                  <div>
                    <span className="font-medium">Timeline:</span> {action.timeline}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AIWorkflowOptimizationCardProps {
  predictions: ROIPredictions;
}

function AIWorkflowOptimizationCard({ predictions }: AIWorkflowOptimizationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          AI Workflow Optimization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Cost Optimization Suggestions</h4>
            <div className="space-y-2">
              {predictions.ai_workflow_optimization.cost_optimization_suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{suggestion}</span>
                </div>
              ))}
              {predictions.ai_workflow_optimization.cost_optimization_suggestions.length === 0 && (
                <p className="text-sm text-gray-500">No cost optimization suggestions at this time</p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Performance Improvement Areas</h4>
            <div className="space-y-2">
              {predictions.ai_workflow_optimization.performance_improvement_areas.map((area, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{area}</span>
                </div>
              ))}
              {predictions.ai_workflow_optimization.performance_improvement_areas.length === 0 && (
                <p className="text-sm text-gray-500">No performance improvement areas identified</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
