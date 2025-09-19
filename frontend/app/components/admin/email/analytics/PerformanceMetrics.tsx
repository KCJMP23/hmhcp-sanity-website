'use client';

// Performance Metrics Component
// Created: 2025-01-27
// Purpose: Detailed performance metrics and benchmarking

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Users, 
  Mail, 
  MousePointer, 
  Eye, 
  Reply, 
  XCircle,
  Award,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import type { EmailCampaign, EmailAnalytics, ABTestResult } from '@/types/email-campaigns';

interface PerformanceMetricsProps {
  campaigns: EmailCampaign[];
  analytics: EmailAnalytics[];
  abTestResults: ABTestResult[];
  onExport: (format: 'csv' | 'pdf' | 'excel') => void;
}

interface BenchmarkData {
  metric: string;
  current: number;
  industry_average: number;
  top_performers: number;
  trend: 'up' | 'down' | 'stable';
  performance_grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface TimeSeriesMetric {
  date: string;
  value: number;
  target: number;
  benchmark: number;
}

interface CampaignComparison {
  campaign_id: string;
  campaign_name: string;
  campaign_type: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  performance_score: number;
  rank: number;
}

const INDUSTRY_BENCHMARKS = {
  open_rate: { average: 21.33, top_performers: 35.0 },
  click_rate: { average: 2.62, top_performers: 5.0 },
  bounce_rate: { average: 2.0, top_performers: 0.5 },
  unsubscribe_rate: { average: 0.26, top_performers: 0.1 },
  delivery_time: { average: 5000, top_performers: 1000 },
  list_growth_rate: { average: 2.5, top_performers: 5.0 }
};

const PERFORMANCE_GRADES = {
  A: { color: 'text-green-600', bgColor: 'bg-green-100', description: 'Excellent' },
  B: { color: 'text-blue-600', bgColor: 'bg-blue-100', description: 'Good' },
  C: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', description: 'Average' },
  D: { color: 'text-orange-600', bgColor: 'bg-orange-100', description: 'Below Average' },
  F: { color: 'text-red-600', bgColor: 'bg-red-100', description: 'Poor' }
};

const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' }
];

