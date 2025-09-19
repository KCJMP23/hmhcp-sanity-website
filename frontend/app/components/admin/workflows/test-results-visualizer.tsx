'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  RefreshCw,
  Filter,
  Eye
} from 'lucide-react';
import { ABTest, TestReport, TestComparison, StatisticalAnalysis } from '@/lib/workflows/ab-testing';

interface TestResultsVisualizerProps {
  test: ABTest;
  report: TestReport | null;
  onGenerateReport: () => void;
  onExportResults: () => void;
  onRefreshData: () => void;
}

export function TestResultsVisualizer({
  test,
  report,
  onGenerateReport,
  onExportResults,
  onRefreshData
}: TestResultsVisualizerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'variants' | 'comparisons' | 'statistics'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const primaryMetric = test.metrics.find(m => m.isPrimary);
  const selectedMetricData = selectedMetric ? test.metrics.find(m => m.id === selectedMetric) : primaryMetric;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'paused':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'running':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'paused':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const getLiftColor = (lift: number) => {
    if (lift > 0) return 'text-green-600';
    if (lift < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getLiftIcon = (lift: number) => {
    if (lift > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (lift < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Target className="h-4 w-4 text-gray-500" />;
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'keep_treatment':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'keep_control':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'continue_testing':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'keep_treatment':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'keep_control':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'continue_testing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(test.status)}
              <CardTitle className="text-lg font-semibold">{test.name}</CardTitle>
              <Badge className={`text-xs ${getStatusColor(test.status)}`}>
                {test.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onRefreshData}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onExportResults}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              {!report && test.status === 'completed' && (
                <Button
                  size="sm"
                  onClick={onGenerateReport}
                  variant="default"
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Generate Report
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Tabs */}
          <div className="border-b">
            <div className="flex space-x-8 px-6">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'variants'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('variants')}
              >
                Variants
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comparisons'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('comparisons')}
              >
                Comparisons
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'statistics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('statistics')}
              >
                Statistics
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Test Summary */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Total Participants</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {report?.totalParticipants || 0}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Variants</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {test.variants.length}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Metrics</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {test.metrics.length}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Duration</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {test.duration}d
                    </div>
                  </div>
                </div>

                {/* Winner Summary */}
                {report?.summary.winner && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-lg font-semibold text-green-800">Test Winner</span>
                    </div>
                    <div className="text-sm text-green-700">
                      <strong>{report.summary.winner}</strong> shows {report.summary.lift > 0 ? '+' : ''}{report.summary.lift.toFixed(1)}% improvement
                      with {formatConfidence(report.summary.confidence)} confidence
                    </div>
                    <div className="mt-2 text-sm text-green-600">
                      Recommendation: {report.summary.recommendation.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Primary Metric Results */}
                {selectedMetricData && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Primary Metric: {selectedMetricData.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {test.variants.map((variant) => {
                        const variantData = report?.variants.find(v => v.id === variant.id);
                        if (!variantData) return null;

                        return (
                          <div key={variant.id} className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{variant.name}</span>
                              {variant.isControl && (
                                <Badge variant="outline" className="text-xs">Control</Badge>
                              )}
                            </div>
                            <div className="text-2xl font-bold">
                              {formatPercentage(variantData.conversionRate)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatNumber(variantData.participants)} participants
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'variants' && (
              <div className="space-y-4">
                {test.variants.map((variant) => {
                  const variantData = report?.variants.find(v => v.id === variant.id);
                  
                  return (
                    <div key={variant.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{variant.name}</h3>
                          {variant.isControl && (
                            <Badge variant="outline" className="text-xs">Control</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {variant.trafficPercentage}% traffic
                        </div>
                      </div>
                      
                      {variant.description && (
                        <p className="text-sm text-gray-600 mb-4">{variant.description}</p>
                      )}
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">Participants</div>
                          <div className="text-xl font-bold">
                            {variantData?.participants || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">Conversion Rate</div>
                          <div className="text-xl font-bold">
                            {variantData ? formatPercentage(variantData.conversionRate) : 'N/A'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">Performance</div>
                          <div className="text-xl font-bold">
                            {variant.metadata.estimatedExecutionTime}ms
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">Complexity</div>
                          <div className="text-xl font-bold">
                            {variant.metadata.complexity}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'comparisons' && report && (
              <div className="space-y-4">
                {report.comparisons.map((comparison, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        {comparison.controlVariant} vs {comparison.treatmentVariant}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getLiftIcon(comparison.lift)}
                        <span className={`text-lg font-bold ${getLiftColor(comparison.lift)}`}>
                          {comparison.lift > 0 ? '+' : ''}{comparison.lift.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-sm font-medium text-gray-600 mb-1">Control</div>
                        <div className="text-xl font-bold">
                          {formatPercentage(comparison.controlResults.mean)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ±{formatPercentage(comparison.controlResults.confidenceInterval.upper - comparison.controlResults.mean)}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-sm font-medium text-gray-600 mb-1">Treatment</div>
                        <div className="text-xl font-bold">
                          {formatPercentage(comparison.treatmentResults.mean)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ±{formatPercentage(comparison.treatmentResults.confidenceInterval.upper - comparison.treatmentResults.mean)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getRecommendationColor(comparison.recommendation)}`}>
                        {getRecommendationIcon(comparison.recommendation)}
                        {comparison.recommendation.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Confidence: {formatConfidence(comparison.confidenceLevel)}
                      </div>
                      <div className="text-sm text-gray-600">
                        P-value: {comparison.controlResults.pValue.toFixed(4)}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      {comparison.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'statistics' && report && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {test.variants.map((variant) => {
                    const variantData = report.variants.find(v => v.id === variant.id);
                    if (!variantData) return null;

                    return (
                      <div key={variant.id} className="p-4 border rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">{variant.name}</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Sample Size</span>
                            <span className="font-medium">{formatNumber(variantData.participants)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Conversion Rate</span>
                            <span className="font-medium">{formatPercentage(variantData.conversionRate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Performance</span>
                            <span className="font-medium">{variantData.performance}ms</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
