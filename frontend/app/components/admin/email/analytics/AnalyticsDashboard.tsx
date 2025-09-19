'use client';

// Analytics Dashboard Component
// Created: 2025-01-27
// Purpose: Comprehensive email analytics and monitoring dashboard

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
  Users, 
  Mail, 
  MousePointer, 
  Eye, 
  Reply, 
  XCircle,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Target,
  Clock,
  Globe
} from 'lucide-react';
import type { 
  EmailAnalytics, 
  EmailCampaign, 
  ABTestResult,
  EmailTemplate 
} from '@/types/email-campaigns';

interface AnalyticsDashboardProps {
  campaigns: EmailCampaign[];
  analytics: EmailAnalytics[];
  abTestResults: ABTestResult[];
  templates: EmailTemplate[];
  onRefresh: () => Promise<void>;
}

interface AnalyticsSummary {
  total_campaigns: number;
  total_recipients: number;
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  total_bounces: number;
  total_unsubscribes: number;
  overall_open_rate: number;
  overall_click_rate: number;
  overall_bounce_rate: number;
  overall_unsubscribe_rate: number;
  average_delivery_time: number;
  top_performing_campaign: string;
  top_performing_template: string;
}

interface TimeSeriesData {
  date: string;
  sent: number;
  opens: number;
  clicks: number;
  bounces: number;
  unsubscribes: number;
}

interface CampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  campaign_type: string;
  sent_count: number;
  opens: number;
  clicks: number;
  bounces: number;
  unsubscribes: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  revenue: number;
  roi: number;
}

interface TemplatePerformance {
  template_id: string;
  template_name: string;
  template_category: string;
  usage_count: number;
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  average_open_rate: number;
  average_click_rate: number;
  performance_score: number;
}

const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' }
];

const METRIC_TYPES = [
  { value: 'opens', label: 'Open Rate', icon: Eye, color: 'text-blue-600' },
  { value: 'clicks', label: 'Click Rate', icon: MousePointer, color: 'text-green-600' },
  { value: 'bounces', label: 'Bounce Rate', icon: XCircle, color: 'text-red-600' },
  { value: 'unsubscribes', label: 'Unsubscribe Rate', icon: Reply, color: 'text-yellow-600' }
];