export default function PerformanceMetrics({ 
  campaigns, 
  analytics, 
  abTestResults, 
  onExport 
}: PerformanceMetricsProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('open_rate');
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'trends' | 'comparison' | 'abtests'>('benchmarks');

  // Calculate benchmark data
  const calculateBenchmarks = useCallback((): BenchmarkData[] => {
    const total_sent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
    const total_opens = analytics.reduce((sum, a) => sum + (a.opens || 0), 0);
    const total_clicks = analytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
    const total_bounces = analytics.reduce((sum, a) => sum + (a.bounces || 0), 0);
    const total_unsubscribes = analytics.reduce((sum, a) => sum + (a.unsubscribes || 0), 0);
    
    const open_rate = total_sent > 0 ? (total_opens / total_sent) * 100 : 0;
    const click_rate = total_opens > 0 ? (total_clicks / total_opens) * 100 : 0;
    const bounce_rate = total_sent > 0 ? (total_bounces / total_sent) * 100 : 0;
    const unsubscribe_rate = total_sent > 0 ? (total_unsubscribes / total_sent) * 100 : 0;
    
    const benchmarks: BenchmarkData[] = [
      {
        metric: 'Open Rate',
        current: Math.round(open_rate * 100) / 100,
        industry_average: INDUSTRY_BENCHMARKS.open_rate.average,
        top_performers: INDUSTRY_BENCHMARKS.open_rate.top_performers,
        trend: 'up', // Would be calculated from historical data
        performance_grade: getPerformanceGrade(open_rate, INDUSTRY_BENCHMARKS.open_rate.average, INDUSTRY_BENCHMARKS.open_rate.top_performers)
      },
      {
        metric: 'Click Rate',
        current: Math.round(click_rate * 100) / 100,
        industry_average: INDUSTRY_BENCHMARKS.click_rate.average,
        top_performers: INDUSTRY_BENCHMARKS.click_rate.top_performers,
        trend: 'up',
        performance_grade: getPerformanceGrade(click_rate, INDUSTRY_BENCHMARKS.click_rate.average, INDUSTRY_BENCHMARKS.click_rate.top_performers)
      },
      {
        metric: 'Bounce Rate',
        current: Math.round(bounce_rate * 100) / 100,
        industry_average: INDUSTRY_BENCHMARKS.bounce_rate.average,
        top_performers: INDUSTRY_BENCHMARKS.bounce_rate.top_performers,
        trend: 'down', // Lower is better for bounce rate
        performance_grade: getPerformanceGrade(bounce_rate, INDUSTRY_BENCHMARKS.bounce_rate.average, INDUSTRY_BENCHMARKS.bounce_rate.top_performers, true)
      },
      {
        metric: 'Unsubscribe Rate',
        current: Math.round(unsubscribe_rate * 100) / 100,
        industry_average: INDUSTRY_BENCHMARKS.unsubscribe_rate.average,
        top_performers: INDUSTRY_BENCHMARKS.unsubscribe_rate.top_performers,
        trend: 'down', // Lower is better for unsubscribe rate
        performance_grade: getPerformanceGrade(unsubscribe_rate, INDUSTRY_BENCHMARKS.unsubscribe_rate.average, INDUSTRY_BENCHMARKS.unsubscribe_rate.top_performers, true)
      }
    ];
    
    return benchmarks;
  }, [campaigns, analytics]);

  const getPerformanceGrade = (current: number, average: number, top: number, lowerIsBetter: boolean = false): 'A' | 'B' | 'C' | 'D' | 'F' => {
    if (lowerIsBetter) {
      if (current <= top) return 'A';
      if (current <= average) return 'B';
      if (current <= average * 1.5) return 'C';
      if (current <= average * 2) return 'D';
      return 'F';
    } else {
      if (current >= top) return 'A';
      if (current >= average * 1.5) return 'B';
      if (current >= average) return 'C';
      if (current >= average * 0.5) return 'D';
      return 'F';
    }
  };

  const benchmarks = calculateBenchmarks();

  // Calculate campaign comparison
  const campaignComparison: CampaignComparison[] = campaigns.map((campaign, index) => {
    const campaignAnalytics = analytics.find(a => a.campaign_id === campaign.id);
    const sent_count = campaign.sent_count || 0;
    const opens = campaignAnalytics?.opens || 0;
    const clicks = campaignAnalytics?.clicks || 0;
    const bounces = campaignAnalytics?.bounces || 0;
    const unsubscribes = campaignAnalytics?.unsubscribes || 0;
    
    const open_rate = sent_count > 0 ? (opens / sent_count) * 100 : 0;
    const click_rate = opens > 0 ? (clicks / opens) * 100 : 0;
    const bounce_rate = sent_count > 0 ? (bounces / sent_count) * 100 : 0;
    const unsubscribe_rate = sent_count > 0 ? (unsubscribes / sent_count) * 100 : 0;
    
    // Calculate performance score (weighted average)
    const performance_score = (
      open_rate * 0.4 +
      click_rate * 0.3 +
      (100 - bounce_rate) * 0.2 +
      (100 - unsubscribe_rate) * 0.1
    );
    
    return {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      campaign_type: campaign.campaign_type,
      sent_count,
      open_rate: Math.round(open_rate * 100) / 100,
      click_rate: Math.round(click_rate * 100) / 100,
      bounce_rate: Math.round(bounce_rate * 100) / 100,
      unsubscribe_rate: Math.round(unsubscribe_rate * 100) / 100,
      performance_score: Math.round(performance_score * 100) / 100,
      rank: 0 // Will be set after sorting
    };
  }).sort((a, b) => b.performance_score - a.performance_score)
    .map((campaign, index) => ({ ...campaign, rank: index + 1 }));

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getGradeConfig = (grade: 'A' | 'B' | 'C' | 'D' | 'F') => {
    return PERFORMANCE_GRADES[grade];
  };

  const getPerformanceColor = (current: number, average: number, top: number, lowerIsBetter: boolean = false) => {
    if (lowerIsBetter) {
      if (current <= top) return 'text-green-600';
      if (current <= average) return 'text-blue-600';
      if (current <= average * 1.5) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (current >= top) return 'text-green-600';
      if (current >= average * 1.5) return 'text-blue-600';
      if (current >= average) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>
          <p className="text-gray-600">Benchmark against industry standards and track performance trends</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => onExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparison">Campaign Comparison</TabsTrigger>
          <TabsTrigger value="abtests">A/B Test Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="benchmarks" className="space-y-6">
          {/* Industry Benchmarks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Industry Benchmarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {benchmarks.map((benchmark) => {
                  const gradeConfig = getGradeConfig(benchmark.performance_grade);
                  const performanceColor = getPerformanceColor(
                    benchmark.current, 
                    benchmark.industry_average, 
                    benchmark.top_performers,
                    benchmark.metric.includes('Rate') && !benchmark.metric.includes('Open') && !benchmark.metric.includes('Click')
                  );
                  
                  return (
                    <div key={benchmark.metric} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{benchmark.metric}</h4>
                          <Badge className={`${gradeConfig.bgColor} ${gradeConfig.color}`}>
                            {benchmark.performance_grade}
                          </Badge>
                          {getTrendIcon(benchmark.trend)}
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${performanceColor}`}>
                            {benchmark.current}%
                          </div>
                          <div className="text-sm text-gray-600">Current</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-semibold text-gray-900">
                            {benchmark.industry_average}%
                          </div>
                          <div className="text-sm text-gray-600">Industry Average</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-semibold text-blue-600">
                            {benchmark.top_performers}%
                          </div>
                          <div className="text-sm text-gray-600">Top Performers</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-semibold text-green-600">
                            {gradeConfig.description}
                          </div>
                          <div className="text-sm text-gray-600">Performance Grade</div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Performance vs Industry Average</span>
                          <span className={performanceColor}>
                            {benchmark.current > benchmark.industry_average ? '+' : ''}
                            {((benchmark.current - benchmark.industry_average) / benchmark.industry_average * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, Math.max(0, (benchmark.current / benchmark.industry_average) * 50))}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {benchmarks.map((benchmark) => {
                  const gradeConfig = getGradeConfig(benchmark.performance_grade);
                  
                  return (
                    <div key={benchmark.metric} className="text-center p-4 border border-gray-200 rounded-lg">
                      <div className={`text-3xl font-bold mb-2 ${gradeConfig.color}`}>
                        {benchmark.performance_grade}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{benchmark.metric}</div>
                      <div className="text-xs text-gray-600">{gradeConfig.description}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Trend analysis charts would be implemented here</p>
                <p className="text-sm">Historical data visualization and trend analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignComparison.map((campaign) => (
                  <div key={campaign.campaign_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{campaign.rank}</Badge>
                        <h4 className="font-medium">{campaign.campaign_name}</h4>
                        <Badge variant="secondary">{campaign.campaign_type}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {campaign.performance_score}
                        </div>
                        <div className="text-sm text-gray-600">Performance Score</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{campaign.open_rate}%</div>
                        <div className="text-sm text-gray-600">Open Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{campaign.click_rate}%</div>
                        <div className="text-sm text-gray-600">Click Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">{campaign.bounce_rate}%</div>
                        <div className="text-sm text-gray-600">Bounce Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-yellow-600">{campaign.unsubscribe_rate}%</div>
                        <div className="text-sm text-gray-600">Unsubscribe Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abtests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.filter(c => c.ab_test_config).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No A/B tests found</p>
                  <p className="text-sm">Create campaigns with A/B testing to view performance metrics</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns
                    .filter(c => c.ab_test_config)
                    .map((campaign) => {
                      const campaignAnalytics = analytics.find(a => a.campaign_id === campaign.id);
                      const testResults = abTestResults.filter(r => r.campaign_id === campaign.id);
                      
                      return (
                        <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-medium">{campaign.name}</h4>
                              <p className="text-sm text-gray-600">A/B Test: {campaign.ab_test_config?.test_name}</p>
                            </div>
                            <Badge variant="outline">
                              {testResults.length} variants
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold">{campaign.recipient_count || 0}</div>
                              <div className="text-sm text-gray-600">Total Recipients</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-blue-600">
                                {campaignAnalytics ? ((campaignAnalytics.opens / campaign.sent_count) * 100).toFixed(1) : 0}%
                              </div>
                              <div className="text-sm text-gray-600">Open Rate</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-green-600">
                                {campaignAnalytics ? ((campaignAnalytics.clicks / campaignAnalytics.opens) * 100).toFixed(1) : 0}%
                              </div>
                              <div className="text-sm text-gray-600">Click Rate</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
