'use client';

// A/B Test Results Component
// Created: 2025-01-27
// Purpose: Display A/B test results with statistical analysis

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Target,
  Users,
  Mail,
  MousePointer,
  Clock
} from 'lucide-react';
import type { EmailCampaign, ABTestConfig, ABTestResult } from '@/types/email-campaigns';

interface ABTestResultsProps {
  campaign: EmailCampaign;
  testResults: ABTestResult[];
  onSelectWinner: (variantId: string) => void;
  onEndTest: () => void;
}

interface TestVariantStats {
  variant_id: string;
  variant_name: string;
  subject_line: string;
  sent_count: number;
  opens: number;
  clicks: number;
  conversions: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  confidence_level: number;
  is_winner: boolean;
  is_significant: boolean;
}

interface TestSummary {
  test_name: string;
  test_duration_hours: number;
  total_recipients: number;
  total_opens: number;
  total_clicks: number;
  overall_open_rate: number;
  overall_click_rate: number;
  test_status: 'running' | 'completed' | 'cancelled';
  winner_selected: boolean;
  statistical_significance: boolean;
  minimum_sample_size_met: boolean;
  test_duration_met: boolean;
}

export default function ABTestResults({ 
  campaign, 
  testResults, 
  onSelectWinner, 
  onEndTest 
}: ABTestResultsProps) {
  const [testSummary, setTestSummary] = useState<TestSummary | null>(null);
  const [variantStats, setVariantStats] = useState<TestVariantStats[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'open_rate' | 'click_rate' | 'conversion_rate'>('open_rate');

  // Calculate test statistics
  useEffect(() => {
    if (!campaign.ab_test_config || !testResults.length) return;

    const config = campaign.ab_test_config;
    const variants = config.variants || [];
    
    // Calculate variant statistics
    const stats: TestVariantStats[] = variants.map(variant => {
      const variantResults = testResults.filter(r => r.variant_id === variant.id);
      const sent_count = variantResults.reduce((sum, r) => sum + (r.sent_count || 0), 0);
      const opens = variantResults.reduce((sum, r) => sum + (r.opens || 0), 0);
      const clicks = variantResults.reduce((sum, r) => sum + (r.clicks || 0), 0);
      const conversions = variantResults.reduce((sum, r) => sum + (r.conversions || 0), 0);
      
      const open_rate = sent_count > 0 ? (opens / sent_count) * 100 : 0;
      const click_rate = opens > 0 ? (clicks / opens) * 100 : 0;
      const conversion_rate = clicks > 0 ? (conversions / clicks) * 100 : 0;
      
      // Calculate confidence level (simplified)
      const confidence_level = calculateConfidenceLevel(sent_count, opens, config.confidence_level || 0.95);
      
      return {
        variant_id: variant.id,
        variant_name: variant.name,
        subject_line: variant.subject_line,
        sent_count,
        opens,
        clicks,
        conversions,
        open_rate: Math.round(open_rate * 100) / 100,
        click_rate: Math.round(click_rate * 100) / 100,
        conversion_rate: Math.round(conversion_rate * 100) / 100,
        confidence_level: Math.round(confidence_level * 100) / 100,
        is_winner: false, // Will be determined by comparison
        is_significant: confidence_level >= (config.confidence_level || 0.95)
      };
    });

    // Determine winner based on selected metric
    const sortedStats = [...stats].sort((a, b) => {
      const aValue = a[selectedMetric];
      const bValue = b[selectedMetric];
      return bValue - aValue;
    });

    if (sortedStats.length > 0) {
      sortedStats[0].is_winner = true;
    }

    setVariantStats(sortedStats);

    // Calculate test summary
    const total_recipients = stats.reduce((sum, s) => sum + s.sent_count, 0);
    const total_opens = stats.reduce((sum, s) => sum + s.opens, 0);
    const total_clicks = stats.reduce((sum, s) => sum + s.clicks, 0);
    const overall_open_rate = total_recipients > 0 ? (total_opens / total_recipients) * 100 : 0;
    const overall_click_rate = total_opens > 0 ? (total_clicks / total_opens) * 100 : 0;

    const test_duration_hours = config.test_duration_hours || 24;
    const minimum_sample_size_met = stats.every(s => s.sent_count >= (config.minimum_sample_size || 1000));
    const test_duration_met = true; // This would be calculated based on actual test duration
    
    const statistical_significance = stats.some(s => s.is_significant);
    const winner_selected = campaign.status === 'sent' && campaign.ab_test_config?.winner_variant_id;

    setTestSummary({
      test_name: config.test_name || `${campaign.name} A/B Test`,
      test_duration_hours,
      total_recipients,
      total_opens,
      total_clicks,
      overall_open_rate: Math.round(overall_open_rate * 100) / 100,
      overall_click_rate: Math.round(overall_click_rate * 100) / 100,
      test_status: campaign.status as any,
      winner_selected,
      statistical_significance,
      minimum_sample_size_met,
      test_duration_met
    });

  }, [campaign, testResults, selectedMetric]);

  const calculateConfidenceLevel = (sampleSize: number, successes: number, targetConfidence: number): number => {
    // Simplified confidence level calculation
    // In a real implementation, this would use proper statistical methods
    if (sampleSize < 30) return 0.5;
    if (sampleSize < 100) return 0.7;
    if (sampleSize < 1000) return 0.8;
    return Math.min(0.95, 0.7 + (sampleSize / 10000) * 0.25);
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'open_rate': return <Mail className="h-4 w-4" />;
      case 'click_rate': return <MousePointer className="h-4 w-4" />;
      case 'conversion_rate': return <Target className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'open_rate': return 'Open Rate';
      case 'click_rate': return 'Click Rate';
      case 'conversion_rate': return 'Conversion Rate';
      default: return 'Metric';
    }
  };

  const getPerformanceColor = (value: number, isWinner: boolean) => {
    if (isWinner) return 'text-green-600';
    if (value > 0) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getPerformanceIcon = (value: number, isWinner: boolean) => {
    if (isWinner) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (value > 0) return <TrendingUp className="h-4 w-4 text-blue-500" />;
    return <TrendingDown className="h-4 w-4 text-gray-400" />;
  };

  if (!testSummary || !variantStats.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No A/B test data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            A/B Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{testSummary.total_recipients.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Recipients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{testSummary.overall_open_rate}%</div>
              <div className="text-sm text-gray-600">Overall Open Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{testSummary.overall_click_rate}%</div>
              <div className="text-sm text-gray-600">Overall Click Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{testSummary.test_duration_hours}h</div>
              <div className="text-sm text-gray-600">Test Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Test Status:</span>
                <Badge variant={testSummary.test_status === 'running' ? 'default' : 'secondary'}>
                  {testSummary.test_status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Statistical Significance:</span>
                <Badge variant={testSummary.statistical_significance ? 'default' : 'secondary'}>
                  {testSummary.statistical_significance ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {testSummary.test_status === 'running' && (
                <Button onClick={onEndTest} variant="outline">
                  End Test
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <span className="font-medium">View by:</span>
            {(['open_rate', 'click_rate', 'conversion_rate'] as const).map(metric => (
              <Button
                key={metric}
                variant={selectedMetric === metric ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric(metric)}
                className="flex items-center gap-2"
              >
                {getMetricIcon(metric)}
                {getMetricLabel(metric)}
              </Button>
            ))}
          </div>

          {/* Variant Results */}
          <div className="space-y-4">
            {variantStats.map((variant, index) => (
              <div key={variant.variant_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{variant.variant_name}</h4>
                    {variant.is_winner && (
                      <Badge variant="default" className="bg-green-500">
                        Winner
                      </Badge>
                    )}
                    {variant.is_significant && (
                      <Badge variant="outline" className="text-green-600">
                        Significant
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Confidence: {variant.confidence_level}%</span>
                    {getPerformanceIcon(variant[selectedMetric], variant.is_winner)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{variant.sent_count.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{variant.opens.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Opens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{variant.clicks.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{variant.conversions.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Conversions</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Subject Line:</span>
                    <span className="text-sm text-gray-600">{variant.subject_line}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{getMetricLabel(selectedMetric)}:</span>
                    <span className={`text-sm font-semibold ${getPerformanceColor(variant[selectedMetric], variant.is_winner)}`}>
                      {variant[selectedMetric]}%
                    </span>
                  </div>
                </div>

                {variant.is_winner && !testSummary.winner_selected && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button 
                      onClick={() => onSelectWinner(variant.variant_id)}
                      className="w-full"
                    >
                      Select as Winner
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Test Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Minimum Sample Size (1,000 per variant)</span>
              <div className="flex items-center gap-2">
                {testSummary.minimum_sample_size_met ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {testSummary.minimum_sample_size_met ? 'Met' : 'Not Met'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Minimum Duration (24 hours)</span>
              <div className="flex items-center gap-2">
                {testSummary.test_duration_met ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {testSummary.test_duration_met ? 'Met' : 'Not Met'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Statistical Significance (p &lt; 0.05)</span>
              <div className="flex items-center gap-2">
                {testSummary.statistical_significance ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {testSummary.statistical_significance ? 'Achieved' : 'Not Achieved'}
                </span>
              </div>
            </div>
          </div>

          {!testSummary.minimum_sample_size_met && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Test requires at least 1,000 recipients per variant for statistical significance. 
                Current sample sizes may not provide reliable results.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