export default function AnalyticsDashboard({ 
  campaigns, 
  analytics, 
  abTestResults, 
  templates,
  onRefresh 
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('opens');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'templates' | 'abtests' | 'deliverability'>('overview');

  // Calculate analytics summary
  const calculateSummary = useCallback((): AnalyticsSummary => {
    const total_campaigns = campaigns.length;
    const total_recipients = campaigns.reduce((sum, c) => sum + (c.recipient_count || 0), 0);
    const total_sent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
    
    const total_opens = analytics.reduce((sum, a) => sum + (a.opens || 0), 0);
    const total_clicks = analytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
    const total_bounces = analytics.reduce((sum, a) => sum + (a.bounces || 0), 0);
    const total_unsubscribes = analytics.reduce((sum, a) => sum + (a.unsubscribes || 0), 0);
    
    const overall_open_rate = total_sent > 0 ? (total_opens / total_sent) * 100 : 0;
    const overall_click_rate = total_opens > 0 ? (total_clicks / total_opens) * 100 : 0;
    const overall_bounce_rate = total_sent > 0 ? (total_bounces / total_sent) * 100 : 0;
    const overall_unsubscribe_rate = total_sent > 0 ? (total_unsubscribes / total_sent) * 100 : 0;
    
    // Find top performing campaign
    const campaignPerformance = campaigns.map(campaign => {
      const campaignAnalytics = analytics.find(a => a.campaign_id === campaign.id);
      const openRate = campaignAnalytics ? (campaignAnalytics.opens / campaign.sent_count) * 100 : 0;
      return { campaign, openRate };
    });
    
    const topCampaign = campaignPerformance.reduce((best, current) => 
      current.openRate > best.openRate ? current : best, campaignPerformance[0] || { campaign: null, openRate: 0 }
    );
    
    // Find top performing template
    const templateUsage = templates.map(template => {
      const templateCampaigns = campaigns.filter(c => c.template_id === template.id);
      const totalSent = templateCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
      const totalOpens = templateCampaigns.reduce((sum, c) => {
        const analytics = analytics.find(a => a.campaign_id === c.id);
        return sum + (analytics?.opens || 0);
      }, 0);
      const openRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
      return { template, openRate, totalSent };
    });
    
    const topTemplate = templateUsage.reduce((best, current) => 
      current.openRate > best.openRate ? current : best, templateUsage[0] || { template: null, openRate: 0 }
    );

    return {
      total_campaigns,
      total_recipients,
      total_sent,
      total_opens,
      total_clicks,
      total_bounces,
      total_unsubscribes,
      overall_open_rate: Math.round(overall_open_rate * 100) / 100,
      overall_click_rate: Math.round(overall_click_rate * 100) / 100,
      overall_bounce_rate: Math.round(overall_bounce_rate * 100) / 100,
      overall_unsubscribe_rate: Math.round(overall_unsubscribe_rate * 100) / 100,
      average_delivery_time: 0, // Would be calculated from actual delivery data
      top_performing_campaign: topCampaign.campaign?.name || 'N/A',
      top_performing_template: topTemplate.template?.name || 'N/A'
    };
  }, [campaigns, analytics, templates]);

  const summary = calculateSummary();

  // Calculate campaign performance
  const campaignPerformance: CampaignPerformance[] = campaigns.map(campaign => {
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
    
    return {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      campaign_type: campaign.campaign_type,
      sent_count,
      opens,
      clicks,
      bounces,
      unsubscribes,
      open_rate: Math.round(open_rate * 100) / 100,
      click_rate: Math.round(click_rate * 100) / 100,
      bounce_rate: Math.round(bounce_rate * 100) / 100,
      unsubscribe_rate: Math.round(unsubscribe_rate * 100) / 100,
      revenue: 0, // Would be calculated from actual revenue data
      roi: 0 // Would be calculated from actual ROI data
    };
  });

  // Calculate template performance
  const templatePerformance: TemplatePerformance[] = templates.map(template => {
    const templateCampaigns = campaigns.filter(c => c.template_id === template.id);
    const usage_count = templateCampaigns.length;
    const total_sent = templateCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
    const total_opens = templateCampaigns.reduce((sum, c) => {
      const analytics = analytics.find(a => a.campaign_id === c.id);
      return sum + (analytics?.opens || 0);
    }, 0);
    const total_clicks = templateCampaigns.reduce((sum, c) => {
      const analytics = analytics.find(a => a.campaign_id === c.id);
      return sum + (analytics?.clicks || 0);
    }, 0);
    
    const average_open_rate = total_sent > 0 ? (total_opens / total_sent) * 100 : 0;
    const average_click_rate = total_opens > 0 ? (total_clicks / total_opens) * 100 : 0;
    const performance_score = (average_open_rate + average_click_rate) / 2;
    
    return {
      template_id: template.id,
      template_name: template.name,
      template_category: template.category,
      usage_count,
      total_sent,
      total_opens,
      total_clicks,
      average_open_rate: Math.round(average_open_rate * 100) / 100,
      average_click_rate: Math.round(average_click_rate * 100) / 100,
      performance_score: Math.round(performance_score * 100) / 100
    };
  });

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await onRefresh();
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricIcon = (metric: string) => {
    const metricConfig = METRIC_TYPES.find(m => m.value === metric);
    return metricConfig ? metricConfig.icon : BarChart3;
  };

  const getMetricColor = (metric: string) => {
    const metricConfig = METRIC_TYPES.find(m => m.value === metric);
    return metricConfig ? metricConfig.color : 'text-gray-600';
  };

  const getPerformanceTrend = (current: number, previous: number) => {
    if (current > previous) return { direction: 'up', color: 'text-green-600', icon: TrendingUp };
    if (current < previous) return { direction: 'down', color: 'text-red-600', icon: TrendingDown };
    return { direction: 'stable', color: 'text-gray-600', icon: BarChart3 };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Analytics</h1>
          <p className="text-gray-600">Comprehensive email performance and monitoring</p>
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
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_campaigns}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_recipients.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold text-gray-900">{summary.overall_open_rate}%</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Click Rate</p>
                <p className="text-2xl font-bold text-gray-900">{summary.overall_click_rate}%</p>
              </div>
              <MousePointer className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
          <TabsTrigger value="deliverability">Deliverability</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Sent</span>
                    <span className="text-lg font-semibold">{summary.total_sent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Opens</span>
                    <span className="text-lg font-semibold">{summary.total_opens.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Clicks</span>
                    <span className="text-lg font-semibold">{summary.total_clicks.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bounce Rate</span>
                    <span className="text-lg font-semibold text-red-600">{summary.overall_bounce_rate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Unsubscribe Rate</span>
                    <span className="text-lg font-semibold text-yellow-600">{summary.overall_unsubscribe_rate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Best Campaign</p>
                    <p className="text-lg font-semibold">{summary.top_performing_campaign}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Best Template</p>
                    <p className="text-lg font-semibold">{summary.top_performing_template}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Delivery Time</p>
                    <p className="text-lg font-semibold">{summary.average_delivery_time}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metric Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {METRIC_TYPES.map((metric) => {
                  const Icon = metric.icon;
                  const value = summary[`overall_${metric.value}_rate` as keyof AnalyticsSummary] as number;
                  
                  return (
                    <div key={metric.value} className="text-center p-4 border border-gray-200 rounded-lg">
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${metric.color}`} />
                      <div className="text-2xl font-bold text-gray-900">{value}%</div>
                      <div className="text-sm text-gray-600">{metric.label}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignPerformance.map((campaign) => (
                  <div key={campaign.campaign_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">{campaign.campaign_name}</h4>
                        <p className="text-sm text-gray-600">{campaign.campaign_type}</p>
                      </div>
                      <Badge variant="outline">{campaign.sent_count.toLocaleString()} sent</Badge>
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

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templatePerformance.map((template) => (
                  <div key={template.template_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">{template.template_name}</h4>
                        <p className="text-sm text-gray-600">{template.template_category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{template.usage_count} campaigns</Badge>
                        <Badge variant="secondary">Score: {template.performance_score}</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{template.total_sent.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{template.average_open_rate}%</div>
                        <div className="text-sm text-gray-600">Avg Open Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{template.average_click_rate}%</div>
                        <div className="text-sm text-gray-600">Avg Click Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">{template.performance_score}</div>
                        <div className="text-sm text-gray-600">Performance Score</div>
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
              <CardTitle>A/B Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.filter(c => c.ab_test_config).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No A/B tests found</p>
                  <p className="text-sm">Create campaigns with A/B testing to view results here</p>
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

        <TabsContent value="deliverability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deliverability Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{summary.overall_open_rate}%</div>
                  <div className="text-sm text-gray-600">Open Rate</div>
                  <div className="text-xs text-gray-500 mt-1">Industry avg: 20-25%</div>
                </div>
                
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{summary.overall_bounce_rate}%</div>
                  <div className="text-sm text-gray-600">Bounce Rate</div>
                  <div className="text-xs text-gray-500 mt-1">Industry avg: 2-5%</div>
                </div>
                
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{summary.overall_unsubscribe_rate}%</div>
                  <div className="text-sm text-gray-600">Unsubscribe Rate</div>
                  <div className="text-xs text-gray-500 mt-1">Industry avg: 0.1-0.5%</div>
                </div>
                
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{summary.average_delivery_time}ms</div>
                  <div className="text-sm text-gray-600">Delivery Time</div>
                  <div className="text-xs text-gray-500 mt-1">Target: &lt;100ms</div>
                </div>
              </div>
              
              <Alert className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Monitor these metrics regularly to maintain good sender reputation. 
                  High bounce rates or unsubscribe rates can negatively impact deliverability.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
