'use client';

// Campaign Dashboard Component
// Created: 2025-01-27
// Purpose: Campaign management dashboard with analytics and controls

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Copy,
  BarChart3,
  Users,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
  MousePointer,
  Reply
} from 'lucide-react';
import type { EmailCampaign, EmailAnalytics } from '@/types/email-campaigns';

interface CampaignDashboardProps {
  campaigns: EmailCampaign[];
  analytics: EmailAnalytics[];
  onCampaignCreate: () => void;
  onCampaignEdit: (campaign: EmailCampaign) => void;
  onCampaignDelete: (campaignId: string) => void;
  onCampaignDuplicate: (campaign: EmailCampaign) => void;
  onCampaignStart: (campaignId: string) => void;
  onCampaignPause: (campaignId: string) => void;
  onCampaignStop: (campaignId: string) => void;
}

interface CampaignStats {
  total_campaigns: number;
  active_campaigns: number;
  scheduled_campaigns: number;
  completed_campaigns: number;
  total_recipients: number;
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  average_open_rate: number;
  average_click_rate: number;
}

const CAMPAIGN_STATUSES = [
  { value: 'all', label: 'All Campaigns' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'sending', label: 'Sending' },
  { value: 'sent', label: 'Sent' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' }
];

const CAMPAIGN_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'appointment_reminder', label: 'Appointment Reminder' },
  { value: 'educational', label: 'Educational' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'compliance', label: 'Compliance' }
];

export default function CampaignDashboard({ 
  campaigns, 
  analytics,
  onCampaignCreate,
  onCampaignEdit,
  onCampaignDelete,
  onCampaignDuplicate,
  onCampaignStart,
  onCampaignPause,
  onCampaignStop
}: CampaignDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'analytics'>('overview');
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());

  // Calculate campaign statistics
  const calculateStats = useCallback((): CampaignStats => {
    const total_campaigns = campaigns.length;
    const active_campaigns = campaigns.filter(c => c.status === 'sending').length;
    const scheduled_campaigns = campaigns.filter(c => c.status === 'scheduled').length;
    const completed_campaigns = campaigns.filter(c => c.status === 'sent').length;
    
    const total_recipients = campaigns.reduce((sum, c) => sum + (c.recipient_count || 0), 0);
    const total_sent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
    
    const total_opens = analytics.reduce((sum, a) => sum + (a.opens || 0), 0);
    const total_clicks = analytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
    
    const average_open_rate = total_sent > 0 ? (total_opens / total_sent) * 100 : 0;
    const average_click_rate = total_opens > 0 ? (total_clicks / total_opens) * 100 : 0;

    return {
      total_campaigns,
      active_campaigns,
      scheduled_campaigns,
      completed_campaigns,
      total_recipients,
      total_sent,
      total_opens,
      total_clicks,
      average_open_rate,
      average_click_rate
    };
  }, [campaigns, analytics]);

  const stats = calculateStats();

  // Filter campaigns based on search and filters
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchTerm || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesType = typeFilter === 'all' || campaign.campaign_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      scheduled: { variant: 'outline' as const, label: 'Scheduled' },
      sending: { variant: 'default' as const, label: 'Sending' },
      sent: { variant: 'default' as const, label: 'Sent' },
      paused: { variant: 'secondary' as const, label: 'Paused' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCampaignActions = (campaign: EmailCampaign) => {
    const actions = [];
    
    if (campaign.status === 'draft') {
      actions.push(
        <Button key="edit" variant="outline" size="sm" onClick={() => onCampaignEdit(campaign)}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>,
        <Button key="start" variant="default" size="sm" onClick={() => onCampaignStart(campaign.id)}>
          <Play className="h-4 w-4 mr-1" />
          Start
        </Button>
      );
    } else if (campaign.status === 'scheduled') {
      actions.push(
        <Button key="edit" variant="outline" size="sm" onClick={() => onCampaignEdit(campaign)}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>,
        <Button key="pause" variant="outline" size="sm" onClick={() => onCampaignPause(campaign.id)}>
          <Pause className="h-4 w-4 mr-1" />
          Pause
        </Button>
      );
    } else if (campaign.status === 'sending') {
      actions.push(
        <Button key="pause" variant="outline" size="sm" onClick={() => onCampaignPause(campaign.id)}>
          <Pause className="h-4 w-4 mr-1" />
          Pause
        </Button>
      );
    } else if (campaign.status === 'paused') {
      actions.push(
        <Button key="start" variant="default" size="sm" onClick={() => onCampaignStart(campaign.id)}>
          <Play className="h-4 w-4 mr-1" />
          Resume
        </Button>
      );
    }
    
    actions.push(
      <Button key="duplicate" variant="outline" size="sm" onClick={() => onCampaignDuplicate(campaign)}>
        <Copy className="h-4 w-4 mr-1" />
        Duplicate
      </Button>
    );
    
    return actions;
  };

  const getCampaignAnalytics = (campaignId: string) => {
    const campaignAnalytics = analytics.find(a => a.campaign_id === campaignId);
    if (!campaignAnalytics) return null;
    
    const openRate = campaignAnalytics.sent_count > 0 
      ? (campaignAnalytics.opens / campaignAnalytics.sent_count) * 100 
      : 0;
    const clickRate = campaignAnalytics.opens > 0 
      ? (campaignAnalytics.clicks / campaignAnalytics.opens) * 100 
      : 0;
    
    return {
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      bounces: campaignAnalytics.bounces || 0,
      unsubscribes: campaignAnalytics.unsubscribes || 0
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Management</h1>
          <p className="text-gray-600">Manage and monitor email campaigns</p>
        </div>
        <Button onClick={onCampaignCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_campaigns}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active_campaigns}</p>
                  </div>
                  <Play className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_recipients.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.average_open_rate.toFixed(1)}%</p>
                  </div>
                  <Eye className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.slice(0, 5).map((campaign) => {
                  const campaignStats = getCampaignAnalytics(campaign.id);
                  
                  return (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{campaign.name}</h4>
                          {getStatusBadge(campaign.status)}
                          <Badge variant="outline">{campaign.campaign_type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{campaign.recipient_count || 0} recipients</span>
                          {campaignStats && (
                            <>
                              <span>{campaignStats.openRate}% open rate</span>
                              <span>{campaignStats.clickRate}% click rate</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCampaignActions(campaign)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search campaigns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {CAMPAIGN_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {CAMPAIGN_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign List */}
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => {
              const campaignStats = getCampaignAnalytics(campaign.id);
              
              return (
                <Card key={campaign.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                          <Badge variant="outline">{campaign.campaign_type}</Badge>
                        </div>
                        
                        {campaign.description && (
                          <p className="text-gray-600 mb-4">{campaign.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Recipients</p>
                            <p className="text-lg font-semibold">{campaign.recipient_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Sent</p>
                            <p className="text-lg font-semibold">{campaign.sent_count || 0}</p>
                          </div>
                          {campaignStats && (
                            <>
                              <div>
                                <p className="text-sm text-gray-600">Open Rate</p>
                                <p className="text-lg font-semibold">{campaignStats.openRate}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Click Rate</p>
                                <p className="text-lg font-semibold">{campaignStats.clickRate}%</p>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                          {campaign.scheduled_at && (
                            <span>Scheduled: {new Date(campaign.scheduled_at).toLocaleString()}</span>
                          )}
                          {campaign.sent_at && (
                            <span>Sent: {new Date(campaign.sent_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {getCampaignActions(campaign)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCampaignDelete(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Opens</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_opens.toLocaleString()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_clicks.toLocaleString()}</p>
                  </div>
                  <MousePointer className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Click Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.average_click_rate.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bounces</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.reduce((sum, a) => sum + (a.bounces || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  const campaignStats = getCampaignAnalytics(campaign.id);
                  if (!campaignStats) return null;
                  
                  return (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-gray-600">{campaign.campaign_type}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Open Rate</p>
                          <p className="text-lg font-semibold">{campaignStats.openRate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Click Rate</p>
                          <p className="text-lg font-semibold">{campaignStats.clickRate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Bounces</p>
                          <p className="text-lg font-semibold">{campaignStats.bounces}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
